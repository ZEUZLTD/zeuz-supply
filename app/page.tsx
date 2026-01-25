import { supabaseServer } from "@/lib/supabase-server";
import { INVENTORY } from "@/data/inventory";
import fs from 'fs';
import path from 'path';
import { HomeView } from "@/components/HomeView";
import { StoreHydrator } from "@/components/StoreHydrator";
import { InventoryItem, SectionType } from "@/lib/types";
import { getSettings } from "@/app/admin/marketing/actions";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: 'ZEUZ_SUPPLY // Industrial Lithium-Ion Solutions',
  alternates: {
    canonical: 'https://zeuz.supply',
  },
};

// Force dynamic rendering and disable caching
export const revalidate = 60; // Revalidate every 60 seconds (ISR)

interface SupabaseBatch {
  status: string;
  stock_quantity: number;
  graph_data?: any;
}

interface SupabaseProduct {
  slug: string;
  name: string;
  spec: string;
  tag: string;
  pitch: string;
  price_gbp: number | null;
  category: string;
  batches: SupabaseBatch[];
  // Extended Technical Stats
  nominal_voltage_v?: number;
  charge_voltage_v?: number;
  discharge_cutoff_v?: number;
  max_discharge_a?: number;
  standard_charge_a?: number;
  ac_impedance_mohm?: number;
  weight_g?: number;
  priority?: number;
  batch_test_url?: string;
}

async function getInventory(): Promise<InventoryItem[]> {
  try {
    // 1. Fetch Products
    const { data: products, error } = await supabaseServer
      .from('products')
      .select(`
        *,
        batches (
          status,
          stock_quantity,
          graph_data
        )
      `)
      .order('priority', { ascending: true });

    if (error) {
      console.error("Supabase Error:", error);
    }

    if (!products || products.length === 0) {
      console.warn("Supabase fetch returned empty list or error");
      return INVENTORY.map(i => ({
        ...i,
        category: i.category as SectionType,
        status: i.status as InventoryItem['status'],
        price: i.price ?? null,
        graph_data: null,
        priority: 99
      }));
    }

    // 2. Transform to InventoryItem
    // Cast strict type to avoid explicit any
    const rawProducts = products as unknown as SupabaseProduct[];

    // Helper to downsample curve data
    const downsampleCurve = (points: any[], target: number = 100) => {
      if (!points || points.length <= target) return points;
      const step = points.length / target;
      return Array.from({ length: target }, (_, i) => points[Math.floor(i * step)]);
    };

    return rawProducts.map((p) => {
      // Logic to determine status from batches
      // If any batch is LIVE and stock > 5 -> IN_STOCK
      // If any batch is LIVE and stock <= 5 and > 0 -> LOW_STOCK
      // If all batches < 0 -> OUT_OF_STOCK
      // If only TESTING batches -> COMING_SOON

      const liveBatches = p.batches?.filter((b) => b.status === 'LIVE') || [];
      const totalStock = liveBatches.reduce((acc, b) => acc + (b.stock_quantity || 0), 0);

      // Extract graph data from the first batch that has it (prefer LIVE, then any)
      const graphDataBatch = liveBatches.find(b => b.graph_data) || p.batches?.find(b => b.graph_data);
      let graphData = graphDataBatch ? graphDataBatch.graph_data : null;

      // DOWNSAMPLE if exists
      if (graphData) {
        const processedData: any = {};
        Object.keys(graphData).forEach(key => {
          if (Array.isArray(graphData[key])) {
            processedData[key] = downsampleCurve(graphData[key], 80); // Conservative 80 points
          }
        });
        graphData = processedData;
      }

      let status: InventoryItem['status'] = 'OUT_OF_STOCK';

      if (p.category === 'PROTOTYPE') {
        status = 'COMING_SOON';
      } else if (totalStock > 20) {
        status = 'IN_STOCK';
      } else if (totalStock > 0) {
        status = 'LOW_STOCK';
      } else {
        // Check if coming soon logic applies
        status = 'OUT_OF_STOCK'; // Default for now
      }

      // Server-Side Image Check
      const imagePath = `/images/products/${p.slug}/1.png`;
      const fullPath = path.join(process.cwd(), 'public', imagePath);
      const hasImage = fs.existsSync(fullPath);

      return {
        id: p.slug, // Map slug to ID used in frontend
        model: p.name,
        spec: p.spec,
        tag: p.tag,
        pitch: p.pitch,
        price: p.price_gbp ? Number(p.price_gbp) : null,
        category: p.category as SectionType,
        status: status,
        stock_quantity: totalStock,
        // Extended Technical Stats
        nominal_voltage_v: p.nominal_voltage_v,
        charge_voltage_v: p.charge_voltage_v,
        discharge_cutoff_v: p.discharge_cutoff_v,
        max_discharge_a: p.max_discharge_a,
        standard_charge_a: p.standard_charge_a,
        ac_impedance_mohm: p.ac_impedance_mohm,
        weight_g: p.weight_g,
        graph_data: graphData,
        priority: p.priority || 99, // Default to low priority if missing
        batch_test_url: p.batch_test_url || null,
        slug: p.slug,
        hasImage: hasImage
      };
    });

  } catch (e) {
    console.error("Critical Fetch Error", e);
    return INVENTORY.map(i => ({
      ...i,
      category: i.category as SectionType,
      status: i.status as InventoryItem['status'],
      price: i.price ?? null,
      priority: 99
    }));
  }
}

export default async function Home() {
  const inventory = await getInventory();
  const settings = await getSettings();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'ZEUZ SUPPLY',
    url: 'https://zeuz.supply',
    logo: 'https://zeuz.supply/cell_transparent_shadow.png',
    description: 'Premium wholesale 18650 & 21700 cells for high-drain industrial applications.',
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HomeView inventory={inventory} settings={settings} />
      <StoreHydrator inventory={inventory} />
    </>
  );
}
