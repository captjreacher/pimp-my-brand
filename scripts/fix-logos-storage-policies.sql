-- Fix storage policies for logos bucket
-- Drop any existing policies for logos bucket
DROP POLICY IF EXISTS "Users can upload logos" ON storage.objects;
DROP POLICY IF EXISTS "Users can view logos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update logos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view logos" ON storage.objects;

-- Create simple policies for logos bucket
CREATE POLICY "Authenticated users can upload to logos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'logos' AND 
    auth.role() = 'authenticated'
  );

CREATE POLICY "Authenticated users can view logos" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'logos' AND 
    auth.role() = 'authenticated'
  );

CREATE POLICY "Authenticated users can update logos" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'logos' AND 
    auth.role() = 'authenticated'
  );

CREATE POLICY "Authenticated users can delete logos" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'logos' AND 
    auth.role() = 'authenticated'
  );

-- Also ensure the uploads bucket has the right policies
DROP POLICY IF EXISTS "Authenticated users can upload to uploads" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view uploads" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update uploads" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete uploads" ON storage.objects;

CREATE POLICY "Authenticated users can upload to uploads" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'uploads' AND 
    auth.role() = 'authenticated'
  );

CREATE POLICY "Authenticated users can view uploads" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'uploads' AND 
    auth.role() = 'authenticated'
  );

CREATE POLICY "Authenticated users can update uploads" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'uploads' AND 
    auth.role() = 'authenticated'
  );

CREATE POLICY "Authenticated users can delete uploads" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'uploads' AND 
    auth.role() = 'authenticated'
  );