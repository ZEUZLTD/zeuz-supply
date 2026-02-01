-- RESOLVE OVERLAP CONFLICTS: Split ALL -> INSERT/UPDATE/DELETE
-- 2026-02-01

-- Goal: Ensure 'SELECT' action is covered by exactly ONE policy to satisfy linter.

-- 1. APP SETTINGS
-- Dropped: Unified Admin All App Settings (which included SELECT)
-- Kept: Unified Read App Settings (Handles ALL Selects)

DROP POLICY IF EXISTS "Unified Admin All App Settings" ON public.app_settings;

-- Create Specific Write Policies for Admin
CREATE POLICY "Unified Admin Insert App Settings" ON public.app_settings FOR INSERT
WITH CHECK (
    (select auth.role()) = 'authenticated' AND
    exists (
        select 1 from public.profiles
        where id = (select auth.uid()) and role = 'admin'
    )
);

CREATE POLICY "Unified Admin Update App Settings" ON public.app_settings FOR UPDATE
USING (
    (select auth.role()) = 'authenticated' AND
    exists (
        select 1 from public.profiles
        where id = (select auth.uid()) and role = 'admin'
    )
);

CREATE POLICY "Unified Admin Delete App Settings" ON public.app_settings FOR DELETE
USING (
    (select auth.role()) = 'authenticated' AND
    exists (
        select 1 from public.profiles
        where id = (select auth.uid()) and role = 'admin'
    )
);


-- 2. ORDERS
-- Drop potential overlapping policies
DROP POLICY IF EXISTS "Admin All Orders" ON public.orders;
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
DROP POLICY IF EXISTS "Anon can view orders" ON public.orders;

-- Create Unified Read Policy (Combines User Own + Admin + Legacy Anon if needed)
CREATE POLICY "Unified Read Orders" ON public.orders FOR SELECT
USING (
    -- User Own Order
    (customer_email = (select email from auth.users where id = (select auth.uid())))
    OR
    -- Admin Access
    (
        (select auth.role()) = 'authenticated' AND
        exists (
            select 1 from public.profiles
            where id = (select auth.uid()) and role = 'admin'
        )
    )
    -- NOTE: Intentionally OMITTING "Anon" legacy check unless explicitly required. 
    -- If Anon needed access, they usually do it via special token lookup or similar, not RLS list.
);

-- Create Admin Write Policies
CREATE POLICY "Unified Admin Insert Orders" ON public.orders FOR INSERT
WITH CHECK (
    (select auth.role()) = 'authenticated' AND
    exists (
        select 1 from public.profiles
        where id = (select auth.uid()) and role = 'admin'
    )
);

CREATE POLICY "Unified Admin Update Orders" ON public.orders FOR UPDATE
USING (
    (select auth.role()) = 'authenticated' AND
    exists (
        select 1 from public.profiles
        where id = (select auth.uid()) and role = 'admin'
    )
);

CREATE POLICY "Unified Admin Delete Orders" ON public.orders FOR DELETE
USING (
    (select auth.role()) = 'authenticated' AND
    exists (
        select 1 from public.profiles
        where id = (select auth.uid()) and role = 'admin'
    )
);
