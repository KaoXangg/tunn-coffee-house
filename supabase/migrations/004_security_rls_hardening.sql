-- =============================================================================
-- TUNN COFFEE HOUSE — MIGRATION 004: DATABASE RLS HARDENING & ANTI-SPAM
-- Run this SQL in Supabase SQL Editor to enforce Owner-only writes on sensitive
-- system tables and length/format validation on anonymous customer_events.
-- =============================================================================

-- 1. Restrict site_settings writes strictly to Root Owner Admin
DROP POLICY IF EXISTS "Admins can manage site_settings" ON public.site_settings;
DROP POLICY IF EXISTS "Owner can manage site_settings" ON public.site_settings;
CREATE POLICY "Owner can manage site_settings" ON public.site_settings
  FOR ALL
  USING (public.is_owner_admin())
  WITH CHECK (public.is_owner_admin());

-- 2. Restrict page_sections writes strictly to Root Owner Admin
DROP POLICY IF EXISTS "Admins can manage page_sections" ON public.page_sections;
DROP POLICY IF EXISTS "Owner can manage page_sections" ON public.page_sections;
CREATE POLICY "Owner can manage page_sections" ON public.page_sections
  FOR ALL
  USING (public.is_owner_admin())
  WITH CHECK (public.is_owner_admin());

-- 3. Harden profiles updates:
--    - Root Owner Admin can update any profile
--    - Sub-Managers can only update their own non-privilege fields (cannot escalate role or is_owner)
DROP POLICY IF EXISTS "Admins can update profiles" ON public.profiles;
DROP POLICY IF EXISTS "Owner can update all profiles" ON public.profiles;
CREATE POLICY "Owner can update all profiles" ON public.profiles
  FOR UPDATE
  USING (public.is_owner_admin())
  WITH CHECK (public.is_owner_admin());

DROP POLICY IF EXISTS "Users can update own display name" ON public.profiles;
CREATE POLICY "Users can update own display name" ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND role = (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid())
    AND is_owner = (SELECT p.is_owner FROM public.profiles p WHERE p.id = auth.uid())
  );

-- 4. Anti-spam & input length validation on public.customer_events
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'customer_events'
  ) THEN
    ALTER TABLE public.customer_events
      DROP CONSTRAINT IF EXISTS chk_customer_events_lengths;

    ALTER TABLE public.customer_events
      ADD CONSTRAINT chk_customer_events_lengths CHECK (
        (product_id IS NULL OR char_length(product_id) <= 80)
        AND (product_name IS NULL OR char_length(product_name) <= 120)
        AND (table_number IS NULL OR char_length(table_number) <= 20)
      );

    DROP POLICY IF EXISTS "Public can insert customer_events" ON public.customer_events;
    CREATE POLICY "Public can insert customer_events" ON public.customer_events
      FOR INSERT
      WITH CHECK (
        (event_type = 'product_view' AND product_id IS NOT NULL AND char_length(trim(product_id)) > 0 AND char_length(product_id) <= 80)
        OR
        (event_type = 'qr_scan' AND table_number IS NOT NULL AND char_length(trim(table_number)) > 0 AND char_length(table_number) <= 20)
      );
  END IF;
END $$;
