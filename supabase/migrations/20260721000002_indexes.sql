-- ============================================================
-- Migration: Indexes for Performance
-- Version: 20260721000002
-- Type: ADDITIVE — all CREATE INDEX IF NOT EXISTS
-- Covers: all FK columns, filter columns, frequently queried cols
-- ============================================================

-- ── users ────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_users_email    ON public.users (email);
CREATE INDEX IF NOT EXISTS idx_users_role     ON public.users (role);

-- ── design_requests ──────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_design_requests_customer_id  ON public.design_requests (customer_id);
CREATE INDEX IF NOT EXISTS idx_design_requests_tailor_id    ON public.design_requests (tailor_id);
CREATE INDEX IF NOT EXISTS idx_design_requests_status       ON public.design_requests (status);
CREATE INDEX IF NOT EXISTS idx_design_requests_created_at   ON public.design_requests (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_design_requests_status_created ON public.design_requests (status, created_at DESC);
-- Partial index for the common tailor browse case
CREATE INDEX IF NOT EXISTS idx_design_requests_pending_bids
  ON public.design_requests (created_at DESC)
  WHERE status = 'pending_bids';

-- ── wishlist_items ────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_wishlist_items_customer_id ON public.wishlist_items (customer_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_items_created_at  ON public.wishlist_items (created_at DESC);

-- ── tailor_profiles ──────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_tailor_profiles_verification ON public.tailor_profiles (verification_status);
CREATE INDEX IF NOT EXISTS idx_tailor_profiles_avg_rating   ON public.tailor_profiles (avg_rating DESC);
CREATE INDEX IF NOT EXISTS idx_tailor_profiles_featured      ON public.tailor_profiles (featured)
  WHERE featured = true;
CREATE INDEX IF NOT EXISTS idx_tailor_profiles_availability  ON public.tailor_profiles (availability_status)
  WHERE availability_status = 'accepting_orders';

-- ── quotations ───────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_quotations_request_id  ON public.quotations (request_id);
CREATE INDEX IF NOT EXISTS idx_quotations_tailor_id   ON public.quotations (tailor_id);
CREATE INDEX IF NOT EXISTS idx_quotations_bid_status  ON public.quotations (bid_status);
CREATE INDEX IF NOT EXISTS idx_quotations_created_at  ON public.quotations (created_at DESC);

-- ── messages ─────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_messages_order_id    ON public.messages (order_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id   ON public.messages (sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at  ON public.messages (order_id, created_at ASC);

-- ── reviews ──────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_reviews_order_id    ON public.reviews (order_id);
CREATE INDEX IF NOT EXISTS idx_reviews_tailor_id   ON public.reviews (tailor_id);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at  ON public.reviews (created_at DESC);

-- ── notifications ─────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_notifications_user_id     ON public.notifications (user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read        ON public.notifications (user_id, read)
  WHERE read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_created_at  ON public.notifications (user_id, created_at DESC);

-- ── saved_tailors ─────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_saved_tailors_customer_id ON public.saved_tailors (customer_id);
CREATE INDEX IF NOT EXISTS idx_saved_tailors_tailor_id   ON public.saved_tailors (tailor_id);

-- ── disputes ─────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_disputes_order_id    ON public.disputes (order_id);
CREATE INDEX IF NOT EXISTS idx_disputes_raised_by   ON public.disputes (raised_by);
CREATE INDEX IF NOT EXISTS idx_disputes_status      ON public.disputes (status);

-- ── addresses ────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_addresses_user_id    ON public.addresses (user_id);
CREATE INDEX IF NOT EXISTS idx_addresses_is_default ON public.addresses (user_id, is_default)
  WHERE is_default = true;

-- ── design_request_images ─────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_design_request_images_request_id  ON public.design_request_images (request_id);
CREATE INDEX IF NOT EXISTS idx_design_request_images_sort        ON public.design_request_images (request_id, sort_order ASC);

-- ── order_status_history ─────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_order_status_history_order_id   ON public.order_status_history (order_id);
CREATE INDEX IF NOT EXISTS idx_order_status_history_created_at ON public.order_status_history (order_id, created_at ASC);

-- ── measurements ─────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_measurements_user_id    ON public.measurements (user_id);
CREATE INDEX IF NOT EXISTS idx_measurements_is_default ON public.measurements (user_id, is_default)
  WHERE is_default = true;

-- ── payments ─────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_payments_order_id        ON public.payments (order_id);
CREATE INDEX IF NOT EXISTS idx_payments_customer_id     ON public.payments (customer_id);
CREATE INDEX IF NOT EXISTS idx_payments_tailor_id       ON public.payments (tailor_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_status  ON public.payments (payment_status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at      ON public.payments (created_at DESC);

-- ── conversations ─────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_conversations_order_id      ON public.conversations (order_id);
CREATE INDEX IF NOT EXISTS idx_conversations_customer_id   ON public.conversations (customer_id);
CREATE INDEX IF NOT EXISTS idx_conversations_tailor_id     ON public.conversations (tailor_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message  ON public.conversations (last_message_at DESC NULLS LAST);

-- ── activity_logs ─────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_activity_logs_actor_id   ON public.activity_logs (actor_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_event      ON public.activity_logs (event);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity     ON public.activity_logs (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.activity_logs (created_at DESC);
