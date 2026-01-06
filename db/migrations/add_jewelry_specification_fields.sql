-- Add new fields to products table for detailed jewelry specifications
-- This migration adds fields for Material/Purity, Material Weight, Total Weight, Size, Jewelry Size,
-- Style (BST), Sub Style, Main Stone Type, Stone Quantity, Shape and Polished, Origin, Item Serial,
-- Country of Origin, Certification Number, Size (mm), Color, Clarity, Weight (CT), PCS, Cut Grade,
-- Treatment, Sub Stone Types 1-3

-- Add new columns to products table
ALTER TABLE products
ADD COLUMN IF NOT EXISTS material_purity TEXT,
ADD COLUMN IF NOT EXISTS material_weight_g DECIMAL(10, 3),
ADD COLUMN IF NOT EXISTS total_weight_g DECIMAL(10, 3),
ADD COLUMN IF NOT EXISTS size_text TEXT,
ADD COLUMN IF NOT EXISTS jewelry_size TEXT,
ADD COLUMN IF NOT EXISTS style_bst TEXT,
ADD COLUMN IF NOT EXISTS sub_style TEXT,
ADD COLUMN IF NOT EXISTS main_stone_type TEXT,
ADD COLUMN IF NOT EXISTS stone_quantity INTEGER,
ADD COLUMN IF NOT EXISTS shape_and_polished TEXT,
ADD COLUMN IF NOT EXISTS origin TEXT,
ADD COLUMN IF NOT EXISTS item_serial TEXT,
ADD COLUMN IF NOT EXISTS country_of_origin TEXT,
ADD COLUMN IF NOT EXISTS certification_number TEXT,
ADD COLUMN IF NOT EXISTS size_mm DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS color TEXT,
ADD COLUMN IF NOT EXISTS clarity TEXT,
ADD COLUMN IF NOT EXISTS weight_ct DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS pcs INTEGER,
ADD COLUMN IF NOT EXISTS cut_grade TEXT,
ADD COLUMN IF NOT EXISTS treatment TEXT,
ADD COLUMN IF NOT EXISTS sub_stone_type_1 TEXT,
ADD COLUMN IF NOT EXISTS sub_stone_type_2 TEXT,
ADD COLUMN IF NOT EXISTS sub_stone_type_3 TEXT;

-- Make name nullable (product name will default to product code if null)
ALTER TABLE products
ALTER COLUMN name DROP NOT NULL;

-- Ensure SKU is unique
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'products_sku_key' 
        AND conrelid = 'products'::regclass
    ) THEN
        ALTER TABLE products ADD CONSTRAINT products_sku_key UNIQUE (sku);
    END IF;
END $$;

-- Add comments for documentation
COMMENT ON COLUMN products.material_purity IS 'Material / Purity (text)';
COMMENT ON COLUMN products.material_weight_g IS 'Material Weight (g) - decimal number';
COMMENT ON COLUMN products.total_weight_g IS 'Total Weight (g) - decimal number';
COMMENT ON COLUMN products.size_text IS 'Size (text)';
COMMENT ON COLUMN products.jewelry_size IS 'Jewelry size (text)';
COMMENT ON COLUMN products.style_bst IS 'Style (BST) (text)';
COMMENT ON COLUMN products.sub_style IS 'Sub Style (text)';
COMMENT ON COLUMN products.main_stone_type IS 'Main stone type (text)';
COMMENT ON COLUMN products.stone_quantity IS 'Stone Quantity (number)';
COMMENT ON COLUMN products.shape_and_polished IS 'Shape and Polished (text)';
COMMENT ON COLUMN products.origin IS 'Origin (text)';
COMMENT ON COLUMN products.item_serial IS 'Item Serial (text)';
COMMENT ON COLUMN products.country_of_origin IS 'Country of Origin (text)';
COMMENT ON COLUMN products.certification_number IS 'Certification number (text)';
COMMENT ON COLUMN products.size_mm IS 'Size (mm) - decimal number';
COMMENT ON COLUMN products.color IS 'Color (text)';
COMMENT ON COLUMN products.clarity IS 'Clarity (text)';
COMMENT ON COLUMN products.weight_ct IS 'Weight (CT) - decimal number';
COMMENT ON COLUMN products.pcs IS 'PCS (number)';
COMMENT ON COLUMN products.cut_grade IS 'Cut Grade (text)';
COMMENT ON COLUMN products.treatment IS 'Treatment (text)';
COMMENT ON COLUMN products.sub_stone_type_1 IS 'Sub Stone type 1 (text)';
COMMENT ON COLUMN products.sub_stone_type_2 IS 'Sub Stone type 2 (text)';
COMMENT ON COLUMN products.sub_stone_type_3 IS 'Sub Stone type 3 (text)';

