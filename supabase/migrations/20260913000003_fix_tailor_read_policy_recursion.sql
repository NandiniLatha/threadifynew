-- ============================================================
-- Migration: Fix Tailor Read Policy Recursion
-- Version: 20260913000003
-- Resolves an infinite recursion bug introduced in the previous
-- migration (20260913000002) which queried public.users.
-- Replaces it with the safe JWT metadata check, and preserves
-- the fix that allows tailors to read both pending_bids and
-- quoted requests.
-- ============================================================

DROP POLICY IF EXISTS "Allow tailors to read pending design requests" ON public.design_requests;

CREATE POLICY "Allow tailors to read pending design requests" ON public.design_requests
  FOR SELECT USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'tailor' AND
    status IN ('pending_bids'::request_status, 'quoted'::request_status)
  );
