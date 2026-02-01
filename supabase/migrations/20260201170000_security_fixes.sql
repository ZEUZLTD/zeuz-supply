-- SECURITY FIXES: Mutable search paths & Insecure RLS policies
-- 2026-02-01

-- 1. FIX: Function Search Path Mutable
-- Set search_path to 'public' to prevent malicious code execution via search path manipulation.

ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.check_voucher(text) SET search_path = public;
ALTER FUNCTION public.curr_user_is_admin() SET search_path = public;


-- 2. FIX: RLS Policy Always True (Revoke Insecure Anon Access)
-- Removing "Anon" policies that allowed modification (INSERT/UPDATE/DELETE) on sensitive tables.
-- These were likely leftovers from 'temp_dev_access.sql'.

-- Batches
DROP POLICY IF EXISTS "Anon can delete batches" ON public.batches;
DROP POLICY IF EXISTS "Anon can insert batches" ON public.batches;
DROP POLICY IF EXISTS "Anon can update batches" ON public.batches;

-- Orders
DROP POLICY IF EXISTS "Anon can update orders" ON public.orders;

-- Products
DROP POLICY IF EXISTS "Anon can insert products" ON public.products;
DROP POLICY IF EXISTS "Anon can update products" ON public.products;

-- Vouchers
DROP POLICY IF EXISTS "Anon can delete vouchers" ON public.vouchers;
DROP POLICY IF EXISTS "Anon can insert vouchers" ON public.vouchers;
DROP POLICY IF EXISTS "Anon can update vouchers" ON public.vouchers;
