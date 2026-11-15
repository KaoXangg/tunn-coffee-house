-- =============================================================================
-- TUNN COFFEE HOUSE — MIGRATION 006: QUICK TABLE FEEDBACK
-- Run this SQL in Supabase SQL Editor to store anonymous customer table ratings.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.table_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_number TEXT CHECK (table_number IS NULL OR char_length(table_number) <= 20),
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  tags TEXT[] NOT NULL DEFAULT '{}',
  comment TEXT NOT NULL DEFAULT '' CHECK (char_length(comment) <= 300),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_table_feedback_created ON public.table_feedback(created_at DESC);

ALTER TABLE public.table_feedback ENABLE ROW LEVEL SECURITY;

-- Anyone at the store can submit validated quick feedback without logging in
DROP POLICY IF EXISTS "Public can insert table_feedback" ON public.table_feedback;
CREATE POLICY "Public can insert table_feedback" ON public.table_feedback
  FOR INSERT
  WITH CHECK (
    rating BETWEEN 1 AND 5
    AND char_length(comment) <= 300
    AND (table_number IS NULL OR char_length(table_number) <= 20)
  );

-- Authenticated Admins & Sub-Managers can read feedback on Dashboard
DROP POLICY IF EXISTS "Admins can view table_feedback" ON public.table_feedback;
CREATE POLICY "Admins can view table_feedback" ON public.table_feedback
  FOR SELECT
  USING (public.is_admin());

-- Only Root Owner Admin can delete feedback entries
DROP POLICY IF EXISTS "Owner can delete table_feedback" ON public.table_feedback;
CREATE POLICY "Owner can delete table_feedback" ON public.table_feedback
  FOR DELETE
  USING (public.is_owner_admin());
