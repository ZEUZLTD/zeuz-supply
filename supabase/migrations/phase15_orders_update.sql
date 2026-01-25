-- Enhance orders table for Analytics
-- Ensure table exists (idempotent)
CREATE TABLE IF NOT EXISTS public.orders (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    stripe_session_id text UNIQUE NOT NULL,
    customer_email text,
    shipping_address jsonb,
    status text DEFAULT 'PENDING',
    created_at timestamptz DEFAULT now()
);

-- Add analytics columns if they don't exist
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS amount_total integer DEFAULT 0; -- stored in cents/pence
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS currency text DEFAULT 'gbp';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS items jsonb DEFAULT '[]'::jsonb;

-- Enable RLS if not already
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Policies
-- Admin: Full Access
CREATE POLICY "Admin All Orders" ON public.orders
FOR ALL
USING (
    auth.role() = 'authenticated' AND
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- User: View own orders (matching email - tricky without auth linking, but for now standard users might verify via email magic link if we link them. 
-- For now, let's just allow Admins to see all.
