'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Order } from '@/lib/types';

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

export async function getOrderKPIs() {
    const supabase = await getSupabase();

    // Total Revenue & Count
    // For large datasets, use count() and sum() in SQL/RPC. 
    // MVP: fetch all orders (be careful if > 1000s, but for launch fine).
    // Better MVP: .select('id, amount_total') to minimize data.
    const { data, error } = await supabase
        .from('orders')
        .select('id, amount_total, status');

    if (error) throw error;

    const totalOrders = data.length;
    // Amount total is in cents/pence
    const totalRevenue = data.reduce((acc, order) => acc + (order.amount_total || 0), 0) / 100;

    const paidOrders = data.filter(o => o.status === 'PAID');
    const aov = paidOrders.length > 0 ? (totalRevenue / paidOrders.length) : 0;

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

export async function getSalesOverTime() {
    const supabase = await getSupabase();
    // Group by day.
    // MVP: Fetch created_at and amount_total, group in JS.
    const { data, error } = await supabase
        .from('orders')
        .select('created_at, amount_total')
        .eq('status', 'PAID')
        .order('created_at', { ascending: true });

    if (error) throw error;

    // Aggregate by Date (DD/MM)
    const salesMap = new Map<string, number>();

    data.forEach(order => {
        const date = new Date(order.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' });
        const val = (order.amount_total || 0) / 100;
        salesMap.set(date, (salesMap.get(date) || 0) + val);
    });

    // Convert to Array
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

    const updateData: any = { status };
    if (tracking) updateData.tracking_number = tracking;
    if (carrier) updateData.carrier = carrier;

    const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', id);

    if (error) throw error;
    return { success: true };
}
