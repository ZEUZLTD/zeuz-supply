-- Phase 11: Trust & Safety
-- Add batch_test_url to products

ALTER TABLE products ADD COLUMN IF NOT EXISTS batch_test_url TEXT DEFAULT NULL;

-- Optional: Populate some dummy data or real data if known
-- UPDATE products SET batch_test_url = '/pdfs/batch_test_sample.pdf' WHERE name LIKE '%Molicel P50B%';
