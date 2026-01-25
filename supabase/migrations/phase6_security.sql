-- Phase 6 Security & Cleanup

-- 1. Enable RLS on Vouchers
ALTER TABLE vouchers ENABLE ROW LEVEL SECURITY;

-- Allow public read access to active vouchers (needed for client-side validation)
-- In a real production app, you might hide this behind an RPC function to prevent code scraping.
CREATE POLICY "Public Read Active Vouchers" ON vouchers 
FOR SELECT 
USING (active = true);

-- 2. Ensure Profiles RLS is active (already done in Phase 5 but good to confirm)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
-- (Policies were added in Phase 5)

-- 3. Cleanup / Optional
-- Add any missing indexes if needed
CREATE INDEX IF NOT EXISTS idx_products_priority ON products(priority);
