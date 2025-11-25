-- ============================================
-- ADD BANK COLUMNS TO WITHDRAW_REQUEST TABLE
-- SQL script to add bank columns to existing withdraw_request table
-- Run this in Supabase SQL Editor if the table already exists
-- ============================================

-- Add bank columns to withdraw_request table
ALTER TABLE public.withdraw_request
ADD COLUMN IF NOT EXISTS bank_name text,
ADD COLUMN IF NOT EXISTS bank_owner_name text,
ADD COLUMN IF NOT EXISTS bank_number text;

-- Make bank columns NOT NULL (only if table is empty or you want to set defaults)
-- Uncomment the following lines if you want to make them required:
-- ALTER TABLE public.withdraw_request
-- ALTER COLUMN bank_name SET NOT NULL,
-- ALTER COLUMN bank_owner_name SET NOT NULL,
-- ALTER COLUMN bank_number SET NOT NULL;

-- Add comments
COMMENT ON COLUMN public.withdraw_request.bank_name IS 'Bank name at the time of request (snapshot - does not change if bank_info is updated)';
COMMENT ON COLUMN public.withdraw_request.bank_owner_name IS 'Bank account owner name at the time of request (snapshot - does not change if bank_info is updated)';
COMMENT ON COLUMN public.withdraw_request.bank_number IS 'Bank account number at the time of request (snapshot - does not change if bank_info is updated)';

