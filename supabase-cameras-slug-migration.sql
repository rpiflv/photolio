-- Migration: Change cameras to use slug-based IDs (like categories)
-- 
-- Before: cameras.id = UUID, photos.camera = camera name string
-- After:  cameras.id = slug text, photos.camera = camera slug
--
-- Run this migration in your Supabase SQL Editor.

-- Step 1: Add a temporary slug column to cameras
ALTER TABLE cameras ADD COLUMN slug TEXT;

-- Step 2: Generate slugs from camera names
UPDATE cameras
SET slug = LOWER(REGEXP_REPLACE(TRIM(name), '[^a-zA-Z0-9]+', '-', 'g'));

-- Remove leading/trailing hyphens from slugs
UPDATE cameras
SET slug = TRIM(BOTH '-' FROM slug);

-- Step 3: Update photos.camera from name -> slug
UPDATE photos p
SET camera = c.slug
FROM cameras c
WHERE p.camera = c.name;

-- Step 4: Drop old primary key and id column, make slug the new id
-- First drop any foreign key constraints or policies referencing cameras.id
-- (RLS policies use user_id, not id, so they should be fine)

-- Remove the old UUID id column and rename slug to id
ALTER TABLE cameras DROP CONSTRAINT cameras_pkey;
ALTER TABLE cameras DROP COLUMN id;
ALTER TABLE cameras RENAME COLUMN slug TO id;
ALTER TABLE cameras ADD PRIMARY KEY (id);

-- Step 5: Drop the old UNIQUE constraint on name if it exists
ALTER TABLE cameras DROP CONSTRAINT IF EXISTS cameras_name_key;

-- Verify the migration
SELECT 'Cameras after migration:' as info;
SELECT id, name, user_id FROM cameras ORDER BY name;

SELECT 'Sample photos with camera slugs:' as info;
SELECT id, title, camera FROM photos WHERE camera IS NOT NULL LIMIT 10;
