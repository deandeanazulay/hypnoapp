/*
  # Add automatic user profile creation trigger

  This migration adds a database trigger that automatically creates a user profile
  record in the user_profiles table whenever a new user is created in auth.users.
  This fixes the "Database error saving new user" issue during signup.

  1. New Functions
    - `handle_new_user()` - Creates user profile with default values
  
  2. New Triggers  
    - `on_auth_user_created` - Executes after user creation in auth.users
  
  3. Security
    - Function runs with SECURITY DEFINER to bypass RLS during profile creation
*/

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
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
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create user profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();