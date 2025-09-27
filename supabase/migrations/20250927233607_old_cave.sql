/*
  # Add Achievement Tracking System

  1. New Tables
    - `user_achievements`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to user_profiles)
      - `achievement_id` (text)
      - `unlocked_at` (timestamp)
      - `metadata` (jsonb for additional data)

  2. Security
    - Enable RLS on `user_achievements` table
    - Add policies for users to read/write their own achievements

  3. Functions
    - Add trigger to update user_profiles.updated_at when achievements change
*/

-- Create user_achievements table
CREATE TABLE IF NOT EXISTS user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE,
  achievement_id text NOT NULL,
  unlocked_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

-- Enable RLS
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read own achievements"
  ON user_achievements
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own achievements"
  ON user_achievements
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement_id ON user_achievements(achievement_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_unlocked_at ON user_achievements(unlocked_at);

-- Add daily session reset function
CREATE OR REPLACE FUNCTION reset_daily_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE user_profiles 
  SET daily_sessions_used = 0
  WHERE last_session_date != CURRENT_DATE::text
    OR last_session_date IS NULL;
END;
$$;

-- Add function to check and award streak bonuses
CREATE OR REPLACE FUNCTION check_streak_bonus(user_id_param uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_record user_profiles%ROWTYPE;
  bonus_tokens integer := 0;
  bonus_message text := '';
BEGIN
  SELECT * INTO user_record FROM user_profiles WHERE id = user_id_param;
  
  IF user_record.session_streak % 7 = 0 AND user_record.session_streak > 0 THEN
    bonus_tokens := 10;
    bonus_message := 'Weekly streak bonus!';
  ELSIF user_record.session_streak % 30 = 0 AND user_record.session_streak > 0 THEN
    bonus_tokens := 50;
    bonus_message := 'Monthly streak bonus!';
  END IF;
  
  IF bonus_tokens > 0 THEN
    UPDATE user_profiles 
    SET tokens = tokens + bonus_tokens
    WHERE id = user_id_param;
  END IF;
  
  RETURN jsonb_build_object(
    'bonus_tokens', bonus_tokens,
    'message', bonus_message
  );
END;
$$;