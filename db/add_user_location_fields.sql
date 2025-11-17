-- Add country and state columns to users table for two-level location
-- This migration adds country and state/province/city fields similar to orders

-- Add country column
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS country text;

-- Add state/province/city column
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS state text;

-- Migrate existing location data to country if it exists
-- This assumes the old location field contains country names
-- You may need to adjust this based on your existing data
UPDATE public.users 
SET country = location 
WHERE location IS NOT NULL AND country IS NULL;

-- Note: The old 'location' column is kept for backward compatibility
-- You can drop it later if needed with: ALTER TABLE public.users DROP COLUMN location;

