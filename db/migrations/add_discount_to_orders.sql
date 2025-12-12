-- Add discount_code and discount_rate columns to orders table
-- This allows orders to store the discount code and rate that was applied at the time of order creation
-- The discount rate is locked in at the time of application, so if admin changes the code later,
-- existing orders keep their original discount amount

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS discount_code TEXT REFERENCES discount_codes(code) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS discount_rate DECIMAL(5, 2) CHECK (discount_rate IS NULL OR (discount_rate >= 0 AND discount_rate <= 100));

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS orders_discount_code_idx ON orders(discount_code);

-- Add comment
COMMENT ON COLUMN orders.discount_code IS 'Discount code applied to this order (locked in at time of application)';
COMMENT ON COLUMN orders.discount_rate IS 'Discount rate percentage applied to this order (locked in at time of application)';

