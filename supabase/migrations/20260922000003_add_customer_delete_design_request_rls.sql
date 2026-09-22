-- ============================================================
-- Migration: Customer Delete Design Request RLS Policy
-- Version: 20260922000003
-- Description: Allows customers to delete their own design requests 
--              strictly when they are in a cancellable state.
-- ============================================================

-- Customers can delete their own cancellable design requests
DROP POLICY IF EXISTS "Allow customers to delete own cancellable design requests" ON public.design_requests;
CREATE POLICY "Allow customers to delete own cancellable design requests"
  ON public.design_requests
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() = customer_id
    AND status IN ('draft'::request_status, 'pending_bids'::request_status, 'quoted'::request_status, 'cancelled'::request_status)
  );
