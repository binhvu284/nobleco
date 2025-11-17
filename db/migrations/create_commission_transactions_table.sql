-- Create commission transactions table
CREATE TABLE IF NOT EXISTS public.commission_transactions (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id bigint NOT NULL REFERENCES public.users(id),
  order_id bigint NOT NULL REFERENCES public.orders(id),
  commission_type text NOT NULL CHECK (commission_type IN ('self', 'level1', 'level2')),
  order_amount numeric NOT NULL CHECK (order_amount >= 0),
  commission_rate numeric NOT NULL CHECK (commission_rate >= 0 AND commission_rate <= 100),
  commission_amount numeric NOT NULL CHECK (commission_amount >= 0),
  points_before integer NOT NULL DEFAULT 0,
  points_after integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  completed_at timestamp with time zone
);

CREATE INDEX IF NOT EXISTS idx_commission_transactions_user_id ON public.commission_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_commission_transactions_order_id ON public.commission_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_commission_transactions_status ON public.commission_transactions(status);

