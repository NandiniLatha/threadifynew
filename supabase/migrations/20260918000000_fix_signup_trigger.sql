-- ============================================================
-- Migration: Fix signup trigger schema resolution and secure roles
-- Version: 20260918000000
-- ============================================================

-- ── 1. Fix schema resolution and enforce secure registration ──────────
-- The previous trigger (20260721000006) failed because the `user_role` type
-- was not schema-qualified and no safe search_path was set.
-- 
-- SECURITY NOTE: We do NOT blindly trust the client-provided role. The 'tailor'
-- role has elevated privileges (e.g., viewing customer profiles and requests).
-- Allowing users to instantly self-promote to 'tailor' bypasses manual review.
-- Instead, ALL new users are explicitly created as 'customer' in public.users. 
-- If a user requests the 'tailor' role during signup, it remains safely preserved 
-- in `auth.users.raw_user_meta_data->>'role'`. An admin or secure backend 
-- process can later review this and promote the user to 'tailor'.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- ALWAYS insert as 'customer' initially to prevent privilege escalation.
  INSERT INTO public.users (id, email, role, name, phone)
  VALUES (
    new.id,
    new.email,
    'customer'::public.user_role,
    COALESCE(new.raw_user_meta_data->>'name', ''),
    COALESCE(new.raw_user_meta_data->>'phone', '')
  );
  
  RETURN new;
END;
$$;

-- ============================================================
-- Rollback Plan:
-- Do NOT restore the previous trigger from 20260721000006 as it 
-- contains a critical defect (missing schema qualification and 
-- search_path) that causes all signups to fail. 
-- 
-- If this migration needs to be rolled back, you must write a 
-- forward-fixing migration or revert to the original functional 
-- state from 20260709000000. Do not blindly copy the broken 
-- trigger back into production.
-- ============================================================
