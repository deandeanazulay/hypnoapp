/*
  # Fix User Profile Insert Policy and Email Handling

  1. Security Fix
    - Fix RLS policy to use correct `auth.uid()` function instead of `uid()`
  
  2. Email Field Fix  
    - Make email field nullable to prevent insert failures when email is not available
    - This prevents "Database error saving new user" during signup
*/

-- Fix the INSERT policy to use correct auth.uid() function
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;

CREATE POLICY "Users can insert own profile"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Make email nullable to prevent insert failures
ALTER TABLE user_profiles 
ALTER COLUMN email DROP NOT NULL;

-- Update other RLS policies to use auth.uid() for consistency
DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;
CREATE POLICY "Users can read own profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);