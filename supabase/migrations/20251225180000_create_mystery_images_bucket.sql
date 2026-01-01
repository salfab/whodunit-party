-- Create storage bucket for mystery images (cover and character portraits)
-- This bucket is public for read access (images displayed in game)

INSERT INTO storage.buckets (id, name, file_size_limit, allowed_mime_types)
VALUES (
  'mystery-images',
  'mystery-images',
  5242880, -- 5MB per image
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

-- Make the bucket public
UPDATE storage.buckets SET public = true WHERE id = 'mystery-images';

-- Public read access - anyone can view mystery images
CREATE POLICY "Public read access for mystery images"
ON storage.objects FOR SELECT
USING (bucket_id = 'mystery-images');

-- Service role can upload images (used by API)
-- Note: Service role bypasses RLS, so this is just documentation
CREATE POLICY "Service role can upload mystery images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'mystery-images');

-- Service role can update images
CREATE POLICY "Service role can update mystery images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'mystery-images');

-- Service role can delete images
CREATE POLICY "Service role can delete mystery images"
ON storage.objects FOR DELETE
USING (bucket_id = 'mystery-images');
