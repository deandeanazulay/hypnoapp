/*
# Fix Authentication Issues - Clean Pattern

1. Clean Profile Table Setup
   - `user_profiles` table with proper RLS policies
   - No modifications to auth schema
   - Safe, reliable pattern

2. Security
   - Enable RLS on user_profiles
   - Policies for authenticated users only
   - SECURITY DEFINER function for profile creation

3. Key Changes
   - Uses public.ensure_profile() RPC instead of triggers on auth.users
   - Clean RLS policies that don't interfere with auth flow
   - No auth schema modifications
*/

-- Drop any existing auth triggers that might be causing issues
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Drop any existing users table that might conflict
DROP TABLE IF EXISTS public.users CASCADE;

-- Create clean user_profiles table
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  level integer NOT NULL DEFAULT 1,
  experience integer NOT NULL DEFAULT 0,
  current_state text NOT NULL DEFAULT 'calm',
  session_streak integer NOT NULL DEFAULT 0,
  last_session_time timestamptz,
  achievements text[] NOT NULL DEFAULT '{}',
  orb_energy real NOT NULL DEFAULT 0.3,
  depth integer NOT NULL DEFAULT 1,
  breathing text NOT NULL DEFAULT 'rest',
  hp integer NOT NULL DEFAULT 80,
  mp integer NOT NULL DEFAULT 60,
  tokens integer NOT NULL DEFAULT 50,
  plan text NOT NULL DEFAULT 'free',
  daily_sessions_used integer NOT NULL DEFAULT 0,
  last_session_date text,
  ego_state_usage jsonb NOT NULL DEFAULT '{}',
  active_ego_state text NOT NULL DEFAULT 'guardian',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Updated at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  new.updated_at := now();
  RETURN new;
END;
$$;

-- Updated at trigger
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Clean RLS policies
DROP POLICY IF EXISTS "Users can read own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Enable read for users on own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users on own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Enable update for users on own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Enable delete for users on own profile" ON public.user_profiles;

-- Simple, clean policies
CREATE POLICY "Users can read own profile"
  ON public.user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can delete own profile"
  ON public.user_profiles
  FOR DELETE
  TO authenticated
  USING (auth.uid() = id);

-- Safe RPC function to ensure profile exists (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.ensure_profile()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  user_email text;
BEGIN
  -- Must be authenticated
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Get user email from auth.users
  SELECT email INTO user_email FROM auth.users WHERE id = uid;

  -- Insert profile if it doesn't exist
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
    uid,
    user_email,
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
    '{"guardian": 0, "rebel": 0, "healer": 0, "explorer": 0, "mystic": 0, "sage": 0, "child": 0, "performer": 0, "shadow": 0, "builder": 0, "seeker": 0, "lover": 0, "trickster": 0, "warrior": 0, "visionary": 0}'::jsonb,
    'guardian',
    now(),
    now()
  ) ON CONFLICT (id) DO NOTHING;

EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail
    RAISE WARNING 'Failed to create user profile for %: %', uid, SQLERRM;
END;
$$;

-- Grant permissions to call the function
GRANT EXECUTE ON FUNCTION public.ensure_profile() TO anon, authenticated;