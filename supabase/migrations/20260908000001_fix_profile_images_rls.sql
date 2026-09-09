-- Fix RLS policies for the profile-images bucket
-- Resolves the "new row violates row-level security policy" error during upsert

-- 1. Add missing UPDATE policy
-- Supabase `upsert: true` requires both INSERT and UPDATE policies
CREATE POLICY "profile-images: owner update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'profile-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- 2. Update SELECT policy for public access
-- Drop the old restrictive authenticated-only policy
DROP POLICY IF EXISTS "profile-images: authenticated read" ON storage.objects;

-- Create a new public read policy since profile images should be visible to anyone
CREATE POLICY "profile-images: public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'profile-images');
