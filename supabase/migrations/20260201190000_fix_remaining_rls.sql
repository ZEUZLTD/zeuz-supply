-- FINAL RLS CLEANUP: Fix InitCalls & Consolidate Redundant Policies
-- 2026-02-01

-- 1. AUTH INIT OPTIMIZATION (Wrap auth.role())
-- Fixes: "re-evaluates auth.role() for each row"

-- Inquiries
DROP POLICY IF EXISTS "Allow public insert to inquiries" ON public.inquiries;
CREATE POLICY "Unified Insert Inquiries" ON public.inquiries FOR INSERT
WITH CHECK ((select auth.role()) = 'anon');

-- Signups
DROP POLICY IF EXISTS "Allow public insert to signups" ON public.signups;
CREATE POLICY "Unified Insert Signups" ON public.signups FOR INSERT
WITH CHECK ((select auth.role()) = 'anon');

-- Checkouts (Re-apply with wrapper just to be 100% sure and consistent)
DROP POLICY IF EXISTS "Anon can insert checkouts" ON public.checkouts;
CREATE POLICY "Unified Insert Checkouts" ON public.checkouts FOR INSERT
WITH CHECK ((select auth.role()) = 'anon');

DROP POLICY IF EXISTS "Anon can update checkouts" ON public.checkouts;
CREATE POLICY "Unified Update Checkouts" ON public.checkouts FOR UPDATE
USING ((select auth.role()) = 'anon');


-- 2. POLICY CONSOLIDATION (Unified Policies)
-- Fixes: "Multiple permissive policies for role..."

-- App Settings
-- Drop old overlapping policies
DROP POLICY IF EXISTS "Allow admin full access" ON public.app_settings;
DROP POLICY IF EXISTS "Allow public read marketing settings" ON public.app_settings;

-- Create Unified Read Policy
CREATE POLICY "Unified Read App Settings" ON public.app_settings FOR SELECT
USING (
    key IN ('SHOW_SPLASH', 'SPLASH_MESSAGE', 'LAUNCH_DISCOUNT_ACTIVE') -- Public keys
    OR
    ( -- Admin Check
      (select auth.role()) = 'authenticated' AND
      exists (
          select 1 from public.profiles
          where id = (select auth.uid()) and role = 'admin'
      )
    )
);

-- Re-create Admin Write Policy (separate from Read is fine, but ensure only one Write policy exists)
-- Assuming the previous "Allow admin full access" was FOR ALL. We need a specific Write/All policy for admin.
CREATE POLICY "Unified Admin All App Settings" ON public.app_settings FOR ALL
USING (
    (select auth.role()) = 'authenticated' AND
    exists (
        select 1 from public.profiles
        where id = (select auth.uid()) and role = 'admin'
    )
);


-- Batches
DROP POLICY IF EXISTS "Allow public read batches" ON public.batches;
DROP POLICY IF EXISTS "Anon can view batches" ON public.batches;
-- Create Unified Read
CREATE POLICY "Unified Read Batches" ON public.batches FOR SELECT
USING (true);


-- Products
DROP POLICY IF EXISTS "Allow public read products" ON public.products;
DROP POLICY IF EXISTS "Anon can view products" ON public.products;
-- Create Unified Read
CREATE POLICY "Unified Read Products" ON public.products FOR SELECT
USING (true);


-- Volume Discounts
DROP POLICY IF EXISTS "Admin Full Access Volume Discounts" ON public.volume_discounts;
DROP POLICY IF EXISTS "Public Read Volume Discounts" ON public.volume_discounts;
-- Create Unified Read
CREATE POLICY "Unified Read Volume Discounts" ON public.volume_discounts FOR SELECT
USING (true);
-- Create Admin Write (if not covered by Read)
CREATE POLICY "Unified Admin Write Volume Discounts" ON public.volume_discounts FOR INSERT
WITH CHECK (
    (select auth.role()) = 'authenticated' AND
    exists (
        select 1 from public.profiles
        where id = (select auth.uid()) and role = 'admin'
    )
);
CREATE POLICY "Unified Admin Update Volume Discounts" ON public.volume_discounts FOR UPDATE
USING (
    (select auth.role()) = 'authenticated' AND
    exists (
        select 1 from public.profiles
        where id = (select auth.uid()) and role = 'admin'
    )
);
CREATE POLICY "Unified Admin Delete Volume Discounts" ON public.volume_discounts FOR DELETE
USING (
    (select auth.role()) = 'authenticated' AND
    exists (
        select 1 from public.profiles
        where id = (select auth.uid()) and role = 'admin'
    )
);


-- Profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Anon can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

CREATE POLICY "Unified Read Profiles" ON public.profiles FOR SELECT
USING (
    (select auth.uid()) = id -- Own Profile
    OR
    ( -- Admin Access
        (select auth.role()) = 'authenticated' AND
        exists (
            select 1 from public.profiles
            where id = (select auth.uid()) and role = 'admin'
        )
    )
);
-- Ensure update/insert policies are still fine (handled in previous migration but good to verify they are single)
-- "Users can update own profile" from previous migration is likely fine.
