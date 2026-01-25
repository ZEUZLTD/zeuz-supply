-- Create cart_items table
create table if not exists cart_items (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  product_id uuid references products(id) on delete cascade not null,
  quantity integer not null default 1 check (quantity > 0),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(user_id, product_id)
);

-- Enable RLS (Idempotent)
alter table cart_items enable row level security;

-- Policies (Drop first to ensure clean update or logic to check existence)
-- Simpler: Drop if exists
drop policy if exists "Users can view their own cart items" on cart_items;
create policy "Users can view their own cart items"
  on cart_items for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own cart items" on cart_items;
create policy "Users can insert their own cart items"
  on cart_items for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own cart items" on cart_items;
create policy "Users can update their own cart items"
  on cart_items for update
  using (auth.uid() = user_id);

drop policy if exists "Users can delete their own cart items" on cart_items;
create policy "Users can delete their own cart items"
  on cart_items for delete
  using (auth.uid() = user_id);

-- Realtime (Idempotent)
do $$
begin
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' 
    and schemaname = 'public' 
    and tablename = 'cart_items'
  ) then
    alter publication supabase_realtime add table cart_items;
  end if;
end $$;
