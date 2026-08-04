-- ============================================================
-- Migration: RLS Policies for New Tables + Admin Access
-- Version: 20260721000004
-- Default-deny is already on (ENABLE ROW LEVEL SECURITY done
-- in migration 1). This migration adds explicit ALLOW policies.
-- Pattern: default deny → explicit allow for each role
-- ============================================================

-- ── Helper: admin role check ──────────────────────────────────
-- Used in policy expressions so we don't repeat the sub-select
-- everywhere. Marked STABLE + SECURITY DEFINER so it can be
-- called from policy expressions without infinite recursion.

CREATE OR REPLACE FUNCTION is_admin() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  )
$$;

CREATE OR REPLACE FUNCTION is_tailor() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'tailor'
  )
$$;

-- ── addresses ────────────────────────────────────────────────

CREATE POLICY "addresses: owner full access"
  ON public.addresses FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "addresses: admin read"
  ON public.addresses FOR SELECT
  USING (is_admin());

-- ── design_request_images ─────────────────────────────────────

-- Customer can read images for their own requests
CREATE POLICY "dri: customer read own"
  ON public.design_request_images FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.design_requests dr
      WHERE dr.id = request_id AND dr.customer_id = auth.uid()
    )
  );

-- Tailors can read images for requests they have a quote on or are assigned to
CREATE POLICY "dri: tailor read accessible requests"
  ON public.design_request_images FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.design_requests dr
      WHERE dr.id = request_id AND (
        dr.tailor_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.quotations q
          WHERE q.request_id = dr.id AND q.tailor_id = auth.uid()
        )
      )
    )
  );

-- Tailors can read images for pending_bids requests (to decide whether to bid)
CREATE POLICY "dri: tailor read pending"
  ON public.design_request_images FOR SELECT
  USING (
    is_tailor() AND
    EXISTS (
      SELECT 1 FROM public.design_requests dr
      WHERE dr.id = request_id AND dr.status = 'pending_bids'
    )
  );

-- Customer (or tailor) can upload images for their request/associated request
CREATE POLICY "dri: customer insert own"
  ON public.design_request_images FOR INSERT
  WITH CHECK (
    auth.uid() = uploaded_by AND
    EXISTS (
      SELECT 1 FROM public.design_requests dr
      WHERE dr.id = request_id AND dr.customer_id = auth.uid()
    )
  );

-- Customer can delete their own request images
CREATE POLICY "dri: customer delete own"
  ON public.design_request_images FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.design_requests dr
      WHERE dr.id = request_id AND dr.customer_id = auth.uid()
    )
  );

CREATE POLICY "dri: admin full access"
  ON public.design_request_images FOR ALL
  USING (is_admin());

-- ── order_status_history ─────────────────────────────────────
-- Immutable audit log — no update/delete for non-admins

CREATE POLICY "osh: customer read own order history"
  ON public.order_status_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.design_requests dr
      WHERE dr.id = order_id AND dr.customer_id = auth.uid()
    )
  );

CREATE POLICY "osh: tailor read assigned order history"
  ON public.order_status_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.design_requests dr
      WHERE dr.id = order_id AND dr.tailor_id = auth.uid()
    )
  );

CREATE POLICY "osh: admin full access"
  ON public.order_status_history FOR ALL
  USING (is_admin());

-- ── measurements ─────────────────────────────────────────────

CREATE POLICY "measurements: owner full access"
  ON public.measurements FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "measurements: admin read"
  ON public.measurements FOR SELECT
  USING (is_admin());

-- ── payments ─────────────────────────────────────────────────

CREATE POLICY "payments: customer read own"
  ON public.payments FOR SELECT
  USING (auth.uid() = customer_id);

CREATE POLICY "payments: tailor read own"
  ON public.payments FOR SELECT
  USING (auth.uid() = tailor_id);

-- Only server-side (service role) or admin inserts payment records
-- The anon key + RLS path: customer row insert is NOT allowed client-side;
-- all payment inserts go through the server-side API route with service-role.
CREATE POLICY "payments: admin full access"
  ON public.payments FOR ALL
  USING (is_admin());

-- ── conversations ─────────────────────────────────────────────

CREATE POLICY "conversations: customer read own"
  ON public.conversations FOR SELECT
  USING (auth.uid() = customer_id);

CREATE POLICY "conversations: tailor read own"
  ON public.conversations FOR SELECT
  USING (auth.uid() = tailor_id);

CREATE POLICY "conversations: admin full access"
  ON public.conversations FOR ALL
  USING (is_admin());

-- Conversations are created/updated by server triggers only —
-- no client-side INSERT policy needed.

-- ── activity_logs ─────────────────────────────────────────────
-- Admin-only; no customer access

CREATE POLICY "activity_logs: admin full access"
  ON public.activity_logs FOR ALL
  USING (is_admin());

-- ── Augment existing tables with admin policies ───────────────
-- (existing user/tailor/customer policies remain unchanged)

-- users — admin full access
DROP POLICY IF EXISTS "users: admin full access" ON public.users;
CREATE POLICY "users: admin full access"
  ON public.users FOR ALL
  USING (is_admin());

-- design_requests — admin full access
DROP POLICY IF EXISTS "design_requests: admin full access" ON public.design_requests;
CREATE POLICY "design_requests: admin full access"
  ON public.design_requests FOR ALL
  USING (is_admin());

-- tailor_profiles — admin full access
DROP POLICY IF EXISTS "tailor_profiles: admin full access" ON public.tailor_profiles;
CREATE POLICY "tailor_profiles: admin full access"
  ON public.tailor_profiles FOR ALL
  USING (is_admin());

-- quotations — admin full access
DROP POLICY IF EXISTS "quotations: admin full access" ON public.quotations;
CREATE POLICY "quotations: admin full access"
  ON public.quotations FOR ALL
  USING (is_admin());

-- messages — admin full access
DROP POLICY IF EXISTS "messages: admin full access" ON public.messages;
CREATE POLICY "messages: admin full access"
  ON public.messages FOR ALL
  USING (is_admin());

-- reviews — admin full access
DROP POLICY IF EXISTS "reviews: admin full access" ON public.reviews;
CREATE POLICY "reviews: admin full access"
  ON public.reviews FOR ALL
  USING (is_admin());

-- notifications — admin full access
DROP POLICY IF EXISTS "notifications: admin full access" ON public.notifications;
CREATE POLICY "notifications: admin full access"
  ON public.notifications FOR ALL
  USING (is_admin());

-- disputes — already has admin policy in migration 1, verify:
DROP POLICY IF EXISTS "disputes: admin full access" ON public.disputes;
CREATE POLICY "disputes: admin full access"
  ON public.disputes FOR ALL
  USING (is_admin());

-- wishlist_items — admin full access
DROP POLICY IF EXISTS "wishlist_items: admin full access" ON public.wishlist_items;
CREATE POLICY "wishlist_items: admin full access"
  ON public.wishlist_items FOR ALL
  USING (is_admin());

-- saved_tailors — admin full access
DROP POLICY IF EXISTS "saved_tailors: admin full access" ON public.saved_tailors;
CREATE POLICY "saved_tailors: admin full access"
  ON public.saved_tailors FOR ALL
  USING (is_admin());
