-- Fix Supabase Auth token fields to prevent "Database error querying schema"
-- This addresses the issue described in: https://github.com/supabase/auth/issues/1940

BEGIN;

-- Set default values for token fields to empty strings instead of NULL
-- This prevents the "converting NULL to string is unsupported" error

ALTER TABLE auth.users 
  ALTER COLUMN confirmation_token SET DEFAULT '';

ALTER TABLE auth.users 
  ALTER COLUMN recovery_token SET DEFAULT '';

ALTER TABLE auth.users 
  ALTER COLUMN email_change_token_new SET DEFAULT '';

ALTER TABLE auth.users 
  ALTER COLUMN email_change_token_current SET DEFAULT '';

ALTER TABLE auth.users 
  ALTER COLUMN email_change SET DEFAULT '';

-- Also make these columns nullable if they aren't already
ALTER TABLE auth.users 
  ALTER COLUMN confirmation_token DROP NOT NULL;

ALTER TABLE auth.users 
  ALTER COLUMN recovery_token DROP NOT NULL;

ALTER TABLE auth.users 
  ALTER COLUMN email_change_token_new DROP NOT NULL;

ALTER TABLE auth.users 
  ALTER COLUMN email_change_token_current DROP NOT NULL;

ALTER TABLE auth.users 
  ALTER COLUMN email_change_sent_at DROP NOT NULL;

ALTER TABLE auth.users 
  ALTER COLUMN email_change DROP NOT NULL;

-- Update existing NULL values to empty strings
UPDATE auth.users 
SET 
  confirmation_token = COALESCE(confirmation_token, ''),
  recovery_token = COALESCE(recovery_token, ''),
  email_change_token_new = COALESCE(email_change_token_new, ''),
  email_change_token_current = COALESCE(email_change_token_current, ''),
  email_change = COALESCE(email_change, '')
WHERE 
  confirmation_token IS NULL 
  OR recovery_token IS NULL 
  OR email_change_token_new IS NULL 
  OR email_change_token_current IS NULL 
  OR email_change IS NULL;

COMMIT;

-- Verify the fix
SELECT 
  COUNT(*) as total_users,
  COUNT(CASE WHEN confirmation_token IS NULL THEN 1 END) as null_confirmation_tokens,
  COUNT(CASE WHEN recovery_token IS NULL THEN 1 END) as null_recovery_tokens,
  COUNT(CASE WHEN email_change_token_new IS NULL THEN 1 END) as null_email_change_tokens
FROM auth.users;