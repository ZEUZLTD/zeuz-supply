-- SECURITY REFINEMENT: Scope Public Policies & Remove Redundancy
-- 2026-02-01

-- 1. Checkouts: Scope Anon Access & Remove Service Role Explicit Policy
DROP POLICY IF EXISTS "Anon can insert checkouts" ON public.checkouts;
CREATE POLICY "Anon can insert checkouts" 
ON public.checkouts FOR INSERT 
WITH CHECK (auth.role() = 'anon');

DROP POLICY IF EXISTS "Anon can update checkouts" ON public.checkouts;
CREATE POLICY "Anon can update checkouts" 
ON public.checkouts FOR UPDATE 
USING (auth.role() = 'anon');

-- Remove explicit service role policy (Service Role bypasses RLS by default)
DROP POLICY IF EXISTS "Service role full access checkouts" ON public.checkouts;


-- 2. Inquiries: Scope Anon Access
DROP POLICY IF EXISTS "Allow public insert to inquiries" ON public.inquiries;
CREATE POLICY "Allow public insert to inquiries" 
ON public.inquiries FOR INSERT 
WITH CHECK (auth.role() = 'anon');


-- 3. Signups: Scope Anon Access
DROP POLICY IF EXISTS "Allow public insert to signups" ON public.signups;
CREATE POLICY "Allow public insert to signups" 
ON public.signups FOR INSERT 
WITH CHECK (auth.role() = 'anon');
