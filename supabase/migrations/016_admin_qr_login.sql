-- QR Login approval sessions for passwordless / forgot-password login from an already-signed-in Admin device
CREATE TABLE IF NOT EXISTS public.admin_qr_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_secret text NOT NULL,
  verification_code text NOT NULL,
  device_label text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'consumed', 'expired')),
  approved_by uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  approved_email text,
  otp_token text,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '90 seconds')
);

CREATE INDEX IF NOT EXISTS idx_admin_qr_sessions_expires_at
  ON public.admin_qr_sessions (expires_at);

ALTER TABLE public.admin_qr_sessions ENABLE ROW LEVEL SECURITY;

-- Strict lock: only service_role (Edge Function) may read/write QR login sessions
REVOKE ALL ON public.admin_qr_sessions FROM anon, authenticated;
