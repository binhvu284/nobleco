-- Add signup_data column to otps table to store signup information before account creation
ALTER TABLE public.otps 
ADD COLUMN IF NOT EXISTS signup_data jsonb;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_otps_signup_data ON public.otps(signup_data) WHERE signup_data IS NOT NULL;

