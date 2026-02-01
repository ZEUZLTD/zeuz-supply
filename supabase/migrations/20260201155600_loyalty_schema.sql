ALTER TABLE vouchers ADD COLUMN IF NOT EXISTS allowed_emails text[];
ALTER TABLE vouchers ADD COLUMN IF NOT EXISTS is_first_order_only boolean DEFAULT false;
