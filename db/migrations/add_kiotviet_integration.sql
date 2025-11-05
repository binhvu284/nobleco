-- ============================================
-- KIOTVIET API INTEGRATION - DATABASE SCHEMA UPDATE
-- SQL script to update products and categories tables for third-party integration
-- Run this in Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. UPDATE PRODUCTS TABLE
-- Add KiotViet-specific fields and sync tracking
-- ============================================

-- Add KiotViet Product ID (unique identifier from KiotViet)
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS kiotviet_id TEXT UNIQUE;

-- Add Serial Number
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS serial_number TEXT;

-- Add Supplier ID
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS supplier_id TEXT;

-- Add Center Stone Size (mm)
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS center_stone_size_mm NUMERIC(10, 2);

-- Add Ni tay (Vietnamese field name - temporary)
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS ni_tay NUMERIC(10, 2);

-- Add Shape
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS shape TEXT;

-- Add Dimensions
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS dimensions TEXT;

-- Add Stone Count
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS stone_count INTEGER;

-- Add Carat Weight (ct)
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS carat_weight_ct NUMERIC(10, 2);

-- Add Gold Purity
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS gold_purity TEXT;

-- Add Product Weight (g)
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS product_weight_g NUMERIC(10, 2);

-- Add Type (phân loại)
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS type TEXT;

-- Add Inventory Value
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS inventory_value NUMERIC(20, 0);

-- Add sync tracking fields
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS sync_status TEXT DEFAULT 'pending' 
CHECK (sync_status IN ('pending', 'synced', 'failed', 'syncing'));

-- Add index on kiotviet_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_products_kiotviet_id ON public.products(kiotviet_id) 
WHERE kiotviet_id IS NOT NULL;

-- Add index on sync_status for filtering synced products
CREATE INDEX IF NOT EXISTS idx_products_sync_status ON public.products(sync_status);

-- ============================================
-- 2. UPDATE CATEGORIES TABLE
-- Add KiotViet integration fields
-- ============================================

-- Add KiotViet Category ID
ALTER TABLE public.categories 
ADD COLUMN IF NOT EXISTS kiotviet_id TEXT UNIQUE;

-- Add sync tracking fields
ALTER TABLE public.categories 
ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE public.categories 
ADD COLUMN IF NOT EXISTS sync_status TEXT DEFAULT 'pending' 
CHECK (sync_status IN ('pending', 'synced', 'failed', 'syncing'));

-- Add index on kiotviet_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_categories_kiotviet_id ON public.categories(kiotviet_id) 
WHERE kiotviet_id IS NOT NULL;

-- Add index on sync_status
CREATE INDEX IF NOT EXISTS idx_categories_sync_status ON public.categories(sync_status);

-- ============================================
-- 3. CREATE THIRD-PARTY INTEGRATIONS TABLE
-- Store API credentials and configuration for multiple integrations
-- ============================================

