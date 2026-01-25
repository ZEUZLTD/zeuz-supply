CREATE TABLE IF NOT EXISTS public.email_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    subject TEXT NOT NULL,
    body_html TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

-- Allow Admin full access
CREATE POLICY "Admin full access email_templates" 
ON public.email_templates 
FOR ALL 
USING (
  auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'admin'
  )
);

-- Allow Service Role read access (for API/Webhooks)
CREATE POLICY "Service Role read email_templates"
ON public.email_templates
FOR SELECT
USING (true); -- Service role bypasses RLS anyway, but good to be explicit if using standard client

-- Seed Data (Upsert)
INSERT INTO public.email_templates (key, subject, body_html, description)
VALUES 
(
    'abandoned_cart', 
    'You requested a quote - complete your order', 
    '<h1>Hi there!</h1><p>You left items in your cart. Come back and complete your purchase!</p><a href="{{cart_url}}">Restore Cart</a>', 
    'Sent when a cart is abandoned for more than 1 hour.'
),
(
    'order_confirmation', 
    'ORDER CONFIRMED // ZEUZ LABS', 
    '<h1>ORDER CONFIRMED</h1><p>Order ID: {{order_id}}</p><p>Thank you for your business. We are preparing your shipment.</p>', 
    'Sent immediately after a successful Stripe payment.'
)
ON CONFLICT (key) DO NOTHING;
