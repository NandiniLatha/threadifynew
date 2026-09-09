-- Create a partial unique index on the quotations table to prevent a tailor from having more than one active quote for the same request.
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_quotation 
ON public.quotations (tailor_id, request_id) 
WHERE status IN ('pending', 'accepted');
