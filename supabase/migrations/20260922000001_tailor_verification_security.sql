-- ============================================================
-- Migration: Tailor Verification Security & Automatic Role Sync
-- Version: 20260922000001
-- Description: 
--   1. Prevents non-admin users from modifying tailor verification_status.
--   2. Automatically syncs public.users.role to 'tailor' when tailor_profiles.verification_status becomes 'approved'.
-- ============================================================

-- ── 1. Prevent Non-Admin Self-Approval on tailor_profiles ────
CREATE OR REPLACE FUNCTION public.prevent_tailor_verification_self_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_caller_role text;
BEGIN
  IF NEW.verification_status IS DISTINCT FROM OLD.verification_status THEN
    v_caller_role := (COALESCE(NULLIF(current_setting('request.jwt.claims', true), ''), '{}'))::jsonb ->> 'role';
    
    -- Allow service_role bypass (backend admin client)
    IF v_caller_role = 'service_role' THEN
      RETURN NEW;
    END IF;

    -- Allow superuser / SQL editor connections
    IF v_caller_role IS NULL AND session_user IN ('postgres', 'supabase_admin') THEN
      RETURN NEW;
    END IF;

    -- Allow authenticated admin users
    IF public.is_admin() THEN
      RETURN NEW;
    END IF;

    -- Reject all other role modification attempts
    RAISE EXCEPTION 'Unauthorized: Only admins can modify tailor verification status';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.prevent_tailor_verification_self_update() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.prevent_tailor_verification_self_update() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_tailor_verification_self_update() FROM anon;

DROP TRIGGER IF EXISTS trg_prevent_tailor_verification_self_update ON public.tailor_profiles;
CREATE TRIGGER trg_prevent_tailor_verification_self_update
BEFORE UPDATE ON public.tailor_profiles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_tailor_verification_self_update();


-- ── 2. Automatic Atomic Role Sync on Tailor Approval ──────────
CREATE OR REPLACE FUNCTION public.sync_tailor_verification_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- When verification_status transitions to 'approved', promote public.users.role to 'tailor'
  IF NEW.verification_status = 'approved' AND (OLD.verification_status IS DISTINCT FROM 'approved') THEN
    UPDATE public.users
    SET role = 'tailor'::public.user_role
    WHERE id = NEW.user_id;
  END IF;
  
  -- If an approved tailor application is later revoked/rejected, demote back to 'customer'
  IF NEW.verification_status IN ('rejected', 'suspended') AND OLD.verification_status = 'approved' THEN
    UPDATE public.users
    SET role = 'customer'::public.user_role
    WHERE id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.sync_tailor_verification_role() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.sync_tailor_verification_role() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_tailor_verification_role() FROM anon;

DROP TRIGGER IF EXISTS trg_sync_tailor_verification_role ON public.tailor_profiles;
CREATE TRIGGER trg_sync_tailor_verification_role
AFTER UPDATE OF verification_status ON public.tailor_profiles
FOR EACH ROW
EXECUTE FUNCTION public.sync_tailor_verification_role();
