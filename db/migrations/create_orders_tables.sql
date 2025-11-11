-- ============================================
-- ORDERS AND ORDER ITEMS TABLES
-- SQL script to create orders and order_items tables
-- Run this in Supabase SQL Editor
-- ============================================

-- ============================================
-- CREATE ORDERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.orders (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  
  -- Order identification
  order_number text NOT NULL UNIQUE,  -- Human-readable order number (e.g., ORD-2024-001)
  
  -- Financial information
  subtotal_amount numeric NOT NULL DEFAULT 0 CHECK (subtotal_amount >= 0),
  discount_amount numeric NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
  tax_amount numeric NOT NULL DEFAULT 0 CHECK (tax_amount >= 0),  -- Tax if applicable
  total_amount numeric NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
  
  -- Order status
  status text NOT NULL DEFAULT 'pending' CHECK (status = ANY (ARRAY[
    'pending'::text,
    'processing'::text,
    'confirmed'::text,
    'shipped'::text,
    'delivered'::text,
    'completed'::text,
    'cancelled'::text,
    'refunded'::text
  ])),
  
  -- Payment information
  payment_method text CHECK (payment_method = ANY (ARRAY[
    'cash'::text,
    'card'::text,
    'bank_transfer'::text,
    'credit'::text,
    'other'::text
  ])),
  payment_status text DEFAULT 'pending' CHECK (payment_status = ANY (ARRAY[
    'pending'::text,
    'partial'::text,
    'paid'::text,
    'failed'::text,
    'refunded'::text
  ])),
  payment_date timestamp with time zone,
  
  -- Relationships
  client_id bigint,  -- Foreign key to clients table
  created_by bigint NOT NULL,  -- User who created the order (salesperson/admin)
  
  -- Additional information
  notes text,  -- Order notes/comments
  shipping_address text,  -- Delivery address if applicable
  
  -- Timestamps
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  completed_at timestamp with time zone,  -- When order was completed/delivered
  cancelled_at timestamp with time zone,  -- When order was cancelled
  
  -- Foreign key constraints
  CONSTRAINT orders_client_id_fkey FOREIGN KEY (client_id) 
    REFERENCES public.clients(id) ON DELETE SET NULL,
  CONSTRAINT orders_created_by_fkey FOREIGN KEY (created_by) 
    REFERENCES public.users(id) ON DELETE RESTRICT
);

-- ============================================
-- CREATE ORDER ITEMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.order_items (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  
  -- Relationships
  order_id bigint NOT NULL,  -- Foreign key to orders table
  product_id bigint NOT NULL,  -- Foreign key to products table
  
  -- Product information at time of order (snapshot)
  product_name text NOT NULL,  -- Store product name at time of order
  product_sku text,  -- Store SKU at time of order
  product_price numeric NOT NULL CHECK (product_price >= 0),  -- Price at time of order
  
  -- Order item details
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price numeric NOT NULL CHECK (unit_price >= 0),  -- Price per unit
  discount_amount numeric NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),  -- Discount for this item
  line_total numeric NOT NULL CHECK (line_total >= 0),  -- (unit_price * quantity) - discount_amount
  
  -- Timestamps
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  
  -- Foreign key constraints
  CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) 
    REFERENCES public.orders(id) ON DELETE CASCADE,
  CONSTRAINT order_items_product_id_fkey FOREIGN KEY (product_id) 
    REFERENCES public.products(id) ON DELETE RESTRICT
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
-- Orders table indexes
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_client_id ON public.orders(client_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_by ON public.orders(created_by);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status_created_at ON public.orders(status, created_at DESC);

-- Order items table indexes
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_product ON public.order_items(order_id, product_id);

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

-- Apply updated_at trigger to orders
DROP TRIGGER IF EXISTS update_orders_updated_at ON public.orders;
CREATE TRIGGER update_orders_updated_at 
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Apply updated_at trigger to order_items
DROP TRIGGER IF EXISTS update_order_items_updated_at ON public.order_items;
CREATE TRIGGER update_order_items_updated_at 
BEFORE UPDATE ON public.order_items
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- FUNCTION TO GENERATE ORDER NUMBER
-- ============================================
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS text AS $$
DECLARE
  year_prefix text;
  sequence_num integer;
  order_num text;
BEGIN
  -- Get current year prefix
  year_prefix := 'ORD-' || TO_CHAR(now(), 'YYYY') || '-';
  
  -- Get the next sequence number for this year
  SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM LENGTH(year_prefix) + 1) AS integer)), 0) + 1
  INTO sequence_num
  FROM public.orders
  WHERE order_number LIKE year_prefix || '%';
  
  -- Format: ORD-YYYY-XXXXX (5 digits)
  order_num := year_prefix || LPAD(sequence_num::text, 5, '0');
  
  RETURN order_num;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGER TO AUTO-GENERATE ORDER NUMBER
