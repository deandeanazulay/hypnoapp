/*
# Fix RLS Policy Auth Function Reference

1. Problem
   - The user_profiles INSERT policy may be using `uid()` instead of `auth.uid()`
   - This can cause authentication failures during user profile creation

2. Solution
   - Drop and recreate the INSERT policy with correct `auth.uid()` function
   - Ensure the policy properly authenticates new user profile creation
*/

-- Drop the existing INSERT policy
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;

-- Recreate with correct auth function reference
CREATE POLICY "Users can insert own profile"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);