-- ============================================================
-- Migration: Scope Design Requests Admin Policy to Authenticated
-- Version: 20261003000000
-- File: supabase/migrations/20261003000000_scope_design_requests_admin_policy.sql
-- Description: Restricts "design_requests: admin full access" from {public}
--              to {authenticated} to eliminate nested is_admin() evaluation
--              during public Explore relational queries.
-- ============================================================

DROP POLICY IF EXISTS "design_requests: admin full access" ON public.design_requests;
CREATE POLICY "design_requests: admin full access"
  ON public.design_requests
  AS PERMISSIVE FOR ALL
  TO authenticated
  USING (is_admin());
