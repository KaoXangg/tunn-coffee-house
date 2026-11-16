-- =============================================================================
-- TUNN COFFEE HOUSE — MIGRATION 014: LOCK DIRECT ANON INSERT ON table_feedback
-- =============================================================================
-- Forces all anonymous customer feedback submissions to go through the
-- `submit-feedback` Edge Function (which verifies Cloudflare Turnstile token
-- server-side before inserting with service_role).
-- Existing SELECT / DELETE policies for Admins remain unchanged.
-- =============================================================================

REVOKE INSERT ON TABLE public.table_feedback FROM anon;
DROP POLICY IF EXISTS "Public can insert table_feedback" ON public.table_feedback;
