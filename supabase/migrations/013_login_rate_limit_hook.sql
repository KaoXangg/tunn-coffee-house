-- =============================================================================
-- TUNN COFFEE HOUSE — MIGRATION 013: SERVER-SIDE LOGIN RATE LIMIT AUTH HOOK
-- =============================================================================
-- Implements Supabase Auth Hook (Password Verification Attempt) to enforce
-- server-side brute-force lockout (5 failed attempts -> 5 minutes lockout).
-- Cannot be bypassed by clearing localStorage or calling /auth/v1/token directly.
--
-- Manual setup in Supabase Dashboard:
--   Authentication -> Hooks -> Add Hook -> Password Verification Attempt
--   Target: Postgres Function -> public.handle_password_verification_attempt
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.login_attempts (
  identifier TEXT PRIMARY KEY,
  failed_count INT NOT NULL DEFAULT 0,
  locked_until TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

-- Block all direct client access to login_attempts; only SECURITY DEFINER hook writes/reads it
REVOKE ALL ON TABLE public.login_attempts FROM PUBLIC, anon, authenticated;

CREATE INDEX IF NOT EXISTS idx_login_attempts_updated_at
  ON public.login_attempts (updated_at);

-- Supabase Auth Hook: Password Verification Attempt
-- Input event JSONB:
--   {
--     "user_id": "<uuid>",
--     "valid": true | false
--   }
-- Return:
--   {} to allow, or { "decision": "reject", "message": "..." } to block.
CREATE OR REPLACE FUNCTION public.handle_password_verification_attempt(event JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id TEXT;
  v_valid BOOLEAN;
  v_identifier TEXT;
  v_row public.login_attempts%ROWTYPE;
  v_remaining_sec INT;
  v_new_failed INT;
BEGIN
  v_user_id := NULLIF(trim(COALESCE(event->>'user_id', '')), '');
  v_valid := COALESCE((event->>'valid')::BOOLEAN, FALSE);

  IF v_user_id IS NULL THEN
    RETURN '{}'::JSONB;
  END IF;

  -- Prefer normalized email from auth.users when available; fallback to user_id
  SELECT lower(trim(email)) INTO v_identifier
  FROM auth.users
  WHERE id::TEXT = v_user_id
  LIMIT 1;

  IF v_identifier IS NULL OR char_length(v_identifier) = 0 THEN
    v_identifier := v_user_id;
  END IF;

  SELECT * INTO v_row
  FROM public.login_attempts
  WHERE identifier = v_identifier
  FOR UPDATE;

  -- 1. If currently locked, reject immediately with remaining seconds
  IF FOUND AND v_row.locked_until IS NOT NULL AND v_row.locked_until > NOW() THEN
    v_remaining_sec := GREATEST(1, CEIL(EXTRACT(EPOCH FROM (v_row.locked_until - NOW())))::INT);
    RETURN jsonb_build_object(
      'decision', 'reject',
      'message', format('Tài khoản đang bị khóa tạm thời do đăng nhập sai nhiều lần. Vui lòng thử lại sau %s giây.', v_remaining_sec)
    );
  END IF;

  -- 2. Password valid -> reset counter & lock
  IF v_valid THEN
    INSERT INTO public.login_attempts (identifier, failed_count, locked_until, updated_at)
    VALUES (v_identifier, 0, NULL, NOW())
    ON CONFLICT (identifier) DO UPDATE SET
      failed_count = 0,
      locked_until = NULL,
      updated_at = NOW();
    RETURN '{}'::JSONB;
  END IF;

  -- 3. Password invalid -> increment counter; lock 5 minutes on >= 5 failures
  v_new_failed := COALESCE(v_row.failed_count, 0) + 1;

  IF v_new_failed >= 5 THEN
    INSERT INTO public.login_attempts (identifier, failed_count, locked_until, updated_at)
    VALUES (v_identifier, 0, NOW() + INTERVAL '5 minutes', NOW())
    ON CONFLICT (identifier) DO UPDATE SET
      failed_count = 0,
      locked_until = NOW() + INTERVAL '5 minutes',
      updated_at = NOW();

    RETURN jsonb_build_object(
      'decision', 'reject',
      'message', 'Tài khoản đang bị khóa tạm thời 5 phút do đăng nhập sai quá 5 lần. Vui lòng thử lại sau 300 giây.'
    );
  END IF;

  INSERT INTO public.login_attempts (identifier, failed_count, locked_until, updated_at)
  VALUES (v_identifier, v_new_failed, NULL, NOW())
  ON CONFLICT (identifier) DO UPDATE SET
    failed_count = v_new_failed,
    locked_until = NULL,
    updated_at = NOW();

  RETURN '{}'::JSONB;
END;
$$;

-- Restrict execution strictly to supabase_auth_admin (Supabase Auth service)
REVOKE ALL ON FUNCTION public.handle_password_verification_attempt(JSONB) FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.handle_password_verification_attempt(JSONB) TO supabase_auth_admin;

-- Optional cleanup via pg_cron if installed (otherwise clean up rows older than 24h periodically)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.schedule(
      'cleanup_stale_login_attempts',
      '0 * * * *',
      $cron$DELETE FROM public.login_attempts WHERE updated_at < NOW() - INTERVAL '24 hours' AND (locked_until IS NULL OR locked_until < NOW());$cron$
    );
  END IF;
END;
$$;
