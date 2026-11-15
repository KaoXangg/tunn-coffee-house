-- =============================================================================
-- TUNN COFFEE HOUSE - CUSTOMER ANALYTICS (PRODUCT VIEWS & QR TABLE SCANS)
-- Run this script in Supabase SQL Editor to persist anonymous customer events.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.customer_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type TEXT NOT NULL CHECK (event_type IN ('product_view', 'qr_scan')),
  product_id TEXT,
  product_name TEXT,
  table_number TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customer_events_created ON public.customer_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_customer_events_type ON public.customer_events(event_type);

ALTER TABLE public.customer_events ENABLE ROW LEVEL SECURITY;

-- Anyone visiting the storefront can log an anonymous view or QR scan
DROP POLICY IF EXISTS "Public can insert customer_events" ON public.customer_events;
CREATE POLICY "Public can insert customer_events" ON public.customer_events
  FOR INSERT WITH CHECK (TRUE);

-- Only authenticated Admins can read analytics on the Dashboard
DROP POLICY IF EXISTS "Admins can view customer_events" ON public.customer_events;
CREATE POLICY "Admins can view customer_events" ON public.customer_events
  FOR SELECT USING (public.is_admin());
