-- Phase 12: Dynamic Images
-- 1. Ensure Slug Column Exists
ALTER TABLE products ADD COLUMN IF NOT EXISTS slug TEXT;
-- Safely add constraint only if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_slug_key') THEN
        ALTER TABLE products ADD CONSTRAINT products_slug_key UNIQUE (slug);
    END IF;
END $$;

-- 2. Backfill Slugs (Simple: Lowercase + Hyphens)
-- This is a one-time operation to populate existing data
UPDATE products 
SET slug = LOWER(REPLACE(name, ' ', '-'))
WHERE slug IS NULL;

-- 3. Ensure Index (Duplicate of Phase 8 but safe to repeat with IF NOT EXISTS if it wasn't there)
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
