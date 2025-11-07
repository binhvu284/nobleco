-- Remove unique constraint from users.name column
-- Multiple users can have the same name, so this constraint is incorrect

-- First, check if the constraint exists and drop it
DO $$ 
BEGIN
  -- Drop the unique constraint on name if it exists
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'users_name_key' 
    AND conrelid = 'users'::regclass
  ) THEN
    ALTER TABLE public.users DROP CONSTRAINT users_name_key;
  END IF;
END $$;

-- Verify the constraint is removed
-- The name column should still exist but without the unique constraint

