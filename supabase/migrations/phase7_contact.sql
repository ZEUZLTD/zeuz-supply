-- Create ENUM for Inquiry Types
CREATE TYPE inquiry_type AS ENUM ('NEWSLETTER', 'STOCK_NOTIFY', 'PROTO_WAITLIST', 'BULK_QUOTE', 'GENERAL');

-- Create Inquiries Table
CREATE TABLE public.inquiries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL,
    type inquiry_type NOT NULL DEFAULT 'GENERAL',
    message TEXT, -- Optional for simple signups
    metadata JSONB DEFAULT '{}'::jsonb, -- Store product_id, qty, etc.
    status TEXT DEFAULT 'NEW', -- NEW, PROCESSED, ARCHIVED
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;

-- Policy: Allow Public Insert (Anyone can contact)
CREATE POLICY "Allow public insert to inquiries"
ON public.inquiries
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Policy: Allow Admin Read/Update (Service Role only usually, but we might want an Admin UI later)
-- For now, restricting to service_role mostly, but let's allow authenticated users to see THEIR OWN if we had auth (we don't forced auth yet).
-- So we won't add a meaningless SELECT policy for anon.

-- Grant Access
GRANT INSERT ON public.inquiries TO anon, authenticated;
GRANT ALL ON public.inquiries TO service_role;
