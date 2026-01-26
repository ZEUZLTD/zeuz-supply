import { supabaseServer } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic'; // Always fetch fresh
export const revalidate = 0;

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const ids = searchParams.get('ids')?.split(',');

        let query = supabaseServer
            .from('products')
            .select(`
                id,
                slug,
                price_gbp, 
                batches (
                    status,
                    stock_quantity
                )
            `);

        // Optional filtering if specific IDs requested (e.g. for Product Page / Cart)
        // CRITICAL FIX: Frontend uses SLUG as ID. We must query 'slug' column, not 'id' (UUID).
        if (ids && ids.length > 0) {
            query = query.in('slug', ids);
        }

        const { data: products, error } = await query;

        if (error) {
            console.error("API_LIVE_ERROR", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Transform for efficient Client Lookup: { [slug]: { price, stock, status } }
        const liveMap: Record<string, any> = {};

        products?.forEach((p: any) => {
            // Calculate Live Stock from Batches (Source of Truth)
            let liveStock = 0;
            if (p.batches && Array.isArray(p.batches)) {
                const liveBatches = p.batches.filter((b: any) => b.status === 'LIVE');
                liveStock = liveBatches.reduce((acc: number, b: any) => acc + (b.stock_quantity || 0), 0);
            }

            // Determine Status
            let status = 'OUT_OF_STOCK';
            // Note: We can send raw data and let client decide, OR normalize here.
            // Let's send raw stock/price and let client rules decide status to keep logic in one place if possible,
            // OR replicate logic. Replicating simple logic here is safer for consistency.

            // Simplest Status Logic (can be enhanced on client)
            if (liveStock > 20) status = 'IN_STOCK';
            else if (liveStock > 0) status = 'LOW_STOCK';

            // MAP KEY IS SLUG because Client uses Slug as ID
            const key = p.slug || p.id;
            liveMap[key] = {
                price: Number(p.price_gbp),
                stock: liveStock,
                status: status // Helper status, client can override if needed
            };
        });

        // 2. Fetch Active Volume Discounts (Cacheable)
        const { data: volumeTiers } = await supabaseServer
            .from('volume_discounts')
            .select('min_quantity, discount_percent')
            .eq('active', true)
            .order('min_quantity', { ascending: true });

        return NextResponse.json({
            products: liveMap,
            volume_discounts: volumeTiers || []
        });

    } catch (e: any) {
        console.error("API_FATAL in /api/live-inventory:", e);
        return NextResponse.json({ error: e.message || "Internal Server Error", stack: e.stack }, { status: 500 });
    }
}
