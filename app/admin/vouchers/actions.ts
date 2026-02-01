'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Voucher } from '@/lib/types';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

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

export async function getVouchers() {
    const supabase = await getSupabase();
    const { data, error } = await supabase
        .from('vouchers')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Voucher[];
}

export async function createVoucher(formData: FormData) {
    const supabase = await getSupabase();

    const code = (formData.get('code') as string).toUpperCase();
    const type = formData.get('type') as string;
    const value = parseFloat(formData.get('value') as string);
    const min_spend = parseFloat((formData.get('min_spend') as string) || '0');

    // Advanced Rules
    const productIdsRaw = formData.getAll('product_ids');
    const product_ids = productIdsRaw.length > 0 ? productIdsRaw.map(s => (s as string).trim()).filter(Boolean) : null;

    const max_usage_per_cart_str = formData.get('max_usage_per_cart') as string;
    const max_usage_per_cart = max_usage_per_cart_str ? parseInt(max_usage_per_cart_str) : null;

    const max_global_uses_str = formData.get('max_global_uses') as string;
    const max_global_uses = max_global_uses_str ? parseInt(max_global_uses_str) : null;

    const start_date = (formData.get('start_date') as string) || null;
    const expiry_date = (formData.get('expiry_date') as string) || null;
    const is_free_shipping = formData.get('is_free_shipping') === 'on';
    const is_first_order_only = formData.get('is_first_order_only') === 'on';

    const allowedEmailsRaw = formData.get('allowed_emails') as string;
    const allowed_emails = allowedEmailsRaw
        ? allowedEmailsRaw.split(/[\n,]/).map(e => e.trim()).filter(e => e.length > 0)
        : null;

    // Validation
    if (!code || isNaN(value)) throw new Error('Invalid code or value');

    const voucher: Partial<Voucher> & { discount_percent?: number; discount_amount?: number } = {
        code,
        type: type as Voucher['type'],
        active: true,
        used_count: 0,
        min_spend: min_spend || null,
        product_ids,
        max_usage_per_cart,
        max_global_uses,
        // Default Start: Now if empty
        start_date: start_date ? new Date(start_date).toISOString() : new Date().toISOString(),
        // Default Expiry: Null (Never) if empty
        expiry_date: expiry_date ? new Date(expiry_date).toISOString() : null,
        is_free_shipping,
        is_first_order_only,
        allowed_emails
    };

    if (type === 'PERCENT') voucher.discount_percent = value;
    else voucher.discount_amount = value; // Stores value for both FIXED and FIXED_PRICE

    const { error } = await supabase.from('vouchers').insert(voucher);

    if (error) {
        console.error(error);
        throw new Error('Failed to create voucher: ' + error.message + ' (' + error.details + ')');
    }

    revalidatePath('/admin/vouchers');
    redirect('/admin/vouchers');
}

export async function deleteVoucher(id: string) {
    const supabase = await getSupabase();
    const { error } = await supabase.from('vouchers').delete().eq('id', id);
    if (error) throw error;
    revalidatePath('/admin/vouchers');
}

export async function duplicateVoucher(id: string) {
    const supabase = await getSupabase();
    const { data: voucher, error: fetchError } = await supabase.from('vouchers').select('*').eq('id', id).single();
    if (fetchError || !voucher) throw new Error('Voucher not found');

    const newVoucher = { ...voucher };
    delete newVoucher.id;
    delete newVoucher.created_at;
    newVoucher.code = `${voucher.code}_CLONE_${Math.floor(Math.random() * 1000)}`;
    newVoucher.used_count = 0;

    const { error: insertError } = await supabase.from('vouchers').insert(newVoucher);
    if (insertError) throw insertError;

    revalidatePath('/admin/vouchers');
}

export async function updateVoucher(id: string, formData: FormData) {
    const supabase = await getSupabase();

    const code = (formData.get('code') as string).toUpperCase();
    const type = formData.get('type') as string;
    const value = parseFloat(formData.get('value') as string);
    const min_spend = parseFloat((formData.get('min_spend') as string) || '0');

    // Advanced Rules
    const productIdsRaw = formData.getAll('product_ids');
    const product_ids = productIdsRaw.length > 0 ? productIdsRaw.map(s => (s as string).trim()).filter(Boolean) : null;

    const max_usage_per_cart_str = formData.get('max_usage_per_cart') as string;
    const max_usage_per_cart = max_usage_per_cart_str ? parseInt(max_usage_per_cart_str) : null;

    const max_global_uses_str = formData.get('max_global_uses') as string;
    const max_global_uses = max_global_uses_str ? parseInt(max_global_uses_str) : null;

    const start_date = (formData.get('start_date') as string) || null;
    const expiry_date = (formData.get('expiry_date') as string) || null;
    const is_free_shipping = formData.get('is_free_shipping') === 'on';
    const is_first_order_only = formData.get('is_first_order_only') === 'on';

    const allowedEmailsRaw = formData.get('allowed_emails') as string;
    const allowed_emails = allowedEmailsRaw
        ? allowedEmailsRaw.split(/[\n,]/).map(e => e.trim()).filter(e => e.length > 0)
        : null;

    const updates: Partial<Voucher> & { discount_percent?: number; discount_amount?: number } = {
        code,
        type: type as Voucher['type'],
        min_spend: min_spend || null,
        product_ids,
        max_usage_per_cart,
        max_global_uses,
        start_date: start_date ? new Date(start_date).toISOString() : null,
        expiry_date: expiry_date ? new Date(expiry_date).toISOString() : null,
        is_free_shipping,
        is_first_order_only,
        allowed_emails
    };

    if (type === 'PERCENT') {
        updates.discount_percent = value;
        updates.discount_amount = 0;
    } else {
        updates.discount_amount = value;
        updates.discount_percent = 0;
    }

    console.log("[ADMIN] Updating voucher:", id, updates);
    const { error } = await supabase.from('vouchers').update(updates).eq('id', id);
    if (error) {
        console.error("[ADMIN] Update Error:", error);
        throw error;
    }

    revalidatePath('/admin/vouchers');
    redirect('/admin/vouchers');
}

export async function toggleVoucher(id: string, currentStatus: boolean) {
    const supabase = await getSupabase();
    const { error } = await supabase.from('vouchers').update({ active: !currentStatus }).eq('id', id);
    if (error) throw error;
    revalidatePath('/admin/vouchers');
}
