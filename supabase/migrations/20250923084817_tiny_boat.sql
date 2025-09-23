/*
  # Fix User Profile Creation During Signup

  This migration fixes the "Database error saving new user" issue by:
  1. Ensuring proper RLS policies for user profile creation
  2. Creating a secure trigger function for automatic profile creation
  3. Adding the necessary trigger on auth.users
*/

-- Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create the trigger function with SECURITY DEFINER to bypass RLS
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
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
    active_ego_state
  )
  VALUES (
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
    'guardian'
  );
  RETURN NEW;
END;
$$;

-- Create the trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Ensure user_profiles table exists with proper structure
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  level integer DEFAULT 1 NOT NULL,
  experience integer DEFAULT 0 NOT NULL,
  current_state text DEFAULT 'calm' NOT NULL,
  session_streak integer DEFAULT 0 NOT NULL,
  last_session_time timestamp with time zone,
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
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;

-- Create RLS policies that allow proper access
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

-- Note: No INSERT policy needed since the trigger function runs as SECURITY DEFINER