CREATE TABLE IF NOT EXISTS public.third_party_integrations (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  
  -- Integration identification
  name TEXT NOT NULL UNIQUE, -- e.g., 'kiotviet', 'another_app'
  display_name TEXT NOT NULL, -- e.g., 'KiotViet', 'Another App'
  
  -- API configuration
  api_url TEXT NOT NULL, -- Base API URL
  token_url TEXT, -- OAuth token endpoint
  client_id TEXT, -- OAuth client ID
  client_secret TEXT, -- OAuth client secret (should be encrypted in production)
  retailer TEXT, -- Retailer/store identifier
  
  -- Token management
  access_token TEXT, -- Current access token
  refresh_token TEXT, -- Refresh token for getting new access tokens
  token_expires_at TIMESTAMP WITH TIME ZONE, -- When the access token expires
  
  -- Integration settings
  is_active BOOLEAN DEFAULT true, -- Whether integration is enabled
  is_default BOOLEAN DEFAULT false, -- Default integration to use
  sync_enabled BOOLEAN DEFAULT true, -- Whether auto-sync is enabled
  
  -- Sync tracking
  last_sync_at TIMESTAMP WITH TIME ZONE, -- Last successful sync time
  sync_interval_minutes INTEGER DEFAULT 60, -- How often to sync (in minutes)
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create unique index to ensure only one default integration
CREATE UNIQUE INDEX IF NOT EXISTS idx_integrations_default 
ON public.third_party_integrations(is_default) 
WHERE is_default = true;

-- Create index on name for quick lookups
CREATE INDEX IF NOT EXISTS idx_integrations_name ON public.third_party_integrations(name);

-- Create index on is_active for filtering active integrations
CREATE INDEX IF NOT EXISTS idx_integrations_active ON public.third_party_integrations(is_active);

-- ============================================
-- 4. CREATE SYNC LOGS TABLE
-- Track synchronization history and errors
-- ============================================

CREATE TABLE IF NOT EXISTS public.sync_logs (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  
  -- Integration reference
  integration_id BIGINT REFERENCES public.third_party_integrations(id) ON DELETE SET NULL,
  
  -- Sync metadata
  sync_type TEXT NOT NULL CHECK (sync_type IN ('full', 'incremental', 'manual')),
  status TEXT NOT NULL CHECK (status IN ('running', 'completed', 'failed', 'partial')),
  
  -- Sync statistics
  products_synced INTEGER DEFAULT 0,
  products_created INTEGER DEFAULT 0,
  products_updated INTEGER DEFAULT 0,
  products_failed INTEGER DEFAULT 0,
  categories_synced INTEGER DEFAULT 0,
  categories_created INTEGER DEFAULT 0,
  categories_updated INTEGER DEFAULT 0,
  categories_failed INTEGER DEFAULT 0,
  
  -- Error tracking
  error_message TEXT,
  error_details JSONB, -- Store detailed error information
  
  -- Timestamps
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for sync logs
CREATE INDEX IF NOT EXISTS idx_sync_logs_integration_id ON public.sync_logs(integration_id);
CREATE INDEX IF NOT EXISTS idx_sync_logs_status ON public.sync_logs(status);
CREATE INDEX IF NOT EXISTS idx_sync_logs_started_at ON public.sync_logs(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_sync_logs_sync_type ON public.sync_logs(sync_type);

-- ============================================
-- 5. TRIGGERS
-- Auto-update updated_at timestamps
-- ============================================

-- Function to update updated_at column (if not exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to third_party_integrations
DROP TRIGGER IF EXISTS update_third_party_integrations_updated_at ON public.third_party_integrations;
CREATE TRIGGER update_third_party_integrations_updated_at 
BEFORE UPDATE ON public.third_party_integrations
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 6. INITIAL DATA
-- Insert default KiotViet integration configuration
-- ============================================

-- Insert KiotViet integration (if not exists)
INSERT INTO public.third_party_integrations (
  name,
  display_name,
  api_url,
  token_url,
  client_id,
  client_secret,
  retailer,
  is_active,
  is_default,
  sync_enabled
) VALUES (
  'kiotviet',
  'KiotViet',
  'https://public.kiotapi.com',
  'https://id.kiotviet.vn/connect/token',
  '733933ea-8926-4454-906f-bb2c5a1b200c',
  'C21301C23C61A43D15C879F919C2B7DF2784C827',
  'nobleco',
  true,
  true,
  true
) ON CONFLICT (name) DO NOTHING;

-- ============================================
-- 7. COMMENTS (Documentation)
-- ============================================

COMMENT ON COLUMN public.products.kiotviet_id IS 'Unique identifier from KiotViet API for product linking';
COMMENT ON COLUMN public.products.serial_number IS 'Product serial number from KiotViet';
COMMENT ON COLUMN public.products.supplier_id IS 'Supplier identifier from KiotViet';
COMMENT ON COLUMN public.products.center_stone_size_mm IS 'Center stone size in millimeters';
COMMENT ON COLUMN public.products.shape IS 'Product shape (e.g., Round, Princess, Oval)';
COMMENT ON COLUMN public.products.dimensions IS 'Product dimensions';
COMMENT ON COLUMN public.products.stone_count IS 'Number of stones in the product';
COMMENT ON COLUMN public.products.carat_weight_ct IS 'Total carat weight';
COMMENT ON COLUMN public.products.gold_purity IS 'Gold purity (e.g., 18K, 24K)';
COMMENT ON COLUMN public.products.product_weight_g IS 'Product weight in grams';
COMMENT ON COLUMN public.products.type IS 'Product type/classification (phân loại)';
COMMENT ON COLUMN public.products.inventory_value IS 'Total inventory value';
COMMENT ON COLUMN public.products.last_synced_at IS 'Timestamp of last successful sync from third-party';
COMMENT ON COLUMN public.products.sync_status IS 'Current sync status: pending, synced, failed, syncing';

COMMENT ON COLUMN public.categories.kiotviet_id IS 'Unique identifier from KiotViet API for category linking';
COMMENT ON COLUMN public.categories.last_synced_at IS 'Timestamp of last successful sync from third-party';
COMMENT ON COLUMN public.categories.sync_status IS 'Current sync status: pending, synced, failed, syncing';

COMMENT ON TABLE public.third_party_integrations IS 'Stores configuration and credentials for third-party API integrations';
COMMENT ON TABLE public.sync_logs IS 'Tracks synchronization history and errors for all integrations';

-- ============================================
-- SETUP COMPLETE!
-- ============================================
-- 
-- Next steps:
-- 1. Verify all columns were added successfully
-- 2. Check indexes were created
-- 3. Verify initial KiotViet integration was inserted
-- 4. Test API connection with the test connection button
-- ============================================

