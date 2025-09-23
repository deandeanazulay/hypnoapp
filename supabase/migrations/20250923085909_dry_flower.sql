/*
  # Fix Missing INSERT Policy for User Profiles

  1. Security
    - Add missing INSERT policy for `user_profiles` table
    - Allow authenticated users to insert their own profile data
    - This fixes the "Database error saving new user" during signup

  The issue was that RLS was enabled on `user_profiles` but there was no policy
  allowing users to INSERT their own profile data during account creation.
*/

-- Add missing INSERT policy for user_profiles table
CREATE POLICY "Users can insert own profile"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);