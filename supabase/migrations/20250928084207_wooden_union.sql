/*
  # Add script column to custom_protocols table

  1. Changes
    - Add `script` column to `custom_protocols` table to store generated session scripts
    - Column type: JSONB to store structured script data
    - Default value: empty JSON object
    - Allow null values for existing protocols

  2. Purpose
    - Enable saving AI-generated scripts to personal library
    - Allow reuse of scripts without regenerating (saves tokens)
    - Store complete script structure including segments and metadata
*/

-- Add script column to store generated session scripts
ALTER TABLE custom_protocols 
ADD COLUMN IF NOT EXISTS script JSONB DEFAULT '{}'::jsonb;