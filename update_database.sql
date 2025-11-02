-- ============================================
-- NOBLECO CLIENTS TABLE
-- SQL script to create the clients table
-- Run this in Supabase SQL Editor
-- ============================================

-- ============================================
-- CREATE CLIENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.clients (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  
  -- Basic Information
  name text NOT NULL,
  phone text,
  email text,
  birthday date, -- Date of birth
  
  -- Location
  location text, -- Country name or ISO code (e.g., "United States", "US", "Vietnam", "VN")
  
  -- Description
  description text, -- Additional notes or description about the client
  
  -- Tracking
  order_count integer DEFAULT 0 CHECK (order_count >= 0), -- Cached count of orders (updated via trigger or computed)
  created_by bigint REFERENCES public.users(id) ON DELETE SET NULL, -- User who created this client record (references users.id, not refer_code)
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Indexes for clients
CREATE INDEX IF NOT EXISTS idx_clients_name ON public.clients(name);
CREATE INDEX IF NOT EXISTS idx_clients_email ON public.clients(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_clients_phone ON public.clients(phone) WHERE phone IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_clients_location ON public.clients(location) WHERE location IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_clients_created_by ON public.clients(created_by);
CREATE INDEX IF NOT EXISTS idx_clients_created_at ON public.clients(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_clients_order_count ON public.clients(order_count DESC);

-- Full-text search index for clients
CREATE INDEX IF NOT EXISTS idx_clients_search ON public.clients 
USING gin(to_tsvector('english', name || ' ' || coalesce(email, '') || ' ' || coalesce(phone, '') || ' ' || coalesce(description, '')));

-- ============================================
-- TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to clients
DROP TRIGGER IF EXISTS update_clients_updated_at ON public.clients;
CREATE TRIGGER update_clients_updated_at 
BEFORE UPDATE ON public.clients
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

-- Function to update client order count
-- Note: This function should be called when orders are created/deleted
-- You'll need to create a trigger on the orders table once it's created
CREATE OR REPLACE FUNCTION update_client_order_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increment order count for the client
    UPDATE public.clients 
    SET order_count = order_count + 1 
    WHERE id = NEW.client_id;
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement order count for the client
    UPDATE public.clients 
    SET order_count = GREATEST(0, order_count - 1)
    WHERE id = OLD.client_id;
  ELSIF TG_OP = 'UPDATE' THEN
    -- If client_id changed, update both old and new client counts
    IF OLD.client_id IS DISTINCT FROM NEW.client_id THEN
      UPDATE public.clients 
      SET order_count = GREATEST(0, order_count - 1)
      WHERE id = OLD.client_id;
      UPDATE public.clients 
      SET order_count = order_count + 1 
      WHERE id = NEW.client_id;
    END IF;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Note: The trigger for update_client_order_count will be created when the orders table is set up
-- Example trigger (commented out until orders table exists):
-- DROP TRIGGER IF EXISTS trigger_update_client_order_count ON public.orders;
-- CREATE TRIGGER trigger_update_client_order_count
-- AFTER INSERT OR DELETE OR UPDATE OF client_id ON public.orders
-- FOR EACH ROW
-- EXECUTE FUNCTION update_client_order_count();

-- ============================================
-- INSERT SAMPLE CLIENTS DATA
-- ============================================

INSERT INTO public.clients (
  name, phone, email, birthday, location, description, created_by
) VALUES
(
  'John Smith',
  '+1 (555) 123-4567',
  'john.smith@example.com',
  '1990-05-15',
  'United States',
  'Regular customer, prefers premium products',
  (SELECT id FROM users WHERE role = 'admin' LIMIT 1)
),
(
  'Sarah Wilson',
  '+1 (555) 987-6543',
  'sarah.wilson@example.com',
  '1985-08-22',
  'Canada',
  'VIP client, bulk orders',
  (SELECT id FROM users WHERE role = 'admin' LIMIT 1)
),
(
  'Michael Davis',
  '+1 (555) 456-7890',
  'michael.davis@example.com',
  '1992-11-10',
  'United States',
  'New client, interested in organic products',
  (SELECT id FROM users WHERE role = 'admin' LIMIT 1)
),
(
  'Emily Chen',
  '+1 (555) 321-0987',
  'emily.chen@example.com',
  '1988-03-25',
  'United States',
  'Loyal customer, frequent orders',
  (SELECT id FROM users WHERE role = 'admin' LIMIT 1)
),
(
  'David Rodriguez',
  '+1 (555) 654-3210',
  'david.rodriguez@example.com',
  '1995-07-08',
  'Mexico',
  'B2B client, wholesale orders',
  (SELECT id FROM users WHERE role = 'admin' LIMIT 1)
),
(
  'Lisa Anderson',
  '+1 (555) 789-0123',
  'lisa.anderson@example.com',
  '1991-12-03',
  'United States',
  'Interested in health and wellness products',
  (SELECT id FROM users WHERE role = 'admin' LIMIT 1)
),
(
  'James Taylor',
  '+44 20 1234 5678',
  'james.taylor@example.com',
  '1987-01-18',
  'United Kingdom',
  'International client, prefers express shipping',
  (SELECT id FROM users WHERE role = 'admin' LIMIT 1)
),
(
  'Maria Garcia',
  '+34 91 123 4567',
  'maria.garcia@example.com',
  '1993-09-14',
  'Spain',
  'New client, first order pending',
  (SELECT id FROM users WHERE role = 'admin' LIMIT 1)
),
(
  'Robert Brown',
  '+1 (555) 234-5678',
  'robert.brown@example.com',
  '1989-06-20',
  'United States',
  'Regular customer, prefers subscription model',
  (SELECT id FROM users WHERE role = 'admin' LIMIT 1)
),
(
  'Jennifer Lee',
  '+1 (555) 345-6789',
  'jennifer.lee@example.com',
  '1994-02-28',
  'United States',
  'Price-sensitive customer, looks for deals',
  (SELECT id FROM users WHERE role = 'admin' LIMIT 1)
)
ON CONFLICT DO NOTHING;

-- ============================================
-- FIX PRICE COLUMNS FOR VND CURRENCY
-- Update price and cost_price columns to support large VND values
-- ============================================

-- Alter price column to support larger values (numeric(20, 0) = 20 digits, 0 decimal places)
-- This supports VND values up to 99,999,999,999,999,999,999
ALTER TABLE public.products 
ALTER COLUMN price TYPE numeric(20, 0);

-- Alter cost_price column to support larger values
ALTER TABLE public.products 
ALTER COLUMN cost_price TYPE numeric(20, 0);

-- ============================================
-- SETUP COMPLETE!
-- ============================================
