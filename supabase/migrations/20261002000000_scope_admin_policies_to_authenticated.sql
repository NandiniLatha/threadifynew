-- ============================================================
-- Migration: Scope Admin Policies to Authenticated Role
-- Version: 20261002000000
-- File: supabase/migrations/20261002000000_scope_admin_policies_to_authenticated.sql
-- Description: Restricts admin RLS policies from {public} to {authenticated}
--              on public catalog tables so anonymous users are not evaluated
--              against is_admin(), resolving the PostgREST Explore permission error.
-- ============================================================

-- ── 1. tailor_profiles ────────────────────────────────────────
DROP POLICY IF EXISTS "tailor_profiles: admin full access" ON public.tailor_profiles;
CREATE POLICY "tailor_profiles: admin full access"
  ON public.tailor_profiles
  AS PERMISSIVE FOR ALL
  TO authenticated
  USING (is_admin());

-- ── 2. reviews ────────────────────────────────────────────────
DROP POLICY IF EXISTS "reviews: admin full access" ON public.reviews;
CREATE POLICY "reviews: admin full access"
  ON public.reviews
  AS PERMISSIVE FOR ALL
  TO authenticated
  USING (is_admin());

-- ── 3. tailor_specializations ─────────────────────────────────
DROP POLICY IF EXISTS "tailor_specializations: admin full access" ON public.tailor_specializations;
CREATE POLICY "tailor_specializations: admin full access"
  ON public.tailor_specializations
  AS PERMISSIVE FOR ALL
  TO authenticated
  USING (is_admin());

-- ── 4. tailor_skills ──────────────────────────────────────────
DROP POLICY IF EXISTS "tailor_skills: admin full access" ON public.tailor_skills;
CREATE POLICY "tailor_skills: admin full access"
  ON public.tailor_skills
  AS PERMISSIVE FOR ALL
  TO authenticated
  USING (is_admin());

-- ── 5. tailor_experience ──────────────────────────────────────
DROP POLICY IF EXISTS "tailor_experience: admin full access" ON public.tailor_experience;
CREATE POLICY "tailor_experience: admin full access"
  ON public.tailor_experience
  AS PERMISSIVE FOR ALL
  TO authenticated
  USING (is_admin());

-- ── 6. tailor_pricing ─────────────────────────────────────────
DROP POLICY IF EXISTS "tailor_pricing: admin full access" ON public.tailor_pricing;
CREATE POLICY "tailor_pricing: admin full access"
  ON public.tailor_pricing
  AS PERMISSIVE FOR ALL
  TO authenticated
  USING (is_admin());

-- ── 7. tailor_availability ────────────────────────────────────
DROP POLICY IF EXISTS "tailor_availability: admin full access" ON public.tailor_availability;
CREATE POLICY "tailor_availability: admin full access"
  ON public.tailor_availability
  AS PERMISSIVE FOR ALL
  TO authenticated
  USING (is_admin());

-- ── 8. tailor_delivery_options ────────────────────────────────
DROP POLICY IF EXISTS "tailor_delivery_options: admin full access" ON public.tailor_delivery_options;
CREATE POLICY "tailor_delivery_options: admin full access"
  ON public.tailor_delivery_options
  AS PERMISSIVE FOR ALL
  TO authenticated
  USING (is_admin());

-- ── 9. tailor_portfolio_items ─────────────────────────────────
DROP POLICY IF EXISTS "tailor_portfolio_items: admin full access" ON public.tailor_portfolio_items;
CREATE POLICY "tailor_portfolio_items: admin full access"
  ON public.tailor_portfolio_items
  AS PERMISSIVE FOR ALL
  TO authenticated
  USING (is_admin());

-- ── 10. tailor_social_links ───────────────────────────────────
DROP POLICY IF EXISTS "tailor_social_links: admin full access" ON public.tailor_social_links;
CREATE POLICY "tailor_social_links: admin full access"
  ON public.tailor_social_links
  AS PERMISSIVE FOR ALL
  TO authenticated
  USING (is_admin());

-- ── 11. tailor_certifications ─────────────────────────────────
DROP POLICY IF EXISTS "tailor_certifications: admin full access" ON public.tailor_certifications;
CREATE POLICY "tailor_certifications: admin full access"
  ON public.tailor_certifications
  AS PERMISSIVE FOR ALL
  TO authenticated
  USING (is_admin());
