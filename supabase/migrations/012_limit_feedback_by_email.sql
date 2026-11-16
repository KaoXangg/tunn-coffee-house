-- =============================================================================
-- TUNN COFFEE HOUSE — MIGRATION 012: SERVER-SIDE 24H GMAIL COOLDOWN
-- =============================================================================
-- Prevents bypassing the client-side 24h Gmail check via Incognito mode or
-- clearing localStorage by enforcing canonical Gmail uniqueness within 24 hours
-- directly in PostgreSQL on public.table_feedback.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.canonical_gmail(raw_email TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  cleaned TEXT;
  local_part TEXT;
  domain_part TEXT;
  plus_pos INT;
BEGIN
  IF raw_email IS NULL THEN
    RETURN NULL;
  END IF;

  cleaned := lower(trim(raw_email));
  IF position('@' IN cleaned) = 0 THEN
    RETURN cleaned;
  END IF;

  local_part := split_part(cleaned, '@', 1);
  domain_part := split_part(cleaned, '@', 2);

  IF domain_part = 'googlemail.com' THEN
    domain_part := 'gmail.com';
  END IF;

  IF domain_part = 'gmail.com' THEN
    plus_pos := position('+' IN local_part);
    IF plus_pos > 0 THEN
      local_part := substr(local_part, 1, plus_pos - 1);
    END IF;
    local_part := replace(local_part, '.', '');
  END IF;

  RETURN local_part || '@' || domain_part;
END;
$$;

CREATE INDEX IF NOT EXISTS idx_table_feedback_canonical_gmail_created
  ON public.table_feedback (public.canonical_gmail(customer_email), created_at DESC)
  WHERE customer_email IS NOT NULL;

CREATE OR REPLACE FUNCTION public.enforce_table_feedback_email_cooldown()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  canon_email TEXT;
BEGIN
  canon_email := public.canonical_gmail(NEW.customer_email);
  IF canon_email IS NOT NULL AND char_length(canon_email) > 0 THEN
    IF EXISTS (
      SELECT 1
      FROM public.table_feedback
      WHERE public.canonical_gmail(customer_email) = canon_email
        AND created_at >= NOW() - INTERVAL '24 hours'
    ) THEN
      RAISE EXCEPTION 'EMAIL_RATE_LIMIT: Gmail này vừa gửi đánh giá trong 24 giờ qua.'
        USING ERRCODE = 'P0001';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_table_feedback_email_cooldown ON public.table_feedback;
CREATE TRIGGER trg_table_feedback_email_cooldown
  BEFORE INSERT ON public.table_feedback
  FOR EACH ROW EXECUTE FUNCTION public.enforce_table_feedback_email_cooldown();
