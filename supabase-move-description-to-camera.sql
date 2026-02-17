-- Migration: Move description values into camera field
-- and create a cameras lookup table.

BEGIN;

-- Step 1: Move description into camera (description currently holds camera names)
UPDATE photos
SET camera = description,
    description = NULL
WHERE description IS NOT NULL;

-- Step 2: Create cameras table
CREATE TABLE IF NOT EXISTS cameras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Step 3: Populate cameras table with unique values from photos
INSERT INTO cameras (name)
SELECT DISTINCT camera
FROM photos
WHERE camera IS NOT NULL
ON CONFLICT (name) DO NOTHING;

-- Step 4: Enable RLS on cameras table
ALTER TABLE cameras ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read cameras
CREATE POLICY "Anyone can read cameras"
  ON cameras FOR SELECT
  USING (true);

-- Only authenticated users can insert cameras (admin will handle this)
CREATE POLICY "Authenticated users can insert cameras"
  ON cameras FOR INSERT
  TO authenticated
  WITH CHECK (true);

COMMIT;
