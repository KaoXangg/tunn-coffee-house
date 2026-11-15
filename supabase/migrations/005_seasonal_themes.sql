-- =============================================================================
-- TUNN COFFEE HOUSE — MIGRATION 005: SEASONAL THEME MANAGER & SCHEDULER
-- Run this SQL in Supabase SQL Editor to persist seasonal themes & schedules.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.seasonal_themes (
  id TEXT PRIMARY KEY,
  key TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'holiday' CHECK (category IN ('seasonal', 'holiday', 'campaign', 'event', 'custom')),
  description TEXT NOT NULL DEFAULT '',
  is_preset BOOLEAN NOT NULL DEFAULT FALSE,
  tokens JSONB NOT NULL DEFAULT '{}'::jsonb,
  banner JSONB NOT NULL DEFAULT '{}'::jsonb,
  decorations JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT FALSE,
  schedule_start TIMESTAMPTZ,
  schedule_end TIMESTAMPTZ,
  timezone TEXT NOT NULL DEFAULT 'Asia/Ho_Chi_Minh',
  priority INTEGER NOT NULL DEFAULT 10,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_seasonal_themes_active ON public.seasonal_themes(is_active);
CREATE INDEX IF NOT EXISTS idx_seasonal_themes_schedule ON public.seasonal_themes(schedule_start, schedule_end, priority DESC);

ALTER TABLE public.seasonal_themes ENABLE ROW LEVEL SECURITY;

-- Public storefront can read seasonal themes to display active or scheduled theme
DROP POLICY IF EXISTS "Public can read seasonal_themes" ON public.seasonal_themes;
CREATE POLICY "Public can read seasonal_themes" ON public.seasonal_themes
  FOR SELECT USING (TRUE);

-- Only Root Owner Admin can create, update, activate, schedule, or delete themes
DROP POLICY IF EXISTS "Owner can manage seasonal_themes" ON public.seasonal_themes;
CREATE POLICY "Owner can manage seasonal_themes" ON public.seasonal_themes
  FOR ALL
  USING (public.is_owner_admin())
  WITH CHECK (public.is_owner_admin());

-- Backend scheduler resolver: evaluates scheduled window (priority DESC) first, then manual is_active
CREATE OR REPLACE FUNCTION public.get_effective_seasonal_theme()
RETURNS SETOF public.seasonal_themes AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM public.seasonal_themes
  WHERE (
    schedule_start IS NOT NULL
    AND schedule_start <= NOW()
    AND (schedule_end IS NULL OR schedule_end >= NOW())
  )
  OR (
    is_active = TRUE
    AND (schedule_end IS NULL OR schedule_end >= NOW())
  )
  ORDER BY
    CASE
      WHEN schedule_start IS NOT NULL AND schedule_start <= NOW() AND (schedule_end IS NULL OR schedule_end >= NOW()) THEN 1
      ELSE 0
    END DESC,
    priority DESC,
    updated_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
