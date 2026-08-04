-- ============================================================
-- Migration: Schema Additions
-- Version: 20260721000001
-- Type: ADDITIVE — safe to run on existing data
-- Adds: updated_at to all tables, new structured columns,
--       new tables: addresses, design_request_images,
--       order_status_history, measurements, payments,
--       conversations, activity_logs
--       New enums: bid_status_type, notification_type,
--       availability_status_type, payment_status_type,
--       activity_event_type
-- ============================================================

-- ── 1. New ENUM types ────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE bid_status_type AS ENUM ('pending', 'accepted', 'rejected', 'withdrawn');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE notification_type AS ENUM (
    'bid_received', 'bid_accepted', 'order_paid', 'order_in_production',
    'order_shipped', 'order_delivered', 'review_received', 'message_received',
    'dispute_opened', 'system'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE availability_status_type AS ENUM (
    'accepting_orders', 'limited_availability', 'fully_booked', 'on_leave'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE payment_status_type AS ENUM (
    'pending', 'completed', 'refunded', 'failed'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE activity_event_type AS ENUM (
    'user_signup', 'order_created', 'bid_submitted', 'bid_accepted',
    'payment_completed', 'order_status_changed', 'review_submitted',
    'dispute_opened', 'message_sent', 'profile_updated'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── 2. Shared updated_at trigger function ────────────────────

CREATE OR REPLACE FUNCTION fn_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = timezone('utc', now());
  RETURN NEW;
END;
$$;

-- ── 3. Add updated_at to existing tables ─────────────────────

-- users
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS updated_at  timestamp with time zone DEFAULT timezone('utc', now()) NOT NULL,
  ADD COLUMN IF NOT EXISTS avatar_url  text;

DROP TRIGGER IF EXISTS trg_users_updated_at ON public.users;
CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- design_requests
ALTER TABLE public.design_requests
  ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT timezone('utc', now()) NOT NULL;

DROP TRIGGER IF EXISTS trg_design_requests_updated_at ON public.design_requests;
CREATE TRIGGER trg_design_requests_updated_at
  BEFORE UPDATE ON public.design_requests
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- wishlist_items
ALTER TABLE public.wishlist_items
  ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT timezone('utc', now()) NOT NULL;

DROP TRIGGER IF EXISTS trg_wishlist_items_updated_at ON public.wishlist_items;
CREATE TRIGGER trg_wishlist_items_updated_at
  BEFORE UPDATE ON public.wishlist_items
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- tailor_profiles
ALTER TABLE public.tailor_profiles
  ADD COLUMN IF NOT EXISTS updated_at          timestamp with time zone DEFAULT timezone('utc', now()) NOT NULL,
  ADD COLUMN IF NOT EXISTS location            text,
  ADD COLUMN IF NOT EXISTS experience_years    integer CHECK (experience_years >= 0),
  ADD COLUMN IF NOT EXISTS starting_price      numeric(10,2),
  ADD COLUMN IF NOT EXISTS response_time_hrs   integer DEFAULT 24,
  ADD COLUMN IF NOT EXISTS availability_status availability_status_type DEFAULT 'accepting_orders',
  ADD COLUMN IF NOT EXISTS specialty           text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS measurement_options text[] DEFAULT '{}'::text[];

DROP TRIGGER IF EXISTS trg_tailor_profiles_updated_at ON public.tailor_profiles;
CREATE TRIGGER trg_tailor_profiles_updated_at
  BEFORE UPDATE ON public.tailor_profiles
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- quotations — also migrate status text → enum safely via new column + backfill
ALTER TABLE public.quotations
  ADD COLUMN IF NOT EXISTS updated_at   timestamp with time zone DEFAULT timezone('utc', now()) NOT NULL,
  ADD COLUMN IF NOT EXISTS bid_status   bid_status_type;

-- Backfill bid_status from legacy text status column
UPDATE public.quotations SET bid_status = 'accepted'  WHERE status = 'accepted'  AND bid_status IS NULL;
UPDATE public.quotations SET bid_status = 'rejected'  WHERE status = 'rejected'  AND bid_status IS NULL;
UPDATE public.quotations SET bid_status = 'withdrawn' WHERE status = 'withdrawn' AND bid_status IS NULL;
UPDATE public.quotations SET bid_status = 'pending'   WHERE bid_status IS NULL;

-- Set NOT NULL now that backfill is done
ALTER TABLE public.quotations ALTER COLUMN bid_status SET NOT NULL;
ALTER TABLE public.quotations ALTER COLUMN bid_status SET DEFAULT 'pending';

DROP TRIGGER IF EXISTS trg_quotations_updated_at ON public.quotations;
CREATE TRIGGER trg_quotations_updated_at
  BEFORE UPDATE ON public.quotations
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- messages — add read tracking
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT timezone('utc', now()) NOT NULL,
  ADD COLUMN IF NOT EXISTS read_by    uuid[] DEFAULT '{}'::uuid[];

DROP TRIGGER IF EXISTS trg_messages_updated_at ON public.messages;
CREATE TRIGGER trg_messages_updated_at
  BEFORE UPDATE ON public.messages
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- reviews — add tailor_id denorm for fast queries + updated_at
ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT timezone('utc', now()) NOT NULL,
  ADD COLUMN IF NOT EXISTS tailor_id  uuid REFERENCES public.users(id) ON DELETE SET NULL;

-- Backfill tailor_id from design_requests
UPDATE public.reviews r
SET tailor_id = dr.tailor_id
FROM public.design_requests dr
WHERE r.order_id = dr.id
  AND r.tailor_id IS NULL
  AND dr.tailor_id IS NOT NULL;

DROP TRIGGER IF EXISTS trg_reviews_updated_at ON public.reviews;
CREATE TRIGGER trg_reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- notifications — add type + updated_at
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS updated_at       timestamp with time zone DEFAULT timezone('utc', now()) NOT NULL,
  ADD COLUMN IF NOT EXISTS notification_type notification_type DEFAULT 'system';

DROP TRIGGER IF EXISTS trg_notifications_updated_at ON public.notifications;
CREATE TRIGGER trg_notifications_updated_at
  BEFORE UPDATE ON public.notifications
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- saved_tailors — add updated_at
ALTER TABLE public.saved_tailors
  ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT timezone('utc', now()) NOT NULL;

DROP TRIGGER IF EXISTS trg_saved_tailors_updated_at ON public.saved_tailors;
CREATE TRIGGER trg_saved_tailors_updated_at
  BEFORE UPDATE ON public.saved_tailors
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- ── 4. New tables ─────────────────────────────────────────────

-- addresses
CREATE TABLE IF NOT EXISTS public.addresses (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  label        text NOT NULL DEFAULT 'Home',   -- e.g. Home, Office, Store
  line1        text NOT NULL,
  line2        text,
  city         text NOT NULL,
  state        text NOT NULL,
  postal_code  text NOT NULL,
  country      text NOT NULL DEFAULT 'IN',
  is_default   boolean NOT NULL DEFAULT false,
  created_at   timestamp with time zone DEFAULT timezone('utc', now()) NOT NULL,
  updated_at   timestamp with time zone DEFAULT timezone('utc', now()) NOT NULL
);

ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS trg_addresses_updated_at ON public.addresses;
CREATE TRIGGER trg_addresses_updated_at
  BEFORE UPDATE ON public.addresses
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- design_request_images (multi-image support, additive to existing image_url)
CREATE TABLE IF NOT EXISTS public.design_request_images (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id  uuid NOT NULL REFERENCES public.design_requests(id) ON DELETE CASCADE,
  image_url   text NOT NULL,
  is_primary  boolean NOT NULL DEFAULT false,
  sort_order  integer NOT NULL DEFAULT 0,
  uploaded_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at  timestamp with time zone DEFAULT timezone('utc', now()) NOT NULL
);

ALTER TABLE public.design_request_images ENABLE ROW LEVEL SECURITY;

-- order_status_history (immutable audit log)
CREATE TABLE IF NOT EXISTS public.order_status_history (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id    uuid NOT NULL REFERENCES public.design_requests(id) ON DELETE CASCADE,
  from_status request_status,
  to_status   request_status NOT NULL,
  changed_by  uuid REFERENCES public.users(id) ON DELETE SET NULL,
  note        text,
  created_at  timestamp with time zone DEFAULT timezone('utc', now()) NOT NULL
  -- No updated_at: this is an immutable audit log
);

ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;

-- measurements
CREATE TABLE IF NOT EXISTS public.measurements (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  label         text NOT NULL DEFAULT 'My Measurements',
  -- Standard garment measurements in centimetres
  chest         numeric(5,1),
  waist         numeric(5,1),
  hips          numeric(5,1),
  shoulder      numeric(5,1),
  sleeve_length numeric(5,1),
  inseam        numeric(5,1),
  neck          numeric(5,1),
  height        numeric(5,1),
  weight        numeric(5,1),
  -- Flexible key-value for custom measurements
  custom        jsonb DEFAULT '{}'::jsonb,
  is_default    boolean NOT NULL DEFAULT false,
  created_at    timestamp with time zone DEFAULT timezone('utc', now()) NOT NULL,
  updated_at    timestamp with time zone DEFAULT timezone('utc', now()) NOT NULL
);

ALTER TABLE public.measurements ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS trg_measurements_updated_at ON public.measurements;
CREATE TRIGGER trg_measurements_updated_at
  BEFORE UPDATE ON public.measurements
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- payments (dedicated payment records, FKs to design_requests as the order)
CREATE TABLE IF NOT EXISTS public.payments (
  id                  uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id            uuid NOT NULL REFERENCES public.design_requests(id) ON DELETE RESTRICT,
  customer_id         uuid NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  tailor_id           uuid NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  amount              numeric(10,2) NOT NULL CHECK (amount > 0),
  platform_fee        numeric(10,2) NOT NULL DEFAULT 0,
  tailor_payout       numeric(10,2) NOT NULL,
  currency            text NOT NULL DEFAULT 'INR',
  payment_status      payment_status_type NOT NULL DEFAULT 'pending',
  -- Razorpay fields (nullable until real integration)
  razorpay_order_id   text,
  razorpay_payment_id text,
  razorpay_signature  text,
  -- Refund tracking
  refund_id           text,
  refunded_at         timestamp with time zone,
  refund_amount       numeric(10,2),
  -- Payout tracking
  payout_released     boolean NOT NULL DEFAULT false,
  payout_released_at  timestamp with time zone,
  created_at          timestamp with time zone DEFAULT timezone('utc', now()) NOT NULL,
  updated_at          timestamp with time zone DEFAULT timezone('utc', now()) NOT NULL,
  UNIQUE (order_id)   -- One payment record per order
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS trg_payments_updated_at ON public.payments;
CREATE TRIGGER trg_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- conversations (lightweight grouping for message threads)
-- NOTE: In this app messages are scoped to design_requests; conversations
--       adds metadata (last_message_at, preview) for efficient inbox queries.
CREATE TABLE IF NOT EXISTS public.conversations (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id         uuid NOT NULL REFERENCES public.design_requests(id) ON DELETE CASCADE,
  customer_id      uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  tailor_id        uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  last_message_at  timestamp with time zone,
  last_message_preview text,
  customer_unread  integer NOT NULL DEFAULT 0,
  tailor_unread    integer NOT NULL DEFAULT 0,
  created_at       timestamp with time zone DEFAULT timezone('utc', now()) NOT NULL,
  updated_at       timestamp with time zone DEFAULT timezone('utc', now()) NOT NULL,
  UNIQUE (order_id)  -- One conversation thread per order
);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS trg_conversations_updated_at ON public.conversations;
CREATE TRIGGER trg_conversations_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- activity_logs (admin audit trail, not customer-facing)
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  actor_id    uuid REFERENCES public.users(id) ON DELETE SET NULL,
  event       activity_event_type NOT NULL,
  entity_type text NOT NULL,  -- 'order', 'payment', 'user', etc.
  entity_id   uuid,
  metadata    jsonb DEFAULT '{}'::jsonb,
  ip_address  text,
  created_at  timestamp with time zone DEFAULT timezone('utc', now()) NOT NULL
  -- No updated_at: immutable log
);

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
