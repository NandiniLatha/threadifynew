-- ============================================================
-- Migration: Platform Upgrade — Marketplace Enhancements
-- Version: 20260819000000
-- Type: ADDITIVE — safe to run on existing data
-- Adds: enriched quotation breakdown, review sub-ratings,
--       next_available_date for tailors,
--       new tables: collections, collection_items, consultations
--       Extended request_status enum values
-- ============================================================

-- ── 1. Extend request_status enum with full lifecycle statuses ─────────────
ALTER TYPE request_status ADD VALUE IF NOT EXISTS 'quoted';
ALTER TYPE request_status ADD VALUE IF NOT EXISTS 'quote_accepted';
ALTER TYPE request_status ADD VALUE IF NOT EXISTS 'payment_pending';
ALTER TYPE request_status ADD VALUE IF NOT EXISTS 'confirmed';
ALTER TYPE request_status ADD VALUE IF NOT EXISTS 'measurements_pending';
ALTER TYPE request_status ADD VALUE IF NOT EXISTS 'cutting';
ALTER TYPE request_status ADD VALUE IF NOT EXISTS 'stitching';
ALTER TYPE request_status ADD VALUE IF NOT EXISTS 'quality_check';
ALTER TYPE request_status ADD VALUE IF NOT EXISTS 'ready';
ALTER TYPE request_status ADD VALUE IF NOT EXISTS 'completed';
ALTER TYPE request_status ADD VALUE IF NOT EXISTS 'rejected';

-- ── 2. Enrich quotations with pricing breakdown ────────────────────────────
ALTER TABLE public.quotations
  ADD COLUMN IF NOT EXISTS base_garment_price    numeric(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS fabric_cost           numeric(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS stitching_cost        numeric(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS customization_charges numeric(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS delivery_charges      numeric(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS estimated_completion_date date;

-- ── 3. Enrich reviews with sub-rating categories ──────────────────────────
ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS rating_quality       integer CHECK (rating_quality BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS rating_communication integer CHECK (rating_communication BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS rating_delivery      integer CHECK (rating_delivery BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS rating_value         integer CHECK (rating_value BETWEEN 1 AND 5);

-- ── 4. Extend tailor_profiles with next available date ───────────────────
ALTER TABLE public.tailor_profiles
  ADD COLUMN IF NOT EXISTS next_available_date date;

-- ── 5. Collections (favorites) tables ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.collections (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name       text NOT NULL,
  cover_url  text,
  created_at timestamp with time zone DEFAULT timezone('utc', now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc', now()) NOT NULL
);

ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS trg_collections_updated_at ON public.collections;
CREATE TRIGGER trg_collections_updated_at
  BEFORE UPDATE ON public.collections
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- Only allow users to manage their own collections
DROP POLICY IF EXISTS "Users manage own collections" ON public.collections;
CREATE POLICY "Users manage own collections" ON public.collections
  FOR ALL USING (auth.uid() = user_id);

-- collection_items: generic saved items (designers, portfolio items, inspiration)
CREATE TABLE IF NOT EXISTS public.collection_items (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  collection_id uuid NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
  user_id       uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  item_type     text NOT NULL, -- 'designer' | 'portfolio_item' | 'inspiration'
  item_id       uuid,          -- FK to the referenced entity (nullable for inspiration URLs)
  item_url      text,          -- For inspiration images (external URL or Cloudinary)
  item_meta     jsonb DEFAULT '{}'::jsonb, -- Extra metadata (name, image_url, etc.)
  created_at    timestamp with time zone DEFAULT timezone('utc', now()) NOT NULL,
  UNIQUE (collection_id, item_type, item_id)
);

ALTER TABLE public.collection_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own collection items" ON public.collection_items;
CREATE POLICY "Users manage own collection items" ON public.collection_items
  FOR ALL USING (auth.uid() = user_id);

-- ── 6. Consultation booking table ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.consultations (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  tailor_id   uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  date        date NOT NULL,
  time_slot   text NOT NULL, -- e.g. '10:00 AM', '2:00 PM'
  mode        text NOT NULL DEFAULT 'online',  -- 'online' | 'in-person'
  reason      text,
  notes       text,
  status      text NOT NULL DEFAULT 'pending', -- 'pending' | 'confirmed' | 'cancelled'
  created_at  timestamp with time zone DEFAULT timezone('utc', now()) NOT NULL,
  updated_at  timestamp with time zone DEFAULT timezone('utc', now()) NOT NULL,
  -- Prevent double-booking a tailor on the same date+timeslot
  UNIQUE (tailor_id, date, time_slot)
);

ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS trg_consultations_updated_at ON public.consultations;
CREATE TRIGGER trg_consultations_updated_at
  BEFORE UPDATE ON public.consultations
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- Customer can create/view/cancel their own consultations
DROP POLICY IF EXISTS "Customers manage own consultations" ON public.consultations;
CREATE POLICY "Customers manage own consultations" ON public.consultations
  FOR ALL USING (auth.uid() = customer_id);

-- Tailor can view and update their consultations
DROP POLICY IF EXISTS "Tailors view own consultations" ON public.consultations;
CREATE POLICY "Tailors view own consultations" ON public.consultations
  FOR SELECT USING (auth.uid() = tailor_id);

DROP POLICY IF EXISTS "Tailors update own consultations" ON public.consultations;
CREATE POLICY "Tailors update own consultations" ON public.consultations
  FOR UPDATE USING (auth.uid() = tailor_id);

-- ── 7. Index additions ─────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_collections_user_id ON public.collections (user_id);
CREATE INDEX IF NOT EXISTS idx_collection_items_collection_id ON public.collection_items (collection_id);
CREATE INDEX IF NOT EXISTS idx_collection_items_user_id ON public.collection_items (user_id);
CREATE INDEX IF NOT EXISTS idx_consultations_customer_id ON public.consultations (customer_id);
CREATE INDEX IF NOT EXISTS idx_consultations_tailor_id ON public.consultations (tailor_id);
CREATE INDEX IF NOT EXISTS idx_consultations_date ON public.consultations (date);
