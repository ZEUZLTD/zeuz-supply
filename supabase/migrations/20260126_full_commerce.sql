-- Helper Function for Admin Check
CREATE OR REPLACE FUNCTION public.curr_user_is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1. Volume Discounts Table
CREATE TABLE IF NOT EXISTS public.volume_discounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    min_quantity INTEGER NOT NULL,
    discount_percent NUMERIC NOT NULL, -- e.g. 5.0 for 5%
    label TEXT, -- e.g. "2+ Items"
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.volume_discounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Read Volume Discounts" ON public.volume_discounts FOR SELECT USING (true);
CREATE POLICY "Admin Full Access Volume Discounts" ON public.volume_discounts USING ((curr_user_is_admin()));

-- 2. Cart Items (If not exists, ensuring strict schema)
CREATE TABLE IF NOT EXISTS public.cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE, -- Strict FK
    quantity INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, product_id)
);

-- RLS
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users own cart" ON public.cart_items;
CREATE POLICY "Users own cart" ON public.cart_items USING (auth.uid() = user_id);

-- 3. Cart Sessions (For Voucher State)
CREATE TABLE IF NOT EXISTS public.cart_sessions (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    voucher_code TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.cart_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users own session" ON public.cart_sessions;
CREATE POLICY "Users own session" ON public.cart_sessions USING (auth.uid() = user_id);

-- 4. Seed Initial Volume Discounts (Defaults)
INSERT INTO public.volume_discounts (min_quantity, discount_percent, label)
SELECT 2, 5, '2+ Items'
WHERE NOT EXISTS (SELECT 1 FROM public.volume_discounts WHERE min_quantity = 2);

INSERT INTO public.volume_discounts (min_quantity, discount_percent, label)
SELECT 10, 10, '10+ Items'
WHERE NOT EXISTS (SELECT 1 FROM public.volume_discounts WHERE min_quantity = 10);

INSERT INTO public.volume_discounts (min_quantity, discount_percent, label)
SELECT 50, 15, '50+ Items'
WHERE NOT EXISTS (SELECT 1 FROM public.volume_discounts WHERE min_quantity = 50);

INSERT INTO public.volume_discounts (min_quantity, discount_percent, label)
SELECT 100, 20, '100+ Items'
WHERE NOT EXISTS (SELECT 1 FROM public.volume_discounts WHERE min_quantity = 100);
