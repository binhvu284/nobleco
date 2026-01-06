-- Add new fields to centerstones table for detailed centerstone specifications
-- This migration adds fields for Shape and Polished, Origin, Item Serial, Country of Origin,
-- Certification number, Size (mm), Color, Clarity, Weight (CT), PCS, Cut Grade, Treatment

-- Add new columns to centerstones table
ALTER TABLE centerstones
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
ADD COLUMN IF NOT EXISTS treatment TEXT;

-- Make name nullable (product name will default to product code if null)
ALTER TABLE centerstones
ALTER COLUMN name DROP NOT NULL;

-- Ensure SKU is unique (should already be unique, but ensure it)
-- Note: The original migration already has sku TEXT UNIQUE, so this is just a safety check
-- If the unique constraint doesn't exist, we'll add it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'centerstones_sku_key' 
        AND conrelid = 'centerstones'::regclass
    ) THEN
        ALTER TABLE centerstones ADD CONSTRAINT centerstones_sku_key UNIQUE (sku);
    END IF;
END $$;

-- Add comments for documentation
COMMENT ON COLUMN centerstones.shape_and_polished IS 'Shape and Polished (text)';
COMMENT ON COLUMN centerstones.origin IS 'Origin (text)';
COMMENT ON COLUMN centerstones.item_serial IS 'Item Serial (text)';
COMMENT ON COLUMN centerstones.country_of_origin IS 'Country of Origin (text)';
COMMENT ON COLUMN centerstones.certification_number IS 'Certification number (text)';
COMMENT ON COLUMN centerstones.size_mm IS 'Size (mm) - decimal number';
COMMENT ON COLUMN centerstones.color IS 'Color (text)';
COMMENT ON COLUMN centerstones.clarity IS 'Clarity (text)';
COMMENT ON COLUMN centerstones.weight_ct IS 'Weight (CT) - decimal number';
COMMENT ON COLUMN centerstones.pcs IS 'PCS (number)';
COMMENT ON COLUMN centerstones.cut_grade IS 'Cut Grade (text)';
COMMENT ON COLUMN centerstones.treatment IS 'Treatment (text)';

