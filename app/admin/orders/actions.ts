'use server';

import { createServerClient } from '@supabase/ssr';
import Stripe from 'stripe';
import { cookies } from 'next/headers';
import { Order } from '@/lib/types';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Helper to get authenticated Admin Client
async function getSupabase() {
    const cookieStore = cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_KEY!,
        { cookies: { get(name: string) { return cookieStore.get(name)?.value; } } }
    );

    const { data: { user } } = await supabase.auth.getUser();

    // DEV BYPASS
    if (process.env.NODE_ENV === 'development' && cookieStore.get('zeuz_dev_admin')?.value === 'true') {
        return supabase;
    }

    if (!user) throw new Error('Unauthorized');
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'admin') throw new Error('Forbidden');

    return supabase;
}

export async function getOrderKPIs(from?: string, to?: string) {
    const supabase = await getSupabase();

    let query = supabase
        .from('orders')
        .select('id, amount_total, status, created_at');

    if (from) query = query.gte('created_at', from);
    if (to) query = query.lte('created_at', to);

    const { data, error } = await query;

    if (error) throw error;

    const totalOrders = data.length;

    // Only count revenue for valid paid orders
    const validStatuses = ['PAID', 'SHIPPED', 'COMPLETED'];
    const revenueOrders = data.filter(o => validStatuses.includes(o.status));

    // Amount total is in cents/pence
    const totalRevenue = revenueOrders.reduce((acc, order) => acc + (order.amount_total || 0), 0) / 100;

    const aov = revenueOrders.length > 0 ? (totalRevenue / revenueOrders.length) : 0;

    return {
        totalOrders,
        totalRevenue,
        aov
    };
}

export async function getRecentOrders(limit = 10): Promise<Order[]> {
    const supabase = await getSupabase();
    const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) throw error;
    return data as Order[];
}

export async function getOrderFulfillmentStats() {
    const supabase = await getSupabase();

    // We want counts for: PAID, PROCESSING (if used), SHIPPED, COMPLETED
    const { data, error } = await supabase
        .from('orders')
        .select('status');

    if (error) throw error;

    const stats = {
        to_fulfill: 0,
        shipped: 0,
        completed: 0
    };

    data.forEach(order => {
        const s = order.status;
        if (s === 'PAID') stats.to_fulfill++;
        else if (s === 'SHIPPED') stats.shipped++;
        else if (s === 'COMPLETED') stats.completed++;
    });

    return stats;
}

export async function getSalesOverTime(from?: string, to?: string, grouping: 'hour' | 'day' | 'month' = 'day') {
    const supabase = await getSupabase();

    let query = supabase
        .from('orders')
        .select('created_at, amount_total')
        .in('status', ['PAID', 'SHIPPED', 'COMPLETED'])
        .order('created_at', { ascending: true });

    if (from) query = query.gte('created_at', from);
    if (to) query = query.lte('created_at', to);

    const { data, error } = await query;

    if (error) throw error;

    const salesMap = new Map<string, number>();

    data.forEach(order => {
        const dateObj = new Date(order.created_at);
        let key: string;

        if (grouping === 'hour') {
            key = dateObj.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
        } else if (grouping === 'month') {
            key = dateObj.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' });
        } else {
            // Default Daily
            key = dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' });
        }

        const val = (order.amount_total || 0) / 100;
        salesMap.set(key, (salesMap.get(key) || 0) + val);
    });

    return Array.from(salesMap.entries()).map(([date, revenue]) => ({ date, revenue }));
}

export async function getOrder(id: string) {
    const supabase = await getSupabase();
    const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', id)
        .single();

    if (error) throw error;
    return data;
}

