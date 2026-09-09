-- Migration: 20260904000002_tailor_progress_photos_rls.sql
--
-- Re-adds full RLS policies for design_request_images to address cases where pg_policies
-- may be missing them.
--
-- Security model:
--   - Customers can SELECT images belonging to their own order.
--   - Tailors can SELECT images belonging to orders assigned to them.
--   - Tailors can INSERT progress photos (is_primary=false, scoped to auth.uid() & tailor_id).
--   - No UPDATE or DELETE for tailors (progress photos are immutable once posted).

-- First, ensure RLS is enabled
ALTER TABLE public.design_request_images ENABLE ROW LEVEL SECURITY;

-- 1. Customer SELECT policy
-- Customers can read images for their own requests
DROP POLICY IF EXISTS "dri: customer read own" ON public.design_request_images;
CREATE POLICY "dri: customer read own"
  ON public.design_request_images FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.design_requests dr
      WHERE dr.id = request_id AND dr.customer_id = auth.uid()
    )
  );

-- 2. Tailor SELECT policy
-- Tailors can read images for requests they are assigned to
DROP POLICY IF EXISTS "dri: tailor read accessible requests" ON public.design_request_images;
CREATE POLICY "dri: tailor read accessible requests"
  ON public.design_request_images FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.design_requests dr
      WHERE dr.id = request_id AND dr.tailor_id = auth.uid()
    )
  );

-- 3. Tailor INSERT policy
-- Tailors can upload progress photos for their assigned orders
DROP POLICY IF EXISTS "dri: tailor insert progress photos" ON public.design_request_images;
CREATE POLICY "dri: tailor insert progress photos"
  ON public.design_request_images FOR INSERT
  WITH CHECK (
    auth.uid() = uploaded_by
    AND EXISTS (
      SELECT 1 FROM public.design_requests dr
      WHERE dr.id = request_id
        AND dr.tailor_id = auth.uid()
    )
  );
