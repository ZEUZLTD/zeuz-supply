-- Create signups table for "Coming Soon" notifications
create table if not exists public.signups (
  id uuid default gen_random_uuid() primary key,
  email text not null,
  product_id text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.signups enable row level security;

-- Allow ANYONE (anon) to insert emails (Sign up)
create policy "Allow public insert to signups"
  on public.signups
  for insert
  to anon
  with check (true);

-- Only service headers (dashboard) can read emails (Privacy)
create policy "Enable read access for service role only"
  on public.signups
  for select
  to service_role
  using (true);
