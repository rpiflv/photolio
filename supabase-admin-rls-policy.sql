-- Allow authenticated admins to insert, update, and delete photos
-- First, drop existing policies if they exist
DROP POLICY IF EXISTS "Allow admin insert photos" ON photos;
DROP POLICY IF EXISTS "Allow admin update photos" ON photos;
DROP POLICY IF EXISTS "Allow admin delete photos" ON photos;

-- Create policies for admin operations
CREATE POLICY "Allow admin insert photos" ON photos
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Allow admin update photos" ON photos
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Allow admin delete photos" ON photos
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Ensure SELECT policy exists for everyone
DROP POLICY IF EXISTS "Allow public read photos" ON photos;
CREATE POLICY "Allow public read photos" ON photos
  FOR SELECT
  TO anon, authenticated
  USING (true);
