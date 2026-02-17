-- Migration: Add user_id to photos and contact_info tables
-- Links all data to the authenticated user who created it.
-- Run this in Supabase SQL Editor.

BEGIN;

-- =============================================
-- 1. Add user_id to photos table
-- =============================================
ALTER TABLE photos
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Backfill existing photos with the current admin user
-- Replace the subquery if you have multiple admins and want a specific one
UPDATE photos
SET user_id = (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1)
WHERE user_id IS NULL;

-- Make user_id NOT NULL after backfill
ALTER TABLE photos
ALTER COLUMN user_id SET NOT NULL;

-- Set default so new inserts auto-fill user_id
ALTER TABLE photos
ALTER COLUMN user_id SET DEFAULT auth.uid();

-- Update RLS policies for photos
DROP POLICY IF EXISTS "Allow admin insert photos" ON photos;
DROP POLICY IF EXISTS "Allow admin update photos" ON photos;
DROP POLICY IF EXISTS "Allow admin delete photos" ON photos;
DROP POLICY IF EXISTS "Allow public read photos" ON photos;

-- Anyone can read all photos (public portfolio)
CREATE POLICY "Allow public read photos" ON photos
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Users can only insert their own photos
CREATE POLICY "Owner can insert photos" ON photos
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Users can only update their own photos
CREATE POLICY "Owner can update photos" ON photos
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Users can only delete their own photos
CREATE POLICY "Owner can delete photos" ON photos
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- =============================================
-- 2. Add user_id to contact_info table
-- =============================================
ALTER TABLE contact_info
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Backfill existing contact_info
UPDATE contact_info
SET user_id = (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1)
WHERE user_id IS NULL;

-- Make user_id NOT NULL after backfill
ALTER TABLE contact_info
ALTER COLUMN user_id SET NOT NULL;

-- Set default
ALTER TABLE contact_info
ALTER COLUMN user_id SET DEFAULT auth.uid();

-- Add unique constraint so each user has one contact_info row
ALTER TABLE contact_info
ADD CONSTRAINT contact_info_user_id_unique UNIQUE (user_id);

-- Update RLS policies for contact_info
DROP POLICY IF EXISTS "Anyone can read contact_info" ON contact_info;
DROP POLICY IF EXISTS "Authenticated users can update contact_info" ON contact_info;

-- Anyone can read contact info
CREATE POLICY "Anyone can read contact_info" ON contact_info
  FOR SELECT
  USING (true);

-- Users can only update their own contact info
CREATE POLICY "Owner can update contact_info" ON contact_info
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can insert their own contact info
CREATE POLICY "Owner can insert contact_info" ON contact_info
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

COMMIT;
