-- ============================================================
-- Schema Patch: reviews trigger to update avg_rating
-- Applied to: reviews, tailor_profiles
-- ============================================================

CREATE OR REPLACE FUNCTION update_tailor_avg_rating()
RETURNS TRIGGER AS $$
DECLARE
  v_tailor_id uuid;
BEGIN
  -- get tailor_id from the order
  IF TG_OP = 'DELETE' THEN
    SELECT tailor_id INTO v_tailor_id FROM public.design_requests WHERE id = OLD.order_id;
  ELSE
    SELECT tailor_id INTO v_tailor_id FROM public.design_requests WHERE id = NEW.order_id;
  END IF;

  IF v_tailor_id IS NOT NULL THEN
    UPDATE public.tailor_profiles
    SET avg_rating = (
      SELECT COALESCE(ROUND(AVG(rating), 2), 5.00)
      FROM public.reviews
      JOIN public.design_requests ON public.reviews.order_id = public.design_requests.id
      WHERE public.design_requests.tailor_id = v_tailor_id
    )
    WHERE user_id = v_tailor_id;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_tailor_avg_rating ON public.reviews;
CREATE TRIGGER trigger_update_tailor_avg_rating
AFTER INSERT OR UPDATE OR DELETE ON public.reviews
FOR EACH ROW EXECUTE PROCEDURE update_tailor_avg_rating();
