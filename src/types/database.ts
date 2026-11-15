export interface NavItem {
  label: string;
  href: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: 'admin' | 'editor' | 'staff';
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface SiteSettings {
  id: number;
  brand_name: string;
  site_title: string;
  slogan: string;
  logo_url: string;
  favicon_url: string;

  // Appearance & Design System
  primary_color: string;
  secondary_bg_color: string;
  primary_bg_color: string;
  text_primary_color: string;
  text_muted_color: string;
  accent_color: string;
  heading_font: string;
  body_font: string;
  border_radius: string;
  button_style: 'editorial' | 'rounded' | 'pill';
  theme_mode: 'light' | 'dark';

  // Navigation & Header
  nav_items: NavItem[];
  header_cta_label: string;
  header_cta_href: string;

  // Contact Settings
  store_name: string;
  address: string;
  hotline: string;
  email: string;
  opening_hours: string;
  google_maps_url: string;
  google_maps_embed: string;
  facebook_url: string;
  instagram_url: string;
  tiktok_url: string;
  order_url: string;

  // Footer
  footer_description: string;
  copyright_text: string;

  // SEO
  seo_title: string;
  seo_description: string;
  seo_keywords: string;
  og_image_url: string;

  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  image_url: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  image_url: string;
  price: number;
  sale_price: number | null;
  category_id: string | null;
  badge: string;
  is_featured: boolean;
  is_best_seller: boolean;
  is_available: boolean;
  is_visible: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  categories?: Category | null;
}

export interface MediaAsset {
  id: string;
  file_name: string;
  file_path: string;
  public_url: string;
  mime_type: string;
  file_size: number;
  width: number | null;
  height: number | null;
  alt_text: string;
  folder: string;
  uploaded_by: string | null;
  created_at: string;
}

export interface Promotion {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  banner_image_url: string;
  tag: string;
  start_date: string | null;
  end_date: string | null;
  cta_label: string;
  cta_url: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface GalleryItem {
  id: string;
  title: string;
  caption: string;
  category: 'Đồ uống' | 'Không gian' | 'Thương hiệu' | 'Sự kiện';
  image_url: string;
  aspect_ratio: 'portrait' | 'landscape' | 'square';
  is_visible: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface HeroSectionContent {
  badge: string;
  headline: string;
  subheadline: string;
  primary_cta_label: string;
  primary_cta_href: string;
  secondary_cta_label: string;
  secondary_cta_href: string;
  hero_image_url: string;
  secondary_image_url: string;
  background_color: string;
  text_color: string;
  overlay_opacity: number;
  alignment: 'left' | 'center' | 'right';
  featured_note_title: string;
  featured_note_subtitle: string;
}

export interface AboutPillar {
  number: string;
  title: string;
  description: string;
}

export interface AboutSectionContent {
  eyebrow: string;
  headline: string;
  lead_paragraph: string;
  story_body: string;
  main_image_url: string;
  secondary_image_url: string;
  quote: string;
  pillars: AboutPillar[];
}

export interface PageSection {
  id: string;
  section_key: 'hero' | 'about' | 'featured' | 'menu' | 'promotions' | 'gallery' | 'contact';
  title: string;
  subtitle: string;
  is_enabled: boolean;
  sort_order: number;
  content: Record<string, any>;
  updated_at: string;
}

export interface AdminActivityLog {
  id: string;
  actor_id: string | null;
  actor_email: string | null;
  action: string;
  entity_type: string;
  entity_name: string | null;
  details: Record<string, any>;
  created_at: string;
}
