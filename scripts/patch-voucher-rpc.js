const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function applySql() {
    const sql = `
DROP FUNCTION IF EXISTS check_voucher(text);

CREATE OR REPLACE FUNCTION check_voucher(code_input TEXT)
RETURNS TABLE (
    valid BOOLEAN,
    discount_percent NUMERIC,
    discount_amount NUMERIC,
    type TEXT,
    code TEXT,
    min_spend NUMERIC,
    product_ids JSONB,
    max_usage_per_cart INT,
    is_free_shipping BOOLEAN,
    value NUMERIC,
    error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_record public.vouchers%ROWTYPE;
BEGIN
    SELECT * INTO v_record FROM public.vouchers WHERE code = UPPER(code_input) LIMIT 1;

    IF NOT FOUND THEN
        RETURN QUERY SELECT 
            FALSE, NULL::NUMERIC, NULL::NUMERIC, NULL::TEXT, NULL::TEXT, NULL::NUMERIC, NULL::JSONB, NULL::INT, NULL::BOOLEAN, NULL::NUMERIC, 
            'CODE_NOT_FOUND';
        RETURN;
    END IF;

    -- Validity Checks
    IF NOT v_record.active THEN
        RETURN QUERY SELECT 
            FALSE, NULL::NUMERIC, NULL::NUMERIC, NULL::TEXT, NULL::TEXT, NULL::NUMERIC, NULL::JSONB, NULL::INT, NULL::BOOLEAN, NULL::NUMERIC,
            'VOUCHER_DISABLED';
        RETURN;
    END IF;

    -- Date Checks
    IF v_record.start_date IS NOT NULL AND NOW() < v_record.start_date THEN
         RETURN QUERY SELECT 
            FALSE, NULL::NUMERIC, NULL::NUMERIC, NULL::TEXT, NULL::TEXT, NULL::NUMERIC, NULL::JSONB, NULL::INT, NULL::BOOLEAN, NULL::NUMERIC,
            'VOUCHER_PENDING';
         RETURN;
    END IF;

    IF v_record.expiry_date IS NOT NULL AND NOW() > v_record.expiry_date THEN
         RETURN QUERY SELECT 
            FALSE, NULL::NUMERIC, NULL::NUMERIC, NULL::TEXT, NULL::TEXT, NULL::NUMERIC, NULL::JSONB, NULL::INT, NULL::BOOLEAN, NULL::NUMERIC,
            'VOUCHER_EXPIRED';
         RETURN;
    END IF;

    -- Global Usage Check
    IF v_record.max_global_uses IS NOT NULL AND (v_record.used_count >= v_record.max_global_uses) THEN
         RETURN QUERY SELECT 
            FALSE, NULL::NUMERIC, NULL::NUMERIC, NULL::TEXT, NULL::TEXT, NULL::NUMERIC, NULL::JSONB, NULL::INT, NULL::BOOLEAN, NULL::NUMERIC,
            'USE_LIMIT_REACHED';
         RETURN;
    END IF;

    -- Success
    RETURN QUERY SELECT 
        TRUE, 
        v_record.discount_percent, 
        v_record.discount_amount, 
        v_record.type, 
        v_record.code,
        v_record.min_spend,
        v_record.product_ids,
        v_record.max_usage_per_cart,
        v_record.is_free_shipping,
        CASE WHEN v_record.type = 'PERCENT' THEN v_record.discount_percent ELSE v_record.discount_amount END,
        NULL::TEXT;
END;
$$;
  `;

    console.log("Applying SQL patch for better voucher errors...");
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql }); // Assuming an exec_sql helper or just run it via REST

    if (error) {
        // If no exec_sql RPC, we have to use the Postgres REST endpoint or just tell the user.
        // Most Supabase setups don't have exec_sql unless explicitly added.
        // I'll try to just update the function if I can find another way, 
        // but the most reliable is the SQL Editor.
        console.error("Failed to apply via RPC. You may need to run this manually in SQL Editor.", error);
    } else {
        console.log("SQL Patch Applied Successfully!");
    }
}

applySql();
