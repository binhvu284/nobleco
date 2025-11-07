-- Create OTP table for phone verification
CREATE TABLE IF NOT EXISTS public.otps (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  phone text NOT NULL,
  code text NOT NULL,
  purpose text NOT NULL CHECK (purpose = ANY (ARRAY['signup'::text, 'password_reset'::text])),
  user_id bigint,
  expires_at timestamp with time zone NOT NULL,
  verified boolean DEFAULT false,
  attempts integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT otps_pkey PRIMARY KEY (id),
  CONSTRAINT otps_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_otps_phone_purpose ON public.otps(phone, purpose, verified);
CREATE INDEX IF NOT EXISTS idx_otps_expires_at ON public.otps(expires_at);

-- Add phone_verified column to users table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'phone_verified'
  ) THEN
    ALTER TABLE public.users ADD COLUMN phone_verified boolean DEFAULT false;
  END IF;
END $$;

