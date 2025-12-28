-- Create centerstones tables
-- This migration creates tables for center stones (similar to products but separate)
-- Center stones are separate from jewelry products and have their own categories

-- ============================================
-- 1. Create centerstones table
-- ============================================
-- This table mirrors the products table structure
CREATE TABLE IF NOT EXISTS centerstones (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    sku TEXT UNIQUE,
    short_description TEXT NOT NULL,
    long_description TEXT,
    price DECIMAL(10, 2) NOT NULL DEFAULT 0,
    cost_price DECIMAL(10, 2),
    stock INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('draft', 'active', 'inactive', 'archived')),
    is_featured BOOLEAN NOT NULL DEFAULT false,
    created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    updated_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    -- KiotViet integration fields
    kiotviet_id TEXT,
    serial_number TEXT,
    supplier_id TEXT,
    jewelry_specifications TEXT,
    inventory_value DECIMAL(10, 2),
    -- Legacy fields (kept for backward compatibility)
    center_stone_size_mm DECIMAL(10, 2),
    ni_tay DECIMAL(10, 2),
    shape TEXT,
    dimensions TEXT,
    stone_count INTEGER,
    carat_weight_ct DECIMAL(10, 2),
    gold_purity TEXT,
    product_weight_g DECIMAL(10, 2),
    type TEXT,
    last_synced_at TIMESTAMP WITH TIME ZONE,
    sync_status TEXT
);

-- Create indexes for centerstones
CREATE INDEX IF NOT EXISTS idx_centerstones_slug ON centerstones(slug);
CREATE INDEX IF NOT EXISTS idx_centerstones_sku ON centerstones(sku);
CREATE INDEX IF NOT EXISTS idx_centerstones_status ON centerstones(status);
CREATE INDEX IF NOT EXISTS idx_centerstones_created_at ON centerstones(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_centerstones_is_featured ON centerstones(is_featured);

-- Add comments
COMMENT ON TABLE centerstones IS 'Center stones table - separate from jewelry products';
COMMENT ON COLUMN centerstones.jewelry_specifications IS 'Multi-line text field containing all center stone specifications';

-- ============================================
-- 2. Create centerstone_categories table
-- ============================================
-- This table mirrors the categories table structure but for center stones
CREATE TABLE IF NOT EXISTS centerstone_categories (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    parent_id BIGINT REFERENCES centerstone_categories(id) ON DELETE CASCADE,
    level INTEGER NOT NULL DEFAULT 0,
    color TEXT NOT NULL DEFAULT '#3B82F6',
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    is_featured BOOLEAN NOT NULL DEFAULT false,
    product_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    -- KiotViet integration fields
    kiotviet_id TEXT,
    last_synced_at TIMESTAMP WITH TIME ZONE,
    sync_status TEXT
);

-- Create indexes for centerstone_categories
CREATE INDEX IF NOT EXISTS idx_centerstone_categories_slug ON centerstone_categories(slug);
CREATE INDEX IF NOT EXISTS idx_centerstone_categories_status ON centerstone_categories(status);
CREATE INDEX IF NOT EXISTS idx_centerstone_categories_parent_id ON centerstone_categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_centerstone_categories_created_at ON centerstone_categories(created_at DESC);

-- Add comments
COMMENT ON TABLE centerstone_categories IS 'Categories for center stones - separate from jewelry categories';

-- ============================================
-- 3. Create centerstone_category_relations table
-- ============================================
-- Junction table linking centerstones to centerstone_categories (similar to product_categories)
CREATE TABLE IF NOT EXISTS centerstone_category_relations (
    id BIGSERIAL PRIMARY KEY,
    centerstone_id BIGINT NOT NULL REFERENCES centerstones(id) ON DELETE CASCADE,
    category_id BIGINT NOT NULL REFERENCES centerstone_categories(id) ON DELETE CASCADE,
    is_primary BOOLEAN NOT NULL DEFAULT false,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(centerstone_id, category_id)
);

-- Create indexes for centerstone_category_relations
CREATE INDEX IF NOT EXISTS idx_centerstone_category_relations_centerstone_id ON centerstone_category_relations(centerstone_id);
CREATE INDEX IF NOT EXISTS idx_centerstone_category_relations_category_id ON centerstone_category_relations(category_id);
CREATE INDEX IF NOT EXISTS idx_centerstone_category_relations_is_primary ON centerstone_category_relations(is_primary);

-- Add comments
COMMENT ON TABLE centerstone_category_relations IS 'Junction table linking centerstones to centerstone_categories';

-- ============================================
-- 4. Create centerstone_images table
-- ============================================
-- This table mirrors the product_images table structure
CREATE TABLE IF NOT EXISTS centerstone_images (
    id BIGSERIAL PRIMARY KEY,
    centerstone_id BIGINT NOT NULL REFERENCES centerstones(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL,
    url TEXT NOT NULL,
    alt_text TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_featured BOOLEAN NOT NULL DEFAULT false,
    file_size BIGINT,
    width INTEGER,
    height INTEGER,
    mime_type TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for centerstone_images
CREATE INDEX IF NOT EXISTS idx_centerstone_images_centerstone_id ON centerstone_images(centerstone_id);
CREATE INDEX IF NOT EXISTS idx_centerstone_images_sort_order ON centerstone_images(centerstone_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_centerstone_images_is_featured ON centerstone_images(centerstone_id, is_featured);

-- Add comments
COMMENT ON TABLE centerstone_images IS 'Images for center stones - separate from product_images';

