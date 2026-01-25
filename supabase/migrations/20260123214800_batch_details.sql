-- Add new columns to batches table
ALTER TABLE public.batches 
ADD COLUMN IF NOT EXISTS supplier_reference TEXT,
ADD COLUMN IF NOT EXISTS received_date DATE DEFAULT CURRENT_DATE;

-- Comment on columns
COMMENT ON COLUMN public.batches.supplier_reference IS 'Reference code or name for the supplier of this batch';
COMMENT ON COLUMN public.batches.received_date IS 'Date when the batch was received/added to stock';