export async function updateOrderStatus(id: string, status: string, tracking?: string, carrier?: string) {
    const supabase = await getSupabase();

    const updateData: { status: string; tracking_number?: string; carrier?: string } = { status };
    if (tracking) updateData.tracking_number = tracking;
    if (carrier) updateData.carrier = carrier;

    const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', id);

    if (error) throw error;

    // Send Email if Shipped
    // Send Email if Shipped
    if (status === 'SHIPPED') {
        try {
            // Need customer email
            const { data: order } = await supabase.from('orders').select('customer_email').eq('id', id).single();

            if (order?.customer_email) {
                // Fetch Items for Manifest
                // The 'items' column is JSONB, so we cast it (user updated typing)
                const { data: fullOrder } = await supabase.from('orders').select('items').eq('id', id).single();
                const items = (fullOrder?.items as { quantity: number; description: string }[]) || [];

                const itemsHtml = items.map((item) => `
                    <div style="display: table-row; border-bottom: 1px solid #222;">
                        <div style="display: table-cell; padding: 10px 0; font-size: 10px; color: #888; width: 10%;">${item.quantity}x</div>
                        <div style="display: table-cell; padding: 10px 0; font-size: 12px; color: white; font-weight: bold; text-align: left;">${item.description}</div>
                    </div>
                `).join('') || '<div style="color: #666; font-size: 10px; padding: 10px;">No items listed</div>';

                const wrapperHtml = `<div style="display: table; width: 100%; border-collapse: collapse; margin-top: 20px; margin-bottom: 20px;">${itemsHtml}</div>`;
                const orderLink = `${process.env.NEXT_PUBLIC_BASE_URL}/?order_id=${id}`;

                const { sendTransactionalEmail } = await import('@/lib/email');
                await sendTransactionalEmail({
                    key: 'order_shipped',
                    to: order.customer_email,
                    data: {
                        order_id: id,
                        tracking_number: tracking || 'PENDING',
                        carrier: carrier || 'COURIER',
                        items_html: wrapperHtml,
                        order_link: orderLink
                    }
                });
            }
        } catch (e) {
            console.error('Failed to send shipment email:', e);
            // Don't fail the update
        }
    }

    // LOYALTY PROTOCOL: Send 'order_delivered' and assign reward on COMPLETION
    if (status === 'COMPLETED') {
        try {
            // 1. Get Customer Email
            const { data: order } = await supabase.from('orders').select('customer_email').eq('id', id).single();
            if (order?.customer_email) {
                const email = order.customer_email;
                const rewardCode = 'PROTOCOL_REWARD'; // Hardcoded master voucher

                // 2. Add to Allowlist (Idempotent check via SQL array functions is hard via JS client alone without Race cond. 
                // But for this scale, Read -> Modify -> Write is acceptable, or unique array append via RPC if existed).
                // We will do Read -> Check -> Write.

                const { data: voucher } = await supabase
                    .from('vouchers')
                    .select('allowed_emails')
                    .eq('code', rewardCode)
                    .single();

                if (voucher) {
                    const currentList = voucher.allowed_emails || [];
                    if (!currentList.includes(email)) {
                        const newList = [...currentList, email];
                        await supabase
                            .from('vouchers')
                            .update({ allowed_emails: newList })
                            .eq('code', rewardCode);
                    }
                }

                // 3. Send 'order_delivered' Email
                const { sendTransactionalEmail } = await import('@/lib/email');
                await sendTransactionalEmail({
                    key: 'order_delivered',
                    to: email,
                    data: {
                        order_id: id,
                        voucher_code: rewardCode
                    }
                });
            }

        } catch (e) {
            console.error('Failed to process Loyalty Protocol:', e);
        }
    }

    return { success: true };
}

export async function refundOrder(orderId: string) {
    const supabase = await getSupabase();

    // Get Order to find Payment Intent
    const { data: order, error: fetchError } = await supabase
        .from('orders')
        .select('id, stripe_session_id, stripe_payment_intent_id, amount_total, status')
        .eq('id', orderId)
        .single();

    if (fetchError || !order) throw new Error("Order not found");

    // Status Check
    if (order.status === 'REFUNDED') throw new Error("Order already refunded");

    let paymentIntentId = order.stripe_payment_intent_id;

    // Self-Healing: If PI is missing, fetch it from Stripe Session
    if (!paymentIntentId && order.stripe_session_id) {
        try {
            const session = await stripe.checkout.sessions.retrieve(order.stripe_session_id);
            if (session.payment_intent) {
                // Handle both string and object (though usually string unless expanded)
                paymentIntentId = typeof session.payment_intent === 'string'
                    ? session.payment_intent
                    : session.payment_intent.id;

                // Save it for future
                await supabase.from('orders').update({ stripe_payment_intent_id: paymentIntentId }).eq('id', orderId);
            }
        } catch (e) {
            console.error("Failed to retrieve session for PI lookup", e);
        }
    }

    if (!paymentIntentId) throw new Error("No Payment Intent found (cannot refund via Stripe)");

    try {
        const refund = await stripe.refunds.create({
            payment_intent: paymentIntentId,
            reason: 'requested_by_customer'
        });

        if (refund.status === 'succeeded' || refund.status === 'pending') {
            const { error: updateError } = await supabase
                .from('orders')
                .update({ status: 'REFUNDED' })
                .eq('id', orderId);

            if (updateError) throw updateError;
            return { success: true };
        } else {
            throw new Error(`Stripe Refund status: ${refund.status}`);
        }

    } catch (err: unknown) {
        console.error("Refund Error:", err);
        throw new Error(err instanceof Error ? err.message : "Refund failed");
    }
}
