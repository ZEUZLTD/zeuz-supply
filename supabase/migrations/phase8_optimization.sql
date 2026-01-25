-- Phase 8: Optimization & Security
-- 1. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);

-- 2. Future-Proofing Graphs
ALTER TABLE batches ADD COLUMN IF NOT EXISTS graph_data JSONB DEFAULT '{}'::jsonb;

-- 3. Voucher Security (RPC)
-- Secure function to check vouchers without exposing the table
CREATE OR REPLACE FUNCTION check_voucher(code_input TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with owner privileges (bypassing RLS for the lookup)
AS $$
DECLARE
    voucher_record RECORD;
BEGIN
    SELECT * INTO voucher_record
    FROM vouchers
    WHERE code = UPPER(code_input) 
    AND active = TRUE;

    IF FOUND THEN
        RETURN jsonb_build_object(
            'valid', true,
            'type', CASE 
                WHEN voucher_record.discount_percent > 0 THEN 'PERCENT' 
                ELSE 'FIXED' 
            END,
            'value', CASE 
                WHEN voucher_record.discount_percent > 0 THEN voucher_record.discount_percent 
                ELSE voucher_record.discount_amount 
            END,
            'code', voucher_record.code
        );
    ELSE
        RETURN jsonb_build_object('valid', false);
    END IF;
END;
$$;

-- 4. Lockdown Vouchers Table
-- Revoke the public policy created in Phase 6 (if it exists)
-- We'll just drop the policy to be safe, creating a "Deny All" by default for Anon SELECT
DROP POLICY IF EXISTS "Public Read Active Vouchers" ON vouchers;
DROP POLICY IF EXISTS "Allow public read active vouchers" ON vouchers; 

-- Make sure RLS is on
ALTER TABLE vouchers ENABLE ROW LEVEL SECURITY;

-- Grant execute on the function
GRANT EXECUTE ON FUNCTION check_voucher(text) TO anon, authenticated, service_role;
