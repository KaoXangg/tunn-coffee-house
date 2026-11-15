-- Enable Supabase Realtime for all storefront & CMS tables so customer devices update immediately without F5
DO $$
DECLARE
  tbl TEXT;
  tables TEXT[] := ARRAY[
    'site_settings',
    'page_sections',
    'products',
    'categories',
    'promotions',
    'gallery_items',
    'seasonal_themes',
    'table_feedback'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    IF EXISTS (
      SELECT 1
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relname = tbl
    ) THEN
      IF NOT EXISTS (
        SELECT 1
        FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
          AND schemaname = 'public'
          AND tablename = tbl
      ) THEN
        EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', tbl);
      END IF;
    END IF;
  END LOOP;
END $$;
