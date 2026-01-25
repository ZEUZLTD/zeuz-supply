-- FIX: Resolve "column reference code is ambiguous"
DROP FUNCTION IF EXISTS check_voucher(text);

CREATE OR REPLACE FUNCTION check_voucher(code_input TEXT)
RETURNS TABLE (
    valid BOOLEAN,
    discount_percent NUMERIC,
    discount_amount NUMERIC,
    type TEXT,
    voucher_code TEXT, -- RENAMED from 'code' to avoid ambiguity
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
    -- Query by UPPER case for case-insensitivity
    SELECT * INTO v_record FROM public.vouchers WHERE UPPER(vouchers.code) = UPPER(code_input) LIMIT 1;

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

    -- Date Checks (Using NOW() for server-side time)
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

    -- Success: Renamed 'code' return to 'voucher_code'
    RETURN QUERY SELECT 
        TRUE, 
        v_record.discount_percent, 
        v_record.discount_amount, 
        v_record.type, 
        v_record.code, -- This is the table column
        v_record.min_spend,
        v_record.product_ids,
        v_record.max_usage_per_cart,
        v_record.is_free_shipping,
        CASE WHEN v_record.type = 'PERCENT' THEN v_record.discount_percent ELSE v_record.discount_amount END,
        NULL::TEXT;
END;
$$;
