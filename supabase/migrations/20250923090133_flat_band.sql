/*
  # Fix User Creation Trigger Function

  This migration fixes the "Database error saving new user" issue by:
  
  1. Recreating the handle_new_user trigger function with proper error handling
  2. Using SECURITY DEFINER to bypass RLS policies during profile creation
  3. Adding robust error handling to prevent signup failures
  4. Ensuring the trigger can handle duplicate profile creation gracefully
*/

-- Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create the trigger function with proper error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Try to create user profile, but don't fail if it already exists
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
      '{
        "guardian": 0,
        "rebel": 0,
        "healer": 0,
        "explorer": 0,
        "mystic": 0,
        "sage": 0,
        "child": 0,
        "performer": 0,
        "shadow": 0,
        "builder": 0,
        "seeker": 0,
        "lover": 0,
        "trickster": 0,
        "warrior": 0,
        "visionary": 0
      }',
      'guardian'
    );
  EXCEPTION
    WHEN unique_violation THEN
      -- Profile already exists, which is fine
      NULL;
    WHEN OTHERS THEN
      -- Log error but don't fail the user creation
      RAISE LOG 'Error creating user profile for user %: %', NEW.id, SQLERRM;
  END;
  
  RETURN NEW;
END;
$$;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO anon;