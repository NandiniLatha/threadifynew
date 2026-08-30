-- ============================================================
-- Threadify — Security & Privacy Hardening Migration
-- Migration: 20260830000001_security_privacy_hardening.sql
-- ============================================================

-- ── 1. Users Table Privacy Hardening ─────────────────────────
-- Drop the overly permissive public SELECT policy that exposed email/phone
DROP POLICY IF EXISTS "Allow public read access to profiles" ON public.users;
DROP POLICY IF EXISTS "users: public read profiles" ON public.users;
DROP POLICY IF EXISTS "users: owner read own" ON public.users;
DROP POLICY IF EXISTS "users: public read tailors" ON public.users;
DROP POLICY IF EXISTS "users: participants read connected party" ON public.users;

-- Policy A: Users have full SELECT access to their own account row (includes private email/phone)
CREATE POLICY "users: owner read own"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

-- Policy B: Public & marketplace clients can discover tailor profiles (tailors are public businesses)
CREATE POLICY "users: public read tailors"
  ON public.users FOR SELECT
  USING (role = 'tailor'::user_role);

-- Policy C: Customers and tailors in an active order can see each other's party details
CREATE POLICY "users: participants read connected party"
  ON public.users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.design_requests dr
      WHERE (dr.customer_id = public.users.id AND dr.tailor_id = auth.uid())
         OR (dr.tailor_id = public.users.id AND dr.customer_id = auth.uid())
    )
  );

-- ── 2. Scoped Tailor Measurement Access ───────────────────────
-- Allow assigned tailors on active commissions to view the customer's measurements
DROP POLICY IF EXISTS "measurements: assigned tailor read active orders" ON public.measurements;
CREATE POLICY "measurements: assigned tailor read active orders"
  ON public.measurements FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.design_requests dr
      WHERE dr.customer_id = public.measurements.user_id
        AND dr.tailor_id = auth.uid()
        AND dr.status IN ('assigned', 'in_production', 'delivered')
    )
  );
