-- ============================================
-- Photo Portfolio — Full Database Setup
-- ============================================
-- Run this entire script in the Supabase SQL Editor to set up
-- all tables, policies, functions, and triggers from scratch.
--
-- After running this, create your admin account:
--   1. Sign up via the app's /login page
--   2. Then run:
--      UPDATE profiles SET role = 'admin' WHERE email = 'your-email@example.com';
-- ============================================

BEGIN;

-- =============================================
-- 1. User roles & profiles
-- =============================================

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('user', 'admin');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  role user_role DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Only admins can update roles" ON profiles;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Only admins can update roles"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, role)
  VALUES (NEW.id, NEW.email, 'user');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Helper function
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles WHERE id = user_id AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Backfill any existing users
INSERT INTO profiles (id, email, role)
SELECT id, email, 'user'
FROM auth.users
WHERE id NOT IN (SELECT id FROM profiles)
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- 2. Categories
-- =============================================

CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) DEFAULT auth.uid(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read categories" ON categories;
DROP POLICY IF EXISTS "Authenticated users can insert categories" ON categories;
DROP POLICY IF EXISTS "Users can update own categories" ON categories;
DROP POLICY IF EXISTS "Users can delete own categories" ON categories;
DROP POLICY IF EXISTS "Enable read access for all users" ON categories;

CREATE POLICY "Anyone can read categories"
  ON categories FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert categories"
  ON categories FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own categories"
  ON categories FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own categories"
  ON categories FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- =============================================
-- 3. Cameras
-- =============================================

CREATE TABLE IF NOT EXISTS cameras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES auth.users(id) DEFAULT auth.uid(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE cameras ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read cameras" ON cameras;
DROP POLICY IF EXISTS "Authenticated users can insert cameras" ON cameras;
DROP POLICY IF EXISTS "Users can update own cameras" ON cameras;
DROP POLICY IF EXISTS "Users can delete own cameras" ON cameras;

CREATE POLICY "Anyone can read cameras"
  ON cameras FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert cameras"
  ON cameras FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cameras"
  ON cameras FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own cameras"
  ON cameras FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- =============================================
-- 4. Photos
-- =============================================

CREATE TABLE IF NOT EXISTS photos (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id UUID NOT NULL REFERENCES auth.users(id) DEFAULT auth.uid(),
  title TEXT NOT NULL,
  description TEXT,
  s3_key TEXT NOT NULL,
  thumbnail_s3_key TEXT,
  medium_s3_key TEXT,
  category TEXT,
  date TEXT,
  featured BOOLEAN DEFAULT false,
  tags TEXT[] DEFAULT '{}',
  location TEXT,
  camera TEXT,
  lens TEXT,
  settings JSONB,
  dimensions JSONB,
  price NUMERIC,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE photos ENABLE ROW LEVEL SECURITY;

COMMENT ON COLUMN photos.thumbnail_s3_key IS 'S3 key for 400px thumbnail version';
COMMENT ON COLUMN photos.medium_s3_key IS 'S3 key for 1200px medium version';
COMMENT ON COLUMN photos.dimensions IS 'Original image dimensions {width, height}';
COMMENT ON COLUMN photos.likes_count IS 'Number of times this photo has been liked';

CREATE INDEX IF NOT EXISTS idx_photos_likes_count ON photos(likes_count DESC);

DROP POLICY IF EXISTS "Allow public read photos" ON photos;
DROP POLICY IF EXISTS "Owner can insert photos" ON photos;
DROP POLICY IF EXISTS "Owner can update photos" ON photos;
DROP POLICY IF EXISTS "Owner can delete photos" ON photos;

CREATE POLICY "Allow public read photos" ON photos
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Owner can insert photos" ON photos
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Owner can update photos" ON photos
  FOR UPDATE TO authenticated
  USING (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Owner can delete photos" ON photos
  FOR DELETE TO authenticated
  USING (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Likes functions
CREATE OR REPLACE FUNCTION increment_photo_likes(photo_id TEXT)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE photos SET likes_count = COALESCE(likes_count, 0) + 1 WHERE id::text = photo_id;
END;
$$;

CREATE OR REPLACE FUNCTION decrement_photo_likes(photo_id TEXT)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE photos SET likes_count = GREATEST(COALESCE(likes_count, 0) - 1, 0) WHERE id::text = photo_id;
END;
$$;

GRANT EXECUTE ON FUNCTION increment_photo_likes(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION decrement_photo_likes(TEXT) TO anon, authenticated;

-- =============================================
-- 5. Favorites
-- =============================================

CREATE TABLE IF NOT EXISTS favorites (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  photo_id TEXT NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, photo_id)
);

ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own favorites" ON favorites;
DROP POLICY IF EXISTS "Users can insert own favorites" ON favorites;
DROP POLICY IF EXISTS "Users can delete own favorites" ON favorites;

CREATE POLICY "Users can read own favorites"
  ON favorites FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own favorites"
  ON favorites FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own favorites"
  ON favorites FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- =============================================
-- 6. Home page info
-- =============================================

CREATE TABLE IF NOT EXISTS home_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) DEFAULT auth.uid(),
  site_name TEXT DEFAULT 'Photo Portfolio',
  hero_title TEXT DEFAULT 'Capturing Moments',
  hero_subtitle TEXT DEFAULT 'Through the lenses of my camera, I tell stories that words cannot express.',
  featured_title TEXT DEFAULT 'Featured Work',
  featured_subtitle TEXT DEFAULT 'A selection of my favorite photographs',
  about_title TEXT DEFAULT 'About the Photographer',
  about_bio TEXT DEFAULT 'I''m a passionate photographer who believes in the power of visual storytelling. Every image tells a story, captures an emotion, and preserves a moment in time. Through my lens, I aim to showcase the beauty in everyday moments and extraordinary scenes alike.',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

ALTER TABLE home_info ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read home_info" ON home_info;
DROP POLICY IF EXISTS "Users can insert own home_info" ON home_info;
DROP POLICY IF EXISTS "Users can update own home_info" ON home_info;

CREATE POLICY "Anyone can read home_info"
  ON home_info FOR SELECT USING (true);

CREATE POLICY "Users can insert own home_info"
  ON home_info FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own home_info"
  ON home_info FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- =============================================
-- 7. Contact info
-- =============================================

CREATE TABLE IF NOT EXISTS contact_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) DEFAULT auth.uid(),
  email TEXT,
  phone TEXT,
  location TEXT,
  twitter_handle TEXT,
  twitter_url TEXT,
  instagram_handle TEXT,
  instagram_url TEXT,
  heading TEXT DEFAULT 'Get In Touch',
  subheading TEXT DEFAULT 'Ready to capture your special moments?',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

ALTER TABLE contact_info ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read contact_info" ON contact_info;
DROP POLICY IF EXISTS "Owner can update contact_info" ON contact_info;
DROP POLICY IF EXISTS "Owner can insert contact_info" ON contact_info;

CREATE POLICY "Anyone can read contact_info"
  ON contact_info FOR SELECT USING (true);

CREATE POLICY "Owner can update contact_info"
  ON contact_info FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owner can insert contact_info"
  ON contact_info FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

COMMIT;
