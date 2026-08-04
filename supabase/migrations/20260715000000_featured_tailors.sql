-- Add featured column to tailor_profiles
ALTER TABLE public.tailor_profiles
ADD COLUMN featured boolean DEFAULT false NOT NULL;
