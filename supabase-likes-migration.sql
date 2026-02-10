-- Migration to add likes tracking to photos table
-- Run this in Supabase SQL Editor

-- Add likes_count column to photos table
ALTER TABLE photos 
ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0;

-- Add helpful comment
COMMENT ON COLUMN photos.likes_count IS 'Number of times this photo has been liked';

-- Create index for sorting by most liked
CREATE INDEX IF NOT EXISTS idx_photos_likes_count ON photos(likes_count DESC);

-- Create function to increment photo likes
CREATE OR REPLACE FUNCTION increment_photo_likes(photo_id TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE photos 
  SET likes_count = COALESCE(likes_count, 0) + 1
  WHERE id::text = photo_id;
END;
$$;

-- Create function to decrement photo likes
CREATE OR REPLACE FUNCTION decrement_photo_likes(photo_id TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE photos 
  SET likes_count = GREATEST(COALESCE(likes_count, 0) - 1, 0)
  WHERE id::text = photo_id;
END;
$$;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION increment_photo_likes(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION decrement_photo_likes(TEXT) TO anon, authenticated;
