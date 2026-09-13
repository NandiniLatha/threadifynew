-- ============================================================
-- Migration: Secure Order Transitions RLS
-- Version: 20260913000000
-- Drops the open UPDATE policies on design_requests that allowed
-- clients to bypass the API server's payment and image validation.
-- All state transitions must now route through the Next.js API
-- (which uses the Service Role key) or SECURITY DEFINER RPCs.
-- ============================================================

DROP POLICY IF EXISTS "Allow customers to update status of own requests" ON public.design_requests;
DROP POLICY IF EXISTS "Allow assigned tailor to update order status" ON public.design_requests;
