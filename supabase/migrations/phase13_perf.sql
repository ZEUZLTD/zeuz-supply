-- Phase 13: Performance Optimization
-- Index for Product Category (frequent filtering)
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);

-- Index for Batches Product ID (frequent joins)
CREATE INDEX IF NOT EXISTS idx_batches_product_id ON batches(product_id);
