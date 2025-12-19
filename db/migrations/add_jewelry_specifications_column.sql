-- Add jewelry_specifications column to products table
-- This column will replace the individual jewelry specification fields:
-- center_stone_size_mm, ni_tay, shape, dimensions, stone_count, 
-- carat_weight_ct, gold_purity, product_weight_g, type

ALTER TABLE products
ADD COLUMN IF NOT EXISTS jewelry_specifications TEXT;

-- Add comment to document the column
COMMENT ON COLUMN products.jewelry_specifications IS 'Multi-line text field containing all jewelry specifications. Replaces individual fields: center_stone_size_mm, ni_tay, shape, dimensions, stone_count, carat_weight_ct, gold_purity, product_weight_g, type';

