-- =============================================================================
-- TUNN COFFEE HOUSE — SUPABASE POSTGRESQL SCHEMA, RLS & STORAGE POLICIES
-- =============================================================================
-- Run this migration in your Supabase SQL Editor.

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------------------------------------
-- 1. UTILITY TRIGGER FOR updated_at
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------------------------------
-- 2. PROFILES TABLE (Role-based Authorization)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('admin', 'editor', 'staff')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Helper function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Auto-create profile when a new user signs up
-- If it is the very first user in the database, automatically grant 'admin' role!
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_count INT;
  assigned_role TEXT;
BEGIN
  SELECT COUNT(*) INTO user_count FROM public.profiles;
  IF user_count = 0 THEN
    assigned_role := 'admin';
  ELSE
    assigned_role := 'staff';
  END IF;

  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    assigned_role
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- -----------------------------------------------------------------------------
-- 3. SITE SETTINGS TABLE (Brand, Appearance, Contact, SEO, Navigation, Footer)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.site_settings (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  brand_name TEXT NOT NULL DEFAULT 'TUNN Coffee House',
  site_title TEXT NOT NULL DEFAULT 'TUNN Coffee House — Your Daily Ritual, Made Extraordinary',
  slogan TEXT NOT NULL DEFAULT 'Your Daily Ritual, Made Extraordinary.',
  logo_url TEXT NOT NULL DEFAULT '/logo.png',
  favicon_url TEXT NOT NULL DEFAULT '/logo.png',
  
  -- Appearance & Design System
  primary_color TEXT NOT NULL DEFAULT '#4B2E24',      -- Coffee Brown
  secondary_bg_color TEXT NOT NULL DEFAULT '#E9E6D8', -- Warm Ivory
  primary_bg_color TEXT NOT NULL DEFAULT '#F7F5EF',   -- Cream White
  text_primary_color TEXT NOT NULL DEFAULT '#241914', -- Dark Espresso
  text_muted_color TEXT NOT NULL DEFAULT '#8C7565',   -- Muted Brown
  accent_color TEXT NOT NULL DEFAULT '#D5C6AD',       -- Warm Beige
  heading_font TEXT NOT NULL DEFAULT 'Cormorant Garamond',
  body_font TEXT NOT NULL DEFAULT 'Plus Jakarta Sans',
  border_radius TEXT NOT NULL DEFAULT '0.25rem',
  button_style TEXT NOT NULL DEFAULT 'editorial' CHECK (button_style IN ('editorial', 'rounded', 'pill')),
  theme_mode TEXT NOT NULL DEFAULT 'light' CHECK (theme_mode IN ('light', 'dark')),

  -- Navigation & Header
  nav_items JSONB NOT NULL DEFAULT '[
    {"label": "Trang chủ", "href": "#hero"},
    {"label": "Câu chuyện", "href": "#about"},
    {"label": "Nổi bật", "href": "#featured"},
    {"label": "Thực đơn", "href": "#menu"},
    {"label": "Ưu đãi", "href": "#promotions"},
    {"label": "Không gian", "href": "#gallery"},
    {"label": "Liên hệ", "href": "#contact"}
  ]'::jsonb,
  header_cta_label TEXT NOT NULL DEFAULT 'Khám phá Menu',
  header_cta_href TEXT NOT NULL DEFAULT '#menu',

  -- Contact Settings (No fake phone or address per policy; Admin fills in)
  store_name TEXT NOT NULL DEFAULT 'TUNN Coffee House',
  address TEXT NOT NULL DEFAULT '',
  hotline TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  opening_hours TEXT NOT NULL DEFAULT '07:30 — 22:30 (Mỗi ngày)',
  google_maps_url TEXT NOT NULL DEFAULT '',
  google_maps_embed TEXT NOT NULL DEFAULT '',
  facebook_url TEXT NOT NULL DEFAULT '',
  instagram_url TEXT NOT NULL DEFAULT '',
  tiktok_url TEXT NOT NULL DEFAULT '',
  order_url TEXT NOT NULL DEFAULT '#menu',

  -- Footer Content
  footer_description TEXT NOT NULL DEFAULT 'Nơi hội tụ của những hạt cà phê tuyển chọn, lá trà nguyên bản và nghệ thuật pha chế thủ công trong không gian tối giản ấm áp.',
  copyright_text TEXT NOT NULL DEFAULT '© 2026 TUNN Coffee House. Crafted with warmth & precision.',

  -- SEO Settings
  seo_title TEXT NOT NULL DEFAULT 'TUNN Coffee House — Trà Sữa, Cà Phê Đặc Sản & Matcha Thủ Công',
  seo_description TEXT NOT NULL DEFAULT 'Khám phá hương vị trà sữa nguyên lá, trà trái cây tươi, cà phê rang mộc và matcha chuẩn Nhật tại TUNN Coffee House.',
  seo_keywords TEXT NOT NULL DEFAULT 'TUNN Coffee House, trà sữa, cà phê, matcha, trà trái cây, quán cà phê đẹp',
  og_image_url TEXT NOT NULL DEFAULT '/logo.png',

  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_site_settings_updated_at
  BEFORE UPDATE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- -----------------------------------------------------------------------------
