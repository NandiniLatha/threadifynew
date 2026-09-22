-- ============================================================
-- Migration: Fix Tailor Read Policy
-- Version: 20260913000002
-- Updates the RLS policy so tailors can read design requests 
-- that are in BOTH 'pending_bids' and 'quoted' status.
-- Previously they lost visibility once any tailor quoted on it.
-- ============================================================

DROP POLICY IF EXISTS "Allow tailors to read pending design requests" ON public.design_requests;

CREATE POLICY "Allow tailors to read pending design requests" ON public.design_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.role = 'tailor'::user_role
    ) AND status IN ('pending_bids'::request_status, 'quoted'::request_status)
  );
