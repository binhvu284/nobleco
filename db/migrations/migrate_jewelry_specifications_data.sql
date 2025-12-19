-- Migrate existing jewelry specification data from individual columns to jewelry_specifications column
-- Format: Field name: value (one per line)
-- Only includes fields that have non-null values

UPDATE products
SET jewelry_specifications = TRIM(
    CONCAT_WS(E'\n',
        CASE WHEN center_stone_size_mm IS NOT NULL 
            THEN 'Center Stone Size: ' || center_stone_size_mm::text || ' mm'
            ELSE NULL 
        END,
        CASE WHEN ni_tay IS NOT NULL 
            THEN 'Ni tay: ' || ni_tay::text
            ELSE NULL 
        END,
        CASE WHEN shape IS NOT NULL AND shape != '' 
            THEN 'Shape: ' || shape
            ELSE NULL 
        END,
        CASE WHEN dimensions IS NOT NULL AND dimensions != '' 
            THEN 'Dimensions: ' || dimensions
            ELSE NULL 
        END,
        CASE WHEN stone_count IS NOT NULL 
            THEN 'Stone Count: ' || stone_count::text
            ELSE NULL 
        END,
        CASE WHEN carat_weight_ct IS NOT NULL 
            THEN 'Carat Weight: ' || carat_weight_ct::text || ' ct'
            ELSE NULL 
        END,
        CASE WHEN gold_purity IS NOT NULL AND gold_purity != '' 
            THEN 'Gold Purity: ' || gold_purity
            ELSE NULL 
        END,
        CASE WHEN product_weight_g IS NOT NULL 
            THEN 'Product Weight: ' || product_weight_g::text || ' g'
            ELSE NULL 
        END,
        CASE WHEN type IS NOT NULL AND type != '' 
            THEN 'Type: ' || type
            ELSE NULL 
        END
    )
)
WHERE (
    center_stone_size_mm IS NOT NULL OR
    ni_tay IS NOT NULL OR
    (shape IS NOT NULL AND shape != '') OR
    (dimensions IS NOT NULL AND dimensions != '') OR
    stone_count IS NOT NULL OR
    carat_weight_ct IS NOT NULL OR
    (gold_purity IS NOT NULL AND gold_purity != '') OR
    product_weight_g IS NOT NULL OR
    (type IS NOT NULL AND type != '')
)
AND (jewelry_specifications IS NULL OR jewelry_specifications = '');

-- Note: This migration only updates products that:
-- 1. Have at least one non-null value in the old columns
-- 2. Don't already have a value in jewelry_specifications (to avoid overwriting manually entered data)
-- 
-- CONCAT_WS concatenates non-null values with newline separator
-- TRIM removes any leading/trailing whitespace

