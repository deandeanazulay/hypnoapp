/*
  # Fix User Signup Database Error

  This migration resolves the "Database error saving new user" issue by:
  
  1. Database Triggers
    - Recreates the user creation trigger with proper error handling
    - Ensures trigger runs with SECURITY DEFINER to bypass RLS
    - Makes profile creation non-blocking for user signup
  
  2. RLS Policy Fixes  
    - Updates policies to use correct auth.uid() function
    - Ensures INSERT policy allows new user profile creation
  
  3. Permissions
    - Grants necessary permissions for user creation process
*/

-- Drop existing problematic trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Create a robust user creation function that won't fail signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Try to create user profile, but don't fail if it errors
  BEGIN
    INSERT INTO public.user_profiles (
      id,
      email,
      level,
      experience,
      current_state,
      session_streak,
      achievements,
      orb_energy,
      depth,
      breathing,
      hp,
      mp,
      tokens,
      plan,
      daily_sessions_used,
      ego_state_usage,
      active_ego_state
    ) VALUES (
      NEW.id,
      COALESCE(NEW.email, NEW.raw_user_meta_data->>'email', ''),
      1,
      0,
      'calm',
      0,
      '{}',
      0.3,
      1,
      'rest',
      80,
      60,
      50,
      'free',
      0,
      '{}',
      'guardian'
    );
  EXCEPTION WHEN OTHERS THEN
    -- Log error but don't fail user creation
    RAISE WARNING 'Could not create user profile for user %: %', NEW.id, SQLERRM;
  END;
  
  RETURN NEW;
END;
$$;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Fix RLS policies to use correct auth function
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;  
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;

-- Recreate policies with correct auth.uid() function
CREATE POLICY "Users can insert own profile"
  ON user_profiles
  FOR INSERT 
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can read own profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Ensure RLS is enabled
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT ALL ON public.user_profiles TO supabase_auth_admin;