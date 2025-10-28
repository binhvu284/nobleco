-- ============================================
-- NOBLECO PRODUCT & CATEGORY SYSTEM
-- Complete database setup for products and categories
-- Run this in Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. CREATE CATEGORIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.categories (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  
  -- Basic Information
  name text NOT NULL UNIQUE,
  slug text UNIQUE NOT NULL,
  description text,
  
  -- Hierarchy (for nested categories)
  parent_id bigint REFERENCES public.categories(id) ON DELETE CASCADE,
  level integer DEFAULT 0, -- 0 = top level, 1 = subcategory, etc.
  sort_order integer DEFAULT 0, -- Manual ordering
  
  -- Display
  color text DEFAULT '#3B82F6', -- Brand color for UI
  icon text, -- Icon identifier or emoji
  
  -- Status
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  is_featured boolean DEFAULT false,
  
  -- SEO
  meta_title text,
  meta_description text,
  
  -- Tracking
  product_count integer DEFAULT 0, -- Cached count (updated via trigger)
  view_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Indexes for categories
CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON public.categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_status ON public.categories(status);
CREATE INDEX IF NOT EXISTS idx_categories_sort_order ON public.categories(sort_order);

-- ============================================
-- 2. CREATE PRODUCTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.products (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  
  -- Basic Information
  name text NOT NULL,
  slug text UNIQUE NOT NULL, -- URL-friendly name (e.g., "premium-coffee-beans")
  sku text UNIQUE, -- Stock Keeping Unit (optional, for inventory)
  
  -- Descriptions
  short_description text NOT NULL,
  long_description text,
  
  -- Pricing & Inventory
  price numeric(10, 2) NOT NULL CHECK (price >= 0), -- e.g., 25.99
  compare_at_price numeric(10, 2) CHECK (compare_at_price >= 0), -- Original price for showing discounts
  cost_price numeric(10, 2) CHECK (cost_price >= 0), -- Your cost (for profit calculation)
  stock integer NOT NULL DEFAULT 0 CHECK (stock >= 0),
  low_stock_threshold integer DEFAULT 10, -- Alert when stock is low
  
  -- Product Status & Visibility
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'inactive', 'archived')),
  is_featured boolean DEFAULT false, -- For homepage/promotional display
  is_new_arrival boolean DEFAULT false,
  is_on_sale boolean DEFAULT false,
  
  -- SEO & Marketing
  meta_title text,
  meta_description text,
  meta_keywords text[],
  
  -- Physical Properties (optional but useful for shipping)
  weight numeric(10, 2), -- in kg
  dimensions jsonb, -- {"length": 10, "width": 5, "height": 3, "unit": "cm"}
  
  -- MLM Specific Fields
  commission_percentage integer DEFAULT 0 CHECK (commission_percentage >= 0 AND commission_percentage <= 100),
  points_value integer DEFAULT 0, -- Points earned when purchasing
  points_required integer, -- Points needed to redeem (if applicable)
  
  -- Tracking
  view_count integer DEFAULT 0,
  sales_count integer DEFAULT 0,
  created_by bigint REFERENCES public.users(id) ON DELETE SET NULL,
  updated_by bigint REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Indexes for products
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(status);
CREATE INDEX IF NOT EXISTS idx_products_price ON public.products(price);
CREATE INDEX IF NOT EXISTS idx_products_stock ON public.products(stock);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON public.products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_is_featured ON public.products(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_products_is_on_sale ON public.products(is_on_sale) WHERE is_on_sale = true;
CREATE INDEX IF NOT EXISTS idx_products_created_by ON public.products(created_by);

-- Full-text search index for products
CREATE INDEX IF NOT EXISTS idx_products_search ON public.products 
USING gin(to_tsvector('english', name || ' ' || coalesce(short_description, '')));

-- ============================================
-- 3. CREATE PRODUCT_CATEGORIES TABLE (Junction Table)
-- ============================================
CREATE TABLE IF NOT EXISTS public.product_categories (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  product_id bigint NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  category_id bigint NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  is_primary boolean DEFAULT false, -- One category can be marked as primary
  sort_order integer DEFAULT 0, -- Order within category
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  
  -- Ensure unique product-category combination
  CONSTRAINT unique_product_category UNIQUE (product_id, category_id)
);

-- Indexes for product_categories
CREATE INDEX IF NOT EXISTS idx_product_categories_product ON public.product_categories(product_id);
CREATE INDEX IF NOT EXISTS idx_product_categories_category ON public.product_categories(category_id);
CREATE INDEX IF NOT EXISTS idx_product_categories_primary ON public.product_categories(is_primary) WHERE is_primary = true;

-- ============================================
-- 4. CREATE TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to products
DROP TRIGGER IF EXISTS update_products_updated_at ON public.products;
CREATE TRIGGER update_products_updated_at 
BEFORE UPDATE ON public.products
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

-- Apply updated_at trigger to categories
DROP TRIGGER IF EXISTS update_categories_updated_at ON public.categories;
CREATE TRIGGER update_categories_updated_at 
BEFORE UPDATE ON public.categories
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

-- Function to update category product count
CREATE OR REPLACE FUNCTION update_category_product_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.categories 
    SET product_count = product_count + 1 
    WHERE id = NEW.category_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.categories 
    SET product_count = GREATEST(0, product_count - 1)
    WHERE id = OLD.category_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Apply product count trigger
DROP TRIGGER IF EXISTS trigger_update_product_count ON public.product_categories;
CREATE TRIGGER trigger_update_product_count
AFTER INSERT OR DELETE ON public.product_categories
FOR EACH ROW
EXECUTE FUNCTION update_category_product_count();

-- ============================================
-- 5. INSERT SAMPLE CATEGORIES
-- ============================================

-- Top-level categories
INSERT INTO public.categories (name, slug, description, color, icon, level, sort_order, is_featured) VALUES
('Beverages', 'beverages', 'Drinks and beverage products', '#3B82F6', '🍹', 0, 1, true),
('Food & Snacks', 'food-snacks', 'Food items and snacks', '#EF4444', '🍕', 0, 2, true),
('Health & Wellness', 'health-wellness', 'Health and wellness products', '#10B981', '💊', 0, 3, true),
('Beauty & Personal Care', 'beauty-personal-care', 'Beauty and personal care items', '#EC4899', '💄', 0, 4, false),
('Home & Living', 'home-living', 'Home and lifestyle products', '#F59E0B', '🏠', 0, 5, false),
('Electronics', 'electronics', 'Electronic devices and gadgets', '#8B5CF6', '📱', 0, 6, false)
ON CONFLICT (slug) DO NOTHING;

-- Sub-categories for Beverages
INSERT INTO public.categories (name, slug, description, parent_id, level, sort_order) VALUES
('Coffee', 'coffee', 'Coffee and coffee products', (SELECT id FROM categories WHERE slug = 'beverages'), 1, 1),
('Tea', 'tea', 'Tea and tea products', (SELECT id FROM categories WHERE slug = 'beverages'), 1, 2),
('Juices', 'juices', 'Fresh juices and juice products', (SELECT id FROM categories WHERE slug = 'beverages'), 1, 3),
('Energy Drinks', 'energy-drinks', 'Energy and sports drinks', (SELECT id FROM categories WHERE slug = 'beverages'), 1, 4)
ON CONFLICT (slug) DO NOTHING;

-- Sub-categories for Food & Snacks
INSERT INTO public.categories (name, slug, description, parent_id, level, sort_order) VALUES
('Chocolate', 'chocolate', 'Chocolate and chocolate products', (SELECT id FROM categories WHERE slug = 'food-snacks'), 1, 1),
('Nuts & Seeds', 'nuts-seeds', 'Nuts, seeds, and trail mixes', (SELECT id FROM categories WHERE slug = 'food-snacks'), 1, 2),
('Organic', 'organic', 'Certified organic products', (SELECT id FROM categories WHERE slug = 'food-snacks'), 1, 3)
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- 6. INSERT SAMPLE PRODUCTS
-- ============================================

INSERT INTO public.products (
  name, slug, sku, short_description, long_description, 
  price, compare_at_price, cost_price, stock, low_stock_threshold,
  status, is_featured, is_new_arrival, is_on_sale,
  commission_percentage, points_value,
  weight, dimensions,
  created_by
) VALUES
(
  'Premium Coffee Beans',
  'premium-coffee-beans',
  'COFFEE-001',
  'High-quality arabica coffee beans',
  'Carefully selected arabica coffee beans from the finest plantations. Perfect for coffee enthusiasts who appreciate quality and flavor. These beans are sourced from sustainable farms and roasted to perfection.',
  25.99,
  35.99,
  15.00,
  50,
  10,
  'active',
  true,
  true,
  true,
  15,
  25,
  0.5,
  '{"length": 20, "width": 10, "height": 5, "unit": "cm"}'::jsonb,
  (SELECT id FROM users WHERE role = 'admin' LIMIT 1)
),
(
  'Organic Green Tea',
  'organic-green-tea',
  'TEA-001',
  'Premium organic green tea leaves',
  'Hand-picked organic green tea leaves with antioxidant properties. Great for health-conscious individuals. This tea is known for its delicate flavor and numerous health benefits.',
  18.50,
  22.00,
  12.00,
  35,
  10,
  'active',
  true,
  true,
  false,
  12,
  18,
  0.2,
  '{"length": 15, "width": 10, "height": 3, "unit": "cm"}'::jsonb,
  (SELECT id FROM users WHERE role = 'admin' LIMIT 1)
),
(
  'Artisan Chocolate Bar',
  'artisan-chocolate-bar',
  'CHOC-001',
  'Dark chocolate with sea salt',
  'Premium dark chocolate bar with a hint of sea salt. Made with the finest cocoa beans for an exquisite taste experience. This chocolate is crafted by master chocolatiers using traditional techniques.',
  12.99,
  NULL,
  8.00,
  100,
  20,
  'active',
  false,
  false,
  false,
  10,
  12,
  0.1,
  '{"length": 12, "width": 8, "height": 1, "unit": "cm"}'::jsonb,
  (SELECT id FROM users WHERE role = 'admin' LIMIT 1)
),
(
  'Energy Boost Drink',
  'energy-boost-drink',
  'ENERGY-001',
  'Natural energy drink with vitamins',
  'All-natural energy drink packed with B vitamins and natural caffeine. Perfect for a healthy energy boost without the crash.',
  4.99,
  5.99,
  2.50,
  200,
  50,
  'active',
  false,
  true,
  true,
  8,
  5,
  0.35,
  '{"length": 6, "width": 6, "height": 15, "unit": "cm"}'::jsonb,
  (SELECT id FROM users WHERE role = 'admin' LIMIT 1)
),
(
  'Organic Trail Mix',
  'organic-trail-mix',
  'SNACK-001',
  'Premium mixed nuts and dried fruits',
  'A delicious blend of organic nuts, seeds, and dried fruits. Perfect for a healthy snack on the go.',
  15.99,
  18.99,
  10.00,
  75,
  15,
  'active',
  true,
  false,
  false,
  10,
  15,
  0.4,
  '{"length": 18, "width": 12, "height": 4, "unit": "cm"}'::jsonb,
  (SELECT id FROM users WHERE role = 'admin' LIMIT 1)
)
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- 7. LINK PRODUCTS TO CATEGORIES
-- ============================================

-- Link Premium Coffee Beans to categories
INSERT INTO public.product_categories (product_id, category_id, is_primary, sort_order)
SELECT 
  (SELECT id FROM products WHERE slug = 'premium-coffee-beans'),
  id,
  CASE WHEN slug = 'coffee' THEN true ELSE false END,
  0
FROM categories 
WHERE slug IN ('beverages', 'coffee')
ON CONFLICT (product_id, category_id) DO NOTHING;

-- Link Organic Green Tea to categories
INSERT INTO public.product_categories (product_id, category_id, is_primary, sort_order)
SELECT 
  (SELECT id FROM products WHERE slug = 'organic-green-tea'),
  id,
  CASE WHEN slug = 'tea' THEN true ELSE false END,
  0
FROM categories 
WHERE slug IN ('beverages', 'tea', 'organic', 'health-wellness')
ON CONFLICT (product_id, category_id) DO NOTHING;

-- Link Artisan Chocolate Bar to categories
INSERT INTO public.product_categories (product_id, category_id, is_primary, sort_order)
SELECT 
  (SELECT id FROM products WHERE slug = 'artisan-chocolate-bar'),
  id,
  CASE WHEN slug = 'chocolate' THEN true ELSE false END,
  0
FROM categories 
WHERE slug IN ('food-snacks', 'chocolate')
ON CONFLICT (product_id, category_id) DO NOTHING;

-- Link Energy Boost Drink to categories
INSERT INTO public.product_categories (product_id, category_id, is_primary, sort_order)
SELECT 
  (SELECT id FROM products WHERE slug = 'energy-boost-drink'),
  id,
  CASE WHEN slug = 'energy-drinks' THEN true ELSE false END,
  0
FROM categories 
WHERE slug IN ('beverages', 'energy-drinks', 'health-wellness')
ON CONFLICT (product_id, category_id) DO NOTHING;

-- Link Organic Trail Mix to categories
INSERT INTO public.product_categories (product_id, category_id, is_primary, sort_order)
SELECT 
  (SELECT id FROM products WHERE slug = 'organic-trail-mix'),
  id,
  CASE WHEN slug = 'nuts-seeds' THEN true ELSE false END,
  0
FROM categories 
WHERE slug IN ('food-snacks', 'nuts-seeds', 'organic', 'health-wellness')
ON CONFLICT (product_id, category_id) DO NOTHING;

-- ============================================
-- 8. VERIFICATION QUERIES (for testing)
-- ============================================

-- View all categories with product counts
-- SELECT id, name, slug, parent_id, level, product_count, status, is_featured FROM categories ORDER BY level, sort_order;

-- View all products with basic info
-- SELECT id, name, slug, price, stock, status, is_featured, created_at FROM products ORDER BY created_at DESC;

-- View products with their categories
-- SELECT 
--   p.name as product_name,
--   p.price,
--   p.stock,
--   array_agg(c.name ORDER BY pc.is_primary DESC, c.name) as categories
-- FROM products p
-- LEFT JOIN product_categories pc ON p.id = pc.product_id
-- LEFT JOIN categories c ON pc.category_id = c.id
-- GROUP BY p.id, p.name, p.price, p.stock
-- ORDER BY p.name;

-- ============================================
-- SETUP COMPLETE!
-- ============================================
