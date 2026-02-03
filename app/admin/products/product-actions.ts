'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';


// Helper to get authenticated Admin Client
async function getSupabase() {
    const cookieStore = await cookies();
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

export async function getProducts() {
    const supabase = await getSupabase();
    // Use select('*') to be safe on column names, map locally
    const { data, error } = await supabase
        .from('products')
        .select(`
            *,
            batches (stock_quantity)
        `)
        .order('category', { ascending: true })
        .order('priority', { ascending: true });

    if (error) throw error;

    // Map 'name' to 'model' and 'price_gbp' to 'price' for frontend compatibility
    return data.map((p) => ({
        ...p,
        model: p.name, // Map DB 'name' to 'model'
        price: p.price_gbp, // Map DB 'price_gbp' to 'price'
    }));
}

export async function getProduct(slug: string) {
    const supabase = await getSupabase();
    const { data, error } = await supabase
        .from('products')
        .select(`
            *,
            batches (*)
        `)
        .eq('slug', slug)
        .single();

    if (error) return null;
    return {
        ...data,
        model: data.name, // Map DB 'name' to 'model'
        price: data.price_gbp // Map DB 'price_gbp' to 'price'
    };
}

export async function upsertProduct(formData: FormData) {
    console.log('[DEBUG] upsertProduct: Starting');
    try {
        const supabase = await getSupabase();

        const product = {
            slug: formData.get('slug') as string,
            name: formData.get('model') as string, // DB 'name' map to 'model' input
            spec: formData.get('spec') as string,
            tag: formData.get('tag') as string,
            category: formData.get('category') as string,
            pitch: formData.get('pitch') as string,
            price_gbp: parseFloat(formData.get('price') as string),
            nominal_voltage_v: parseFloat((formData.get('nominal_voltage_v') as string) || '0'),
            max_discharge_a: parseFloat((formData.get('max_discharge_a') as string) || '0'),
            weight_g: parseFloat((formData.get('weight_g') as string) || '0'),
            priority: parseInt((formData.get('priority') as string) || '99'),
            images: formData.getAll('images') as string[],
        };

        console.log('[DEBUG] upsertProduct: Payload prepared', product.slug);

        // Manual Upsert Logic to avoid constraint issues
        // 1. Check if exists
        const { data: existing } = await supabase.from('products').select('id').eq('slug', product.slug).single();

        let error;
        if (existing) {
            // UPDATE
            console.log('[DEBUG] upsertProduct: Updating existing', existing.id);
            const { error: err } = await supabase
                .from('products')
                .update(product)
                .eq('slug', product.slug);
            error = err;
        } else {
            // INSERT
            console.log('[DEBUG] upsertProduct: Inserting new');
            const { error: err } = await supabase
                .from('products')
                .insert(product);
            error = err;
        }

        if (error) {
            console.error('[DEBUG] upsertProduct: DB Error:', error);
            throw new Error('Failed to save product: ' + error.message);
        }

        console.log('[DEBUG] upsertProduct: Success. Revalidating...');
        revalidatePath('/admin/products');
        revalidatePath(`/products/${product.slug}`); // Update public page
    } catch (e: unknown) {
        console.error('[DEBUG] upsertProduct: EXCEPTION:', e);
        throw e;
    }
}

export async function addBatch(slug: string, stock: number, supplierRef?: string, date?: string) {
    const supabase = await getSupabase();
    // Find product ID by slug
    const { data: p } = await supabase.from('products').select('id').eq('slug', slug).single();
    if (!p) throw new Error('Product not found');

    const { error } = await supabase.from('batches').insert({
        product_id: p.id,
        stock_quantity: stock,
        status: 'LIVE',
        supplier_reference: supplierRef || null,
        received_date: date || new Date().toISOString(),
        batch_code: `BATCH-${Date.now()}` // Auto-gen code for MVP
    });

    if (error) throw error;
    revalidatePath('/admin/products');
}

export async function archiveBatch(batchId: string) {
    const supabase = await getSupabase();
    const { error } = await supabase.from('batches').update({ status: 'ARCHIVED' }).eq('id', batchId);
    if (error) throw error;
    revalidatePath('/admin/products');
}

export async function updateBatch(batchId: string, updates: { stock_quantity?: number; supplier_reference?: string; received_date?: string }) {
    const supabase = await getSupabase();
    const { error } = await supabase.from('batches').update(updates).eq('id', batchId);
    if (error) throw error;
    revalidatePath('/admin/products');
}
