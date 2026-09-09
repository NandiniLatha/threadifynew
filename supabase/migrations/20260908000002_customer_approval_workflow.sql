-- ============================================================
-- Migration: Customer Approval Workflow
-- Version: 20260908000002
-- Description: Introduces strict customer approval and evidence 
--              tracking for the production workflow.
-- ============================================================

-- 1. Create the new enum for evidence status
DO $$ BEGIN
  CREATE TYPE production_evidence_status_type AS ENUM (
    'none', 'waiting_for_customer_approval', 'changes_requested'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. Add the status to design_requests
ALTER TABLE public.design_requests
  ADD COLUMN IF NOT EXISTS production_evidence_status production_evidence_status_type NOT NULL DEFAULT 'none';

-- 3. Add production_stage to design_request_images so photos can be linked to a specific stage
ALTER TABLE public.design_request_images
  ADD COLUMN IF NOT EXISTS production_stage request_status;

-- 4. Create production_feedback table to store requested changes
CREATE TABLE IF NOT EXISTS public.production_feedback (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id uuid NOT NULL REFERENCES public.design_requests(id) ON DELETE CASCADE,
  production_stage request_status NOT NULL,
  customer_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  comment text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc', now()) NOT NULL
);

-- 5. Enable RLS on production_feedback
ALTER TABLE public.production_feedback ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies for production_feedback
-- Customers can read their own feedback
DROP POLICY IF EXISTS "production_feedback: customer read own" ON public.production_feedback;
CREATE POLICY "production_feedback: customer read own"
  ON public.production_feedback FOR SELECT
  USING (
    customer_id = auth.uid()
  );

-- Tailors can read feedback for requests they are assigned to
DROP POLICY IF EXISTS "production_feedback: tailor read assigned" ON public.production_feedback;
CREATE POLICY "production_feedback: tailor read assigned"
  ON public.production_feedback FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.design_requests dr
      WHERE dr.id = request_id AND dr.tailor_id = auth.uid()
    )
  );

-- Customers can insert feedback for their own requests
DROP POLICY IF EXISTS "production_feedback: customer insert own" ON public.production_feedback;
CREATE POLICY "production_feedback: customer insert own"
  ON public.production_feedback FOR INSERT
  WITH CHECK (
    customer_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.design_requests dr
      WHERE dr.id = request_id AND dr.customer_id = auth.uid()
    )
  );

-- Admin read all
DROP POLICY IF EXISTS "production_feedback: admin read all" ON public.production_feedback;
CREATE POLICY "production_feedback: admin read all"
  ON public.production_feedback FOR SELECT
  USING (is_admin());
