
-- Run this in your Supabase SQL Editor to support the new Fulfillment System

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS tracking_number text,
ADD COLUMN IF NOT EXISTS carrier text,
ADD COLUMN IF NOT EXISTS notes text,
ADD COLUMN IF NOT EXISTS stripe_payment_intent_id text;

-- Add a check constraint for status if you want to enforce enum values (Optional)
-- ALTER TABLE orders ADD CONSTRAINT check_status CHECK (status IN ('PENDING', 'PAID', 'PROCESSING', 'ACCEPTED', 'PENDING_DELIVERY', 'DELIVERED', 'COMPLETED', 'REFUNDED'));
