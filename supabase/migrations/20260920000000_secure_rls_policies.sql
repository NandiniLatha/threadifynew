-- ============================================================
-- Migration: Secure RLS Policies and Role Updates
-- Version: 20260920000000
-- Fixes critical vulnerabilities where RLS relied on user_metadata
-- which can be manipulated. Instead safely reads from public.users
-- bypassing recursion with plpgsql and SECURITY DEFINER.
-- ============================================================

-- 1. Redefine is_admin() securely to prevent recursion
-- Using PL/pgSQL prevents function inlining which was the root cause of the RLS infinite recursion.
-- SECURITY DEFINER and search_path bypass RLS for the duration of the check.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$;

-- Secure is_admin() from public/anon execution
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, service_role;

-- 2. Redefine is_tailor() securely to prevent recursion
CREATE OR REPLACE FUNCTION public.is_tailor()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'tailor'
  );
END;
$$;

-- Secure is_tailor() from public/anon execution
REVOKE EXECUTE ON FUNCTION public.is_tailor() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_tailor() FROM anon;
GRANT EXECUTE ON FUNCTION public.is_tailor() TO authenticated, service_role;

-- 3. Prevent users from updating their own roles via API
-- This ensures customers cannot maliciously escalate their privileges to 'tailor' or 'admin'
-- by passing a custom 'role' field when updating their profiles.
CREATE OR REPLACE FUNCTION public.prevent_role_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_caller_role text;
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    -- Get the Supabase Auth role from the JWT securely, handling NULL or empty strings
    v_caller_role := (COALESCE(NULLIF(current_setting('request.jwt.claims', true), ''), '{}'))::jsonb ->> 'role';

    -- 1. Allow backend service_role bypass
    IF v_caller_role = 'service_role' THEN
      RETURN NEW;
    END IF;

    -- 2. Allow direct database connections from superusers (e.g. Supabase Dashboard SQL Editor)
    -- PostgREST API connections use the 'authenticator' session_user, so this safely 
    -- distinguishes true dashboard/admin queries from API requests missing a JWT.
    IF v_caller_role IS NULL AND session_user IN ('postgres', 'supabase_admin') THEN
      RETURN NEW;
    END IF;

    -- 3. Otherwise, verify the executing user is an authenticated admin
    IF NOT public.is_admin() THEN
      RAISE EXCEPTION 'Unauthorized: Only admins can change user roles';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Secure the trigger function from direct RPC execution
REVOKE EXECUTE ON FUNCTION public.prevent_role_update() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.prevent_role_update() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_role_update() FROM anon;

DROP TRIGGER IF EXISTS trg_prevent_role_update ON public.users;
CREATE TRIGGER trg_prevent_role_update
BEFORE UPDATE ON public.users
FOR EACH ROW EXECUTE PROCEDURE public.prevent_role_update();

-- 4. Fix policy 1: "users: admin full access"
DROP POLICY IF EXISTS "users: admin full access" ON public.users;
CREATE POLICY "users: admin full access"
  ON public.users
  AS PERMISSIVE FOR ALL
  TO authenticated
  USING ( public.is_admin() )
  WITH CHECK ( public.is_admin() );

-- 5. Fix policy 2: "users: read assigned customer"
DROP POLICY IF EXISTS "users: read assigned customer" ON public.users;
CREATE POLICY "users: read assigned customer"
  ON public.users
  AS PERMISSIVE FOR SELECT
  TO authenticated
  USING (
    role = 'customer' AND
    public.is_tailor() AND
    EXISTS (
      SELECT 1 FROM public.design_requests dr
      WHERE dr.customer_id = users.id AND (
        dr.tailor_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.quotations q
          WHERE q.request_id = dr.id AND q.tailor_id = auth.uid()
        )
      )
    )
  );

-- 6. Fix policy 3: "Allow tailors to read pending design requests"
DROP POLICY IF EXISTS "Allow tailors to read pending design requests" ON public.design_requests;
CREATE POLICY "Allow tailors to read pending design requests" ON public.design_requests
  AS PERMISSIVE FOR SELECT
  TO authenticated 
  USING (
    public.is_tailor() AND
    status IN ('pending_bids'::request_status, 'quoted'::request_status)
  );
