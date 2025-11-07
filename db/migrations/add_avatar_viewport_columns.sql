-- ============================================
-- ADD VIEWPORT COLUMNS TO USER_AVATARS TABLE
-- These columns store the viewport coordinates for circular avatar display
-- ============================================

ALTER TABLE public.user_avatars
ADD COLUMN IF NOT EXISTS viewport_x numeric,
ADD COLUMN IF NOT EXISTS viewport_y numeric,
ADD COLUMN IF NOT EXISTS viewport_size numeric;

-- Comments
COMMENT ON COLUMN public.user_avatars.viewport_x IS 'X coordinate of viewport center (relative to original image width, 0-1)';
COMMENT ON COLUMN public.user_avatars.viewport_y IS 'Y coordinate of viewport center (relative to original image height, 0-1)';
COMMENT ON COLUMN public.user_avatars.viewport_size IS 'Size of viewport (relative to larger dimension, 0-1)';

