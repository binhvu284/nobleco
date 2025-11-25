-- ============================================
-- WALLET AND WITHDRAW REQUEST TABLES
-- SQL script to create withdraw_request and wallet_log tables
-- Run this in Supabase SQL Editor
-- ============================================

-- ============================================
-- DROP EXISTING TABLES IF NEEDED (UNCOMMENT IF TABLES ALREADY EXIST)
-- ============================================
-- DROP TABLE IF EXISTS public.wallet_log CASCADE;
-- DROP TABLE IF EXISTS public.withdraw_request CASCADE;

-- ============================================
-- CREATE WITHDRAW_REQUEST TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.withdraw_request (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  
  -- User who made the request
  user_id bigint NOT NULL,
  
  -- Financial information
  amount numeric NOT NULL CHECK (amount >= 0),  -- Amount in VND currency
  point integer NOT NULL CHECK (point > 0),      -- Points being withdrawn
  
  -- Exchange rate (if points to VND conversion is variable)
  exchange_rate numeric CHECK (exchange_rate > 0),  -- Points to VND conversion rate
  
  -- Request dates
  request_date timestamp with time zone NOT NULL DEFAULT now(),
  completed_date timestamp with time zone,  -- When request was processed
  
  -- Status
  status text NOT NULL DEFAULT 'pending' CHECK (status = ANY (ARRAY[
    'pending'::text,
    'approve'::text,
    'reject'::text
  ])),
  
  -- Processing information
  processed_by bigint,  -- Admin who processed the request
  admin_notes text,  -- Notes from admin (e.g., rejection reason, approval notes)
  
  -- Bank account information (snapshot at time of request - won't change even if bank_info is updated)
  bank_name text NOT NULL,           -- Bank name at time of request
  bank_owner_name text NOT NULL,    -- Bank account owner name at time of request
  bank_number text NOT NULL,        -- Bank account number at time of request
  
  -- Timestamps
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  
  -- Foreign key constraints
  CONSTRAINT withdraw_request_user_id_fkey FOREIGN KEY (user_id) 
    REFERENCES public.users(id) ON DELETE CASCADE,
  CONSTRAINT withdraw_request_processed_by_fkey FOREIGN KEY (processed_by) 
    REFERENCES public.users(id) ON DELETE SET NULL
);

-- ============================================
-- CREATE WALLET_LOG TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.wallet_log (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  
  -- User whose wallet this log belongs to
  user_id bigint NOT NULL,
  
  -- Log information
  log_time timestamp with time zone NOT NULL DEFAULT now(),
  log_type text NOT NULL CHECK (log_type = ANY (ARRAY[
    'My order commission'::text,
    'Level 1 commission'::text,
    'Level 2 commission'::text,
    'Withdraw'::text
  ])),
  
  -- Point amount (positive for additions, negative for withdrawals)
  point_amount numeric NOT NULL,
  
  -- Wallet balance after this transaction
  balance_after numeric CHECK (balance_after >= 0),  -- Wallet balance after this transaction
  
  -- Related records (for tracking purposes)
  related_order_id bigint,  -- For commission logs
  related_withdraw_request_id bigint,  -- For withdraw logs
  
  -- Additional information
  description text,  -- Additional details about the transaction
  
  -- Timestamps
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  
  -- Foreign key constraints
  CONSTRAINT wallet_log_user_id_fkey FOREIGN KEY (user_id) 
    REFERENCES public.users(id) ON DELETE CASCADE,
  CONSTRAINT wallet_log_related_order_id_fkey FOREIGN KEY (related_order_id) 
    REFERENCES public.orders(id) ON DELETE SET NULL,
  CONSTRAINT wallet_log_related_withdraw_request_id_fkey FOREIGN KEY (related_withdraw_request_id) 
    REFERENCES public.withdraw_request(id) ON DELETE SET NULL
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
-- Withdraw request indexes
CREATE INDEX IF NOT EXISTS idx_withdraw_request_user_id ON public.withdraw_request(user_id);
CREATE INDEX IF NOT EXISTS idx_withdraw_request_status ON public.withdraw_request(status);
CREATE INDEX IF NOT EXISTS idx_withdraw_request_request_date ON public.withdraw_request(request_date DESC);
CREATE INDEX IF NOT EXISTS idx_withdraw_request_completed_date ON public.withdraw_request(completed_date DESC);
CREATE INDEX IF NOT EXISTS idx_withdraw_request_status_date ON public.withdraw_request(status, request_date DESC);
CREATE INDEX IF NOT EXISTS idx_withdraw_request_processed_by ON public.withdraw_request(processed_by);

-- Wallet log indexes
CREATE INDEX IF NOT EXISTS idx_wallet_log_user_id ON public.wallet_log(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_log_log_type ON public.wallet_log(log_type);
CREATE INDEX IF NOT EXISTS idx_wallet_log_log_time ON public.wallet_log(log_time DESC);
CREATE INDEX IF NOT EXISTS idx_wallet_log_user_time ON public.wallet_log(user_id, log_time DESC);
CREATE INDEX IF NOT EXISTS idx_wallet_log_related_order_id ON public.wallet_log(related_order_id);
CREATE INDEX IF NOT EXISTS idx_wallet_log_related_withdraw_request_id ON public.wallet_log(related_withdraw_request_id);

-- ============================================
-- UPDATED_AT TRIGGERS
-- ============================================
-- Function to update updated_at column (if not exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to withdraw_request
DROP TRIGGER IF EXISTS update_withdraw_request_updated_at ON public.withdraw_request;
CREATE TRIGGER update_withdraw_request_updated_at 
BEFORE UPDATE ON public.withdraw_request
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- FUNCTION TO UPDATE WALLET BALANCE AFTER TRANSACTION
-- ============================================
-- This function can be called to update the balance_after field
-- It calculates the wallet balance after a transaction
CREATE OR REPLACE FUNCTION update_wallet_balance_after()
RETURNS TRIGGER AS $$
DECLARE
  current_balance numeric;
BEGIN
  -- Get current wallet balance from users table
  SELECT COALESCE(points, 0) INTO current_balance
  FROM public.users
  WHERE id = NEW.user_id;
  
  -- Set balance_after to current balance
  NEW.balance_after := current_balance;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to wallet_log (optional - can be calculated on-the-fly instead)
-- DROP TRIGGER IF EXISTS update_wallet_log_balance_after ON public.wallet_log;
-- CREATE TRIGGER update_wallet_log_balance_after 
-- BEFORE INSERT ON public.wallet_log
-- FOR EACH ROW
-- EXECUTE FUNCTION update_wallet_balance_after();

-- ============================================
-- FUNCTION TO AUTO-UPDATE COMPLETED_DATE ON STATUS CHANGE
-- ============================================
CREATE OR REPLACE FUNCTION update_withdraw_completed_date()
RETURNS TRIGGER AS $$
BEGIN
  -- Set completed_date when status changes to 'approve' or 'reject'
  IF NEW.status IN ('approve', 'reject') AND OLD.status = 'pending' THEN
    NEW.completed_date := now();
  END IF;
  
  -- Clear completed_date if status is changed back to pending
  IF NEW.status = 'pending' AND OLD.status IN ('approve', 'reject') THEN
    NEW.completed_date := NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to withdraw_request
DROP TRIGGER IF EXISTS trigger_update_withdraw_completed_date ON public.withdraw_request;
CREATE TRIGGER trigger_update_withdraw_completed_date
BEFORE UPDATE ON public.withdraw_request
FOR EACH ROW
EXECUTE FUNCTION update_withdraw_completed_date();

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================
COMMENT ON TABLE public.withdraw_request IS 'Stores user withdrawal requests for converting points to VND currency';
COMMENT ON COLUMN public.withdraw_request.id IS 'Unique identifier for the withdrawal request';
COMMENT ON COLUMN public.withdraw_request.user_id IS 'Foreign key to users table - the user requesting the withdrawal';
COMMENT ON COLUMN public.withdraw_request.amount IS 'Amount in VND currency that will be transferred';
COMMENT ON COLUMN public.withdraw_request.point IS 'Number of points the user wants to withdraw';
COMMENT ON COLUMN public.withdraw_request.exchange_rate IS 'Points to VND conversion rate at time of request (if variable)';
COMMENT ON COLUMN public.withdraw_request.request_date IS 'Date and time when the withdrawal request was created';
COMMENT ON COLUMN public.withdraw_request.completed_date IS 'Date and time when the withdrawal request was processed (approved or rejected)';
COMMENT ON COLUMN public.withdraw_request.status IS 'Current status: pending (awaiting review), approve (approved and processed), reject (rejected)';
COMMENT ON COLUMN public.withdraw_request.processed_by IS 'Foreign key to users table - the admin who processed this request';
COMMENT ON COLUMN public.withdraw_request.admin_notes IS 'Notes from admin regarding the withdrawal request (e.g., rejection reason)';
COMMENT ON COLUMN public.withdraw_request.bank_name IS 'Bank name at the time of request (snapshot - does not change if bank_info is updated)';
COMMENT ON COLUMN public.withdraw_request.bank_owner_name IS 'Bank account owner name at the time of request (snapshot - does not change if bank_info is updated)';
COMMENT ON COLUMN public.withdraw_request.bank_number IS 'Bank account number at the time of request (snapshot - does not change if bank_info is updated)';

COMMENT ON TABLE public.wallet_log IS 'Transaction log for user wallet activities including commissions and withdrawals';
COMMENT ON COLUMN public.wallet_log.id IS 'Unique identifier for the wallet log entry';
COMMENT ON COLUMN public.wallet_log.user_id IS 'Foreign key to users table - the user whose wallet this log belongs to';
COMMENT ON COLUMN public.wallet_log.log_time IS 'Date and time when the transaction occurred';
COMMENT ON COLUMN public.wallet_log.log_type IS 'Type of transaction: My order commission, Level 1 commission, Level 2 commission, or Withdraw';
COMMENT ON COLUMN public.wallet_log.point_amount IS 'Point amount for this transaction (positive for additions, negative for withdrawals)';
COMMENT ON COLUMN public.wallet_log.balance_after IS 'Wallet balance after this transaction (calculated for historical reference)';
COMMENT ON COLUMN public.wallet_log.related_order_id IS 'Foreign key to orders table - links commission logs to the order that generated the commission';
COMMENT ON COLUMN public.wallet_log.related_withdraw_request_id IS 'Foreign key to withdraw_request table - links withdraw logs to the withdrawal request';
COMMENT ON COLUMN public.wallet_log.description IS 'Additional details or description about the transaction';

