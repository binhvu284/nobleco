-- Fix foreign key constraints to allow order deletion
-- This changes commission_transactions.order_id foreign key to SET NULL on order deletion
-- This allows deleting orders even if they are referenced in commission_transactions, while preserving commission history

-- ============================================
-- Fix commission_transactions.order_id foreign key
-- ============================================
-- Drop the existing foreign key constraint
-- Note: The constraint name may vary, so we try common names
ALTER TABLE commission_transactions
DROP CONSTRAINT IF EXISTS commission_transactions_order_id_fkey;

ALTER TABLE commission_transactions
DROP CONSTRAINT IF EXISTS commission_transactions_order_id_orders_id_fk;

ALTER TABLE commission_transactions
DROP CONSTRAINT IF EXISTS fk_commission_transactions_order;

-- Make order_id nullable if it's not already
ALTER TABLE commission_transactions
ALTER COLUMN order_id DROP NOT NULL;

-- Recreate with ON DELETE SET NULL (preserves commission transactions but sets order_id to NULL)
ALTER TABLE commission_transactions
ADD CONSTRAINT commission_transactions_order_id_fkey
FOREIGN KEY (order_id)
REFERENCES orders(id)
ON DELETE SET NULL;

COMMENT ON COLUMN commission_transactions.order_id IS 'Order ID for this commission transaction. Set to NULL if the order is deleted.';

-- Note: The commission_transactions table stores order information at the time of commission creation,
-- so setting order_id to NULL does not lose any critical commission data. The commission history remains intact.

