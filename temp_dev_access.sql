-- TEMP DEV ACCESS: Allow Anon to do EVERYTHING
-- Run this to audit the admin system without login

-- 1. Profiles
CREATE POLICY "Anon can view profiles" ON public.profiles FOR SELECT USING (true);

-- 2. Products & Batches (Usually public read, but need write for Admin)
CREATE POLICY "Anon can insert products" ON public.products FOR INSERT WITH CHECK (true);
CREATE POLICY "Anon can update products" ON public.products FOR UPDATE USING (true);
CREATE POLICY "Anon can insert batches" ON public.batches FOR INSERT WITH CHECK (true);
CREATE POLICY "Anon can update batches" ON public.batches FOR UPDATE USING (true);

-- 3. Orders (Usually private)
CREATE POLICY "Anon can view orders" ON public.orders FOR SELECT USING (true);
CREATE POLICY "Anon can update orders" ON public.orders FOR UPDATE USING (true);

-- 4. Vouchers (Usually private)
CREATE POLICY "Anon can view vouchers" ON public.vouchers FOR SELECT USING (true);
CREATE POLICY "Anon can insert vouchers" ON public.vouchers FOR INSERT WITH CHECK (true);
CREATE POLICY "Anon can update vouchers" ON public.vouchers FOR UPDATE USING (true);
CREATE POLICY "Anon can delete vouchers" ON public.vouchers FOR DELETE USING (true);

-- 5. Storage (for images)
-- (Assuming bucket policies might need tweak, but usually separate)
