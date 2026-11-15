-- =============================================================================
-- TUNN COFFEE HOUSE - CUSTOMER ANALYTICS (PRODUCT VIEWS & QR TABLE SCANS)
-- Run this script in Supabase SQL Editor to persist anonymous customer events.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.customer_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type TEXT NOT NULL CHECK (event_type IN ('product_view', 'qr_scan')),
  product_id TEXT CHECK (product_id IS NULL OR char_length(product_id) <= 80),
  product_name TEXT CHECK (product_name IS NULL OR char_length(product_name) <= 120),
  table_number TEXT CHECK (table_number IS NULL OR char_length(table_number) <= 20),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customer_events_created ON public.customer_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_customer_events_type ON public.customer_events(event_type);

ALTER TABLE public.customer_events ENABLE ROW LEVEL SECURITY;

-- Anyone visiting the storefront can log a validated anonymous view or QR scan
DROP POLICY IF EXISTS "Public can insert customer_events" ON public.customer_events;
CREATE POLICY "Public can insert customer_events" ON public.customer_events
  FOR INSERT WITH CHECK (
    (event_type = 'product_view' AND product_id IS NOT NULL AND char_length(trim(product_id)) > 0 AND char_length(product_id) <= 80)
    OR
    (event_type = 'qr_scan' AND table_number IS NOT NULL AND char_length(trim(table_number)) > 0 AND char_length(table_number) <= 20)
  );

-- Only authenticated Admins can read analytics on the Dashboard
DROP POLICY IF EXISTS "Admins can view customer_events" ON public.customer_events;
CREATE POLICY "Admins can view customer_events" ON public.customer_events
  FOR SELECT USING (public.is_admin());
