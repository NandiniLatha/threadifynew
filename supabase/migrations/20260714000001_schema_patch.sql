-- ============================================================
-- Schema Patch: design_requests extended columns + enum update
-- Applied to: design_requests table
-- Adds: payment tracking, tailor assignment, delivery fields
-- ============================================================

-- Extend request_status enum with missing values
-- (Run these one at a time if using Supabase dashboard)
ALTER TYPE request_status ADD VALUE IF NOT EXISTS 'paid';
ALTER TYPE request_status ADD VALUE IF NOT EXISTS 'in_production';
ALTER TYPE request_status ADD VALUE IF NOT EXISTS 'shipped';
ALTER TYPE request_status ADD VALUE IF NOT EXISTS 'reviewed';

-- Add assignment and payment columns to design_requests
ALTER TABLE public.design_requests
  ADD COLUMN IF NOT EXISTS tailor_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS accepted_quotation_id uuid REFERENCES public.quotations(id) ON DELETE SET NULL,
  -- Razorpay fields — left NULL until real integration is wired
  ADD COLUMN IF NOT EXISTS razorpay_order_id text,
  ADD COLUMN IF NOT EXISTS razorpay_payment_id text,
  -- Payment tracking
  ADD COLUMN IF NOT EXISTS amount_paid numeric(10, 2),
  ADD COLUMN IF NOT EXISTS platform_commission numeric(10, 2),
  -- Delivery confirmation timestamp
  ADD COLUMN IF NOT EXISTS delivered_confirmed_at timestamp with time zone;

-- Allow tailors to read orders assigned to them
-- (they previously could only read 'pending_bids' requests)
DROP POLICY IF EXISTS "Allow tailors to read their assigned orders" ON public.design_requests;
CREATE POLICY "Allow tailors to read their assigned orders" ON public.design_requests
  FOR SELECT USING (
    auth.uid() = tailor_id
  );

-- Allow the server (service role) to update any design_request
-- This is needed for the mock-pay and advance-status API routes
-- which run with the anon key but act on behalf of authenticated users.
-- In production, consider a service-role key for these server actions.
DROP POLICY IF EXISTS "Allow customers to update status of own requests" ON public.design_requests;
CREATE POLICY "Allow customers to update status of own requests" ON public.design_requests
  FOR UPDATE USING (auth.uid() = customer_id);

-- NOTE: The advance-status route (tailor updating status) requires either:
-- (a) a service role key, or
-- (b) an additional RLS policy:
DROP POLICY IF EXISTS "Allow assigned tailor to update order status" ON public.design_requests;
CREATE POLICY "Allow assigned tailor to update order status" ON public.design_requests
  FOR UPDATE USING (auth.uid() = tailor_id);
