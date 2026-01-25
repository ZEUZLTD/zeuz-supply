-- TEMP DEV ACCESS V3: IDEMPOTENT GATES
-- Run this to fix access. Safe to re-run multiple times.

-- 1. Profiles
DROP POLICY IF EXISTS "Anon can view profiles" ON public.profiles;
CREATE POLICY "Anon can view profiles" ON public.profiles FOR SELECT USING (true);

-- 2. Products
DROP POLICY IF EXISTS "Anon can view products" ON public.products;
CREATE POLICY "Anon can view products" ON public.products FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anon can insert products" ON public.products;
CREATE POLICY "Anon can insert products" ON public.products FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Anon can update products" ON public.products;
CREATE POLICY "Anon can update products" ON public.products FOR UPDATE USING (true);

-- 3. Batches
DROP POLICY IF EXISTS "Anon can view batches" ON public.batches;
CREATE POLICY "Anon can view batches" ON public.batches FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anon can insert batches" ON public.batches;
CREATE POLICY "Anon can insert batches" ON public.batches FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Anon can update batches" ON public.batches;
CREATE POLICY "Anon can update batches" ON public.batches FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Anon can delete batches" ON public.batches;
CREATE POLICY "Anon can delete batches" ON public.batches FOR DELETE USING (true);

-- 4. Orders
DROP POLICY IF EXISTS "Anon can view orders" ON public.orders;
CREATE POLICY "Anon can view orders" ON public.orders FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anon can update orders" ON public.orders;
CREATE POLICY "Anon can update orders" ON public.orders FOR UPDATE USING (true);

-- 5. Vouchers
DROP POLICY IF EXISTS "Anon can view vouchers" ON public.vouchers;
CREATE POLICY "Anon can view vouchers" ON public.vouchers FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anon can insert vouchers" ON public.vouchers;
CREATE POLICY "Anon can insert vouchers" ON public.vouchers FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Anon can update vouchers" ON public.vouchers;
CREATE POLICY "Anon can update vouchers" ON public.vouchers FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Anon can delete vouchers" ON public.vouchers;
CREATE POLICY "Anon can delete vouchers" ON public.vouchers FOR DELETE USING (true);
