-- PATCH: Fix RLS Policies
-- It seems the public read policies were missed or not applied. This is critical for the anonymous user to see product data.

-- 1. DROP existing policies to avoid conflicts
drop policy if exists "Allow public read products" on products;
drop policy if exists "Allow public read batches" on batches;

-- 2. ENABLE RLS (Just in case)
alter table products enable row level security;
alter table batches enable row level security;

-- 3. RE-CREATE Policies
create policy "Allow public read products" on products for select using (true);
create policy "Allow public read batches" on batches for select using (true);

-- 4. VERIFICATION
-- This query acts as a test. If you see data below, it worked.
select count(*) as product_count from products;