-- 4. CATEGORIES TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT DEFAULT '',
  image_url TEXT DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_sort ON public.categories(sort_order);

CREATE TRIGGER set_categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- -----------------------------------------------------------------------------
-- 5. PRODUCTS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  image_url TEXT NOT NULL DEFAULT '',
  price NUMERIC(12, 0) NOT NULL DEFAULT 0 CHECK (price >= 0),
  sale_price NUMERIC(12, 0) CHECK (sale_price IS NULL OR sale_price >= 0),
  category_id UUID REFERENCES public.categories(id) ON DELETE RESTRICT,
  badge TEXT DEFAULT '',
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  is_best_seller BOOLEAN NOT NULL DEFAULT FALSE,
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  is_visible BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_featured ON public.products(is_featured) WHERE is_featured = TRUE;
CREATE INDEX IF NOT EXISTS idx_products_visible ON public.products(is_visible);
CREATE INDEX IF NOT EXISTS idx_products_sort ON public.products(sort_order);

CREATE TRIGGER set_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- -----------------------------------------------------------------------------
-- 6. MEDIA ASSETS TABLE (Supabase Storage Tracker)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.media_assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL UNIQUE,
  public_url TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_size INT NOT NULL DEFAULT 0,
  width INT,
  height INT,
  alt_text TEXT DEFAULT '',
  folder TEXT NOT NULL DEFAULT 'general',
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_media_folder ON public.media_assets(folder);
CREATE INDEX IF NOT EXISTS idx_media_created ON public.media_assets(created_at DESC);

-- -----------------------------------------------------------------------------
-- 7. PROMOTIONS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.promotions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  subtitle TEXT DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  banner_image_url TEXT NOT NULL DEFAULT '',
  tag TEXT DEFAULT 'Ưu đãi đặc biệt',
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  cta_label TEXT NOT NULL DEFAULT 'Khám phá ngay',
  cta_url TEXT NOT NULL DEFAULT '#menu',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_promotions_sort ON public.promotions(sort_order);

CREATE TRIGGER set_promotions_updated_at
  BEFORE UPDATE ON public.promotions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- -----------------------------------------------------------------------------
-- 8. GALLERY ITEMS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.gallery_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL DEFAULT '',
  caption TEXT DEFAULT '',
  category TEXT NOT NULL DEFAULT 'Không gian' CHECK (category IN ('Đồ uống', 'Không gian', 'Thương hiệu', 'Sự kiện')),
  image_url TEXT NOT NULL,
  aspect_ratio TEXT NOT NULL DEFAULT 'portrait' CHECK (aspect_ratio IN ('portrait', 'landscape', 'square')),
  is_visible BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gallery_sort ON public.gallery_items(sort_order);

CREATE TRIGGER set_gallery_updated_at
  BEFORE UPDATE ON public.gallery_items
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- -----------------------------------------------------------------------------
-- 9. PAGE SECTIONS TABLE (Hero, About, Section Visibility & Reordering)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.page_sections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  section_key TEXT NOT NULL UNIQUE CHECK (section_key IN ('hero', 'about', 'featured', 'menu', 'promotions', 'gallery', 'contact')),
  title TEXT NOT NULL,
  subtitle TEXT DEFAULT '',
  is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INT NOT NULL DEFAULT 0,
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_page_sections_sort ON public.page_sections(sort_order);

