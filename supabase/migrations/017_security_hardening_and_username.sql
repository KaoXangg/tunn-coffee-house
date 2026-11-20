-- =============================================================================
-- TUNN COFFEE HOUSE — MIGRATION 017: SECURITY HARDENING & PROFILES USERNAME
-- =============================================================================
-- 1. Add unique (case-insensitive) username column on public.profiles
-- 2. Replace SECURITY DEFINER view `public_positive_reviews` with safe RPC
-- 3. Fix mutable search_path on utility functions
-- 4. Fix Auth RLS Initplan ((select auth.uid())) & consolidate Multiple Permissive Policies
-- =============================================================================

-- 1. Add username column on profiles for fast, zero-scan username login
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS username TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_username_lower
  ON public.profiles (lower(username))
  WHERE username IS NOT NULL AND char_length(trim(username)) > 0;

-- Backfill username for existing @manager.tunn.local accounts
UPDATE public.profiles
SET username = split_part(lower(email), '@', 1)
WHERE username IS NULL
  AND lower(email) LIKE '%@manager.tunn.local';

-- 2. Replace SECURITY DEFINER view with SECURITY DEFINER RPC (drops view warning)
DROP VIEW IF EXISTS public.public_positive_reviews;

CREATE OR REPLACE FUNCTION public.get_public_positive_reviews()
RETURNS TABLE (
  id UUID,
  customer_name TEXT,
  table_number TEXT,
  rating SMALLINT,
  tags TEXT[],
  comment TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    tf.id,
    COALESCE(NULLIF(trim(tf.customer_name), ''), 'Khách TUNN') AS customer_name,
    tf.table_number,
    tf.rating,
    tf.tags,
    tf.comment,
    tf.created_at
  FROM public.table_feedback tf
  WHERE tf.rating >= 4
  ORDER BY tf.created_at DESC
  LIMIT 24;
$$;

REVOKE ALL ON FUNCTION public.get_public_positive_reviews() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_positive_reviews() TO anon, authenticated;

-- 3. Fix Function Search Path Mutable warnings
ALTER FUNCTION public.handle_updated_at() SET search_path = public;
ALTER FUNCTION public.get_effective_seasonal_theme() SET search_path = public;

-- 4. Fix Auth RLS Initplan & Consolidate Multiple Permissive Policies

-- profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING ((select auth.uid()) = id OR (select public.is_admin()));

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (
    (select auth.uid()) = id
    AND role = 'staff'
    AND is_owner = FALSE
  );

DROP POLICY IF EXISTS "Owner can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own display name" ON public.profiles;
CREATE POLICY "Users or owner can update profiles" ON public.profiles
  FOR UPDATE
  USING ((select public.is_owner_admin()) OR (select auth.uid()) = id)
  WITH CHECK (
    (select public.is_owner_admin())
    OR (
      (select auth.uid()) = id
      AND role = (SELECT p.role FROM public.profiles p WHERE p.id = (select auth.uid()))
      AND is_owner = (SELECT p.is_owner FROM public.profiles p WHERE p.id = (select auth.uid()))
    )
  );

-- site_settings (split FOR ALL so SELECT has only 1 permissive policy)
DROP POLICY IF EXISTS "Owner can manage site_settings" ON public.site_settings;
CREATE POLICY "Owner can insert site_settings" ON public.site_settings
  FOR INSERT WITH CHECK ((select public.is_owner_admin()));
CREATE POLICY "Owner can update site_settings" ON public.site_settings
  FOR UPDATE USING ((select public.is_owner_admin())) WITH CHECK ((select public.is_owner_admin()));
CREATE POLICY "Owner can delete site_settings" ON public.site_settings
  FOR DELETE USING ((select public.is_owner_admin()));

-- page_sections
DROP POLICY IF EXISTS "Owner can manage page_sections" ON public.page_sections;
CREATE POLICY "Owner can insert page_sections" ON public.page_sections
  FOR INSERT WITH CHECK ((select public.is_owner_admin()));
CREATE POLICY "Owner can update page_sections" ON public.page_sections
  FOR UPDATE USING ((select public.is_owner_admin())) WITH CHECK ((select public.is_owner_admin()));
CREATE POLICY "Owner can delete page_sections" ON public.page_sections
  FOR DELETE USING ((select public.is_owner_admin()));

-- categories
DROP POLICY IF EXISTS "Public can view active categories" ON public.categories;
CREATE POLICY "Public can view active categories" ON public.categories
  FOR SELECT USING (is_active = TRUE OR (select public.is_admin()));

DROP POLICY IF EXISTS "Admins can manage categories" ON public.categories;
CREATE POLICY "Admins can insert categories" ON public.categories
  FOR INSERT WITH CHECK ((select public.is_admin()));
CREATE POLICY "Admins can update categories" ON public.categories
  FOR UPDATE USING ((select public.is_admin())) WITH CHECK ((select public.is_admin()));
CREATE POLICY "Admins can delete categories" ON public.categories
  FOR DELETE USING ((select public.is_admin()));

-- products
DROP POLICY IF EXISTS "Public can view visible products" ON public.products;
CREATE POLICY "Public can view visible products" ON public.products
  FOR SELECT USING (is_visible = TRUE OR (select public.is_admin()));

DROP POLICY IF EXISTS "Admins can manage products" ON public.products;
CREATE POLICY "Admins can insert products" ON public.products
  FOR INSERT WITH CHECK ((select public.is_admin()));
CREATE POLICY "Admins can update products" ON public.products
  FOR UPDATE USING ((select public.is_admin())) WITH CHECK ((select public.is_admin()));
CREATE POLICY "Admins can delete products" ON public.products
  FOR DELETE USING ((select public.is_admin()));

-- media_assets
DROP POLICY IF EXISTS "Admins can manage media_assets" ON public.media_assets;
CREATE POLICY "Admins can insert media_assets" ON public.media_assets
  FOR INSERT WITH CHECK ((select public.is_admin()));
CREATE POLICY "Admins can update media_assets" ON public.media_assets
  FOR UPDATE USING ((select public.is_admin())) WITH CHECK ((select public.is_admin()));
CREATE POLICY "Admins can delete media_assets" ON public.media_assets
  FOR DELETE USING ((select public.is_admin()));

-- promotions
DROP POLICY IF EXISTS "Public can view active promotions" ON public.promotions;
CREATE POLICY "Public can view active promotions" ON public.promotions
  FOR SELECT USING (is_active = TRUE OR (select public.is_admin()));

DROP POLICY IF EXISTS "Admins can manage promotions" ON public.promotions;
CREATE POLICY "Admins can insert promotions" ON public.promotions
  FOR INSERT WITH CHECK ((select public.is_admin()));
CREATE POLICY "Admins can update promotions" ON public.promotions
  FOR UPDATE USING ((select public.is_admin())) WITH CHECK ((select public.is_admin()));
CREATE POLICY "Admins can delete promotions" ON public.promotions
  FOR DELETE USING ((select public.is_admin()));

-- gallery_items
DROP POLICY IF EXISTS "Public can view visible gallery_items" ON public.gallery_items;
CREATE POLICY "Public can view visible gallery_items" ON public.gallery_items
  FOR SELECT USING (is_visible = TRUE OR (select public.is_admin()));

DROP POLICY IF EXISTS "Admins can manage gallery_items" ON public.gallery_items;
CREATE POLICY "Admins can insert gallery_items" ON public.gallery_items
  FOR INSERT WITH CHECK ((select public.is_admin()));
CREATE POLICY "Admins can update gallery_items" ON public.gallery_items
  FOR UPDATE USING ((select public.is_admin())) WITH CHECK ((select public.is_admin()));
CREATE POLICY "Admins can delete gallery_items" ON public.gallery_items
  FOR DELETE USING ((select public.is_admin()));

-- seasonal_themes
DROP POLICY IF EXISTS "Owner can manage seasonal_themes" ON public.seasonal_themes;
CREATE POLICY "Owner can insert seasonal_themes" ON public.seasonal_themes
  FOR INSERT WITH CHECK ((select public.is_owner_admin()));
CREATE POLICY "Owner can update seasonal_themes" ON public.seasonal_themes
  FOR UPDATE USING ((select public.is_owner_admin())) WITH CHECK ((select public.is_owner_admin()));
CREATE POLICY "Owner can delete seasonal_themes" ON public.seasonal_themes
  FOR DELETE USING ((select public.is_owner_admin()));

-- admin_activity_logs
DROP POLICY IF EXISTS "Admins can view activity_logs" ON public.admin_activity_logs;
CREATE POLICY "Admins can view activity_logs" ON public.admin_activity_logs
  FOR SELECT USING ((select public.is_admin()));

DROP POLICY IF EXISTS "Admins can insert activity_logs" ON public.admin_activity_logs;
CREATE POLICY "Admins can insert activity_logs" ON public.admin_activity_logs
  FOR INSERT WITH CHECK ((select public.is_admin()));

DROP POLICY IF EXISTS "Owner can delete activity_logs" ON public.admin_activity_logs;
CREATE POLICY "Owner can delete activity_logs" ON public.admin_activity_logs
  FOR DELETE USING ((select public.is_owner_admin()));

-- table_feedback
DROP POLICY IF EXISTS "Admins can view table_feedback" ON public.table_feedback;
CREATE POLICY "Admins can view table_feedback" ON public.table_feedback
  FOR SELECT USING ((select public.is_admin()));

DROP POLICY IF EXISTS "Owner can delete table_feedback" ON public.table_feedback;
CREATE POLICY "Owner can delete table_feedback" ON public.table_feedback
  FOR DELETE USING ((select public.is_owner_admin()));

-- customer_events
DROP POLICY IF EXISTS "Admins can view customer_events" ON public.customer_events;
CREATE POLICY "Admins can view customer_events" ON public.customer_events
  FOR SELECT USING ((select public.is_admin()));
