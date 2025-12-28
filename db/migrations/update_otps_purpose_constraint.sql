-- Update otps_purpose_check constraint to allow email_change and phone_change
-- This migration drops the old constraint and creates a new one with additional allowed values

-- Step 1: Drop the existing constraint (it might have a different name)
ALTER TABLE otps DROP CONSTRAINT IF EXISTS otps_purpose_check;
ALTER TABLE otps DROP CONSTRAINT IF EXISTS otps_purpose_chk;
ALTER TABLE otps DROP CONSTRAINT IF EXISTS check_purpose;

-- Step 2: Create the new constraint with all allowed purpose values
ALTER TABLE otps ADD CONSTRAINT otps_purpose_check 
  CHECK (purpose IN ('signup', 'password_reset', 'email_change', 'phone_change'));

-- Step 3: Add comment
COMMENT ON COLUMN otps.purpose IS 'Purpose of OTP: signup, password_reset, email_change, or phone_change';

