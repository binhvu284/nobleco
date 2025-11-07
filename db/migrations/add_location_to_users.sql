-- ============================================
-- ADD LOCATION COLUMN TO USERS TABLE
-- This column stores the user's country/location
-- ============================================

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS location VARCHAR(255);

-- Comment
COMMENT ON COLUMN public.users.location IS 'User''s geographical location (country)';

