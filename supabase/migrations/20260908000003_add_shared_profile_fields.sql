-- Add missing fields to public.users for shared editable profile
ALTER TABLE public.users 
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS display_name_changed_at timestamp with time zone;
