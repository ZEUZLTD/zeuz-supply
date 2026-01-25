-- Enable Storage Extension (usually enabled by default in Supabase, but good practice)
-- create extension if not exists "storage";

-- Create a public bucket for product images
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

-- POLICY: Public Read Access
create policy "Public Access"
on storage.objects for select
using ( bucket_id = 'product-images' );

-- POLICY: Admin Full Access (Insert, Update, Delete)
create policy "Admin Full Access"
on storage.objects for all
using (
  bucket_id = 'product-images'
  and auth.role() = 'authenticated'
  and exists (
    select 1 from public.profiles
    where id = auth.uid()
    and role = 'admin'
  )
);
