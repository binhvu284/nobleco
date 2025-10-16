-- Complete database setup and fixes for Nobleco
-- Run this in Supabase SQL Editor

-- Fix foreign key constraint error by handling existing bigint id column
-- Drop users_info table if it exists (to recreate with correct types)
DROP TABLE IF EXISTS public.users_info CASCADE;

-- Add missing columns to existing users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS points integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS level text DEFAULT 'guest' CHECK (level IN ('guest','member','unit manager','brand manager')),
ADD COLUMN IF NOT EXISTS status text DEFAULT 'active' CHECK (status IN ('active','inactive')),
ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now(),
ADD COLUMN IF NOT EXISTS refer_code text unique default upper(substring(md5(random()::text) from 1 for 6)),
ADD COLUMN IF NOT EXISTS commission integer not null default 0;

-- Fix status column constraint (remove old 'disable' and ensure only 'active'/'inactive')
ALTER TABLE public.users 
DROP CONSTRAINT IF EXISTS users_status_check;

ALTER TABLE public.users 
ADD CONSTRAINT users_status_check CHECK (status IN ('active', 'inactive'));

-- Update any existing 'disable' values to 'inactive'
UPDATE public.users 
SET status = 'inactive' 
WHERE status = 'disable';

-- Fix account levels constraint (ensure correct 4 levels)
ALTER TABLE public.users 
DROP CONSTRAINT IF EXISTS users_level_check;

ALTER TABLE public.users 
ADD CONSTRAINT users_level_check CHECK (level IN ('guest', 'member', 'unit manager', 'brand manager'));

-- Update any existing incorrect level values to the correct ones
UPDATE public.users 
SET level = CASE 
    WHEN level = 'bronze' THEN 'guest'
    WHEN level = 'silver' THEN 'member'
    WHEN level = 'gold' THEN 'unit manager'
    WHEN level = 'platinum' THEN 'brand manager'
    WHEN level = 'unit' THEN 'unit manager'
    WHEN level = 'brand' THEN 'brand manager'
    ELSE level
END
WHERE level IN ('bronze', 'silver', 'gold', 'platinum', 'unit', 'brand');

-- Set any invalid levels to 'guest' as default
UPDATE public.users 
SET level = 'guest'
WHERE level NOT IN ('guest', 'member', 'unit manager', 'brand manager');

-- Remove the redundant account_level column (since we have the level column)
ALTER TABLE public.users 
DROP COLUMN IF EXISTS account_level;

-- Rename username column to name
ALTER TABLE public.users 
RENAME COLUMN username TO name;

-- Create users_info table with bigint user_id to match existing users.id
-- Purpose: users_info stores changeable data (phone, address)
-- users table stores unchangeable data (name, email, etc.)
CREATE TABLE public.users_info (
  id uuid primary key default gen_random_uuid(),
  user_id bigint not null references public.users(id) on delete cascade,
  name text not null,
  phone text,
  address text
);

-- Create indexes
CREATE INDEX users_info_user_id_idx ON public.users_info (user_id);
CREATE UNIQUE INDEX users_info_user_id_unique_idx ON public.users_info (user_id);
CREATE INDEX IF NOT EXISTS users_refer_code_idx ON public.users (refer_code);

-- Update existing users to have proper created_at timestamps
UPDATE public.users 
SET created_at = now() - (random() * interval '30 days')
WHERE created_at IS NULL;

-- Insert 10 sample users with all the new fields
INSERT INTO public.users (email, name, password, role, points, level, status, refer_code, commission) VALUES
('john.doe@example.com', 'johndoe', '$2a$10$example_hash_here', 'user', 1500, 'member', 'active', 'ABC123', 50),
('jane.smith@example.com', 'janesmith', '$2a$10$example_hash_here', 'user', 850, 'guest', 'active', 'DEF456', 0),
('mike.wilson@example.com', 'mikewilson', '$2a$10$example_hash_here', 'user', 320, 'guest', 'active', 'GHI789', 0),
('sarah.johnson@example.com', 'sarahj', '$2a$10$example_hash_here', 'user', 2800, 'unit manager', 'active', 'JKL012', 150),
('david.brown@example.com', 'davidb', '$2a$10$example_hash_here', 'user', 1200, 'member', 'inactive', 'MNO345', 75),
('lisa.garcia@example.com', 'lisag', '$2a$10$example_hash_here', 'user', 650, 'guest', 'active', 'PQR678', 0),
('robert.miller@example.com', 'robertm', '$2a$10$example_hash_here', 'user', 180, 'guest', 'inactive', 'STU901', 0),
('emma.davis@example.com', 'emmad', '$2a$10$example_hash_here', 'user', 1350, 'member', 'active', 'VWX234', 100),
('james.rodriguez@example.com', 'jamesr', '$2a$10$example_hash_here', 'user', 720, 'brand manager', 'active', 'YZA567', 200),
('olivia.martinez@example.com', 'oliviam', '$2a$10$example_hash_here', 'user', 250, 'guest', 'active', 'BCD890', 0);

