
'use server';

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export type VoucherResult = {
    valid: boolean;
    discount_percent: number | null;
    discount_amount: number | null;
    type: string | null;
    voucher_code: string | null;
    min_spend: number | null;
    product_ids: any | null; // using any for JSONB
    max_usage_per_cart: number | null;
    is_free_shipping: boolean | null;
    value: number | null;
    error_message: string | null;
};

export async function checkVoucherInternal(codeInput: string): Promise<VoucherResult> {
    const code = codeInput.toUpperCase().trim();

    // 1. Fetch Voucher (Service Role bypasses RLS)
    const { data: voucher, error } = await supabase
        .from('vouchers')
        .select('*')
        .ilike('code', code)
        .maybeSingle();

    if (error) {
        console.error("Voucher Fetch Error", error);
        return { valid: false, discount_percent: null, discount_amount: null, type: null, voucher_code: null, min_spend: null, product_ids: null, max_usage_per_cart: null, is_free_shipping: null, value: null, error_message: 'SYSTEM_ERROR' };
    }

    if (!voucher) {
        return { valid: false, discount_percent: null, discount_amount: null, type: null, voucher_code: null, min_spend: null, product_ids: null, max_usage_per_cart: null, is_free_shipping: null, value: null, error_message: 'CODE_NOT_FOUND' };
    }

    // 2. Checks
    if (!voucher.active) {
        return { valid: false, discount_percent: null, discount_amount: null, type: null, voucher_code: null, min_spend: null, product_ids: null, max_usage_per_cart: null, is_free_shipping: null, value: null, error_message: 'VOUCHER_DISABLED' };
    }

    const now = new Date();
    if (voucher.start_date && now < new Date(voucher.start_date)) {
        return { valid: false, discount_percent: null, discount_amount: null, type: null, voucher_code: null, min_spend: null, product_ids: null, max_usage_per_cart: null, is_free_shipping: null, value: null, error_message: 'VOUCHER_PENDING' };
    }

    if (voucher.expiration_date && now > new Date(voucher.expiration_date)) {
        return { valid: false, discount_percent: null, discount_amount: null, type: null, voucher_code: null, min_spend: null, product_ids: null, max_usage_per_cart: null, is_free_shipping: null, value: null, error_message: 'VOUCHER_EXPIRED' };
    }

    // Note: expiration_date might be called expires_at in DB? 
    // Checking phase5_vouchers.sql: "expires_at TIMESTAMP".
    // Let's check both if schema changed.

    if (voucher.expires_at && now > new Date(voucher.expires_at)) {
        return { valid: false, discount_percent: null, discount_amount: null, type: null, voucher_code: null, min_spend: null, product_ids: null, max_usage_per_cart: null, is_free_shipping: null, value: null, error_message: 'VOUCHER_EXPIRED' };
    }

    if (voucher.max_global_uses && (voucher.used_count || 0) >= voucher.max_global_uses) {
        return { valid: false, discount_percent: null, discount_amount: null, type: null, voucher_code: null, min_spend: null, product_ids: null, max_usage_per_cart: null, is_free_shipping: null, value: null, error_message: 'USE_LIMIT_REACHED' };
    }

    // 3. Success
    const type = voucher.type || (voucher.discount_percent > 0 ? 'PERCENT' : 'FIXED');
    const value = type === 'PERCENT' ? voucher.discount_percent : voucher.discount_amount;

    return {
        valid: true,
        discount_percent: voucher.discount_percent,
        discount_amount: voucher.discount_amount,
        type: type,
        voucher_code: voucher.code,
        min_spend: voucher.min_spend,
        product_ids: voucher.product_ids || [],
        max_usage_per_cart: voucher.max_usage_per_cart,
        is_free_shipping: voucher.is_free_shipping,
        value: value,
        error_message: null
    };
}
