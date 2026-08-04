-- ============================================================
-- Migration: Tailor Onboarding & Profile System — Schema
-- Version: 20260728000001
-- Type: ADDITIVE + POLICY UPDATE
-- Adds:
--   - 'suspended' to verification_status_type enum
--   - New columns to tailor_profiles
--   - 10 new normalized tables for structured tailor data
--   - Full RLS policies (tailor/customer/admin) on all new tables
--   - Tightens existing tailor_profiles public SELECT policy so
--     customers only see approved tailors (pending/rejected hidden)
-- Decisions made per audit:
--   - Validation: plain state (existing codebase pattern, no new deps)
--   - Autosave: localStorage (application layer, no new table needed)
--   - Portfolio bucket: new 'tailor-portfolios' per spec (see migration 002)
--   - suspended enum: added as requested
-- ============================================================

-- ── 0. Add 'suspended' to verification_status_type ───────────
-- PostgreSQL enums are append-only; this is safe on live data.

DO $$ BEGIN
  ALTER TYPE verification_status_type ADD VALUE IF NOT EXISTS 'suspended';
EXCEPTION WHEN others THEN NULL; END $$;

-- ── 1. Augment tailor_profiles with new columns ───────────────
-- All additions use IF NOT EXISTS so this migration is re-runnable.

ALTER TABLE public.tailor_profiles
  ADD COLUMN IF NOT EXISTS boutique_name         text,
  ADD COLUMN IF NOT EXISTS profile_photo_url     text,
  ADD COLUMN IF NOT EXISTS age                   integer
    CHECK (age >= 18 AND age <= 100),
  ADD COLUMN IF NOT EXISTS gender                text
    CHECK (gender IN ('male', 'female', 'non_binary', 'prefer_not_to_say')),
  ADD COLUMN IF NOT EXISTS mobile                text,
  ADD COLUMN IF NOT EXISTS languages             text[] DEFAULT '{}'::text[] NOT NULL,
  ADD COLUMN IF NOT EXISTS about                 text,
  ADD COLUMN IF NOT EXISTS fashion_design_degree text,
  ADD COLUMN IF NOT EXISTS gst_number            text,
  ADD COLUMN IF NOT EXISTS onboarding_completed  boolean DEFAULT false NOT NULL;

-- ── 2. Tighten tailor_profiles public read policy ─────────────
-- OLD: FOR SELECT USING (true) — shows pending/rejected to all visitors
-- NEW: customers only see approved; tailors see own regardless of status.
-- Admin full-access policy (migration 20260721000004) is untouched.

DROP POLICY IF EXISTS "Allow public read access to tailor profiles"
  ON public.tailor_profiles;

-- Approved profiles are publicly readable (unauthenticated + customers)
CREATE POLICY "tailor_profiles: public read approved"
  ON public.tailor_profiles FOR SELECT
  USING (verification_status = 'approved');

-- Tailors can always read/write their own profile (any status)
DROP POLICY IF EXISTS "Allow tailors to manage their own profiles"
  ON public.tailor_profiles;

CREATE POLICY "tailor_profiles: tailor own full access"
  ON public.tailor_profiles FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── 3. tailor_specializations ────────────────────────────────

CREATE TABLE IF NOT EXISTS public.tailor_specializations (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tailor_id  uuid NOT NULL
    REFERENCES public.tailor_profiles(user_id) ON DELETE CASCADE,
  name       text NOT NULL CHECK (name IN (
    'mens_wear', 'womens_wear', 'bridal_wear', 'ethnic_wear', 'western_wear',
    'kids_wear', 'luxury_couture', 'alterations', 'uniform_stitching'
  )),
  created_at timestamptz DEFAULT timezone('utc', now()) NOT NULL,
  UNIQUE (tailor_id, name)
);

ALTER TABLE public.tailor_specializations ENABLE ROW LEVEL SECURITY;

-- Customers/public: read specializations of approved tailors only
CREATE POLICY "tailor_specializations: public read approved"
  ON public.tailor_specializations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tailor_profiles tp
      WHERE tp.user_id = tailor_id
        AND tp.verification_status = 'approved'
    )
  );

-- Tailor: full access to own rows (needed during onboarding, pre-approval)
CREATE POLICY "tailor_specializations: tailor own"
  ON public.tailor_specializations FOR ALL
  USING (auth.uid() = tailor_id)
  WITH CHECK (auth.uid() = tailor_id);

-- Admin: full access
CREATE POLICY "tailor_specializations: admin full access"
  ON public.tailor_specializations FOR ALL
  USING (is_admin());

