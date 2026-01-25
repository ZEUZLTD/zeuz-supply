-- Phase 5 Feedback Migration

-- 1. Add Priority to Products for Sorting
ALTER TABLE products ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 100;

-- Update existing items to have distinct priorities (Optional seed)
-- Assuming 'Molicel P45B' -> 1
-- Assuming 'Molicel P42A' -> 2
-- Assuming 'Samsung 50S' -> 3
-- Assuming 'Samsung 30Q' -> 4

-- 2. Create Vouchers Table
CREATE TABLE IF NOT EXISTS vouchers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    discount_percent INTEGER DEFAULT 0, -- e.g. 10 for 10%
    discount_amount DECIMAL(10,2) DEFAULT 0, -- e.g. 5.00 for $5 off
    expires_at TIMESTAMP WITH TIME ZONE,
    active BOOLEAN DEFAULT TRUE,
    usage_limit INTEGER DEFAULT NULL,
    used_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Insert Test Vouchers
INSERT INTO vouchers (code, discount_percent, active) 
VALUES ('TEST10', 10, TRUE)
ON CONFLICT (code) DO NOTHING;

INSERT INTO vouchers (code, discount_amount, active) 
VALUES ('WELCOME5', 5.00, TRUE)
ON CONFLICT (code) DO NOTHING;

-- 4. User Profiles for Theme Persistence
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    theme_color TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS (Optional but good practice)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
