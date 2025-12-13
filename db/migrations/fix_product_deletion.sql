-- Fix foreign key constraints to allow product deletion
-- This changes order_items.product_id foreign key to SET NULL on product deletion
-- This allows deleting products even if they are referenced in order_items, while preserving order history

-- ============================================
-- Step 1: Make product_id column nullable
-- ============================================
-- First, we need to make the product_id column nullable so it can be set to NULL when product is deleted
ALTER TABLE order_items
ALTER COLUMN product_id DROP NOT NULL;

-- ============================================
-- Step 2: Fix order_items.product_id foreign key
-- ============================================
-- Drop the existing foreign key constraint
-- Note: The constraint name may vary, so we try common names
ALTER TABLE order_items
DROP CONSTRAINT IF EXISTS order_items_product_id_fkey;

ALTER TABLE order_items
DROP CONSTRAINT IF EXISTS order_items_product_id_products_id_fk;

ALTER TABLE order_items
DROP CONSTRAINT IF EXISTS fk_order_items_product;

-- Recreate with ON DELETE SET NULL (preserves order items but sets product_id to NULL)
ALTER TABLE order_items
ADD CONSTRAINT order_items_product_id_fkey
FOREIGN KEY (product_id)
REFERENCES products(id)
ON DELETE SET NULL;

COMMENT ON COLUMN order_items.product_id IS 'Product ID for this order item. Set to NULL if the product is deleted.';

-- Note: The order_items table stores product information (name, SKU, price) at the time of order creation,
-- so setting product_id to NULL does not lose any critical order data. The order history remains intact.

