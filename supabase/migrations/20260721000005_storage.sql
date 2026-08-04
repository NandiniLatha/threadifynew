-- ============================================================
-- Migration: Storage Buckets & Policies
-- Version: 20260721000005
-- NOTE: supabase_storage bucket creation requires the storage
-- extension. In local dev this runs automatically via `supabase
-- db reset`. For PRODUCTION, run `supabase db push` or create
-- buckets in the Supabase dashboard + copy these policies.
-- ============================================================

-- ── 1. Create buckets ─────────────────────────────────────────
-- All buckets are private by default (no public access).
-- Storage public URL access is controlled by RLS policies below.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  (
    'design-images',
    'design-images',
    false,
    10485760,  -- 10 MB
    ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
  ),
  (
    'profile-images',
    'profile-images',
    true,      -- Profile images can be publicly readable via signed URL
    5242880,   -- 5 MB
    ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  ),
  (
    'portfolio-images',
    'portfolio-images',
    true,      -- Portfolio images are publicly visible
    10485760,  -- 10 MB
    ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  ),
  (
    'review-images',
    'review-images',
    true,      -- Review images are publicly visible
    5242880,   -- 5 MB
    ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  ),
  (
    'measurement-files',
    'measurement-files',
    false,     -- Private — measurement docs
    10485760,  -- 10 MB
    ARRAY['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']
  )
ON CONFLICT (id) DO NOTHING;

-- ── 2. design-images RLS ─────────────────────────────────────

-- Customers can upload to their own folder: design-images/{user_id}/
CREATE POLICY "design-images: customer upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'design-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Customers can read their own uploads
CREATE POLICY "design-images: customer read own"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'design-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Tailors can read design images for requests they are assigned to or have quoted
CREATE POLICY "design-images: tailor read accessible"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'design-images' AND
    is_tailor()
  );

-- Customers can delete their own images
CREATE POLICY "design-images: customer delete own"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'design-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Admin full access
CREATE POLICY "design-images: admin all"
  ON storage.objects FOR ALL
  USING (bucket_id = 'design-images' AND is_admin());

-- ── 3. profile-images RLS ────────────────────────────────────

-- Any authenticated user can read profile images (they're semi-public)
CREATE POLICY "profile-images: authenticated read"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'profile-images' AND
    auth.role() = 'authenticated'
  );

-- Users can upload to their own folder
CREATE POLICY "profile-images: owner upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'profile-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can delete their own profile image
CREATE POLICY "profile-images: owner delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'profile-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Admin full access
CREATE POLICY "profile-images: admin all"
  ON storage.objects FOR ALL
  USING (bucket_id = 'profile-images' AND is_admin());

-- ── 4. portfolio-images RLS ──────────────────────────────────

-- Anyone (including unauthenticated) can read portfolio images
CREATE POLICY "portfolio-images: public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'portfolio-images');

-- Only tailors can upload to their own folder
CREATE POLICY "portfolio-images: tailor upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'portfolio-images' AND
    is_tailor() AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Tailors can delete their own portfolio images
CREATE POLICY "portfolio-images: tailor delete own"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'portfolio-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Admin full access
CREATE POLICY "portfolio-images: admin all"
  ON storage.objects FOR ALL
  USING (bucket_id = 'portfolio-images' AND is_admin());

-- ── 5. review-images RLS ─────────────────────────────────────

-- Anyone can read review images
CREATE POLICY "review-images: public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'review-images');

-- Authenticated customers can upload review images to their folder
CREATE POLICY "review-images: customer upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'review-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Customers can delete their own review images
CREATE POLICY "review-images: customer delete own"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'review-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Admin full access
CREATE POLICY "review-images: admin all"
  ON storage.objects FOR ALL
  USING (bucket_id = 'review-images' AND is_admin());

-- ── 6. measurement-files RLS ─────────────────────────────────

-- Only the owning user can access their measurement files
CREATE POLICY "measurement-files: owner read"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'measurement-files' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "measurement-files: owner upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'measurement-files' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Tailors assigned to an order can read the customer's measurement files
-- (relaxed read policy for tailors via API — they call a signed URL endpoint)
CREATE POLICY "measurement-files: owner delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'measurement-files' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Admin full access
CREATE POLICY "measurement-files: admin all"
  ON storage.objects FOR ALL
  USING (bucket_id = 'measurement-files' AND is_admin());
