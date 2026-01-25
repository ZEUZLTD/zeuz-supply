-- COMPLETE FIX FOR ADMIN ACCESS
-- Run this ENTIRE script in Supabase SQL Editor

-- 1. Ensure RLS is enabled and Polices exist so Middleware can read the profile
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" 
ON public.profiles FOR SELECT 
USING ( (select auth.uid()) = id );

-- 2. Ensure Trigger exists (for FUTURE users)
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (new.id, new.email, 'user');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 3. FORCE ADMIN ROLE for your specific email
-- This finds your user in auth.users and inserts/updates the profile to be 'admin'
INSERT INTO public.profiles (id, email, role)
SELECT id, email, 'admin'
FROM auth.users
WHERE email = 'liambrt@gmail.com'
ON CONFLICT (id) DO UPDATE SET role = 'admin';

-- 4. Verify the result
SELECT * FROM public.profiles WHERE email = 'liambrt@gmail.com';
