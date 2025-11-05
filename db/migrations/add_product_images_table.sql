-- ============================================
-- PRODUCT IMAGES TABLE
-- SQL script to create the product_images table
-- Run this in Supabase SQL Editor
-- ============================================

-- ============================================
-- CREATE PRODUCT_IMAGES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.product_images (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  
  -- Foreign key to products table
  product_id bigint NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  
  -- Storage information
  storage_path text NOT NULL,  -- Path in Supabase Storage (e.g., "products/123/original/uuid-filename.jpg")
  url text NOT NULL,            -- Full CDN URL from Supabase Storage
  
  -- Image metadata
  alt_text text,                 -- Alt text for accessibility
  sort_order integer DEFAULT 0,  -- For ordering images (0 = first image)
  is_featured boolean DEFAULT false, -- Primary/featured image (one per product)
  
  -- File information
  file_size integer,             -- File size in bytes
  width integer,                 -- Image width in pixels
  height integer,                -- Image height in pixels
  mime_type text,                -- MIME type (e.g., "image/jpeg", "image/png")
  
  -- Timestamps
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON public.product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_sort_order ON public.product_images(product_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_product_images_featured ON public.product_images(product_id, is_featured) WHERE is_featured = true;

-- Unique constraint: Only one featured image per product
CREATE UNIQUE INDEX IF NOT EXISTS idx_product_images_featured_unique 
  ON public.product_images(product_id) 
  WHERE is_featured = true;

-- ============================================
-- TRIGGERS
-- ============================================

-- Apply updated_at trigger to product_images
DROP TRIGGER IF EXISTS update_product_images_updated_at ON public.product_images;
CREATE TRIGGER update_product_images_updated_at 
BEFORE UPDATE ON public.product_images
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SETUP COMPLETE!
-- ============================================

