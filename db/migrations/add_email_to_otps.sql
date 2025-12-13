-- Add email column to otps table to support email OTP
-- Make phone nullable since we can use either phone or email

-- First, add email column
ALTER TABLE otps
ADD COLUMN IF NOT EXISTS email TEXT;

-- Make phone column nullable (drop NOT NULL constraint if it exists)
ALTER TABLE otps
ALTER COLUMN phone DROP NOT NULL;

-- Create index for email lookups
CREATE INDEX IF NOT EXISTS otps_email_idx ON otps(email);

-- Add comments
COMMENT ON COLUMN otps.email IS 'Email address for email-based OTP (nullable if using phone)';
COMMENT ON COLUMN otps.phone IS 'Phone number for phone-based OTP (nullable if using email)';

-- The application logic will ensure either phone or email is provided, but not both

