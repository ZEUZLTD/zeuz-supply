-- Comprehensive fix for orders table schema
-- Based on order-utils.ts requirement

ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;

-- Re-verify other columns just in case
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS stripe_payment_intent_id text,
ADD COLUMN IF NOT EXISTS shipping_address jsonb,
ADD COLUMN IF NOT EXISTS items jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS amount_total integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS currency text DEFAULT 'gbp';

-- Explicitly notify PostgREST to reload schema cache (usually handled by Supabase, but doing it via NOTIFY can help if generic)
NOTIFY pgrst, 'reload config';
