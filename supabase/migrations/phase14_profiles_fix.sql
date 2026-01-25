-- Fix for Profiles Table Schema
-- The table was created in an earlier phase without the 'email' column.

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- Optional: If you want to sync emails from auth.users (requires permissions), 
-- you usually do this via a Trigger. 
-- For now, we just ensure the column exists so your application logic (or manual updates) works.
