-- EMERGENCY: Simplify Profiles Policy to Restore Access
-- 2026-02-01

-- 1. Simplify "Unified Read Profiles"
-- Use strictly "Own Profile" check to allow middleware login to succeed.
-- This removes the recursive Admin Check temporarily.

DROP POLICY IF EXISTS "Unified Read Profiles" ON public.profiles;

CREATE POLICY "Unified Read Profiles" ON public.profiles FOR SELECT
USING (
    id = (select auth.uid())
);

-- Note: is_admin() function remains available but unused in this policy for now.
-- Admin write policies on other tables can still use is_admin() if it works there.
