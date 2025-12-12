-- Fix foreign key constraints to allow user deletion
-- This changes foreign keys to SET NULL or CASCADE on user deletion
-- This allows deleting users even if they have related records, while preserving data where appropriate

-- ============================================
-- 1. Fix orders.created_by foreign key
-- ============================================
-- Drop the existing foreign key constraint
ALTER TABLE orders 
DROP CONSTRAINT IF EXISTS orders_created_by_fkey;

-- Recreate with ON DELETE SET NULL (preserves orders but sets creator to NULL)
ALTER TABLE orders
ADD CONSTRAINT orders_created_by_fkey 
FOREIGN KEY (created_by) 
REFERENCES users(id) 
ON DELETE SET NULL;

COMMENT ON COLUMN orders.created_by IS 'User who created this order. Set to NULL if the user is deleted.';

-- ============================================
-- 2. Fix withdraw_request.user_id foreign key
-- ============================================
-- Drop existing constraint
ALTER TABLE withdraw_request 
DROP CONSTRAINT IF EXISTS withdraw_request_user_id_fkey;

-- Recreate with ON DELETE SET NULL (preserves withdrawal history)
ALTER TABLE withdraw_request
ADD CONSTRAINT withdraw_request_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES users(id) 
ON DELETE SET NULL;

-- ============================================
-- 3. Fix withdraw_request.processed_by foreign key
-- ============================================
-- Drop existing constraint
ALTER TABLE withdraw_request 
DROP CONSTRAINT IF EXISTS withdraw_request_processed_by_fkey;

-- Recreate with ON DELETE SET NULL (preserves who processed it)
ALTER TABLE withdraw_request
ADD CONSTRAINT withdraw_request_processed_by_fkey 
FOREIGN KEY (processed_by) 
REFERENCES users(id) 
ON DELETE SET NULL;

-- ============================================
-- 4. Fix bank_info.user_id foreign key
-- ============================================
-- Drop existing constraint
ALTER TABLE bank_info 
DROP CONSTRAINT IF EXISTS bank_info_user_id_fkey;

-- Recreate with ON DELETE CASCADE (delete bank info when user is deleted)
ALTER TABLE bank_info
ADD CONSTRAINT bank_info_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES users(id) 
ON DELETE CASCADE;

-- ============================================
-- 5. Fix user_avatars.user_id foreign key
-- ============================================
-- Drop existing constraint
ALTER TABLE user_avatars 
DROP CONSTRAINT IF EXISTS user_avatars_user_id_fkey;

-- Recreate with ON DELETE CASCADE (delete avatars when user is deleted)
ALTER TABLE user_avatars
ADD CONSTRAINT user_avatars_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES users(id) 
ON DELETE CASCADE;

-- ============================================
-- 6. Fix user_personal_ids.user_id foreign key
-- ============================================
-- Drop existing constraint
ALTER TABLE user_personal_ids 
DROP CONSTRAINT IF EXISTS user_personal_ids_user_id_fkey;

-- Recreate with ON DELETE CASCADE (delete personal IDs when user is deleted)
ALTER TABLE user_personal_ids
ADD CONSTRAINT user_personal_ids_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES users(id) 
ON DELETE CASCADE;

-- ============================================
-- 7. Fix user_personal_ids.verified_by foreign key
-- ============================================
-- Drop existing constraint
ALTER TABLE user_personal_ids 
DROP CONSTRAINT IF EXISTS user_personal_ids_verified_by_fkey;

-- Recreate with ON DELETE SET NULL (preserves who verified it)
ALTER TABLE user_personal_ids
ADD CONSTRAINT user_personal_ids_verified_by_fkey 
FOREIGN KEY (verified_by) 
REFERENCES users(id) 
ON DELETE SET NULL;

-- ============================================
-- 8. Fix wallet_log.user_id foreign key
-- ============================================
-- Drop existing constraint
ALTER TABLE wallet_log 
DROP CONSTRAINT IF EXISTS wallet_log_user_id_fkey;

-- Recreate with ON DELETE CASCADE (delete wallet logs when user is deleted)
ALTER TABLE wallet_log
ADD CONSTRAINT wallet_log_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES users(id) 
ON DELETE CASCADE;

-- ============================================
-- 9. Fix clients.created_by foreign key
-- ============================================
-- Drop existing constraint
ALTER TABLE clients 
DROP CONSTRAINT IF EXISTS clients_created_by_fkey;

-- Recreate with ON DELETE SET NULL (preserves clients but sets creator to NULL)
ALTER TABLE clients
ADD CONSTRAINT clients_created_by_fkey 
FOREIGN KEY (created_by) 
REFERENCES users(id) 
ON DELETE SET NULL;

-- ============================================
-- 10. Fix commission_transactions.user_id foreign key
-- ============================================
-- Drop existing constraint
ALTER TABLE commission_transactions 
DROP CONSTRAINT IF EXISTS commission_transactions_user_id_fkey;

-- Recreate with ON DELETE SET NULL (preserves commission history)
ALTER TABLE commission_transactions
ADD CONSTRAINT commission_transactions_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES users(id) 
ON DELETE SET NULL;

-- ============================================
-- 11. Fix coworker_permissions.coworker_id foreign key
-- ============================================
-- Drop existing constraint
ALTER TABLE coworker_permissions 
DROP CONSTRAINT IF EXISTS coworker_permissions_coworker_id_fkey;

-- Recreate with ON DELETE CASCADE (delete permissions when coworker is deleted)
ALTER TABLE coworker_permissions
ADD CONSTRAINT coworker_permissions_coworker_id_fkey 
FOREIGN KEY (coworker_id) 
REFERENCES users(id) 
ON DELETE CASCADE;

-- ============================================
-- 12. Fix otps.user_id foreign key
-- ============================================
-- Drop existing constraint
ALTER TABLE otps 
DROP CONSTRAINT IF EXISTS otps_user_id_fkey;

-- Recreate with ON DELETE CASCADE (delete OTPs when user is deleted)
ALTER TABLE otps
ADD CONSTRAINT otps_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES users(id) 
ON DELETE CASCADE;

-- ============================================
-- 13. Fix products.created_by foreign key
-- ============================================
-- Drop existing constraint
ALTER TABLE products 
DROP CONSTRAINT IF EXISTS products_created_by_fkey;

-- Recreate with ON DELETE SET NULL (preserves products but sets creator to NULL)
ALTER TABLE products
ADD CONSTRAINT products_created_by_fkey 
FOREIGN KEY (created_by) 
REFERENCES users(id) 
ON DELETE SET NULL;

-- ============================================
-- 14. Fix products.updated_by foreign key
-- ============================================
-- Drop existing constraint
ALTER TABLE products 
DROP CONSTRAINT IF EXISTS products_updated_by_fkey;

-- Recreate with ON DELETE SET NULL (preserves products but sets updater to NULL)
ALTER TABLE products
ADD CONSTRAINT products_updated_by_fkey 
FOREIGN KEY (updated_by) 
REFERENCES users(id) 
ON DELETE SET NULL;

-- Note: referred_by field stores refer_code (string), not a foreign key, so no constraint needed