CREATE TRIGGER set_page_sections_updated_at
  BEFORE UPDATE ON public.page_sections
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- -----------------------------------------------------------------------------
-- 10. ADMIN ACTIVITY LOGS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_email TEXT,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_name TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_created ON public.admin_activity_logs(created_at DESC);

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_activity_logs ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read their own profile; Admins can read/update all profiles
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Admins can update profiles" ON public.profiles
  FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Site Settings: Anyone can read; only Admin can update/insert
CREATE POLICY "Public can read site_settings" ON public.site_settings
  FOR SELECT USING (TRUE);

CREATE POLICY "Admins can manage site_settings" ON public.site_settings
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Categories: Public can read active categories; Admins can read/write all
CREATE POLICY "Public can view active categories" ON public.categories
  FOR SELECT USING (is_active = TRUE OR public.is_admin());

CREATE POLICY "Admins can manage categories" ON public.categories
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Products: Public can read visible products; Admins can read/write all
CREATE POLICY "Public can view visible products" ON public.products
  FOR SELECT USING (is_visible = TRUE OR public.is_admin());

CREATE POLICY "Admins can manage products" ON public.products
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Media Assets: Public can read; Admins can insert/update/delete
CREATE POLICY "Public can view media_assets" ON public.media_assets
  FOR SELECT USING (TRUE);

CREATE POLICY "Admins can manage media_assets" ON public.media_assets
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Promotions: Public can read active promotions; Admins can read/write all
CREATE POLICY "Public can view active promotions" ON public.promotions
  FOR SELECT USING (is_active = TRUE OR public.is_admin());

CREATE POLICY "Admins can manage promotions" ON public.promotions
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Gallery Items: Public can read visible gallery items; Admins can read/write all
CREATE POLICY "Public can view visible gallery_items" ON public.gallery_items
  FOR SELECT USING (is_visible = TRUE OR public.is_admin());

CREATE POLICY "Admins can manage gallery_items" ON public.gallery_items
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Page Sections: Public can read all sections; Admins can manage all
CREATE POLICY "Public can view page_sections" ON public.page_sections
  FOR SELECT USING (TRUE);

CREATE POLICY "Admins can manage page_sections" ON public.page_sections
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Admin Activity Logs: Only Admins can read and insert
CREATE POLICY "Admins can view activity_logs" ON public.admin_activity_logs
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can insert activity_logs" ON public.admin_activity_logs
  FOR INSERT WITH CHECK (public.is_admin());

-- =============================================================================
-- SUPABASE STORAGE BUCKET & POLICIES ('tunn-media')
-- =============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'tunn-media',
  'tunn-media',
  TRUE,
  5242880, -- 5MB limit per file
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Storage RLS Policies
DROP POLICY IF EXISTS "Public read access for tunn-media" ON storage.objects;
CREATE POLICY "Public read access for tunn-media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'tunn-media');

DROP POLICY IF EXISTS "Admin upload access for tunn-media" ON storage.objects;
CREATE POLICY "Admin upload access for tunn-media"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'tunn-media' AND public.is_admin());

DROP POLICY IF EXISTS "Admin update access for tunn-media" ON storage.objects;
CREATE POLICY "Admin update access for tunn-media"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'tunn-media' AND public.is_admin());

DROP POLICY IF EXISTS "Admin delete access for tunn-media" ON storage.objects;
CREATE POLICY "Admin delete access for tunn-media"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'tunn-media' AND public.is_admin());

-- =============================================================================
-- INITIAL SEED DATA FOR TUNN COFFEE HOUSE
-- =============================================================================