-- ── 4. tailor_skills ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.tailor_skills (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tailor_id  uuid NOT NULL
    REFERENCES public.tailor_profiles(user_id) ON DELETE CASCADE,
  name       text NOT NULL CHECK (name IN (
    'embroidery', 'hand_stitching', 'machine_stitching', 'pattern_making',
    'fashion_illustration', 'custom_measurements', 'fabric_consultation',
    'bridal_designing'
  )),
  created_at timestamptz DEFAULT timezone('utc', now()) NOT NULL,
  UNIQUE (tailor_id, name)
);

ALTER TABLE public.tailor_skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tailor_skills: public read approved"
  ON public.tailor_skills FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tailor_profiles tp
      WHERE tp.user_id = tailor_id
        AND tp.verification_status = 'approved'
    )
  );

CREATE POLICY "tailor_skills: tailor own"
  ON public.tailor_skills FOR ALL
  USING (auth.uid() = tailor_id)
  WITH CHECK (auth.uid() = tailor_id);

CREATE POLICY "tailor_skills: admin full access"
  ON public.tailor_skills FOR ALL
  USING (is_admin());

-- ── 5. tailor_experience ─────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.tailor_experience (
  tailor_id           uuid PRIMARY KEY
    REFERENCES public.tailor_profiles(user_id) ON DELETE CASCADE,
  total_years         integer NOT NULL DEFAULT 0
    CHECK (total_years >= 0),
  previous_boutique   text,
  current_boutique    text,
  freelance_exp_years integer DEFAULT 0
    CHECK (freelance_exp_years >= 0),
  updated_at          timestamptz DEFAULT timezone('utc', now()) NOT NULL
);

ALTER TABLE public.tailor_experience ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS trg_tailor_experience_updated_at
  ON public.tailor_experience;
CREATE TRIGGER trg_tailor_experience_updated_at
  BEFORE UPDATE ON public.tailor_experience
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE POLICY "tailor_experience: public read approved"
  ON public.tailor_experience FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tailor_profiles tp
      WHERE tp.user_id = tailor_id
        AND tp.verification_status = 'approved'
    )
  );

CREATE POLICY "tailor_experience: tailor own"
  ON public.tailor_experience FOR ALL
  USING (auth.uid() = tailor_id)
  WITH CHECK (auth.uid() = tailor_id);

CREATE POLICY "tailor_experience: admin full access"
  ON public.tailor_experience FOR ALL
  USING (is_admin());

-- ── 6. tailor_pricing ────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.tailor_pricing (
  tailor_id               uuid PRIMARY KEY
    REFERENCES public.tailor_profiles(user_id) ON DELETE CASCADE,
  stitching_charge        numeric(10,2) CHECK (stitching_charge >= 0),
  consultation_fee        numeric(10,2) CHECK (consultation_fee >= 0),
  starting_price          numeric(10,2) CHECK (starting_price >= 0),
  premium_package         numeric(10,2) CHECK (premium_package >= 0),
  express_delivery_charge numeric(10,2) CHECK (express_delivery_charge >= 0),
  updated_at              timestamptz DEFAULT timezone('utc', now()) NOT NULL
);

ALTER TABLE public.tailor_pricing ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS trg_tailor_pricing_updated_at
  ON public.tailor_pricing;
CREATE TRIGGER trg_tailor_pricing_updated_at
  BEFORE UPDATE ON public.tailor_pricing
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE POLICY "tailor_pricing: public read approved"
  ON public.tailor_pricing FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tailor_profiles tp
      WHERE tp.user_id = tailor_id
        AND tp.verification_status = 'approved'
    )
  );

CREATE POLICY "tailor_pricing: tailor own"
  ON public.tailor_pricing FOR ALL
  USING (auth.uid() = tailor_id)
  WITH CHECK (auth.uid() = tailor_id);

CREATE POLICY "tailor_pricing: admin full access"
  ON public.tailor_pricing FOR ALL
  USING (is_admin());

-- ── 7. tailor_availability ───────────────────────────────────

CREATE TABLE IF NOT EXISTS public.tailor_availability (
  tailor_id           uuid PRIMARY KEY
    REFERENCES public.tailor_profiles(user_id) ON DELETE CASCADE,
  -- Array of day names: 'monday', 'tuesday', ..., 'sunday'
  working_days        text[] DEFAULT '{}'::text[] NOT NULL,
  working_hours_start time,
  working_hours_end   time,
  vacation_mode       boolean DEFAULT false NOT NULL,
  accepting_orders    boolean DEFAULT true NOT NULL,
  updated_at          timestamptz DEFAULT timezone('utc', now()) NOT NULL
);

