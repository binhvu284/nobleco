-- Add Sepay-related fields to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS sepay_order_id text UNIQUE,
ADD COLUMN IF NOT EXISTS sepay_transaction_id text,
ADD COLUMN IF NOT EXISTS webhook_received_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS payment_confirmed_by text DEFAULT 'manual' CHECK (payment_confirmed_by IN ('manual', 'webhook', 'polling'));

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_orders_sepay_order_id ON public.orders(sepay_order_id);
CREATE INDEX IF NOT EXISTS idx_orders_sepay_transaction_id ON public.orders(sepay_transaction_id);

