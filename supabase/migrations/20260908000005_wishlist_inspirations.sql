-- ============================================================
-- Migration: Add Inspiration to Wishlist Items
-- Version: 20260908000001
-- ============================================================

ALTER TABLE public.wishlist_items
  ADD COLUMN IF NOT EXISTS item_type text DEFAULT 'draft' NOT NULL CHECK (item_type IN ('draft', 'inspiration')),
  ADD COLUMN IF NOT EXISTS inspiration_id text;

ALTER TABLE public.wishlist_items
  ALTER COLUMN image_url DROP NOT NULL;

-- Ensure either image_url is provided (for drafts) or inspiration_id is provided (for inspirations)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.wishlist_items'::regclass
      AND conname = 'wishlist_items_content_check'
  ) THEN
    ALTER TABLE public.wishlist_items
      ADD CONSTRAINT wishlist_items_content_check
      CHECK (
        (item_type = 'draft' AND image_url IS NOT NULL)
        OR
        (item_type = 'inspiration' AND inspiration_id IS NOT NULL)
      );
  END IF;
END $$;

-- We need to ensure a customer doesn't duplicate the same inspiration.
CREATE UNIQUE INDEX IF NOT EXISTS unique_customer_inspiration_idx 
  ON public.wishlist_items (customer_id, inspiration_id) 
  WHERE item_type = 'inspiration' AND inspiration_id IS NOT NULL;
