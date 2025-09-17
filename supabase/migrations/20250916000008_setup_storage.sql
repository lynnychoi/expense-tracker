-- Enable storage if not already enabled
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'receipts',
  'receipts',
  false, -- Private bucket
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for receipts bucket
CREATE POLICY "Users can upload their household receipts"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'receipts' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their household receipts"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'receipts' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their household receipts"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'receipts' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their household receipts"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'receipts' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );