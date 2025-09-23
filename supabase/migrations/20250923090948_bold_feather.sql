/*
  # Fix User Creation Trigger Function

  This migration fixes the "Database error saving new user" issue by:

  1. Database Triggers
     - Recreates the handle_new_user() function with proper error handling
     - Uses SECURITY DEFINER to bypass RLS during profile creation
     - Adds comprehensive error catching to prevent signup failures

  2. RLS Policy Updates
     - Ensures INSERT policy on user_profiles allows new user creation
     - Uses correct auth.uid() function syntax

  3. Trigger Management
     - Properly manages the auth trigger for new user creation
*/

-- Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Create improved user creation function with better error handling
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Insert user profile with proper error handling
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
      -- Profile already exists, update it instead
      UPDATE public.user_profiles 
      SET 
        email = COALESCE(NEW.email, NEW.raw_user_meta_data->>'email', email),
        updated_at = NOW()
      WHERE id = NEW.id;
    WHEN OTHERS THEN
      -- Log error but don't fail user creation
      RAISE WARNING 'Failed to create user profile for %: %', NEW.id, SQLERRM;
  END;
  
  RETURN NEW;
END;
$$;

-- Create trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Ensure user_profiles INSERT policy allows new user creation
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
CREATE POLICY "Users can insert own profile"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Update other policies to use correct auth.uid() function
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

-- Grant necessary permissions to auth admin
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT ALL ON public.user_profiles TO supabase_auth_admin;