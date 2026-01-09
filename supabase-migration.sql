-- Add new columns for optimized image versions
-- Run this in Supabase SQL Editor

ALTER TABLE photos 
ADD COLUMN IF NOT EXISTS thumbnail_s3_key TEXT,
ADD COLUMN IF NOT EXISTS medium_s3_key TEXT,
ADD COLUMN IF NOT EXISTS dimensions JSONB;

-- Add helpful comment
COMMENT ON COLUMN photos.thumbnail_s3_key IS 'S3 key for 400px thumbnail version';
COMMENT ON COLUMN photos.medium_s3_key IS 'S3 key for 1200px medium version';
COMMENT ON COLUMN photos.dimensions IS 'Original image dimensions {width, height}';
