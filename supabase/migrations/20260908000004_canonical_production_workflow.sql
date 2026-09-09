-- Ensure all canonical 6-phase production workflow statuses exist in the request_status enum.
-- This does not remove any existing statuses (like pending_bids, assigned, etc.).

-- Using DO block to catch exceptions since ALTER TYPE ADD VALUE IF NOT EXISTS 
-- is supported in newer Postgres, but this approach works consistently.

ALTER TYPE request_status ADD VALUE IF NOT EXISTS 'paid';
ALTER TYPE request_status ADD VALUE IF NOT EXISTS 'cutting';
ALTER TYPE request_status ADD VALUE IF NOT EXISTS 'stitching';
ALTER TYPE request_status ADD VALUE IF NOT EXISTS 'quality_check';
ALTER TYPE request_status ADD VALUE IF NOT EXISTS 'ready';
ALTER TYPE request_status ADD VALUE IF NOT EXISTS 'shipped';
ALTER TYPE request_status ADD VALUE IF NOT EXISTS 'delivered';
ALTER TYPE request_status ADD VALUE IF NOT EXISTS 'completed';
