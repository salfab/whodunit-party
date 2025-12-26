-- Fix storage policies for mystery-images bucket
-- This ensures proper read access for downloaded files

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public read access for mystery images" ON storage.objects;
DROP POLICY IF EXISTS "Service role can upload mystery images" ON storage.objects;
DROP POLICY IF EXISTS "Service role can update mystery images" ON storage.objects;
DROP POLICY IF EXISTS "Service role can delete mystery images" ON storage.objects;

-- Public read access - anyone can view/download mystery images
CREATE POLICY "Public read access for mystery images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'mystery-images');

-- Authenticated users can upload
CREATE POLICY "Authenticated can upload mystery images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'mystery-images');

-- Authenticated users can update
CREATE POLICY "Authenticated can update mystery images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'mystery-images');

-- Authenticated users can delete
CREATE POLICY "Authenticated can delete mystery images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'mystery-images');

-- Ensure bucket is public
UPDATE storage.buckets
SET public = true
WHERE id = 'mystery-images';
