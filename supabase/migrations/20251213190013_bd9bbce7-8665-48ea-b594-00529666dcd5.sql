-- Add avatar_url column to clients table
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS avatar_url text;

-- Add storage policy for clients to upload their avatars
CREATE POLICY "Clients can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = 'clients'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

CREATE POLICY "Clients can update their own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' 
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = 'clients'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

CREATE POLICY "Clients can delete their own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' 
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = 'clients'
  AND (storage.foldername(name))[2] = auth.uid()::text
);