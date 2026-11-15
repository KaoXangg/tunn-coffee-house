import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  DEFAULT_SITE_SETTINGS,
  DEFAULT_CATEGORIES,
  DEFAULT_PRODUCTS,
  DEFAULT_PROMOTIONS,
  DEFAULT_GALLERY_ITEMS,
  DEFAULT_PAGE_SECTIONS,
} from '../lib/defaultData';
import type {
  SiteSettings,
  Category,
  Product,
  Promotion,
  GalleryItem,
  PageSection,
  MediaAsset,
  AdminActivityLog,
} from '../types/database';

interface SiteDataContextType {
  settings: SiteSettings;
  categories: Category[];
  products: Product[];
  promotions: Promotion[];
  gallery: GalleryItem[];
  sections: PageSection[];
  mediaAssets: MediaAsset[];
  activityLogs: AdminActivityLog[];
  loading: boolean;
  isLiveDatabase: boolean;
  refreshAll: () => Promise<void>;
  getSection: (key: PageSection['section_key']) => PageSection | undefined;
  updateSiteSettings: (partial: Partial<SiteSettings>) => Promise<{ error: string | null }>;
  updatePageSection: (
    sectionKey: PageSection['section_key'],
    updates: Partial<PageSection>
  ) => Promise<{ error: string | null }>;
  logAdminActivity: (
    action: string,
    entityType: string,
    entityName?: string,
    details?: Record<string, any>
  ) => Promise<void>;
}

const SiteDataContext = createContext<SiteDataContextType | undefined>(undefined);

