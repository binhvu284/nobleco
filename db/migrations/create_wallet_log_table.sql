-- Create wallet_log table for tracking all wallet transactions
-- This table stores commission, withdrawal, and bonus transactions

CREATE TABLE IF NOT EXISTS wallet_log (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  log_type TEXT NOT NULL CHECK (log_type IN ('Commission', 'Withdraw', 'Bonus')),
  point_amount INTEGER NOT NULL,
  balance_after INTEGER,
  related_order_id BIGINT REFERENCES orders(id) ON DELETE SET NULL,
  related_withdraw_request_id BIGINT REFERENCES withdraw_requests(id) ON DELETE SET NULL,
  description TEXT,
  log_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS wallet_log_user_id_idx ON wallet_log(user_id);
CREATE INDEX IF NOT EXISTS wallet_log_log_time_idx ON wallet_log(log_time DESC);
CREATE INDEX IF NOT EXISTS wallet_log_related_order_id_idx ON wallet_log(related_order_id);
CREATE INDEX IF NOT EXISTS wallet_log_log_type_idx ON wallet_log(log_type);

-- Add comment to table
COMMENT ON TABLE wallet_log IS 'Stores all wallet transaction logs including commissions, withdrawals, and bonuses';
COMMENT ON COLUMN wallet_log.log_type IS 'Type of transaction: Commission, Withdraw, or Bonus';
COMMENT ON COLUMN wallet_log.point_amount IS 'Amount of points (positive for additions, negative for withdrawals)';
COMMENT ON COLUMN wallet_log.balance_after IS 'User balance after this transaction';

