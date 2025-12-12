-- Create discount_codes table for managing discount/promotional codes
-- This table stores discount codes with their rates, usage limits, and validity periods

CREATE TABLE IF NOT EXISTS discount_codes (
  id BIGSERIAL PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  discount_rate DECIMAL(5, 2) NOT NULL CHECK (discount_rate >= 0 AND discount_rate <= 100),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  description TEXT,
  usage_count INTEGER NOT NULL DEFAULT 0 CHECK (usage_count >= 0),
  max_usage INTEGER CHECK (max_usage IS NULL OR max_usage > 0),
  valid_from TIMESTAMP WITH TIME ZONE,
  valid_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT valid_period_check CHECK (
    valid_from IS NULL OR valid_until IS NULL OR valid_from <= valid_until
  )
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS discount_codes_code_idx ON discount_codes(code);
CREATE INDEX IF NOT EXISTS discount_codes_status_idx ON discount_codes(status);
CREATE INDEX IF NOT EXISTS discount_codes_valid_from_idx ON discount_codes(valid_from);
CREATE INDEX IF NOT EXISTS discount_codes_valid_until_idx ON discount_codes(valid_until);

-- Add comment to table
COMMENT ON TABLE discount_codes IS 'Stores discount/promotional codes with usage tracking and validity periods';
COMMENT ON COLUMN discount_codes.code IS 'Unique discount code (e.g., WELCOME10)';
COMMENT ON COLUMN discount_codes.discount_rate IS 'Discount percentage (0-100)';
COMMENT ON COLUMN discount_codes.status IS 'Status: active or inactive';
COMMENT ON COLUMN discount_codes.usage_count IS 'Number of times this code has been used';
COMMENT ON COLUMN discount_codes.max_usage IS 'Maximum number of times this code can be used (NULL = unlimited)';
COMMENT ON COLUMN discount_codes.valid_from IS 'Start date/time when code becomes valid';
COMMENT ON COLUMN discount_codes.valid_until IS 'End date/time when code expires';

