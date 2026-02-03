import { getSupabaseServer } from "@/lib/supabase-server";
import { InventoryItem, SectionType } from "@/lib/types";
import { ProductDetailContent } from "@/components/ProductDetailContent";
import { Metadata, ResolvingMetadata } from "next";
import { notFound } from "next/navigation";
import { INVENTORY } from "@/data/inventory";

// Force ISR
export const revalidate = 60;
export const dynamicParams = true; // Allow new products to be generated on demand

interface Props {
    params: Promise<{ slug: string }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

// Helper: Fetch Single Product
async function getProduct(slug: string): Promise<InventoryItem | null> {
    try {
        const supabaseServer = getSupabaseServer();
        const { data: product, error } = await supabaseServer
            .from('products')
            .select(`
                *,
                batches (
                    status,
                    stock_quantity,
                    graph_data
                )
            `)
            .eq('slug', slug)
            .single();

        if (error || !product) {
            console.error("Product fetch error:", error);
            // FALLBACK TO LOCAL INVENTORY
            const localItem = INVENTORY.find(i => i.id === slug || i.model.toLowerCase().replace(/ /g, '-') === slug);
            if (localItem) return localItem as InventoryItem;
            return null;
        }

        return formatProduct(product);
    } catch (e) {
        console.error("Critical getProduct error:", e);
        // FALLBACK TO LOCAL INVENTORY
        const localItem = INVENTORY.find(i => i.id === slug || i.model.toLowerCase().replace(/ /g, '-') === slug);
        if (localItem) return localItem as InventoryItem;
        return null;
    }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function formatProduct(product: any): InventoryItem {
    const p = product;

    // Safety checks for batches
    const liveBatches = p.batches?.filter((b: { status: string }) => b.status === 'LIVE') || [];
    const totalStock = liveBatches.reduce((acc: number, b: { stock_quantity?: number }) => acc + (b.stock_quantity || 0), 0);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const graphDataBatch = liveBatches.find((b: { graph_data?: any }) => b.graph_data) || p.batches?.find((b: { graph_data?: any }) => b.graph_data);

    let status: InventoryItem['status'] = 'OUT_OF_STOCK';
    if (p.category === 'PROTOTYPE') {
        status = 'COMING_SOON';
    } else if (totalStock > 20) {
        status = 'IN_STOCK';
    } else if (totalStock > 0) {
        status = 'LOW_STOCK';
    }

    return {
        id: p.slug || p.id,
        model: p.name,
        spec: p.spec,
        tag: p.tag,
        pitch: p.pitch,
        price: p.price_gbp ? Number(p.price_gbp) : null,
        category: p.category as SectionType,
        status: status,
        stock_quantity: totalStock,
        nominal_voltage_v: p.nominal_voltage_v,
        charge_voltage_v: p.charge_voltage_v,
        discharge_cutoff_v: p.discharge_cutoff_v,
        max_discharge_a: p.max_discharge_a,
        standard_charge_a: p.standard_charge_a,
        ac_impedance_mohm: p.ac_impedance_mohm,
        weight_g: p.weight_g,
        graph_data: graphDataBatch ? graphDataBatch.graph_data : null,
        priority: p.priority || 99,
        batch_test_url: p.batch_test_url || null,
        slug: p.slug
    };
}

// 1. Metadata Generation
export async function generateMetadata(props: Props, parent: ResolvingMetadata): Promise<Metadata> {
    const params = await props.params;
    try {
        const product = await getProduct(params.slug);

        if (!product) {
            return {
                title: 'Product Not Found | ZEUZ SUPPLY',
            };
        }

        const title = `${product.model} | ZEUZ SUPPLY`;
        const description = product.pitch || `Industrial specs for ${product.model}.`;
        const image = `/images/products/${product.slug}/1.png`; // Optimistic image path

        return {
            title: title,
            description: description,
            openGraph: {
                title: title,
                description: description,
                images: [image],
                type: 'website',
            },
            alternates: {
                canonical: `https://zeuz.supply/products/${product.slug}`,
            },
            twitter: {
                card: 'summary_large_image',
                title: title,
                description: description,
                images: [image],
            }
        };
    } catch (e) {
        console.error("Metadata generation error", e);
        return {
            title: 'ZEUZ SUPPLY',
        };
    }
}

// 2. Page Component
export default async function ProductPage(props: Props) {
    const params = await props.params;
    const product = await getProduct(params.slug);

    if (!product) {
        notFound();
    }

    // 3. JSON-LD Schema
    const productJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.model,
        description: product.pitch,
        image: `https://zeuz.supply/images/products/${product.slug}/1.png`,
        sku: product.id,
        offers: {
            '@type': 'Offer',
            price: product.price,
            priceCurrency: 'GBP',
            availability: product.stock_quantity && product.stock_quantity > 0
                ? 'https://schema.org/InStock'
                : 'https://schema.org/OutOfStock',
            url: `https://zeuz.supply/products/${product.slug}`
        }
    };

    const breadcrumbJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            {
                '@type': 'ListItem',
                position: 1,
                name: 'Home',
                item: 'https://zeuz.supply'
            },
            {
                '@type': 'ListItem',
                position: 2,
                name: product.category,
                item: `https://zeuz.supply/#${product.category}`
            },
            {
                '@type': 'ListItem',
                position: 3,
                name: product.model,
                item: `https://zeuz.supply/products/${product.slug}`
            }
        ]
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
            />
            {/* Reuse the Content Component */}
            <ProductDetailContent product={product} isModal={false} />
        </>
    );
}
