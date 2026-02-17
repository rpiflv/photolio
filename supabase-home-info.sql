-- Migration: Create home_info table for editable Hero + About sections on the home page
-- Run this in Supabase SQL Editor

BEGIN;

-- Drop the old about_info table if it exists (from previous migration)
DROP TABLE IF EXISTS about_info;

CREATE TABLE IF NOT EXISTS home_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) DEFAULT auth.uid(),
  hero_title TEXT DEFAULT 'Capturing Moments',
  hero_subtitle TEXT DEFAULT 'Through the lenses of my camera, I tell stories that words cannot express.',
  featured_title TEXT DEFAULT 'Featured Work',
  featured_subtitle TEXT DEFAULT 'A selection of my favorite photographs',
  about_title TEXT DEFAULT 'About the Photographer',
  about_bio TEXT DEFAULT 'I''m a passionate photographer who believes in the power of visual storytelling. Every image tells a story, captures an emotion, and preserves a moment in time. Through my lens, I aim to showcase the beauty in everyday moments and extraordinary scenes alike.',
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE home_info ENABLE ROW LEVEL SECURITY;

-- Anyone can read home info (public page)
CREATE POLICY "Anyone can read home_info"
  ON home_info FOR SELECT
  USING (true);

-- Authenticated users can insert their own home info
CREATE POLICY "Users can insert own home_info"
  ON home_info FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can only update their own home info
CREATE POLICY "Users can update own home_info"
  ON home_info FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

COMMIT;