export const SiteDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [products, setProducts] = useState<Product[]>(DEFAULT_PRODUCTS);
  const [promotions, setPromotions] = useState<Promotion[]>(DEFAULT_PROMOTIONS);
  const [gallery, setGallery] = useState<GalleryItem[]>(DEFAULT_GALLERY_ITEMS);
  const [sections, setSections] = useState<PageSection[]>(DEFAULT_PAGE_SECTIONS);
  const [mediaAssets, setMediaAssets] = useState<MediaAsset[]>([]);
  const [activityLogs, setActivityLogs] = useState<AdminActivityLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isLiveDatabase, setIsLiveDatabase] = useState<boolean>(false);

  // Sync CSS variables, document title, SEO meta tags, and favicon whenever settings change
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--color-primary', settings.primary_color || '#4B2E24');
    root.style.setProperty('--color-bg-secondary', settings.secondary_bg_color || '#E9E6D8');
    root.style.setProperty('--color-bg-primary', settings.primary_bg_color || '#F7F5EF');
    root.style.setProperty('--color-text-primary', settings.text_primary_color || '#241914');
    root.style.setProperty('--color-text-muted', settings.text_muted_color || '#8C7565');
    root.style.setProperty('--color-accent', settings.accent_color || '#D5C6AD');
    // Upgrade legacy 'Cormorant Garamond' or 'Georgia' to 'Lora' to prevent Vietnamese diacritic shifting on Windows
    const cleanHeadingFont =
      !settings.heading_font ||
      settings.heading_font === 'Cormorant Garamond' ||
      settings.heading_font === 'Georgia'
        ? 'Lora'
        : settings.heading_font;

    const cleanBodyFont =
      !settings.body_font || settings.body_font === 'Plus Jakarta Sans'
        ? 'Be Vietnam Pro'
        : settings.body_font;

    root.style.setProperty('--font-heading', `"${cleanHeadingFont}"`);
    root.style.setProperty('--font-body', `"${cleanBodyFont}"`);
    root.style.setProperty('--radius-brand', settings.border_radius || '0.25rem');

    if (settings.theme_mode === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Update Document Title & Meta SEO
    document.title = settings.seo_title || settings.site_title || 'TUNN Coffee House';

    const setMeta = (selector: string, attr: string, val: string) => {
      const el = document.querySelector(selector);
      if (el && val) el.setAttribute(attr, val);
    };

    setMeta('meta[name="description"]', 'content', settings.seo_description);
    setMeta('meta[name="keywords"]', 'content', settings.seo_keywords);
    setMeta('meta[property="og:title"]', 'content', settings.seo_title);
    setMeta('meta[property="og:description"]', 'content', settings.seo_description);
    setMeta('meta[property="og:image"]', 'content', settings.og_image_url || settings.logo_url);

    const favicon = document.getElementById('dynamic-favicon') as HTMLLinkElement | null;
    if (favicon && settings.favicon_url) {
      favicon.href = settings.favicon_url;
    }
  }, [settings]);

  const refreshAll = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setIsLiveDatabase(false);
      setLoading(false);
      return;
    }

    try {
      const [
        settingsRes,
        catsRes,
        prodsRes,
        promosRes,
        galleryRes,
        sectionsRes,
        mediaRes,
        logsRes,
      ] = await Promise.all([
        supabase.from('site_settings').select('*').eq('id', 1).maybeSingle(),
        supabase.from('categories').select('*').order('sort_order', { ascending: true }),
        supabase
          .from('products')
          .select('*, categories(*)')
          .order('sort_order', { ascending: true }),
        supabase.from('promotions').select('*').order('sort_order', { ascending: true }),
        supabase.from('gallery_items').select('*').order('sort_order', { ascending: true }),
        supabase.from('page_sections').select('*').order('sort_order', { ascending: true }),
        supabase.from('media_assets').select('*').order('created_at', { ascending: false }),
        supabase
          .from('admin_activity_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(200),
      ]);

      if (!settingsRes.error && settingsRes.data) {
        setSettings({
          ...DEFAULT_SITE_SETTINGS,
          ...settingsRes.data,
          nav_items: Array.isArray(settingsRes.data.nav_items)
            ? settingsRes.data.nav_items
            : DEFAULT_SITE_SETTINGS.nav_items,
        });
        setIsLiveDatabase(true);
      }

      if (!catsRes.error && catsRes.data) {
        setCategories(catsRes.data as Category[]);
        setIsLiveDatabase(true);
      }

      if (!prodsRes.error && prodsRes.data) {
        setProducts(prodsRes.data as Product[]);
      }

      if (!promosRes.error && promosRes.data) {
        setPromotions(promosRes.data as Promotion[]);
      }

      if (!galleryRes.error && galleryRes.data) {
        setGallery(galleryRes.data as GalleryItem[]);
      }

      if (!sectionsRes.error && sectionsRes.data && sectionsRes.data.length > 0) {
        setSections(sectionsRes.data as PageSection[]);
      }

      if (!mediaRes.error && mediaRes.data) {
        setMediaAssets(mediaRes.data as MediaAsset[]);
      }

      if (!logsRes.error && logsRes.data) {
        setActivityLogs(logsRes.data as AdminActivityLog[]);
      }
    } catch (err) {
      console.warn('Error fetching live data from Supabase:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  // Realtime subscription so customer website updates automatically when Admin saves
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const channel = supabase
      .channel('tunn-cms-realtime')
      .on('postgres_changes', { event: '*', schema: 'public' }, () => {
        refreshAll();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refreshAll]);

  const getSection = useCallback(
    (key: PageSection['section_key']) => {
      return (
        sections.find((s) => s.section_key === key) ||
        DEFAULT_PAGE_SECTIONS.find((s) => s.section_key === key)
      );
    },
    [sections]
  );

  const logAdminActivity = useCallback(
    async (
      action: string,
      entityType: string,
      entityName?: string,
      details: Record<string, any> = {}
    ) => {
      if (!isSupabaseConfigured) return;
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        let sessionId = sessionStorage.getItem('tunn_admin_session_id');
        let sessionStartMs = Number(sessionStorage.getItem('tunn_admin_session_start') || 0);
        if (!sessionId || !sessionStartMs) {
          sessionId =
            typeof crypto !== 'undefined' && crypto.randomUUID
              ? crypto.randomUUID()
              : `sess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
          sessionStartMs = Date.now();
          sessionStorage.setItem('tunn_admin_session_id', sessionId);
          sessionStorage.setItem('tunn_admin_session_start', String(sessionStartMs));
        }

        const sessionDurationSec = Math.max(
          1,
          Math.round((Date.now() - sessionStartMs) / 1000)
        );

        await supabase.from('admin_activity_logs').insert({
          actor_id: user.id,
          actor_email: user.email,
          action,
          entity_type: entityType,
          entity_name: entityName || null,
          details: {
            session_id: sessionId,
            session_started_at: new Date(sessionStartMs).toISOString(),
            session_duration_sec: sessionDurationSec,
            actor_name:
              user.user_metadata?.full_name ||
              user.email?.split('@')[0] ||
              'Quản lý',
            page_path: window.location.pathname,
            ...details,
          },
        });
      } catch {
        // non-blocking
      }
    },
    []
  );

  const updateSiteSettings = async (partial: Partial<SiteSettings>) => {
    const merged = { ...settings, ...partial, id: 1 };
    setSettings(merged);

    if (!isSupabaseConfigured) {
      return {
        error:
          'Đang ở chế độ xem trước (Chưa cấu hình biến môi trường Supabase). Thay đổi được áp dụng tạm thời trên giao diện.',
      };
    }

    const { error } = await supabase
      .from('site_settings')
      .upsert({ ...partial, id: 1 })
      .eq('id', 1);

    if (error) {
      return { error: error.message };
    }

    await logAdminActivity('Cập nhật cài đặt', 'site_settings', 'Cấu hình thương hiệu & Website');
    await refreshAll();
    return { error: null };
  };

  const updatePageSection = async (
    sectionKey: PageSection['section_key'],
    updates: Partial<PageSection>
  ) => {
    const existing = getSection(sectionKey);
    if (!existing) return { error: 'Section không tồn tại' };

    const updatedSection: PageSection = {
      ...existing,
      ...updates,
      content: updates.content ? { ...existing.content, ...updates.content } : existing.content,
    };

    setSections((prev) =>
      prev.map((s) => (s.section_key === sectionKey ? updatedSection : s))
    );

    if (!isSupabaseConfigured) {
      return {
        error:
          'Đang ở chế độ xem trước (Chưa kết nối Supabase). Thay đổi được áp dụng tạm thời trên giao diện.',
      };
    }

    const { error } = await supabase.from('page_sections').upsert(
      {
        section_key: sectionKey,
        title: updatedSection.title,
        subtitle: updatedSection.subtitle,
        is_enabled: updatedSection.is_enabled,
        sort_order: updatedSection.sort_order,
        content: updatedSection.content,
      },
      { onConflict: 'section_key' }
    );

    if (error) {
      return { error: error.message };
    }

    await logAdminActivity('Cập nhật nội dung trang', 'page_sections', sectionKey);
    await refreshAll();
    return { error: null };
  };

  return (
    <SiteDataContext.Provider
      value={{
        settings,
        categories,
        products,
        promotions,
        gallery,
        sections,
        mediaAssets,
        activityLogs,
        loading,
        isLiveDatabase,
        refreshAll,
        getSection,
        updateSiteSettings,
        updatePageSection,
        logAdminActivity,
      }}
    >
      {children}
    </SiteDataContext.Provider>
  );
};

export function useSiteData() {
  const ctx = useContext(SiteDataContext);
  if (!ctx) throw new Error('useSiteData must be used within SiteDataProvider');
  return ctx;
}
