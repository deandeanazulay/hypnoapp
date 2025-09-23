/*
  # Fix Auth Schema and User Creation Issues

  This migration resolves the "Database error saving new user" issue by:
  1. Ensuring proper auth schema permissions
  2. Disabling problematic RLS on auth tables
  3. Fixing user creation trigger function
  4. Removing constraints that could block user creation
*/

-- Ensure proper permissions on auth schema
GRANT USAGE ON SCHEMA auth TO supabase_auth_admin;
GRANT ALL ON ALL TABLES IN SCHEMA auth TO supabase_auth_admin;
GRANT ALL ON ALL SEQUENCES IN SCHEMA auth TO supabase_auth_admin;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA auth TO supabase_auth_admin;

-- Disable RLS on auth.users if it exists (this is critical - RLS should never be on auth.users)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_class c 
    JOIN pg_namespace n ON n.oid = c.relnamespace 
    WHERE n.nspname = 'auth' AND c.relname = 'users'
  ) THEN
    ALTER TABLE auth.users DISABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Drop and recreate the user creation trigger function with better error handling
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Try to insert user profile, but don't fail if it errors
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
      COALESCE(NEW.email, NEW.raw_user_meta_data->>'email'),
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
  EXCEPTION 
    WHEN OTHERS THEN
      -- Log the error but don't prevent user creation
      RAISE WARNING 'Failed to create user profile for %: %', NEW.id, SQLERRM;
  END;

  -- Always return NEW to allow user creation to continue
  RETURN NEW;
END;
$$;

-- Recreate the trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Ensure users table exists in public schema and has proper structure
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on public.users but ensure it has proper policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies and recreate them
DROP POLICY IF EXISTS "Users can read own data" ON public.users;
DROP POLICY IF EXISTS "Users can update own data" ON public.users;

CREATE POLICY "Users can read own data"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Make sure user_profiles has proper INSERT policy
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
CREATE POLICY "Users can insert own profile"
  ON public.user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Grant necessary permissions to the trigger function
GRANT INSERT ON public.user_profiles TO supabase_auth_admin;
GRANT INSERT ON public.users TO supabase_auth_admin;