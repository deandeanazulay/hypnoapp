/*
  # Create user profiles and sessions tables

  1. New Tables
    - `user_profiles`
      - `id` (uuid, references auth.users)
      - `email` (text)
      - `level` (integer)
      - `experience` (integer) 
      - `current_state` (text)
      - `session_streak` (integer)
      - `last_session_time` (timestamptz)
      - `achievements` (text array)
      - `orb_energy` (real)
      - `depth` (integer)
      - `breathing` (text)
      - `hp` (integer)
      - `mp` (integer)
      - `tokens` (integer)
      - `plan` (text)
      - `daily_sessions_used` (integer)
      - `last_session_date` (text)
      - `ego_state_usage` (jsonb)
      - `active_ego_state` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `sessions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references user_profiles)
      - `ego_state` (text)
      - `action` (text)
      - `duration` (integer)
      - `experience_gained` (integer)
      - `completed_at` (timestamptz)
      
    - `custom_protocols`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references user_profiles)
      - `name` (text)
      - `induction` (text)
      - `deepener` (text)
      - `goals` (text array)
      - `metaphors` (text array)
      - `duration` (integer)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Users can only access their own data
    - Automatic user profile creation via trigger
*/

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  level integer NOT NULL DEFAULT 1,
  experience integer NOT NULL DEFAULT 0,
  current_state text NOT NULL DEFAULT 'calm',
  session_streak integer NOT NULL DEFAULT 0,
  last_session_time timestamptz,
  achievements text[] DEFAULT '{}',
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
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  ego_state text NOT NULL,
  action text NOT NULL,
  duration integer NOT NULL,
  experience_gained integer NOT NULL DEFAULT 0,
  completed_at timestamptz DEFAULT now()
);

-- Create custom_protocols table
CREATE TABLE IF NOT EXISTS custom_protocols (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  induction text NOT NULL,
  deepener text NOT NULL,
  goals text[] DEFAULT '{}',
  metaphors text[] DEFAULT '{}',
  duration integer NOT NULL DEFAULT 15,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_protocols ENABLE ROW LEVEL SECURITY;

-- Policies for user_profiles
CREATE POLICY "Users can read own profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Policies for sessions
CREATE POLICY "Users can read own sessions"
  ON sessions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions"
  ON sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policies for custom_protocols  
CREATE POLICY "Users can read own protocols"
  ON custom_protocols
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own protocols"
  ON custom_protocols
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own protocols"
  ON custom_protocols
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own protocols"
  ON custom_protocols
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Function to handle updated_at timestamps
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER update_custom_protocols_updated_at
  BEFORE UPDATE ON custom_protocols
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Function to create user profile automatically
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (
    id,
    email,
    ego_state_usage
  ) VALUES (
    NEW.id,
    NEW.email,
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
    }'::jsonb
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER create_user_profile_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_user_profile();