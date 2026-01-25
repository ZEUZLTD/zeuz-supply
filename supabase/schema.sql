-- 1. PRODUCTS (The Base SKU)
create table products (
  id uuid primary key default uuid_generate_v4(),
  slug text unique, -- "tenpower-50xg"
  name text,
  brand text, -- "Tenpower"
  
  -- Spec & Display Data
  spec text, -- "5000mAh / 40A"
  tag text, -- "THE KING"
  pitch text, -- "The Low-Resistance King..."
  category text check (category in ('POWER', 'ENERGY', 'PROTOTYPE')),
  
  price_gbp numeric,
  image_url text
);

-- 2. BATCHES (The Magic Layer)
create table batches (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid references products(id),
  batch_code text, -- "TP-2026-JAN-A"
  stock_quantity integer default 0,
  status text check (status in ('LIVE', 'TRANSIT', 'TESTING', 'sold_out', 'ARCHIVED')), 
  arrival_date date,
  acir_avg numeric, 
  graph_url text, 
  created_at timestamp with time zone default now()
);

-- 3. ORDERS
create table orders (
  id uuid primary key default uuid_generate_v4(),
  stripe_session_id text unique,
  customer_email text,
  shipping_address jsonb,
  status text default 'PAID', 
  created_at timestamp with time zone default now()
);

-- 4. Polices
alter table products enable row level security;
alter table batches enable row level security;
alter table orders enable row level security;

create policy "Allow public read products" on products for select using (true);
create policy "Allow public read batches" on batches for select using (true);