-- Insert sample users_info data
INSERT INTO public.users_info (user_id, name, phone, address) 
SELECT u.id, u.name, 
  CASE 
    WHEN u.name = 'johndoe' THEN '+1-555-0101'
    WHEN u.name = 'janesmith' THEN '+1-555-0102'
    WHEN u.name = 'mikewilson' THEN '+1-555-0103'
    WHEN u.name = 'sarahj' THEN '+1-555-0104'
    WHEN u.name = 'davidb' THEN '+1-555-0105'
    WHEN u.name = 'lisag' THEN '+1-555-0106'
    WHEN u.name = 'robertm' THEN '+1-555-0107'
    WHEN u.name = 'emmad' THEN '+1-555-0108'
    WHEN u.name = 'jamesr' THEN '+1-555-0109'
    WHEN u.name = 'oliviam' THEN '+1-555-0110'
    ELSE NULL
  END,
  CASE 
    WHEN u.name = 'johndoe' THEN '123 Main St, New York, NY 10001'
    WHEN u.name = 'janesmith' THEN '456 Oak Ave, Los Angeles, CA 90210'
    WHEN u.name = 'mikewilson' THEN '789 Pine Rd, Chicago, IL 60601'
    WHEN u.name = 'sarahj' THEN '321 Elm St, Houston, TX 77001'
    WHEN u.name = 'davidb' THEN '654 Maple Dr, Phoenix, AZ 85001'
    WHEN u.name = 'lisag' THEN '987 Cedar Ln, Philadelphia, PA 19101'
    WHEN u.name = 'robertm' THEN '147 Birch St, San Antonio, TX 78201'
    WHEN u.name = 'emmad' THEN '258 Willow Ave, San Diego, CA 92101'
    WHEN u.name = 'jamesr' THEN '369 Spruce Rd, Dallas, TX 75201'
    WHEN u.name = 'oliviam' THEN '741 Poplar Dr, San Jose, CA 95101'
    ELSE NULL
  END
FROM public.users u;

-- Verify the data
SELECT id, email, name, role, points, level, status, refer_code, commission, created_at 
FROM public.users 
ORDER BY created_at DESC;

-- Show level distribution
SELECT level, COUNT(*) as count
FROM public.users 
GROUP BY level
ORDER BY level;

-- Show status distribution  
SELECT status, COUNT(*) as count
FROM public.users 
GROUP BY status
ORDER BY status;

-- Verify users_info data
SELECT ui.id, ui.user_id, ui.name, ui.phone, ui.address
FROM public.users_info ui
JOIN public.users u ON ui.user_id = u.id
ORDER BY ui.id DESC;

-- ========================================
-- TEST ACCOUNTS FOR LOGIN
-- ========================================
-- Insert test admin and user accounts for testing login functionality
-- Password for all accounts: "password123"
-- Bcrypt hash generated with salt rounds 10

-- First, ensure the sequence exists and is set correctly
DO $$
BEGIN
  -- Create sequence if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_sequences WHERE schemaname = 'public' AND sequencename = 'users_id_seq') THEN
    CREATE SEQUENCE public.users_id_seq;
  END IF;
  
  -- Set the id column to use the sequence as default
  ALTER TABLE public.users ALTER COLUMN id SET DEFAULT nextval('users_id_seq'::regclass);
  
  -- Sync the sequence with the current max id
  PERFORM setval('users_id_seq', COALESCE((SELECT MAX(id) FROM public.users), 0) + 1, false);
END $$;

-- Now insert test accounts (id will auto-increment)
INSERT INTO public.users (email, name, password, role, points, level, status, refer_code, commission)
VALUES 
  -- Test Admin Account
  ('admin@nobleco.com', 'admin', '$2a$10$rHj6K9P9Yv1lQ8B5pBH8QuEZLYYXxXQPZ.CvVPf3KM5Gf5PfY5LWW', 'admin', 5000, 'brand manager', 'active', 'ADMIN1', 500),
  -- Test User Account
  ('user@nobleco.com', 'testuser', '$2a$10$rHj6K9P9Yv1lQ8B5pBH8QuEZLYYXxXQPZ.CvVPf3KM5Gf5PfY5LWW', 'user', 1200, 'member', 'active', 'USER01', 100)
ON CONFLICT (email) DO NOTHING;

-- Display test accounts
SELECT '========== TEST ACCOUNTS ==========' as info;
SELECT id, email, name, role, points, level, status 
FROM public.users 
WHERE email IN ('admin@nobleco.com', 'user@nobleco.com');