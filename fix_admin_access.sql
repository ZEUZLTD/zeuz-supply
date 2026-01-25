-- FIX: Allow users to read their own profile so Middleware can check 'role'
-- Run this in the Supabase SQL Editor

-- 1. Enable RLS on profiles (It should be on, but let's make sure)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. Allow users to SEE their own profile
-- Without this, "SELECT * FROM profiles WHERE id = auth.uid()" returns NOTHING.
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
USING ( (select auth.uid()) = id );

-- 3. (Optional) Allow Admins to see ALL profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING ( 
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin' 
);
