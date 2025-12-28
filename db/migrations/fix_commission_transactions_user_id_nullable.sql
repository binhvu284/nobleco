-- Fix commission_transactions.user_id to allow NULL values
-- This allows the foreign key ON DELETE SET NULL to work properly when deleting users

-- ============================================
-- Fix commission_transactions.user_id column
-- ============================================
-- Make user_id nullable to allow ON DELETE SET NULL
ALTER TABLE commission_transactions
ALTER COLUMN user_id DROP NOT NULL;

-- Ensure the foreign key constraint is set to ON DELETE SET NULL
-- Drop existing constraint if it exists
ALTER TABLE commission_transactions 
DROP CONSTRAINT IF EXISTS commission_transactions_user_id_fkey;

-- Recreate with ON DELETE SET NULL (preserves commission history)
ALTER TABLE commission_transactions
ADD CONSTRAINT commission_transactions_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES users(id) 
ON DELETE SET NULL;

COMMENT ON COLUMN commission_transactions.user_id IS 'User ID for this commission transaction. Set to NULL if the user is deleted to preserve commission history.';

