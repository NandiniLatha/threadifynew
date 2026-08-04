-- ============================================================
-- Migration: Functions & Triggers
-- Version: 20260721000003
-- Covers:
--   fn_log_order_status_change: writes to order_status_history
--     + fires notification on status change
--   fn_sync_payment_to_order: on payment completion, updates
--     design_requests.status to 'paid'
--   fn_update_conversation_on_message: on message insert,
--     updates conversation last_message_at + unread counts
--   fn_auto_create_conversation: on design_requests status
--     moving past pending_bids, creates conversation row
--   fn_sync_review_tailor_id: keeps reviews.tailor_id in sync
--   fn_log_activity: helper for writing to activity_logs
-- ============================================================

-- ── 1. Order status history + notification on status change ──

CREATE OR REPLACE FUNCTION fn_log_order_status_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_msg     text;
  v_link    text;
  v_notif_type notification_type;
BEGIN
  -- Only act when status actually changes
  IF OLD.status IS NOT DISTINCT FROM NEW.status THEN
    RETURN NEW;
  END IF;

  -- Write to audit log
  INSERT INTO public.order_status_history (order_id, from_status, to_status, changed_by)
  VALUES (NEW.id, OLD.status, NEW.status, auth.uid());

  -- Build notification payload based on new status
  CASE NEW.status
    WHEN 'paid' THEN
      v_msg         := '🎉 Payment confirmed! Your tailor is being notified to begin work.';
      v_link        := '/dashboard/orders/' || NEW.id;
      v_notif_type  := 'order_paid';
    WHEN 'in_production' THEN
      v_msg         := '✂️ Your garment is now In Production!';
      v_link        := '/dashboard/orders/' || NEW.id;
      v_notif_type  := 'order_in_production';
    WHEN 'shipped' THEN
      v_msg         := '📦 Your garment has been shipped — confirm delivery when it arrives!';
      v_link        := '/dashboard/orders/' || NEW.id;
      v_notif_type  := 'order_shipped';
    WHEN 'delivered' THEN
      v_msg         := '✅ Delivery confirmed! Don''t forget to leave a review.';
      v_link        := '/dashboard/orders/' || NEW.id;
      v_notif_type  := 'order_delivered';
    ELSE
      RETURN NEW;  -- No notification for other transitions
  END CASE;

  -- Notify customer for customer-relevant transitions
  IF NEW.customer_id IS NOT NULL AND NEW.status IN ('in_production', 'shipped', 'delivered') THEN
    INSERT INTO public.notifications (user_id, message, link, read, notification_type)
    VALUES (NEW.customer_id, v_msg, v_link, false, v_notif_type);
  END IF;

  -- Notify tailor when payment confirmed (they need to start work)
  IF NEW.tailor_id IS NOT NULL AND NEW.status = 'paid' THEN
    INSERT INTO public.notifications (user_id, message, link, read, notification_type)
    VALUES (
      NEW.tailor_id,
      '🎉 A customer has paid for your quote. Begin production!',
      '/tailor/orders',
      false,
      'order_paid'
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_order_status_change ON public.design_requests;
CREATE TRIGGER trg_order_status_change
  AFTER UPDATE OF status ON public.design_requests
  FOR EACH ROW EXECUTE FUNCTION fn_log_order_status_change();

-- ── 2. Sync payment completion → order status ─────────────────

CREATE OR REPLACE FUNCTION fn_sync_payment_to_order()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NEW.payment_status = 'completed' AND
     (OLD.payment_status IS DISTINCT FROM 'completed') THEN
    -- Advance order to 'paid' when a real payment completes
    UPDATE public.design_requests
    SET
      status                = 'paid',
      amount_paid           = NEW.amount,
      platform_commission   = NEW.platform_fee,
      razorpay_order_id     = NEW.razorpay_order_id,
      razorpay_payment_id   = NEW.razorpay_payment_id
    WHERE id = NEW.order_id
      AND status IN ('pending_bids', 'assigned');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_payment_status_sync ON public.payments;
CREATE TRIGGER trg_payment_status_sync
  AFTER INSERT OR UPDATE OF payment_status ON public.payments
  FOR EACH ROW EXECUTE FUNCTION fn_sync_payment_to_order();

-- ── 3. Auto-create conversation + update on message insert ───

CREATE OR REPLACE FUNCTION fn_upsert_conversation_on_message()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_customer_id uuid;
  v_tailor_id   uuid;
  v_preview     text;
BEGIN
  -- Get order participants
  SELECT customer_id, tailor_id
  INTO v_customer_id, v_tailor_id
  FROM public.design_requests
  WHERE id = NEW.order_id;

  -- Truncate preview to 120 chars
  v_preview := left(NEW.content, 120);

  -- Upsert conversation row
  INSERT INTO public.conversations
    (order_id, customer_id, tailor_id, last_message_at, last_message_preview,
     customer_unread, tailor_unread)
  VALUES
    (NEW.order_id, v_customer_id, v_tailor_id, NEW.created_at, v_preview,
     CASE WHEN NEW.sender_id = v_tailor_id   THEN 1 ELSE 0 END,
     CASE WHEN NEW.sender_id = v_customer_id THEN 1 ELSE 0 END)
  ON CONFLICT (order_id) DO UPDATE SET
    last_message_at      = EXCLUDED.last_message_at,
    last_message_preview = EXCLUDED.last_message_preview,
    customer_unread = conversations.customer_unread +
                      CASE WHEN NEW.sender_id = v_tailor_id   THEN 1 ELSE 0 END,
    tailor_unread   = conversations.tailor_unread +
                      CASE WHEN NEW.sender_id = v_customer_id THEN 1 ELSE 0 END,
    updated_at = timezone('utc', now());

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_upsert_conversation_on_message ON public.messages;
CREATE TRIGGER trg_upsert_conversation_on_message
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION fn_upsert_conversation_on_message();

-- ── 4. Keep reviews.tailor_id in sync with design_requests ──

CREATE OR REPLACE FUNCTION fn_sync_review_tailor_id()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  SELECT tailor_id INTO NEW.tailor_id
  FROM public.design_requests
  WHERE id = NEW.order_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_review_tailor_id ON public.reviews;
CREATE TRIGGER trg_sync_review_tailor_id
  BEFORE INSERT ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION fn_sync_review_tailor_id();

-- ── 5. Activity log helper function ──────────────────────────

CREATE OR REPLACE FUNCTION fn_log_activity(
  p_actor_id    uuid,
  p_event       activity_event_type,
  p_entity_type text,
  p_entity_id   uuid DEFAULT NULL,
  p_metadata    jsonb DEFAULT '{}'::jsonb,
  p_ip_address  text DEFAULT NULL
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.activity_logs (actor_id, event, entity_type, entity_id, metadata, ip_address)
  VALUES (p_actor_id, p_event, p_entity_type, p_entity_id, p_metadata, p_ip_address);
EXCEPTION WHEN OTHERS THEN
  -- Never let audit logging break the primary operation
  NULL;
END;
$$;

-- ── 6. Idempotent notification helper (supersedes helpers.ts pattern) ──

CREATE OR REPLACE FUNCTION fn_create_notification(
  p_user_id          uuid,
  p_message          text,
  p_link             text DEFAULT NULL,
  p_notification_type notification_type DEFAULT 'system'
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_id uuid;
BEGIN
  INSERT INTO public.notifications (user_id, message, link, read, notification_type)
  VALUES (p_user_id, p_message, p_link, false, p_notification_type)
  RETURNING id INTO v_id;
  RETURN v_id;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING '[fn_create_notification] failed: %', SQLERRM;
  RETURN NULL;
END;
$$;

-- ── 7. Accept bid → update quotation status + trigger order advancement ──

CREATE OR REPLACE FUNCTION fn_accept_bid(
  p_request_id  uuid,
  p_quote_id    uuid,
  p_customer_id uuid
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_quote   record;
  v_request record;
BEGIN
  -- Validate ownership
  SELECT * INTO v_request
  FROM public.design_requests
  WHERE id = p_request_id AND customer_id = p_customer_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Request not found or not owned by customer');
  END IF;

  IF v_request.status NOT IN ('pending_bids', 'assigned') THEN
    RETURN jsonb_build_object('error', 'Request is not in a biddable state');
  END IF;

  -- Fetch quotation
  SELECT * INTO v_quote
  FROM public.quotations
  WHERE id = p_quote_id AND request_id = p_request_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Quotation not found for this request');
  END IF;

  -- Mark this quotation accepted
  UPDATE public.quotations SET bid_status = 'accepted', status = 'accepted'
  WHERE id = p_quote_id;

  -- Reject all other quotations for this request
  UPDATE public.quotations SET bid_status = 'rejected', status = 'rejected'
  WHERE request_id = p_request_id AND id != p_quote_id;

  -- Assign tailor to the request
  UPDATE public.design_requests
  SET tailor_id = v_quote.tailor_id,
      accepted_quotation_id = p_quote_id,
      status = 'assigned'
  WHERE id = p_request_id;

  -- Notify tailor
  PERFORM fn_create_notification(
    v_quote.tailor_id,
    '🎉 Your bid was selected! The customer has been directed to payment.',
    '/tailor/orders',
    'bid_accepted'
  );

  RETURN jsonb_build_object('success', true, 'tailor_id', v_quote.tailor_id);
END;
$$;

-- ── 8. Update order status with validation ───────────────────

CREATE OR REPLACE FUNCTION fn_update_order_status(
  p_order_id   uuid,
  p_new_status request_status,
  p_actor_id   uuid
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_order record;
  v_allowed_transitions text[][] := ARRAY[
    ARRAY['pending_bids',  'assigned'],
    ARRAY['pending_bids',  'cancelled'],
    ARRAY['assigned',      'paid'],
    ARRAY['assigned',      'cancelled'],
    ARRAY['paid',          'in_production'],
    ARRAY['in_production', 'shipped'],
    ARRAY['shipped',       'delivered'],
    ARRAY['delivered',     'reviewed']
  ];
  v_transition_valid boolean := false;
  v_pair text[];
BEGIN
  SELECT * INTO v_order FROM public.design_requests WHERE id = p_order_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Order not found');
  END IF;

  -- Check valid transition
  FOREACH v_pair SLICE 1 IN ARRAY v_allowed_transitions LOOP
    IF v_pair[1] = v_order.status::text AND v_pair[2] = p_new_status::text THEN
      v_transition_valid := true;
      EXIT;
    END IF;
  END LOOP;

  IF NOT v_transition_valid THEN
    RETURN jsonb_build_object(
      'error', format('Invalid transition from %s to %s', v_order.status, p_new_status)
    );
  END IF;

  UPDATE public.design_requests SET status = p_new_status WHERE id = p_order_id;

  RETURN jsonb_build_object('success', true, 'status', p_new_status);
END;
$$;
