-- Migration: Create contact_info table for editable contact page
-- Run this in Supabase SQL Editor

BEGIN;

CREATE TABLE IF NOT EXISTS contact_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT,
  phone TEXT,
  location TEXT,
  twitter_handle TEXT,
  twitter_url TEXT,
  instagram_handle TEXT,
  instagram_url TEXT,
  heading TEXT DEFAULT 'Get In Touch',
  subheading TEXT DEFAULT 'Ready to capture your special moments?',
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default placeholder row
INSERT INTO contact_info (
  email, phone, location,
  twitter_handle, twitter_url,
  instagram_handle, instagram_url,
  heading, subheading
) VALUES (
  'your.email@example.com', NULL, 'Your City, Country',
  '@yourhandle', 'https://x.com/yourhandle',
  '@yourhandle', 'https://instagram.com/yourhandle',
  'Get In Touch', 'Ready to capture your special moments?'
);

-- Enable RLS
ALTER TABLE contact_info ENABLE ROW LEVEL SECURITY;

-- Anyone can read contact info
CREATE POLICY "Anyone can read contact_info"
  ON contact_info FOR SELECT
  USING (true);

-- Only authenticated users can update
CREATE POLICY "Authenticated users can update contact_info"
  ON contact_info FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

COMMIT;