ALTER TABLE public.tailor_availability ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS trg_tailor_availability_updated_at
  ON public.tailor_availability;
CREATE TRIGGER trg_tailor_availability_updated_at
  BEFORE UPDATE ON public.tailor_availability
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE POLICY "tailor_availability: public read approved"
  ON public.tailor_availability FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tailor_profiles tp
      WHERE tp.user_id = tailor_id
        AND tp.verification_status = 'approved'
    )
  );

CREATE POLICY "tailor_availability: tailor own"
  ON public.tailor_availability FOR ALL
  USING (auth.uid() = tailor_id)
  WITH CHECK (auth.uid() = tailor_id);

CREATE POLICY "tailor_availability: admin full access"
  ON public.tailor_availability FOR ALL
  USING (is_admin());

-- ── 8. tailor_delivery_options ───────────────────────────────

CREATE TABLE IF NOT EXISTS public.tailor_delivery_options (
  tailor_id             uuid PRIMARY KEY
    REFERENCES public.tailor_profiles(user_id) ON DELETE CASCADE,
  pickup_available      boolean DEFAULT false NOT NULL,
  doorstep_measurement  boolean DEFAULT false NOT NULL,
  home_delivery         boolean DEFAULT false NOT NULL,
  -- Array of city/area names e.g. 'Mumbai', 'Delhi NCR', 'Pan India'
  shipping_areas        text[] DEFAULT '{}'::text[] NOT NULL,
  -- Maximum delivery radius in kilometers
  max_delivery_distance integer CHECK (max_delivery_distance >= 0),
  updated_at            timestamptz DEFAULT timezone('utc', now()) NOT NULL
);

ALTER TABLE public.tailor_delivery_options ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS trg_tailor_delivery_updated_at
  ON public.tailor_delivery_options;
CREATE TRIGGER trg_tailor_delivery_updated_at
  BEFORE UPDATE ON public.tailor_delivery_options
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE POLICY "tailor_delivery_options: public read approved"
  ON public.tailor_delivery_options FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tailor_profiles tp
      WHERE tp.user_id = tailor_id
        AND tp.verification_status = 'approved'
    )
  );

CREATE POLICY "tailor_delivery_options: tailor own"
  ON public.tailor_delivery_options FOR ALL
  USING (auth.uid() = tailor_id)
  WITH CHECK (auth.uid() = tailor_id);

CREATE POLICY "tailor_delivery_options: admin full access"
  ON public.tailor_delivery_options FOR ALL
  USING (is_admin());

-- ── 9. tailor_portfolio_items ────────────────────────────────
-- storage_path: path in tailor-portfolios bucket e.g. "{tailor_id}/{uuid}.jpg"
-- public_url:   resolved public URL cached here to avoid round trips
-- The 10-image minimum is enforced at APPLICATION LAYER (onboarding form).

CREATE TABLE IF NOT EXISTS public.tailor_portfolio_items (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tailor_id     uuid NOT NULL
    REFERENCES public.tailor_profiles(user_id) ON DELETE CASCADE,
  storage_path  text NOT NULL,
  public_url    text NOT NULL,
  media_type    text NOT NULL DEFAULT 'image'
    CHECK (media_type IN ('image', 'video', 'before_after')),
  caption       text,
  display_order integer NOT NULL DEFAULT 0,
  created_at    timestamptz DEFAULT timezone('utc', now()) NOT NULL
);

ALTER TABLE public.tailor_portfolio_items ENABLE ROW LEVEL SECURITY;

-- Customers/public: read portfolio of approved tailors only
CREATE POLICY "tailor_portfolio_items: public read approved"
  ON public.tailor_portfolio_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tailor_profiles tp
      WHERE tp.user_id = tailor_id
        AND tp.verification_status = 'approved'
    )
  );

-- Tailor can see own portfolio regardless of status (to review during onboarding)
CREATE POLICY "tailor_portfolio_items: tailor own"
  ON public.tailor_portfolio_items FOR ALL
  USING (auth.uid() = tailor_id)
  WITH CHECK (auth.uid() = tailor_id);

CREATE POLICY "tailor_portfolio_items: admin full access"
  ON public.tailor_portfolio_items FOR ALL
  USING (is_admin());

-- ── 10. tailor_social_links ──────────────────────────────────

