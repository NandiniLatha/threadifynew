-- ============================================================
-- Migration: Hardened Least-Privilege Data API Grants (Strict Edition)
-- Version: 20261001000000
-- File: supabase/migrations/20261001000000_hardened_data_api_grants.sql
-- Description: Establishes explicit least-privilege Data API permissions
--              for Supabase PostgREST Data API architecture change.
-- ============================================================

-- ── 1. Schema Usage ──────────────────────────────────────────
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- ── 2. Anonymous Access (Public Catalog & Public RAG Read-Only) ───
-- Grants SELECT only on tables where public unauthenticated read access
-- is required (such as Explore directory joins and public RAG search).
-- Rows returned are strictly governed by Row Level Security (RLS).
GRANT SELECT ON TABLE
  public.users,
  public.tailor_profiles,
  public.reviews,
  public.tailor_specializations,
  public.tailor_skills,
  public.tailor_experience,
  public.tailor_pricing,
  public.tailor_availability,
  public.tailor_delivery_options,
  public.tailor_portfolio_items,
  public.tailor_social_links,
  public.tailor_certifications,
  public.fashion_knowledge_vectors
TO anon;

-- ── 3. Authenticated: Full Lifecycle Tables (CRUD) ──────────
-- Tables where authenticated users manage full lifecycle of their own records.
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
  public.design_requests,
  public.wishlist_items,
  public.quotations,
  public.reviews,
  public.addresses,
  public.design_request_images,
  public.measurements,
  public.tailor_portfolio_items,
  public.tailor_verification_documents,
  public.tailor_certifications,
  public.ai_conversations,
  public.collections,
  public.consultations
TO authenticated;

-- ── 4. Authenticated: Specific DML (Least Privilege) ─────────

-- Profile Management (Users cannot INSERT or DELETE own user records directly)
GRANT SELECT, UPDATE ON TABLE
  public.users
TO authenticated;

-- Tailor Settings & Collaborative Objects
GRANT SELECT, INSERT, UPDATE ON TABLE
  public.tailor_profiles,
  public.tailor_experience,
  public.tailor_pricing,
  public.tailor_availability,
  public.tailor_delivery_options,
  public.tailor_social_links,
  public.messages,
  public.disputes,
  public.ai_messages
TO authenticated;

-- Notifications (Users can read, mark read, or dismiss; creation handled by DB triggers)
GRANT SELECT, UPDATE, DELETE ON TABLE
  public.notifications
TO authenticated;

-- Tag & Association Tables (Add / Remove)
GRANT SELECT, INSERT, DELETE ON TABLE
  public.saved_tailors,
  public.tailor_specializations,
  public.tailor_skills,
  public.collection_items
TO authenticated;

-- Append-Only Audit & Feedback Tables (No client-side UPDATE or DELETE)
GRANT SELECT, INSERT ON TABLE
  public.admin_actions,
  public.admin_audit_logs,
  public.production_feedback
TO authenticated;

-- Read-Only Tables for Authenticated (Writes managed by triggers or backend API)
GRANT SELECT ON TABLE
  public.payments,
  public.conversations,
  public.order_status_history,
  public.activity_logs,
  public.fashion_knowledge_vectors
TO authenticated;

-- ── 5. RPC Function Execution Grants ──────────────────────────
-- Fashion RAG Search (Public & Authenticated)
GRANT EXECUTE ON FUNCTION public.match_fashion_knowledge(vector, integer, text) TO anon, authenticated, service_role;

-- Bid Acceptance (Authenticated Customers Only)
REVOKE EXECUTE ON FUNCTION public.fn_accept_bid(uuid, uuid, uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.fn_accept_bid(uuid, uuid, uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.fn_accept_bid(uuid, uuid, uuid) TO authenticated, service_role;

-- ── 6. Service Role Full Access (Backend / Admin / Webhooks) ──
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO service_role;

-- ── 7. Default Privileges for Future Migrations ───────────────
-- Ensure service_role always retains full control on future objects created by postgres
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO service_role;
-- NOTE: Authenticated and anon deliberately DO NOT receive automatic default privileges on future tables.
-- Every future migration creating a table must include explicit, least-privilege GRANT statements.
