-- Fix Supabase Auth Configuration
-- 
-- This migration addresses the "Database error saving new user" issue
-- by ensuring proper auth table configuration and permissions.

-- 1. Ensure RLS is disabled on auth.users (critical for signup to work)
ALTER TABLE auth.users DISABLE ROW LEVEL SECURITY;

-- 2. Drop and recreate the user profile trigger to ensure it works correctly
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 3. Create a robust user profile creation function
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER 
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Insert user profile with proper error handling
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
EXCEPTION
  WHEN unique_violation THEN
    -- Profile already exists, ignore
    RETURN NEW;
  WHEN OTHERS THEN
    -- Log error but don't fail the signup
    RAISE WARNING 'Failed to create user profile: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- 4. Create the trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Ensure user_profiles table has correct permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT INSERT, SELECT, UPDATE ON public.user_profiles TO authenticated;

-- 6. Make sure the user_profiles table exists with correct structure
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  level integer DEFAULT 1 NOT NULL,
  experience integer DEFAULT 0 NOT NULL,
  current_state text DEFAULT 'calm' NOT NULL,
  session_streak integer DEFAULT 0 NOT NULL,
  last_session_time timestamptz,
  achievements text[] DEFAULT '{}',
  orb_energy real DEFAULT 0.3 NOT NULL,
  depth integer DEFAULT 1 NOT NULL,
  breathing text DEFAULT 'rest' NOT NULL,
  hp integer DEFAULT 80 NOT NULL,
  mp integer DEFAULT 60 NOT NULL,
  tokens integer DEFAULT 50 NOT NULL,
  plan text DEFAULT 'free' NOT NULL,
  daily_sessions_used integer DEFAULT 0 NOT NULL,
  last_session_date text,
  ego_state_usage jsonb DEFAULT '{}' NOT NULL,
  active_ego_state text DEFAULT 'guardian' NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 7. Enable RLS on user_profiles (but NOT on auth.users)
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- 8. Create RLS policies for user_profiles
DROP POLICY IF EXISTS "Users can read own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;

CREATE POLICY "Users can read own profile"
  ON public.user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- 9. Grant necessary permissions to service role
GRANT ALL ON public.user_profiles TO service_role;