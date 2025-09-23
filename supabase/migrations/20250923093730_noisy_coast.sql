/*
  # Fix Authentication and User Profile Creation Issues

  1. User Profiles Table Structure
    - Ensures all columns have appropriate defaults or are nullable
    - Fixes any NOT NULL constraint issues

  2. Row Level Security
    - Updates RLS policies to allow proper user profile creation
    - Ensures auth trigger can create profiles

  3. Authentication Trigger
    - Creates robust trigger for automatic profile creation
    - Uses SECURITY DEFINER to bypass RLS during profile creation

  4. Email Confirmation Settings
    - Notes for Supabase dashboard configuration
*/

-- First, let's make sure the user_profiles table has proper defaults
ALTER TABLE user_profiles ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE user_profiles ALTER COLUMN updated_at SET DEFAULT now();
ALTER TABLE user_profiles ALTER COLUMN email DROP NOT NULL;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can manage own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Allow authenticated users to create their own profile" ON user_profiles;

-- Create proper RLS policies
CREATE POLICY "Enable insert for authenticated users on own profile"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable read for users on own profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Enable update for users on own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable delete for users on own profile"
  ON user_profiles
  FOR DELETE
  TO authenticated
  USING (auth.uid() = id);

-- Create or replace the trigger function for user profile creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert a new user profile with all required fields
  INSERT INTO user_profiles (
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
    new.id,
    COALESCE(new.email, new.raw_user_meta_data->>'email'),
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
    'guardian',
    now(),
    now()
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN new;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE LOG 'Error creating user profile for %: %', new.id, SQLERRM;
    RETURN new;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION handle_new_user() TO authenticated;