-- ============================================
-- BANK INFO TABLE
-- SQL script to create bank_info table for storing user bank account information
-- Run this in Supabase SQL Editor
-- ============================================

-- ============================================
-- DROP EXISTING TABLE IF NEEDED (UNCOMMENT IF TABLE ALREADY EXISTS)
-- ============================================
-- DROP TABLE IF EXISTS public.bank_info CASCADE;

-- ============================================
-- CREATE BANK_INFO TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.bank_info (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  
  -- User who owns this bank account
  user_id bigint NOT NULL,
  
  -- Bank account information
  bank_name text NOT NULL,           -- Name of the bank (e.g., "Vietcombank", "Techcombank")
  bank_owner_name text NOT NULL,      -- Name of the account owner
  bank_number text NOT NULL,          -- Bank account number
  
  -- Timestamps
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  
  -- Foreign key constraint
  CONSTRAINT bank_info_user_id_fkey FOREIGN KEY (user_id) 
    REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Ensure one bank info per user (can be modified if multiple bank accounts are allowed)
  CONSTRAINT bank_info_user_id_unique UNIQUE (user_id)
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_bank_info_user_id ON public.bank_info(user_id);

-- ============================================
-- UPDATED_AT TRIGGER
-- ============================================
-- Function to update updated_at column (reuse existing function if available)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to bank_info
DROP TRIGGER IF EXISTS update_bank_info_updated_at ON public.bank_info;
CREATE TRIGGER update_bank_info_updated_at 
BEFORE UPDATE ON public.bank_info
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================
COMMENT ON TABLE public.bank_info IS 'Stores bank account information for users to receive withdrawal payments';
COMMENT ON COLUMN public.bank_info.id IS 'Unique identifier for the bank info record';
COMMENT ON COLUMN public.bank_info.user_id IS 'Foreign key to users table - the user who owns this bank account';
COMMENT ON COLUMN public.bank_info.bank_name IS 'Name of the bank (e.g., Vietcombank, Techcombank, BIDV)';
COMMENT ON COLUMN public.bank_info.bank_owner_name IS 'Name of the bank account owner';
COMMENT ON COLUMN public.bank_info.bank_number IS 'Bank account number';

