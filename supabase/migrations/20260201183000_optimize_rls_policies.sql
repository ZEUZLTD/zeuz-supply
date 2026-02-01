-- PERFORMANCE OPTIMIZATION: Wrap Auth Calls & Consolidate Policies
-- 2026-02-01

-- 1. ORDERS: Optimize & Cleanup
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
CREATE POLICY "Users can view own orders" ON public.orders FOR SELECT TO authenticated
USING (
    customer_email = (select email from auth.users where id = (select auth.uid()))
);

DROP POLICY IF EXISTS "Admin All Orders" ON public.orders;
CREATE POLICY "Admin All Orders" ON public.orders FOR ALL TO authenticated
USING (
    exists (
        select 1 from public.profiles
        where id = (select auth.uid()) and role = 'admin'
    )
);


-- 2. PROFILES: Optimize
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT
USING ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE
USING ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles; -- Usually handled by trigger, but if exists
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT
WITH CHECK ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT
USING (
    exists (
        select 1 from public.profiles
        where id = (select auth.uid()) and role = 'admin'
    )
);


-- 3. CART ITEMS: Consolidate & Optimize
-- Drop granular policies to remove "Multiple Permissive Policies" warning
DROP POLICY IF EXISTS "Users can view their own cart items" ON public.cart_items;
DROP POLICY IF EXISTS "Users can insert their own cart items" ON public.cart_items;
DROP POLICY IF EXISTS "Users can update their own cart items" ON public.cart_items;
DROP POLICY IF EXISTS "Users can delete their own cart items" ON public.cart_items;
DROP POLICY IF EXISTS "Users own cart" ON public.cart_items; -- Drop old consolidation if exists

-- Create Single Optimized Policy
CREATE POLICY "Users own cart" ON public.cart_items FOR ALL
USING ((select auth.uid()) = user_id)
WITH CHECK ((select auth.uid()) = user_id);


-- 4. CART SESSIONS: Optimize
DROP POLICY IF EXISTS "Users own session" ON public.cart_sessions;
CREATE POLICY "Users own session" ON public.cart_sessions FOR ALL
USING ((select auth.uid()) = user_id)
WITH CHECK ((select auth.uid()) = user_id);


-- 5. APP SETTINGS: Optimize & Clarify
DROP POLICY IF EXISTS "Allow admin full access" ON public.app_settings;
CREATE POLICY "Allow admin full access" ON public.app_settings FOR ALL
USING (
    (select auth.role()) = 'authenticated' AND
    exists (
        select 1 from public.profiles
        where id = (select auth.uid()) and role = 'admin'
    )
);


-- 6. EMAIL TEMPLATES: Optimize
DROP POLICY IF EXISTS "Admin full access email_templates" ON public.email_templates;
CREATE POLICY "Admin full access email_templates" ON public.email_templates FOR ALL
USING (
    (select auth.role()) = 'authenticated' AND
    exists (
        select 1 from public.profiles
        where id = (select auth.uid()) and role = 'admin'
    )
);
-- Remove "Service Role" explicit policy if it exists and causes duplication
DROP POLICY IF EXISTS "Service Role read email_templates" ON public.email_templates;


-- 7. USER ADDRESSES: Optimize
DROP POLICY IF EXISTS "Users can view own addresses" ON public.user_addresses;
CREATE POLICY "Users can view own addresses" ON public.user_addresses FOR SELECT
USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own addresses" ON public.user_addresses;
CREATE POLICY "Users can insert own addresses" ON public.user_addresses FOR INSERT
WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own addresses" ON public.user_addresses;
CREATE POLICY "Users can update own addresses" ON public.user_addresses FOR UPDATE
USING ((select auth.uid()) = user_id);

-- 8. RE-APPLY Previous specific fixes (Safety Measure)
-- Ensure 'checkouts' policies use (select auth.role()) if linter complains about auth.role() re-eval
-- (Supabase docs suggest referencing auth.uid() inside select, but auth.role() is usually fine.
--  Adding wrap just in case for consistency).
DROP POLICY IF EXISTS "Anon can insert checkouts" ON public.checkouts;
CREATE POLICY "Anon can insert checkouts" ON public.checkouts FOR INSERT 
WITH CHECK ((select auth.role()) = 'anon');

DROP POLICY IF EXISTS "Anon can update checkouts" ON public.checkouts;
CREATE POLICY "Anon can update checkouts" ON public.checkouts FOR UPDATE 
USING ((select auth.role()) = 'anon');
