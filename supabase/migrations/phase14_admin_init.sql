-- Phase 14: Admin Dashboard Infrastructure

-- 1. RBAC: Add Role to Profiles
-- Ensure profiles exists (it should from Phase 6/7, but let's be safe)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    updated_at TIMESTAMP WITH TIME ZONE,
    theme_preference TEXT
);

-- Add Role Column
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'customer';

-- 2. App Settings (Marketing Control)
CREATE TABLE IF NOT EXISTS public.app_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on Settings
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Admin Full Access, Public Read Only (for specific keys)
-- Actually, let's keep it simple: Public can read 'marketing' keys.
CREATE POLICY "Allow public read marketing settings" ON public.app_settings
FOR SELECT USING (key IN ('SHOW_SPLASH', 'SPLASH_MESSAGE', 'LAUNCH_DISCOUNT_ACTIVE'));

CREATE POLICY "Allow admin full access" ON public.app_settings
FOR ALL USING (
    exists (
        select 1 from profiles
        where id = auth.uid() and role = 'admin'
    )
);

-- 3. Seed Default Settings
INSERT INTO public.app_settings (key, value, description)
VALUES 
    ('SHOW_SPLASH', 'true'::jsonb, 'Toggle the welcome splash modal'),
    ('SPLASH_MESSAGE', '"WELCOME TO ZEUZ SUPPLY. INDUSTRIAL POWER."'::jsonb, 'Text displayed in the splash modal'),
    ('LAUNCH_DISCOUNT_ACTIVE', 'true'::jsonb, 'Enable the 20% off First 100 banner')
ON CONFLICT (key) DO NOTHING;
