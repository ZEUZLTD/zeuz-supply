'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

async function getSupabase() {
    const cookieStore = cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_KEY!,
        { cookies: { get(name: string) { return cookieStore.get(name)?.value; } } }
    );
    // Verify Admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized'); // Naive check, relying on Middleware
    return supabase;
}

export async function getDiscountAnalytics(from?: string, to?: string) {
    const supabase = await getSupabase();

    let query = supabase
        .from('orders')
        .select('*') // Need full items to calc discount
        .eq('status', 'PAID');

    if (from) query = query.gte('created_at', from);
    if (to) query = query.lte('created_at', to);

    const { data: orders, error } = await query;
    if (error) throw error;

    let totalDiscountValue = 0;
    const voucherUsage: Record<string, { count: number, value: number }> = {};
    const volumeUsage: { count: number, value: number } = { count: 0, value: 0 };

    orders.forEach(order => {
        const items = order.items || [];
        const orderMetadata = order.metadata || {};
        const voucherCode = orderMetadata.voucher_code; // If global voucher used

        let orderDiscountTotal = 0;

        items.forEach((item: any) => {
            const price = item.price || {};
            const meta = price.product_data?.metadata || {};
            const originalUnit = meta.original_unit_amount;

            // Stripe amounts are in cents/pence
            const paidUnit = item.amount_total / item.quantity;

            if (originalUnit && originalUnit > paidUnit) {
                const discountPerUnit = originalUnit - paidUnit;
                const totalItemDiscount = discountPerUnit * item.quantity;

                orderDiscountTotal += totalItemDiscount;
                totalDiscountValue += totalItemDiscount;

                // Attribute to Source
                const desc = meta.discount_desc || '';
                if (desc.startsWith('VOLUME')) {
                    volumeUsage.count += item.quantity; // Or 1 per line item? Let's count instances.
                    volumeUsage.value += totalItemDiscount;
                }
            }
        });

        // Global Voucher Logic?
        // If 'voucher_code' exists on order, we attribute the *entire* order discount to it?
        // Or strictly what was labeled?  
        // Current logic: We labeled per-item "discount_desc".
        // Let's iterate items again to aggregate by specific code found in desc

        items.forEach((item: any) => {
            const price = item.price || {};
            const meta = price.product_data?.metadata || {};
            const originalUnit = meta.original_unit_amount;
            const paidUnit = item.amount_total / item.quantity;

            if (originalUnit && originalUnit > paidUnit) {
                const diff = (originalUnit - paidUnit) * item.quantity;
                const code = meta.discount_desc || 'UNKNOWN';

                if (!code.startsWith('VOLUME')) {
                    // Assert it's a voucher
                    if (!voucherUsage[code]) voucherUsage[code] = { count: 0, value: 0 };
                    voucherUsage[code].count += 1; // Count usage acts
                    voucherUsage[code].value += diff;
                }
            }
        });
    });

    return {
        total_discount_value: totalDiscountValue / 100, // Return in GBP
        volume_usage: {
            count: volumeUsage.count,
            value: volumeUsage.value / 100
        },
        voucher_usage: Object.entries(voucherUsage)
            .map(([code, stats]) => ({ code, count: stats.count, value: stats.value / 100 }))
            .sort((a, b) => b.value - a.value)
    };
}
