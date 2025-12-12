-- Fix wallet_log check constraint to allow 'Commission', 'Withdraw', and 'Bonus'
-- This migration drops the old constraint and creates a new one with the correct values

-- Step 1: Check current constraint (for reference)
-- Run this first to see what the current constraint allows:
-- SELECT conname, pg_get_constraintdef(oid) 
-- FROM pg_constraint 
-- WHERE conrelid = 'wallet_log'::regclass AND conname LIKE '%log_type%';

-- Step 2: Drop the existing constraint (it might have a different name)
-- Try these common constraint names:
ALTER TABLE wallet_log DROP CONSTRAINT IF EXISTS wallet_log_log_type_check;
ALTER TABLE wallet_log DROP CONSTRAINT IF EXISTS wallet_log_log_type_chk;
ALTER TABLE wallet_log DROP CONSTRAINT IF EXISTS check_log_type;

-- Step 3: Create the new constraint with the correct values
ALTER TABLE wallet_log ADD CONSTRAINT wallet_log_log_type_check 
  CHECK (log_type IN ('Commission', 'Withdraw', 'Bonus'));

-- Step 4: Verify the constraint was created correctly
-- Run this to verify:
-- SELECT conname, pg_get_constraintdef(oid) 
-- FROM pg_constraint 
-- WHERE conrelid = 'wallet_log'::regclass AND conname = 'wallet_log_log_type_check';

