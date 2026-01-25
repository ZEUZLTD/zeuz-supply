-- FIX: Infinite Recursion in RLS Policies
-- Run this ENTIRE script in Supabase SQL Editor

-- 1. Drop ALL existing policies on profiles to clear the bad recursion
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;

-- 2. Re-create ONLY the safe policy
-- This allows a user (and the middleware acting as them) to see THEIR OWN row.
-- This is all we need for the Login check to work.
CREATE POLICY "Users can view own profile" 
ON public.profiles FOR SELECT 
USING ( auth.uid() = id );

-- 3. Verify it works by trying to read your own user (as the database sees it)
-- Note: This might return nothing in the SQL Editor if you are running as 'postgres' role, 
-- but it will work for the application.
