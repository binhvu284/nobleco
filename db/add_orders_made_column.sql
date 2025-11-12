-- ============================================
-- ADD ORDERS_MADE COLUMN TO CLIENTS TABLE
-- This column will store the count of completed orders for each client
-- ============================================

-- Add the orders_made column to clients table
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS orders_made integer NOT NULL DEFAULT 0;

-- Create an index for better query performance
CREATE INDEX IF NOT EXISTS idx_clients_orders_made ON public.clients(orders_made);

-- ============================================
-- FUNCTION TO UPDATE ORDERS_MADE COUNT
-- ============================================

CREATE OR REPLACE FUNCTION update_client_orders_made()
RETURNS TRIGGER AS $$
BEGIN
  -- Handle INSERT: increment count if order is completed
  IF TG_OP = 'INSERT' THEN
    IF NEW.status = 'completed' AND NEW.client_id IS NOT NULL THEN
      UPDATE public.clients 
      SET orders_made = orders_made + 1 
      WHERE id = NEW.client_id;
    END IF;
    RETURN NEW;
  END IF;

  -- Handle UPDATE: adjust count based on status changes
  IF TG_OP = 'UPDATE' THEN
    -- If client_id changed
    IF OLD.client_id IS DISTINCT FROM NEW.client_id THEN
      -- Decrement from old client if order was completed
      IF OLD.status = 'completed' AND OLD.client_id IS NOT NULL THEN
        UPDATE public.clients 
        SET orders_made = GREATEST(0, orders_made - 1)
        WHERE id = OLD.client_id;
      END IF;
      
      -- Increment to new client if order is completed
      IF NEW.status = 'completed' AND NEW.client_id IS NOT NULL THEN
        UPDATE public.clients 
        SET orders_made = orders_made + 1
        WHERE id = NEW.client_id;
      END IF;
    -- If status changed but client_id stayed the same
    ELSIF OLD.status IS DISTINCT FROM NEW.status THEN
      -- If changed from completed to something else
      IF OLD.status = 'completed' AND NEW.status != 'completed' AND OLD.client_id IS NOT NULL THEN
        UPDATE public.clients 
        SET orders_made = GREATEST(0, orders_made - 1)
        WHERE id = OLD.client_id;
      END IF;
      
      -- If changed to completed from something else
      IF OLD.status != 'completed' AND NEW.status = 'completed' AND NEW.client_id IS NOT NULL THEN
        UPDATE public.clients 
        SET orders_made = orders_made + 1
        WHERE id = NEW.client_id;
      END IF;
    END IF;
    RETURN NEW;
  END IF;

  -- Handle DELETE: decrement count if order was completed
  IF TG_OP = 'DELETE' THEN
    IF OLD.status = 'completed' AND OLD.client_id IS NOT NULL THEN
      UPDATE public.clients 
      SET orders_made = GREATEST(0, orders_made - 1)
      WHERE id = OLD.client_id;
    END IF;
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- CREATE TRIGGER TO AUTO-UPDATE ORDERS_MADE
-- ============================================

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_update_client_orders_made ON public.orders;

-- Create trigger for INSERT, UPDATE, DELETE
CREATE TRIGGER trigger_update_client_orders_made
AFTER INSERT OR UPDATE OR DELETE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION update_client_orders_made();

-- ============================================
-- INITIALIZE ORDERS_MADE FOR EXISTING CLIENTS
-- ============================================

-- Update all clients with their current completed orders count
UPDATE public.clients c
SET orders_made = (
  SELECT COUNT(*)::integer
  FROM public.orders o
  WHERE o.client_id = c.id
    AND o.status = 'completed'
);

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON COLUMN public.clients.orders_made IS 'Count of completed orders for this client. Automatically maintained by trigger.';

