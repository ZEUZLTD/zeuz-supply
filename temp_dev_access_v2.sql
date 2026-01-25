-- TEMP DEV ACCESS V2: OPEN THE GATES CORRECTLY
-- Run this to fix the "Application Error" on Products

-- 1. Profiles
CREATE POLICY "Anon can view profiles" ON public.profiles FOR SELECT USING (true);

-- 2. Products (Read + Write)
CREATE POLICY "Anon can view products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Anon can insert products" ON public.products FOR INSERT WITH CHECK (true);
CREATE POLICY "Anon can update products" ON public.products FOR UPDATE USING (true);

-- 3. Batches (Read + Write)
CREATE POLICY "Anon can view batches" ON public.batches FOR SELECT USING (true);
CREATE POLICY "Anon can insert batches" ON public.batches FOR INSERT WITH CHECK (true);
CREATE POLICY "Anon can update batches" ON public.batches FOR UPDATE USING (true);
CREATE POLICY "Anon can delete batches" ON public.batches FOR DELETE USING (true);

-- 4. Orders
CREATE POLICY "Anon can view orders" ON public.orders FOR SELECT USING (true);
CREATE POLICY "Anon can update orders" ON public.orders FOR UPDATE USING (true);

-- 5. Vouchers
CREATE POLICY "Anon can view vouchers" ON public.vouchers FOR SELECT USING (true);
CREATE POLICY "Anon can insert vouchers" ON public.vouchers FOR INSERT WITH CHECK (true);
CREATE POLICY "Anon can update vouchers" ON public.vouchers FOR UPDATE USING (true);
CREATE POLICY "Anon can delete vouchers" ON public.vouchers FOR DELETE USING (true);