CREATE TABLE IF NOT EXISTS public.tailor_social_links (
  tailor_id  uuid PRIMARY KEY
    REFERENCES public.tailor_profiles(user_id) ON DELETE CASCADE,
  instagram  text,
  facebook   text,
  pinterest  text,
  website    text,
  updated_at timestamptz DEFAULT timezone('utc', now()) NOT NULL
);

ALTER TABLE public.tailor_social_links ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS trg_tailor_social_updated_at
  ON public.tailor_social_links;
CREATE TRIGGER trg_tailor_social_updated_at
  BEFORE UPDATE ON public.tailor_social_links
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE POLICY "tailor_social_links: public read approved"
  ON public.tailor_social_links FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tailor_profiles tp
      WHERE tp.user_id = tailor_id
        AND tp.verification_status = 'approved'
    )
  );

CREATE POLICY "tailor_social_links: tailor own"
  ON public.tailor_social_links FOR ALL
  USING (auth.uid() = tailor_id)
  WITH CHECK (auth.uid() = tailor_id);

CREATE POLICY "tailor_social_links: admin full access"
  ON public.tailor_social_links FOR ALL
  USING (is_admin());

-- ── 11. tailor_verification_documents ───────────────────────
-- CRITICAL: NEVER store a public URL here — only the private storage_path.
-- Admins generate signed URLs at review time via the server-side API route.

CREATE TABLE IF NOT EXISTS public.tailor_verification_documents (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tailor_id    uuid NOT NULL
    REFERENCES public.tailor_profiles(user_id) ON DELETE CASCADE,
  doc_type     text NOT NULL
    CHECK (doc_type IN ('govt_id', 'business_license', 'gst')),
  storage_path text NOT NULL,
  uploaded_at  timestamptz DEFAULT timezone('utc', now()) NOT NULL,
  UNIQUE (tailor_id, doc_type)
);

ALTER TABLE public.tailor_verification_documents ENABLE ROW LEVEL SECURITY;

-- NO public/customer SELECT policy — documents are strictly private.

-- Tailor: full access to own documents
CREATE POLICY "tailor_verification_documents: tailor own"
  ON public.tailor_verification_documents FOR ALL
  USING (auth.uid() = tailor_id)
  WITH CHECK (auth.uid() = tailor_id);

-- Admin: full access (to generate signed URLs for review queue)
CREATE POLICY "tailor_verification_documents: admin full access"
  ON public.tailor_verification_documents FOR ALL
  USING (is_admin());

-- ── 12. tailor_certifications ────────────────────────────────

CREATE TABLE IF NOT EXISTS public.tailor_certifications (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tailor_id    uuid NOT NULL
    REFERENCES public.tailor_profiles(user_id) ON DELETE CASCADE,
  name         text NOT NULL,
  issuing_body text,
  year         integer CHECK (year >= 1950 AND year <= 2100),
  created_at   timestamptz DEFAULT timezone('utc', now()) NOT NULL
);

ALTER TABLE public.tailor_certifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tailor_certifications: public read approved"
  ON public.tailor_certifications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tailor_profiles tp
      WHERE tp.user_id = tailor_id
        AND tp.verification_status = 'approved'
    )
  );

CREATE POLICY "tailor_certifications: tailor own"
  ON public.tailor_certifications FOR ALL
  USING (auth.uid() = tailor_id)
  WITH CHECK (auth.uid() = tailor_id);

CREATE POLICY "tailor_certifications: admin full access"
  ON public.tailor_certifications FOR ALL
  USING (is_admin());

-- ── 13. Performance indexes ───────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_tailor_specializations_tailor_id
  ON public.tailor_specializations (tailor_id);

CREATE INDEX IF NOT EXISTS idx_tailor_skills_tailor_id
  ON public.tailor_skills (tailor_id);

CREATE INDEX IF NOT EXISTS idx_tailor_portfolio_items_tailor_order
  ON public.tailor_portfolio_items (tailor_id, display_order);

CREATE INDEX IF NOT EXISTS idx_tailor_certifications_tailor_id
  ON public.tailor_certifications (tailor_id);

CREATE INDEX IF NOT EXISTS idx_tailor_verification_docs_tailor_id
  ON public.tailor_verification_documents (tailor_id);

CREATE INDEX IF NOT EXISTS idx_tailor_profiles_verification_status
  ON public.tailor_profiles (verification_status);

CREATE INDEX IF NOT EXISTS idx_tailor_profiles_onboarding_completed
  ON public.tailor_profiles (onboarding_completed);