-- 1. Site Settings
INSERT INTO public.site_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- 2. Page Sections (Hero, About, Featured, Menu, Promotions, Gallery, Contact)
INSERT INTO public.page_sections (section_key, title, subtitle, is_enabled, sort_order, content)
VALUES
  (
    'hero',
    'Your Daily Ritual, Made Extraordinary.',
    'Một chút ngọt ngào, cho ngày thêm trọn vẹn.',
    TRUE,
    1,
    '{
      "badge": "EST. TUNN COFFEE HOUSE — ARTISANAL ROASTERY & TEA BAR",
      "headline": "Một chút ngọt ngào,\ncho ngày thêm trọn vẹn.",
      "subheadline": "Your Daily Ritual, Made Extraordinary — Nơi hương cà phê rang mộc quyện cùng vị trà nguyên lá thượng hạng trong không gian tĩnh lặng đầy cảm hứng.",
      "primary_cta_label": "Khám phá Thực đơn",
      "primary_cta_href": "#menu",
      "secondary_cta_label": "Câu chuyện Thương hiệu",
      "secondary_cta_href": "#about",
      "hero_image_url": "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=1400&q=85",
      "secondary_image_url": "https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=900&q=80",
      "background_color": "#E9E6D8",
      "text_color": "#241914",
      "overlay_opacity": 0.15,
      "alignment": "left",
      "featured_note_title": "Trà Sữa Ô Long Nướng Vân Vũ",
      "featured_note_subtitle": "Hương khói nhẹ · Hậu vị ngọt thanh"
    }'::jsonb
  ),
  (
    'about',
    'Triết Lý Của Sự Tĩnh Lặng & Nguyên Bản',
    'Câu chuyện TUNN Coffee House',
    TRUE,
    2,
    '{
      "eyebrow": "THE ART OF SLOWNESS",
      "headline": "Từ những đồi trà sương mù đến tách cà phê thủ công mỗi sớm mai.",
      "lead_paragraph": "Tại TUNN Coffee House, chúng tôi tin rằng một thức uống ngon không chỉ đến từ công thức chuẩn xác, mà bắt đầu từ sự trân trọng từng nguyên liệu tự nhiên và khoảnh khắc thưởng thức của bạn.",
      "story_body": "Mỗi mẻ hạt Arabica Cầu Đất được rang ở ngưỡng vừa phải để giữ trọn hương hoa quả tự nhiên. Mỗi lá trà Ô Long và lục trà Shan Tuyết được ủ lạnh nhiều giờ liền để chiết xuất vị ngọt hậu thanh tao mà không hề chát gắt. Kết hợp cùng sữa tươi thanh trùng và nguyên liệu thủ công làm mới mỗi ngày.",
      "main_image_url": "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=85",
      "secondary_image_url": "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=900&q=80",
      "quote": "“Chúng tôi không chỉ pha chế đồ uống, chúng tôi kiến tạo một khoảng lặng ấm áp giữa nhịp sống vội vã.”",
      "pillars": [
        {
          "number": "01",
          "title": "Nguyên Liệu Tuyển Chọn",
          "description": "100% trà nguyên lá vùng cao, hạt cà phê Arabica & Fine Robusta thu hoạch chín đỏ, bột Matcha Uji Nhật Bản chuẩn lễ trà."
        },
        {
          "number": "02",
          "title": "Pha Chế Thủ Công",
          "description": "Kiểm soát nhiệt độ nước, thời gian ủ trà và áp suất chiết xuất espresso riêng biệt cho từng dòng đồ uống."
        },
        {
          "number": "03",
          "title": "Không Gian Tối Giản Ấm Áp",
          "description": "Thiết kế lấy cảm hứng từ sắc kem ngà, gỗ trầm và ánh sáng tự nhiên, mang lại cảm giác thư thái cho mọi cuộc trò chuyện."
        }
      ]
    }'::jsonb
  ),
  (
    'featured',
    'Tác Phẩm Nổi Bật',
    'Được yêu thích nhất tại TUNN Coffee House',
    TRUE,
    3,
    '{
      "eyebrow": "CURATED SIGNATURES",
      "description": "Những sáng tạo mang đậm dấu ấn riêng của TUNN — cân bằng hoàn hảo giữa hương thơm nguyên bản và cấu trúc vị giác tinh tế."
    }'::jsonb
  ),
  (
    'menu',
    'Thực Đơn Tinh Tuyển',
    'Khám phá trọn vẹn hương vị trà và cà phê thủ công',
    TRUE,
    4,
    '{
      "eyebrow": "SEASONAL & ARTISANAL MENU",
      "note": "Tất cả đồ uống có thể tùy chỉnh mức đường và đá theo khẩu vị riêng của quý khách."
    }'::jsonb
  ),
  (
    'promotions',
    'Ưu Đãi & Mùa Vị Mới',
    'Những chương trình đặc biệt dành riêng cho bạn',
    TRUE,
    5,
    '{
      "eyebrow": "LIMITED EDITIONS & OFFERS"
    }'::jsonb
  ),
  (
    'gallery',
    'Không Gian & Khoảnh Khắc',
    'Góc nhìn nghệ thuật tại TUNN Coffee House',
    TRUE,
    6,
    '{
      "eyebrow": "VISUAL JOURNAL",
      "description": "Từng góc nhỏ, từng vệt nắng chiều và những tách đồ uống được chăm chút tỉ mỉ mỗi ngày."
    }'::jsonb
  ),
  (
    'contact',
    'Ghé Thăm TUNN Coffee House',
    'Chúng tôi luôn sẵn sàng đón tiếp bạn với một tách trà ấm',
    TRUE,
    7,
    '{
      "eyebrow": "VISIT & CONNECT",
      "invitation_note": "Hãy cập nhật địa chỉ, số hotline và bản đồ của quán trong phần Admin CMS → Contact Settings."
    }'::jsonb
  )
