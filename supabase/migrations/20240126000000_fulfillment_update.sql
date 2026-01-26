ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS tracking_number text,
ADD COLUMN IF NOT EXISTS carrier text,
ADD COLUMN IF NOT EXISTS notes text,
ADD COLUMN IF NOT EXISTS stripe_payment_intent_id text;