-- ============================================
CREATE OR REPLACE FUNCTION set_order_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
    NEW.order_number := generate_order_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_order_number ON public.orders;
CREATE TRIGGER trigger_set_order_number
BEFORE INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION set_order_number();

-- ============================================
-- FUNCTION TO CALCULATE ORDER TOTALS
-- ============================================
CREATE OR REPLACE FUNCTION calculate_order_totals()
RETURNS TRIGGER AS $$
DECLARE
  target_order_id bigint;
  order_subtotal numeric;
  order_discount numeric;
  order_total numeric;
BEGIN
  -- Determine which order_id to update
  IF TG_OP = 'DELETE' THEN
    target_order_id := OLD.order_id;
  ELSE
    target_order_id := NEW.order_id;
  END IF;
  
  -- Calculate totals from order items
  SELECT 
    COALESCE(SUM(line_total), 0),
    COALESCE(SUM(discount_amount), 0),
    COALESCE(SUM(line_total), 0)
  INTO order_subtotal, order_discount, order_total
  FROM public.order_items
  WHERE order_id = target_order_id;
  
  -- Update order totals
  UPDATE public.orders
  SET 
    subtotal_amount = order_subtotal,
    discount_amount = order_discount,
    total_amount = order_total
  WHERE id = target_order_id;
  
  -- Return appropriate record based on operation
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Trigger to recalculate order totals when items change
DROP TRIGGER IF EXISTS trigger_calculate_order_totals ON public.order_items;
CREATE TRIGGER trigger_calculate_order_totals
AFTER INSERT OR UPDATE OR DELETE ON public.order_items
FOR EACH ROW
EXECUTE FUNCTION calculate_order_totals();

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE public.orders IS 'Stores order information including financial details, status, and relationships';
COMMENT ON COLUMN public.orders.order_number IS 'Human-readable unique order identifier (e.g., ORD-2024-00001)';
COMMENT ON COLUMN public.orders.subtotal_amount IS 'Total amount before discounts and taxes';
COMMENT ON COLUMN public.orders.discount_amount IS 'Total discount amount applied to the order';
COMMENT ON COLUMN public.orders.tax_amount IS 'Tax amount if applicable';
COMMENT ON COLUMN public.orders.total_amount IS 'Final total amount (subtotal - discount + tax)';
COMMENT ON COLUMN public.orders.status IS 'Current status of the order';
COMMENT ON COLUMN public.orders.payment_method IS 'Method used for payment';
COMMENT ON COLUMN public.orders.payment_status IS 'Current payment status';
COMMENT ON COLUMN public.orders.client_id IS 'Foreign key to clients table - the customer who placed the order';
COMMENT ON COLUMN public.orders.created_by IS 'Foreign key to users table - the user who created/processed the order';

COMMENT ON TABLE public.order_items IS 'Stores individual products/items within an order';
COMMENT ON COLUMN public.order_items.order_id IS 'Foreign key to orders table';
COMMENT ON COLUMN public.order_items.product_id IS 'Foreign key to products table';
COMMENT ON COLUMN public.order_items.product_name IS 'Product name at time of order (snapshot for historical accuracy)';
COMMENT ON COLUMN public.order_items.product_price IS 'Product price at time of order (snapshot for historical accuracy)';
COMMENT ON COLUMN public.order_items.unit_price IS 'Price per unit for this order item';
COMMENT ON COLUMN public.order_items.line_total IS 'Total for this line item (unit_price * quantity - discount_amount)';

