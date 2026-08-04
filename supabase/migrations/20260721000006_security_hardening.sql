-- ============================================================
-- Migration: Security Hardening (Auth & RLS)
-- Version: 20260721000006
-- ============================================================

-- ── 1. Fix Privilege Escalation in Profile Creation ──────────
-- The previous trigger blindly trusted the client's role metadata.
-- We now hardcode the default role to 'customer'. Any role 
-- escalation must happen via a secure admin action later.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, role, name, phone)
  VALUES (
    new.id,
    new.email,
    'customer'::user_role,  -- SECURE: Hardcoded default, ignores client metadata
    COALESCE(new.raw_user_meta_data->>'name', ''),
    COALESCE(new.raw_user_meta_data->>'phone', '')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- SECURE: 'security definer' means it runs with elevated privileges
-- so it can insert into users even though the unauthenticated user can't.

-- ── 2. Admin Actions Audit Log ───────────────────────────────
-- To track sensitive role changes or manual overrides.

CREATE TABLE IF NOT EXISTS public.admin_actions (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id     uuid NOT NULL REFERENCES public.users(id),
  action_type  text NOT NULL,
  target_user  uuid REFERENCES public.users(id),
  metadata     jsonb DEFAULT '{}'::jsonb,
  ip_address   text,
  created_at   timestamp with time zone DEFAULT timezone('utc', now()) NOT NULL
);

ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_actions: admins only"
  ON public.admin_actions FOR ALL
  USING (is_admin());

-- ── 3. Lock Down Profiles (users) RLS ────────────────────────
-- Remove the dangerously permissive public read policy.

DROP POLICY IF EXISTS "Allow public read access to profiles" ON public.users;
DROP POLICY IF EXISTS "Allow users to update their own profiles" ON public.users;

-- Policy A: Everyone can read their own profile.
CREATE POLICY "users: read own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

-- Policy B: Customers can read profiles of tailors they have active requests with.
-- (This ensures the messaging system / order dashboard can load the tailor's name/avatar).
CREATE POLICY "users: read assigned tailor"
  ON public.users FOR SELECT
  USING (
    role = 'tailor' AND
    EXISTS (
      SELECT 1 FROM public.design_requests dr
      WHERE dr.tailor_id = users.id AND dr.customer_id = auth.uid()
    )
  );

-- Policy C: Tailors can read profiles of customers they are assigned to or are bidding on.
CREATE POLICY "users: read assigned customer"
  ON public.users FOR SELECT
  USING (
    role = 'customer' AND
    is_tailor() AND
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

-- Policy D: Public read access ONLY for verified tailors.
-- (Required for the Explore page so anyone can see tailor names/avatars).
CREATE POLICY "users: public read verified tailors"
  ON public.users FOR SELECT
  USING (
    role = 'tailor' AND
    EXISTS (
      SELECT 1 FROM public.tailor_profiles tp
      WHERE tp.user_id = users.id AND tp.verification_status = 'approved'
    )
  );

-- Policy E: Users can update their own profile fields securely.
-- (We restrict what fields they can update via the frontend API, but at the DB layer they can update their row).
CREATE POLICY "users: update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy F: Admin full access (already added in migration 20260721000004, but re-asserting here safely)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'users: admin full access'
  ) THEN
    CREATE POLICY "users: admin full access"
      ON public.users FOR ALL
      USING (is_admin());
  END IF;
END $$;
