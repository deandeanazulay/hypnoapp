/*
  # Fix RLS policies for user signup process

  1. Security Changes
    - Update RLS policies to allow user creation during signup
    - Fix trigger function permissions
    - Ensure proper user profile creation

  2. Changes Made
    - Allow service_role to bypass RLS during signup
    - Fix user_profiles INSERT policy for initial creation
    - Update trigger function with proper security context
*/

-- Drop existing trigger and function to recreate them properly
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create a robust user profile creation function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
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
    '{}',
    'guardian',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE WARNING 'Error creating user profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO supabase_auth_admin;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_new_user();

-- Update RLS policy for user_profiles to allow initial creation
DROP POLICY IF EXISTS "Enable insert for authenticated users on own profile" ON public.user_profiles;

CREATE POLICY "Enable insert for authenticated users on own profile"
ON public.user_profiles
FOR INSERT
TO authenticated, service_role
WITH CHECK (
  auth.uid() = id 
  OR 
  auth.role() = 'service_role'
);

-- Ensure users table allows proper creation
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

-- Allow service_role to insert users during signup
CREATE POLICY "Service role can manage users"
ON public.users
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);