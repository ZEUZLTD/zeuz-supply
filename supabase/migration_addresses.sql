-- Create user_addresses table
create table user_addresses (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  full_name text not null,
  line1 text not null,
  line2 text,
  city text not null,
  postal_code text not null,
  country text default 'GB',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS
alter table user_addresses enable row level security;

create policy "Users can view own addresses"
  on user_addresses for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert own addresses"
  on user_addresses for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update own addresses"
  on user_addresses for update
  to authenticated
  using (auth.uid() = user_id);
