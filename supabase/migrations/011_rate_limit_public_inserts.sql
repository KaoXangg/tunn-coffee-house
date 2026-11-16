-- =============================================================================
-- TUNN COFFEE HOUSE — MIGRATION 011: RATE LIMIT ANONYMOUS PUBLIC INSERTS
-- =============================================================================
-- Protects public.customer_events and public.table_feedback from unrestricted
-- anonymous insert spam by tracking client_fingerprint + UTC minute bucket.
-- Edge Functions can pass an explicit SHA-256 client_fingerprint (IP + UA);
-- direct REST inserts fall back to hashing PostgREST request headers.
-- =============================================================================

ALTER TABLE public.customer_events
  ADD COLUMN IF NOT EXISTS client_fingerprint TEXT
  CHECK (client_fingerprint IS NULL OR char_length(client_fingerprint) <= 128);

ALTER TABLE public.table_feedback
  ADD COLUMN IF NOT EXISTS client_fingerprint TEXT
  CHECK (client_fingerprint IS NULL OR char_length(client_fingerprint) <= 128);

-- Immutable UTC minute-bucket helper for unique rate-limit indexes
CREATE OR REPLACE FUNCTION public.utc_minute_bucket(ts TIMESTAMPTZ)
RETURNS TIMESTAMP
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT date_trunc('minute', ts AT TIME ZONE 'UTC');
$$;

-- Populate client_fingerprint from request headers when omitted by direct REST callers
CREATE OR REPLACE FUNCTION public.populate_client_fingerprint()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  headers_raw TEXT;
  headers_json JSONB;
  req_ip TEXT;
  req_ua TEXT;
BEGIN
  IF NEW.client_fingerprint IS NULL OR char_length(trim(NEW.client_fingerprint)) = 0 THEN
    headers_raw := current_setting('request.headers', true);
    IF headers_raw IS NOT NULL AND char_length(headers_raw) > 0 THEN
      headers_json := headers_raw::jsonb;
      req_ip := COALESCE(headers_json->>'cf-connecting-ip', headers_json->>'x-forwarded-for', '');
      req_ua := COALESCE(headers_json->>'user-agent', '');
      IF char_length(req_ip) > 0 OR char_length(req_ua) > 0 THEN
        NEW.client_fingerprint := md5(req_ip || '|' || req_ua);
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_customer_events_fingerprint ON public.customer_events;
CREATE TRIGGER trg_customer_events_fingerprint
  BEFORE INSERT ON public.customer_events
  FOR EACH ROW EXECUTE FUNCTION public.populate_client_fingerprint();

DROP TRIGGER IF EXISTS trg_table_feedback_fingerprint ON public.table_feedback;
CREATE TRIGGER trg_table_feedback_fingerprint
  BEFORE INSERT ON public.table_feedback
  FOR EACH ROW EXECUTE FUNCTION public.populate_client_fingerprint();

-- Limit anonymous callers to at most 1 event per (fingerprint, event_type, minute)
CREATE UNIQUE INDEX IF NOT EXISTS uq_customer_events_rate_limit
  ON public.customer_events (client_fingerprint, event_type, public.utc_minute_bucket(created_at))
  WHERE client_fingerprint IS NOT NULL;

-- Limit anonymous callers to at most 1 feedback submission per (fingerprint, minute)
CREATE UNIQUE INDEX IF NOT EXISTS uq_table_feedback_rate_limit
  ON public.table_feedback (client_fingerprint, public.utc_minute_bucket(created_at))
  WHERE client_fingerprint IS NOT NULL;
