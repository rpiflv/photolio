-- Migration: Add user_id to categories table and make categories user-customizable
-- Run this in Supabase SQL Editor

BEGIN;

-- Add user_id column to existing categories table
ALTER TABLE categories
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();

-- Backfill existing categories with the first admin user
UPDATE categories
SET user_id = (
  SELECT id FROM auth.users
  LIMIT 1
)
WHERE user_id IS NULL;

-- Make user_id NOT NULL after backfill
ALTER TABLE categories
ALTER COLUMN user_id SET NOT NULL;

-- Drop existing RLS policies if any
DROP POLICY IF EXISTS "Anyone can read categories" ON categories;
DROP POLICY IF EXISTS "Authenticated users can insert categories" ON categories;
DROP POLICY IF EXISTS "Users can update own categories" ON categories;
DROP POLICY IF EXISTS "Users can delete own categories" ON categories;
DROP POLICY IF EXISTS "Enable read access for all users" ON categories;

-- Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Anyone can read categories (public gallery)
CREATE POLICY "Anyone can read categories"
  ON categories FOR SELECT
  USING (true);

-- Authenticated users can insert their own categories
CREATE POLICY "Authenticated users can insert categories"
  ON categories FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own categories
CREATE POLICY "Users can update own categories"
  ON categories FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own categories
CREATE POLICY "Users can delete own categories"
  ON categories FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

COMMIT;
