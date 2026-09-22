-- ============================================================
-- Migration: Fix Tailor Measurement Access RLS Policy
-- Version: 20260922000002
-- ============================================================

-- Allow assigned tailors on any active order state (including paid, confirmed, measurements_pending)
-- to view the customer's measurements.

DROP POLICY IF EXISTS "measurements: assigned tailor read active orders" ON public.measurements;

CREATE POLICY "measurements: assigned tailor read active orders"
  ON public.measurements FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.design_requests dr
      WHERE dr.customer_id = public.measurements.user_id
        AND dr.tailor_id = auth.uid()
        AND dr.status IN (
          'assigned', 'paid', 'confirmed', 'measurements_pending',
          'cutting', 'stitching', 'quality_check', 'ready',
          'in_production', 'shipped', 'delivered', 'completed', 'reviewed'
        )
    )
  );
