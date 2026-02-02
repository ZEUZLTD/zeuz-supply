-- Ensure stripe_payment_intent_id column exists
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS stripe_payment_intent_id text;

-- Add index for faster lookups since we query by this for refunds
CREATE INDEX IF NOT EXISTS idx_orders_payment_intent 
ON public.orders(stripe_payment_intent_id);
