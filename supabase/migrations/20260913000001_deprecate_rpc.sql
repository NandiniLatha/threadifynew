-- ============================================================
-- Migration: Deprecate fn_update_order_status
-- Version: 20260913000001
-- Drops the vulnerable legacy RPC to securely enforce the
-- new server-side Next.js APIs for all order transitions.
-- ============================================================

DROP FUNCTION IF EXISTS public.fn_update_order_status(uuid, public.request_status, uuid);