ON CONFLICT (section_key) DO NOTHING;

-- 3. Seed Categories (6 core categories)
DO $$
DECLARE
  cat_milktea UUID;
  cat_fruittea UUID;
  cat_coffee UUID;
  cat_matcha UUID;
  cat_signature UUID;
  cat_seasonal UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.categories LIMIT 1) THEN
    INSERT INTO public.categories (name, slug, description, image_url, is_active, sort_order)
    VALUES ('Trà Sữa Nguyên Lá', 'tra-sua', 'Trà ủ chậm kết hợp sữa tươi thanh trùng và kem béo nhẹ.', 'https://images.unsplash.com/photo-1558857563-b371033873b8?auto=format&fit=crop&w=800&q=80', TRUE, 1)
    RETURNING id INTO cat_milktea;

    INSERT INTO public.categories (name, slug, description, image_url, is_active, sort_order)
    VALUES ('Trà Trái Cây Tươi', 'tra-trai-cay', 'Sự giao thoa sảng khoái giữa nền trà thanh mát và trái cây nhiệt đới tươi mới.', 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=800&q=80', TRUE, 2)
    RETURNING id INTO cat_fruittea;

    INSERT INTO public.categories (name, slug, description, image_url, is_active, sort_order)
    VALUES ('Cà Phê Thủ Công', 'ca-phe', 'Hạt cà phê tuyển chọn rang mộc, chiết xuất chuẩn xác.', 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80', TRUE, 3)
    RETURNING id INTO cat_coffee;

    INSERT INTO public.categories (name, slug, description, image_url, is_active, sort_order)
    VALUES ('Matcha Uji Nhật Bản', 'matcha', 'Bột trà xanh Uji thu hoạch vụ xuân được đánh tay truyền thống.', 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&w=800&q=80', TRUE, 4)
    RETURNING id INTO cat_matcha;

    INSERT INTO public.categories (name, slug, description, image_url, is_active, sort_order)
    VALUES ('Signature Sáng Tạo', 'signature', 'Những công thức độc bản chỉ có tại TUNN Coffee House.', 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=800&q=80', TRUE, 5)
    RETURNING id INTO cat_signature;

    INSERT INTO public.categories (name, slug, description, image_url, is_active, sort_order)
    VALUES ('Seasonal Drinks', 'seasonal-drinks', 'Bộ sưu tập thức uống giới hạn theo từng mùa trong năm.', 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=800&q=80', TRUE, 6)
    RETURNING id INTO cat_seasonal;

    -- 4. Seed Products
    INSERT INTO public.products (
      name, slug, description, image_url, price, sale_price, category_id, badge,
      is_featured, is_best_seller, is_available, is_visible, sort_order
    ) VALUES
      (
        'Ô Long Nướng Kem Phô Mai Muối Biển',
        'o-long-nuong-kem-pho-mai',
        'Trà Ô Long nướng than hồng đậm hương khói nhẹ, quyện cùng lớp kem phô mai mặn dịu mịn màng như nhung.',
        'https://images.unsplash.com/photo-1558857563-b371033873b8?auto=format&fit=crop&w=800&q=80',
        65000, 59000, cat_milktea, 'Best Seller', TRUE, TRUE, TRUE, TRUE, 1
      ),
      (
        'Trà Sữa Hồng Trà Shan Tuyết Cổ Thụ',
        'tra-sua-hong-tra-shan-tuyet',
        'Hồng trà lên men từ búp trà Shan Tuyết cổ thụ, hương mật ong rừng tự nhiên kết hợp sữa tươi thanh nhẹ.',
        'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=800&q=80',
        62000, NULL, cat_milktea, 'Signature', TRUE, FALSE, TRUE, TRUE, 2
      ),
      (
        'Cold Brew Cam Vàng Quế Thanh',
        'cold-brew-cam-vang-que-thanh',
        'Cà phê Arabica ủ lạnh 18 giờ, điểm xuyết nước cam vàng tươi và hương quế trầm ấm.',
        'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=800&q=80',
        68000, NULL, cat_coffee, 'Signature', TRUE, TRUE, TRUE, TRUE, 3
      ),
      (
        'Matcha Uji Latte Kem Sữa Lạnh',
        'matcha-uji-latte-kem-sua',
        'Matcha Ceremonial Grade vùng Uji đánh chasen thủ công trên nền sữa yến mạch và kem lạnh béo thanh.',
        'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&w=800&q=80',
        72000, 68000, cat_matcha, 'Must Try', TRUE, TRUE, TRUE, TRUE, 4
      ),
      (
        'Trà Lài Nhãn Nhục Hạt Sen Tươi',
        'tra-lai-nhan-nhuc-hat-sen',
        'Lục trà ướp hoa lài tự nhiên, kết hợp nhãn nhục lồng Hưng Yên và hạt sen bùi ngọt thanh mát.',
        'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=800&q=80',
        58000, NULL, cat_fruittea, 'Thanh Mát', TRUE, FALSE, TRUE, TRUE, 5
      ),
      (
        'TUNN Espresso Kem Hạt Phỉ Rang',
        'tunn-espresso-kem-hat-phi',
        'Double shot Espresso đậm đà nâng đỡ lớp kem tươi hạt phỉ rang thơm bùi và vụn cacao nguyên chất.',
        'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80',
        69000, NULL, cat_signature, 'Độc Bản', TRUE, TRUE, TRUE, TRUE, 6
      ),
      (
        'Trà Đào Hồng Tuyết Sơn',
        'tra-dao-hong-tuyet-son',
        'Trà Ô Long bạch đào thanh tao kết hợp miếng đào giòn ngọt và lớp foam hoa hồng nhẹ nhàng.',
        'https://images.unsplash.com/photo-1499638673689-79a0b5115d87?auto=format&fit=crop&w=800&q=80',
        60000, NULL, cat_fruittea, '', FALSE, FALSE, TRUE, TRUE, 7
      ),
      (
        'Matcha Dừa Tươi Nướng Bến Tre',
        'matcha-dua-tuoi-nuong',
        'Sự kết hợp bất ngờ giữa vị umami của Matcha Uji và nước dừa tươi ngọt thanh điểm dừa nướng giòn.',
        'https://images.unsplash.com/photo-1515823064-d6e0c04616a7?auto=format&fit=crop&w=800&q=80',
        69000, NULL, cat_matcha, 'New', FALSE, FALSE, TRUE, TRUE, 8
      ),
      (
        'Cà Phê Sữa Hạnh Nhân Rang Mộc',
        'ca-phe-sua-hanh-nhan',
        'Cà phê phin truyền thống biến tấu cùng sữa hạnh nhân thơm dịu và kem béo thực vật.',
        'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=800&q=80',
        55000, NULL, cat_coffee, '', FALSE, FALSE, TRUE, TRUE, 9
      ),
      (
        'Houjicha Sữa Hạt Dẻ Mùa Thu',
        'houjicha-sua-hat-de-mua-thu',
        'Trà xanh rang Houjicha ấm áp hòa quyện sốt hạt dẻ nghiền thủ công và sữa tươi đánh bông.',
        'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=800&q=80',
        75000, 69000, cat_seasonal, 'Seasonal', FALSE, FALSE, TRUE, TRUE, 10
      );
  END IF;
END $$;

-- 5. Seed Promotions
INSERT INTO public.promotions (
  title, subtitle, description, banner_image_url, tag, start_date, end_date, cta_label, cta_url, is_active, sort_order
)
SELECT * FROM (VALUES
  (
    'Bộ Sưu Tập Thu Đông — Hương Trà Nướng & Hạt Dẻ',
    'AUTUMN / WINTER COLLECTION',
    'Thưởng thức trọn vẹn sự ấm áp từ trà Ô Long nướng than hồng, Houjicha rang trầm và kem hạt dẻ thủ công mới ra mắt tại TUNN Coffee House.',
    'https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&w=1200&q=85',
    'Seasonal Collection',
    NOW() - INTERVAL '7 days',
    NOW() + INTERVAL '60 days',
    'Thử ngay Bộ sưu tập mới',
    '#menu',
    TRUE,
    1
  ),
  (
    'Morning Ritual — Ưu Đãi 15% Khung Giờ Sáng',
    'EVERYDAY 07:30 — 10:30',
    'Khởi đầu ngày mới tràn đầy cảm hứng với ưu đãi 15% cho toàn bộ dòng Cà Phê Thủ Công và Matcha Uji khi ghé quán mỗi buổi sáng.',
    'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=85',
    'Daily Ritual',
    NOW() - INTERVAL '14 days',
    NOW() + INTERVAL '90 days',
    'Xem Thực đơn Cà phê',
    '#menu',
    TRUE,
    2
  )
) AS v(title, subtitle, description, banner_image_url, tag, start_date, end_date, cta_label, cta_url, is_active, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM public.promotions LIMIT 1);

-- 6. Seed Gallery Items
INSERT INTO public.gallery_items (
  title, caption, category, image_url, aspect_ratio, is_visible, sort_order
)
SELECT * FROM (VALUES
  (
    'Ánh nắng sớm qua khung cửa',
    'Không gian tĩnh lặng ngập tràn ánh sáng tự nhiên mỗi buổi sớm tại TUNN.',
    'Không gian',
    'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1000&q=85',
    'portrait',
    TRUE,
    1
  ),
  (
    'Nghệ thuật Pour Over thủ công',
    'Từng giọt cà phê chiết xuất chậm để giữ trọn tầng hương hoa quả.',
    'Đồ uống',
    'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1000&q=85',
    'landscape',
    TRUE,
    2
  ),
  (
    'Matcha Uji đánh Chasen truyền thống',
    'Bột trà xanh nghiền cối đá từ vùng Uji, Kyoto với sắc xanh ngọc bích.',
    'Đồ uống',
    'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&w=1000&q=85',
    'square',
    TRUE,
    3
  ),
  (
    'Góc thưởng trà tối giản',
    'Sự giao thoa giữa vật liệu gỗ trầm, gốm mộc và sắc kem ngà ấm áp.',
    'Không gian',
    'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1000&q=85',
    'portrait',
    TRUE,
    4
  ),
  (
    'Lá trà nguyên bản vùng cao',
    'Tuyển chọn từ những đồi trà sương mù cổ thụ trước khi ủ lạnh.',
    'Thương hiệu',
    'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=1000&q=85',
    'landscape',
    TRUE,
    5
  ),
  (
    'Buổi Workshop Thưởng Trà & Cà Phê',
    'Kết nối những tâm hồn đồng điệu yêu hương vị nguyên bản cuối tuần.',
    'Sự kiện',
    'https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&w=1000&q=85',
    'square',
    TRUE,
    6
  )
) AS v(title, caption, category, image_url, aspect_ratio, is_visible, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM public.gallery_items LIMIT 1);
