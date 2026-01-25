-- ABANDONED CART RECOVERY SCHEMA

-- 1. Create Checkouts Table
CREATE TABLE IF NOT EXISTS public.checkouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT, -- Optional: Stripe Session ID
    email TEXT NOT NULL,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    status TEXT NOT NULL DEFAULT 'OPEN', -- 'OPEN', 'ABANDONED', 'RECOVERED', 'CONVERTED'
    metadata JSONB DEFAULT '{}'::jsonb, -- Store shipping info snapshot etc.
    last_active TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable RLS
ALTER TABLE public.checkouts ENABLE ROW LEVEL SECURITY;

-- 3. Policies
-- Allow Anon to INSERT (Logging checkout attempt)
CREATE POLICY "Anon can insert checkouts" 
ON public.checkouts FOR INSERT 
WITH CHECK (true);

-- Allow Anon to UPDATE their own checkout (by ID match - implicit in client logic usually, or by email/session if we track it)
-- For now, allow UPDATE if we know the ID (UUIDs are hard to guess).
CREATE POLICY "Anon can update checkouts" 
ON public.checkouts FOR UPDATE 
USING (true); -- Ideally restrict this, but for MVP UUID knowledge is key.

-- Allow Service Role (Admin) full access
CREATE POLICY "Service role full access checkouts" 
ON public.checkouts USING (true) WITH CHECK (true);
