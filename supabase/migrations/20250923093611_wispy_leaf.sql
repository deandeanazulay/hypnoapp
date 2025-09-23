/*
  # Fix User Creation Database Error

  1. Database Changes
    - Drop and recreate trigger function with proper error handling
    - Ensure trigger runs with SECURITY DEFINER to bypass RLS
    - Add comprehensive error logging
    - Set all required fields with proper defaults

  2. Security
    - Maintain RLS on user_profiles table  
    - Ensure trigger can create profiles for new auth users
    - Keep existing policies intact
*/

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS handle_new_user ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Create improved trigger function with better error handling
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Insert user profile with all required fields
  INSERT INTO public.user_profiles (
    id,
    email,
    level,
    experience,
    current_state,
    session_streak,
    last_session_time,
    achievements,
    orb_energy,
    depth,
    breathing,
    hp,
    mp,
    tokens,
    plan,
    daily_sessions_used,
    last_session_date,
    ego_state_usage,
    active_ego_state,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.email,
    1,                          -- level
    0,                          -- experience
    'calm',                     -- current_state
    0,                          -- session_streak
    NULL,                       -- last_session_time
    '{}',                       -- achievements (empty array)
    0.3,                        -- orb_energy
    1,                          -- depth
    'rest',                     -- breathing
    80,                         -- hp
    60,                         -- mp
    50,                         -- tokens
    'free',                     -- plan
    0,                          -- daily_sessions_used
    NULL,                       -- last_session_date
    '{}',                       -- ego_state_usage (empty jsonb)
    'guardian',                 -- active_ego_state
    NOW(),                      -- created_at
    NOW()                       -- updated_at
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error for debugging
    RAISE LOG 'Error creating user profile for user %: %', NEW.id, SQLERRM;
    -- Re-raise the exception to prevent user creation if profile creation fails
    RAISE;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER handle_new_user
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Ensure the trigger function owner has proper permissions
GRANT EXECUTE ON FUNCTION handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION handle_new_user() TO supabase_auth_admin;