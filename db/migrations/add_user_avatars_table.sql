-- ============================================
-- USER AVATARS TABLE
-- SQL script to create the user_avatars table
-- Run this in Supabase SQL Editor
-- ============================================

-- ============================================
-- CREATE USER_AVATARS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_avatars (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  
  -- Foreign key to users table
  user_id bigint NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Storage information
  storage_path text NOT NULL,  -- Path in Supabase Storage (e.g., "123/avatar-uuid.jpg")
  url text NOT NULL,            -- Full CDN URL from Supabase Storage
  
  -- Image metadata
  file_size integer,             -- File size in bytes
  width integer,                 -- Image width in pixels
  height integer,                -- Image height in pixels
  mime_type text,                -- MIME type (e.g., "image/jpeg", "image/png")
  
  -- Timestamps
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  
  -- Ensure only one avatar per user
  CONSTRAINT user_avatars_user_id_unique UNIQUE (user_id)
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_user_avatars_user_id ON public.user_avatars(user_id);

-- ============================================
-- UPDATED_AT TRIGGER
-- ============================================
-- Apply updated_at trigger to user_avatars
DROP TRIGGER IF EXISTS update_user_avatars_updated_at ON public.user_avatars;
CREATE TRIGGER update_user_avatars_updated_at 
BEFORE UPDATE ON public.user_avatars
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE public.user_avatars IS 'Stores user avatar images with references to Supabase Storage';
COMMENT ON COLUMN public.user_avatars.user_id IS 'Foreign key to users table - one avatar per user';
COMMENT ON COLUMN public.user_avatars.storage_path IS 'Path in Supabase Storage bucket';
COMMENT ON COLUMN public.user_avatars.url IS 'Public CDN URL for the avatar image';

