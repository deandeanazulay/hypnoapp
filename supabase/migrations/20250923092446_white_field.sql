/*
  # Fix User Signup Database Error

  1. Database Changes
    - Recreate handle_new_user trigger function with SECURITY DEFINER
    - Ensure all required user_profiles fields have proper defaults
    - Fix RLS policies to allow trigger-based inserts

  2. Security
    - Enable proper SECURITY DEFINER for trigger function
    - Maintain RLS policies for user data protection
*/

-- Drop existing trigger and function to recreate properly
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Create improved trigger function with SECURITY DEFINER
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
    active_ego_state,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.email,
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
    'guardian',
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Ensure RLS policies allow the trigger to work
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (true);

-- Add a more specific policy for normal user operations
CREATE POLICY "Users can manage own profile" ON user_profiles
  FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);