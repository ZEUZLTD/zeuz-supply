-- FIX ADMIN RECURSION: Introduce is_admin() helper
-- 2026-02-01

-- 1. Create Safe Helper Function
-- SECURITY DEFINER allows this function to bypass RLS when reading the profiles table.
-- This breaks the infinite recursion loop in "Unified Read Profiles".
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public -- Best practice for security definers
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND role = 'admin'
    );
END;
$$;

-- Grant execute to everyone (it only returns true if *they* are admin)
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated, service_role;


-- 2. Update PROFILES Policy (The Source of Recursion)
DROP POLICY IF EXISTS "Unified Read Profiles" ON public.profiles;

CREATE POLICY "Unified Read Profiles" ON public.profiles FOR SELECT
USING (
    (select auth.uid()) = id -- Own Profile
    OR
    is_admin() -- Safe Admin Check
);


-- 3. Update APP SETTINGS Policies (Consistency & Safety)
DROP POLICY IF EXISTS "Unified Admin Insert App Settings" ON public.app_settings;
CREATE POLICY "Unified Admin Insert App Settings" ON public.app_settings FOR INSERT
WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Unified Admin Update App Settings" ON public.app_settings;
CREATE POLICY "Unified Admin Update App Settings" ON public.app_settings FOR UPDATE
USING (is_admin());

DROP POLICY IF EXISTS "Unified Admin Delete App Settings" ON public.app_settings;
CREATE POLICY "Unified Admin Delete App Settings" ON public.app_settings FOR DELETE
USING (is_admin());

-- Update Read Policy to use is_admin() too
DROP POLICY IF EXISTS "Unified Read App Settings" ON public.app_settings;
CREATE POLICY "Unified Read App Settings" ON public.app_settings FOR SELECT
USING (
    key IN ('SHOW_SPLASH', 'SPLASH_MESSAGE', 'LAUNCH_DISCOUNT_ACTIVE')
    OR
    is_admin()
);


-- 4. Update ORDERS Policies
DROP POLICY IF EXISTS "Unified Read Orders" ON public.orders;
CREATE POLICY "Unified Read Orders" ON public.orders FOR SELECT
USING (
    (customer_email = (select email from auth.users where id = (select auth.uid())))
    OR
    is_admin()
);

DROP POLICY IF EXISTS "Unified Admin Insert Orders" ON public.orders;
CREATE POLICY "Unified Admin Insert Orders" ON public.orders FOR INSERT
WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Unified Admin Update Orders" ON public.orders;
CREATE POLICY "Unified Admin Update Orders" ON public.orders FOR UPDATE
USING (is_admin());

DROP POLICY IF EXISTS "Unified Admin Delete Orders" ON public.orders;
CREATE POLICY "Unified Admin Delete Orders" ON public.orders FOR DELETE
USING (is_admin());


-- 5. Update VOLUME DISCOUNTS Policies
DROP POLICY IF EXISTS "Unified Admin Write Volume Discounts" ON public.volume_discounts;
CREATE POLICY "Unified Admin Insert Volume Discounts" ON public.volume_discounts FOR INSERT
WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Unified Admin Update Volume Discounts" ON public.volume_discounts;
CREATE POLICY "Unified Admin Update Volume Discounts" ON public.volume_discounts FOR UPDATE
USING (is_admin());

DROP POLICY IF EXISTS "Unified Admin Delete Volume Discounts" ON public.volume_discounts;
CREATE POLICY "Unified Admin Delete Volume Discounts" ON public.volume_discounts FOR DELETE
USING (is_admin());


-- 6. Update EMAIL TEMPLATES Policies
DROP POLICY IF EXISTS "Admin full access email_templates" ON public.email_templates;
CREATE POLICY "Admin full access email_templates" ON public.email_templates FOR ALL
USING (is_admin());
