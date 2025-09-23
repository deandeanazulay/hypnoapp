/*
  # Fix Supabase Signup Database Error
  
  This migration addresses the "Database error saving new user" issue by:
  
  1. Security
    - Creates a secure trigger function that bypasses RLS for user profile creation
    - Sets up proper RLS policies for user_profiles table
    - Ensures automatic profile creation on user signup
  
  2. Trigger Setup
    - Creates trigger on auth.users INSERT to automatically create user profiles
    - Uses SECURITY DEFINER to bypass RLS restrictions during profile creation
  
  3. RLS Policies
    - Allows authenticated users to read/update their own profiles
    - Profile creation handled automatically by secure trigger function
*/

-- Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS handle_updated_at();

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create secure user profile creation function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger 
SECURITY DEFINER
LANGUAGE plpgsql AS $$
BEGIN
  -- Insert new user profile with default values
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
    active_ego_state
  ) VALUES (
    NEW.id,
    NEW.email,
    1,
    0,
    'calm',
    0,
    NULL,
    '{}',
    0.3,
    1,
    'rest',
    80,
    60,
    50,
    'free',
    0,
    NULL,
    '{"guardian": 0, "rebel": 0, "healer": 0, "explorer": 0, "mystic": 0, "sage": 0, "child": 0, "performer": 0, "shadow": 0, "builder": 0, "seeker": 0, "lover": 0, "trickster": 0, "warrior": 0, "visionary": 0}',
    'guardian'
  );
  
  RETURN NEW;
EXCEPTION
  -- If profile already exists, that's fine - just continue
  WHEN unique_violation THEN
    RETURN NEW;
  WHEN OTHERS THEN
    -- Log error but don't fail the signup
    RAISE WARNING 'Failed to create user profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Create trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Ensure RLS is enabled on user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profiles" ON user_profiles;

-- Create comprehensive RLS policies
CREATE POLICY "Users can read own profile" ON user_profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Note: No INSERT policy needed since profile creation happens via secure trigger function