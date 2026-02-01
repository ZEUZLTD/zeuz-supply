-- FIX PERMISSION DENIED: Use JWT claims instead of auth.users table
-- 2026-02-01

-- 1. Fix ORDERS Policy (The "Permission Denied" source)
DROP POLICY IF EXISTS "Unified Read Orders" ON public.orders;

CREATE POLICY "Unified Read Orders" ON public.orders FOR SELECT
USING (
    -- Match Email from JWT (Safe, Fast, No Table Access)
    -- Note: auth.jwt() returns JSONB, ->> 'email' extracts text.
    (customer_email = (select auth.jwt() ->> 'email'))
    OR
    is_admin() -- Admin Access (Verified working via RPC check)
);

-- 2. Restore PROFILES Policy (Re-enable Admin View)
-- Since is_admin() is SECURITY DEFINER and verified to return true/false correctly,
-- we can safely restore the full policy without recursion.
DROP POLICY IF EXISTS "Unified Read Profiles" ON public.profiles;

CREATE POLICY "Unified Read Profiles" ON public.profiles FOR SELECT
USING (
    (select auth.uid()) = id -- Own Profile
    OR
    is_admin() -- Admin View All
);
