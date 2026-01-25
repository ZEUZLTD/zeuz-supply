-- Allow users to view their own orders based on Email Address
-- This enables "Guest to User" history preservation
create policy "Users can view own orders"
  on public.orders
  for select
  to authenticated
  using (
    customer_email = (select email from auth.users where id = auth.uid())
  );

-- Optional: Allow users to insert orders? No, only Service Role (via Stripe Webhook) inserts orders.
-- So we only need the Select policy for the frontend.
