-- =============================================================================
-- TUNN COFFEE HOUSE — MIGRATION 015: ENABLE pgTAP FOR RLS/AUTH TESTING
-- =============================================================================
-- Enables pgTAP extension for automated SQL/RLS tests in `supabase/tests/`.
-- Note: On hosted Supabase, you can also enable `pgtap` via:
--   Dashboard -> Database -> Extensions -> search "pgtap" -> Enable
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;
