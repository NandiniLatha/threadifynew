-- ============================================================
-- Migration: Tailor Onboarding — Storage Buckets & Policies
-- Version: 20260728000002
-- Creates:
--   - tailor-portfolios  (public read; tailor-owned upload)
--   - tailor-verification-docs (PRIVATE; tailor upload, admin read only)
-- NOTE: Run `supabase db push` or apply via Supabase dashboard for prod.
-- ============================================================

-- ── 1. Create buckets ─────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  (
    'tailor-portfolios',
    'tailor-portfolios',
    true,       -- Public: portfolio images are customer-visible
    15728640,   -- 15 MB per file (images can be compressed client-side)
    ARRAY[
      'image/jpeg', 'image/jpg', 'image/png', 'image/webp',
      'video/mp4', 'video/webm', 'video/quicktime'
    ]
  ),
  (
    'tailor-verification-docs',
    'tailor-verification-docs',
    false,      -- PRIVATE: never publicly accessible
    10485760,   -- 10 MB per file
    ARRAY[
      'image/jpeg', 'image/jpg', 'image/png', 'image/webp',
      'application/pdf'
    ]
  )
ON CONFLICT (id) DO NOTHING;

-- ── 2. tailor-portfolios RLS ─────────────────────────────────
-- Path convention: {tailor_id}/{uuid}.{ext}
-- e.g. "a1b2c3d4-e5f6-7890-abcd-ef1234567890/portfolio-item-uuid.jpg"

-- Anyone (unauthenticated) can read — images are shown on public profile pages
CREATE POLICY "tailor-portfolios: public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'tailor-portfolios');

-- Only the owning tailor can upload to their own folder
CREATE POLICY "tailor-portfolios: tailor upload own"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'tailor-portfolios' AND
    is_tailor() AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Tailor can update metadata on their own objects
CREATE POLICY "tailor-portfolios: tailor update own"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'tailor-portfolios' AND
    is_tailor() AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Tailor can delete their own portfolio items
CREATE POLICY "tailor-portfolios: tailor delete own"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'tailor-portfolios' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Admin full access
CREATE POLICY "tailor-portfolios: admin all"
  ON storage.objects FOR ALL
  USING (bucket_id = 'tailor-portfolios' AND is_admin());

-- ── 3. tailor-verification-docs RLS ─────────────────────────
-- Path convention: {tailor_id}/{doc_type}.{ext}
-- e.g. "a1b2c3d4-e5f6-7890-abcd-ef1234567890/govt_id.pdf"
-- CRITICAL: NO public SELECT policy. Admins generate signed URLs
-- server-side via a protected API route using the service-role key.

-- Tailor can upload/read/delete their own verification documents
CREATE POLICY "tailor-verification-docs: tailor read own"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'tailor-verification-docs' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "tailor-verification-docs: tailor upload own"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'tailor-verification-docs' AND
    is_tailor() AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "tailor-verification-docs: tailor delete own"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'tailor-verification-docs' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Admin full access (can read all docs to generate signed review URLs)
CREATE POLICY "tailor-verification-docs: admin all"
  ON storage.objects FOR ALL
  USING (bucket_id = 'tailor-verification-docs' AND is_admin());
