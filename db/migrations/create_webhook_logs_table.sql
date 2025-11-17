-- Create webhook logs table for audit trail
CREATE TABLE IF NOT EXISTS public.webhook_logs (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  webhook_type text NOT NULL, -- 'sepay_payment', etc.
  event_type text NOT NULL, -- 'payment.success', 'payment.failed', etc.
  order_id bigint REFERENCES public.orders(id),
  payload jsonb NOT NULL, -- Full webhook payload
  signature text, -- Webhook signature for verification
  processed boolean DEFAULT false,
  processing_error text,
  response_data jsonb, -- Response sent back to webhook sender
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  processed_at timestamp with time zone
);

CREATE INDEX IF NOT EXISTS idx_webhook_logs_order_id ON public.webhook_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_processed ON public.webhook_logs(processed);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_created_at ON public.webhook_logs(created_at);

