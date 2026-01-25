-- Add type column
ALTER TABLE public.vouchers ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'FIXED';

-- Backfill existing data
UPDATE public.vouchers SET type = 'PERCENT' WHERE discount_percent > 0;
UPDATE public.vouchers SET type = 'FIXED' WHERE discount_amount > 0 AND type IS NULL;

-- Ensure check_voucher works with the new column (It was technically broken before if compiled against old schema)
-- We need to re-run the check_voucher definition to be safe/clean? 
-- Actually, the previous migration defined check_voucher using v_record.type which FAILED if column missing.
-- Now that we add the column, we might need to recreate the function to bind correctly, but Postgres usually handles column addition fine if * is used.
-- But let's re-run the check_voucher definition just in case to be explicit.

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
    value NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_record public.vouchers%ROWTYPE;
BEGIN
    SELECT * INTO v_record FROM public.vouchers WHERE code = UPPER(code_input) LIMIT 1;

    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, NULL::NUMERIC, NULL::NUMERIC, NULL::TEXT, NULL::TEXT, NULL::NUMERIC, NULL::JSONB, NULL::INT, NULL::BOOLEAN, NULL::NUMERIC;
        RETURN;
    END IF;

    -- Validity Checks
    IF NOT v_record.active THEN
        RETURN QUERY SELECT FALSE, NULL::NUMERIC, NULL::NUMERIC, NULL::TEXT, NULL::TEXT, NULL::NUMERIC, NULL::JSONB, NULL::INT, NULL::BOOLEAN, NULL::NUMERIC;
            RETURN;
    END IF;

    -- Date Checks
    IF v_record.start_date IS NOT NULL AND NOW() < v_record.start_date THEN
         RETURN QUERY SELECT FALSE, NULL::NUMERIC, NULL::NUMERIC, NULL::TEXT, NULL::TEXT, NULL::NUMERIC, NULL::JSONB, NULL::INT, NULL::BOOLEAN, NULL::NUMERIC;
         RETURN;
    END IF;

    IF v_record.expiry_date IS NOT NULL AND NOW() > v_record.expiry_date THEN
         RETURN QUERY SELECT FALSE, NULL::NUMERIC, NULL::NUMERIC, NULL::TEXT, NULL::TEXT, NULL::NUMERIC, NULL::JSONB, NULL::INT, NULL::BOOLEAN, NULL::NUMERIC;
         RETURN;
    END IF;

    -- Global Usage Check
    IF v_record.max_global_uses IS NOT NULL AND (v_record.used_count >= v_record.max_global_uses) THEN
         RETURN QUERY SELECT FALSE, NULL::NUMERIC, NULL::NUMERIC, NULL::TEXT, NULL::TEXT, NULL::NUMERIC, NULL::JSONB, NULL::INT, NULL::BOOLEAN, NULL::NUMERIC;
         RETURN;
    END IF;

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
        CASE WHEN v_record.type = 'PERCENT' THEN v_record.discount_percent ELSE v_record.discount_amount END;
END;
$$;
