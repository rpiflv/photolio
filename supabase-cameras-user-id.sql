-- Migration: Add user_id to cameras table and make cameras user-customizable
-- Run this in Supabase SQL Editor

BEGIN;

-- Add user_id column to existing cameras table
ALTER TABLE cameras
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();

-- Backfill existing cameras with the first admin user
UPDATE cameras
SET user_id = (
  SELECT id FROM auth.users
  LIMIT 1
)
WHERE user_id IS NULL;

-- Make user_id NOT NULL after backfill
ALTER TABLE cameras
ALTER COLUMN user_id SET NOT NULL;

-- Drop existing RLS policies if any
DROP POLICY IF EXISTS "Anyone can read cameras" ON cameras;
DROP POLICY IF EXISTS "Authenticated users can insert cameras" ON cameras;
DROP POLICY IF EXISTS "Users can update own cameras" ON cameras;
DROP POLICY IF EXISTS "Users can delete own cameras" ON cameras;

-- Enable RLS
ALTER TABLE cameras ENABLE ROW LEVEL SECURITY;

-- Anyone can read cameras (public gallery)
CREATE POLICY "Anyone can read cameras"
  ON cameras FOR SELECT
  USING (true);

-- Authenticated users can insert their own cameras
CREATE POLICY "Authenticated users can insert cameras"
  ON cameras FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own cameras
CREATE POLICY "Users can update own cameras"
  ON cameras FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own cameras
CREATE POLICY "Users can delete own cameras"
  ON cameras FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

COMMIT;
