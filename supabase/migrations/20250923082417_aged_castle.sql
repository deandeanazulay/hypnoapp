/*
  # Add automatic user profile creation trigger

  1. New Functions
    - `handle_new_user()` - Creates user profile with default values when a new user signs up
  
  2. New Triggers  
    - `on_auth_user_created` - Executes after user creation in auth.users table
  
  3. Security
    - Function runs with SECURITY DEFINER to bypass RLS during profile creation
    - Ensures user profile is created automatically during signup process
*/

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
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
  )
  VALUES (
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
  );
  
  RETURN NEW;
END;
$$;

-- Trigger to automatically create user profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();