-- ============================================================
-- Migration: Create Measurements Table + RLS Policies
-- Version: 20260822000000
-- ============================================================

CREATE TABLE IF NOT EXISTS public.measurements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  label TEXT NOT NULL DEFAULT 'My Measurements',
  chest NUMERIC,
  waist NUMERIC,
  hips NUMERIC,
  shoulder NUMERIC,
  sleeve_length NUMERIC,
  inseam NUMERIC,
  neck NUMERIC,
  height NUMERIC,
  weight NUMERIC,
  custom JSONB DEFAULT '{}'::jsonb,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security (Default Deny)
ALTER TABLE public.measurements ENABLE ROW LEVEL SECURITY;

-- ── RLS Policies ──────────────────────────────────────────────

-- Owner full access (Customer can SELECT, INSERT, UPDATE, DELETE ONLY their own measurements)
DROP POLICY IF EXISTS "measurements: owner full access" ON public.measurements;
CREATE POLICY "measurements: owner full access"
  ON public.measurements FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Drop legacy policy if present from previous attempt
DROP POLICY IF EXISTS "measurements: admin read" ON public.measurements;

-- ── Triggers ──────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_measurements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_measurements_updated_at ON public.measurements;
CREATE TRIGGER set_measurements_updated_at
  BEFORE UPDATE ON public.measurements
  FOR EACH ROW
  EXECUTE FUNCTION update_measurements_updated_at();
