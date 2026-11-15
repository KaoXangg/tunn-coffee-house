-- Add customer name, Gmail, and anti-spam verification status to table_feedback
ALTER TABLE public.table_feedback
  ADD COLUMN IF NOT EXISTS customer_name TEXT,
  ADD COLUMN IF NOT EXISTS customer_email TEXT,
  ADD COLUMN IF NOT EXISTS email_verified_status TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'table_feedback_customer_name_len'
  ) THEN
    ALTER TABLE public.table_feedback
      ADD CONSTRAINT table_feedback_customer_name_len
      CHECK (customer_name IS NULL OR char_length(customer_name) <= 80);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'table_feedback_customer_email_check'
  ) THEN
    ALTER TABLE public.table_feedback
      ADD CONSTRAINT table_feedback_customer_email_check
      CHECK (
        customer_email IS NULL
        OR (
          char_length(customer_email) <= 120
          AND customer_email ~* '^[a-z0-9][a-z0-9.+]{4,60}@(gmail\.com|googlemail\.com)$'
        )
      );
  END IF;
END $$;
