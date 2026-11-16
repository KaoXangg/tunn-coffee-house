import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSiteData } from '../contexts/SiteDataContext';
import { useSeasonalTheme } from '../contexts/SeasonalThemeContext';
import { trackQrTableScan } from '../lib/analytics';
import { CustomerHeader } from '../components/customer/CustomerHeader';
import { HeroSection } from '../components/customer/HeroSection';
import { AboutSection } from '../components/customer/AboutSection';
import { FeaturedSection } from '../components/customer/FeaturedSection';
import { MenuSection } from '../components/customer/MenuSection';
import { PromotionsSection } from '../components/customer/PromotionsSection';
import { GallerySection } from '../components/customer/GallerySection';
import { ContactSection } from '../components/customer/ContactSection';
import { CustomerFooter } from '../components/customer/CustomerFooter';
import { ProductDetailModal } from '../components/customer/ProductDetailModal';
import { TableFeedbackModal } from '../components/customer/TableFeedbackModal';
import { SeasonalEffectsLayer } from '../components/customer/SeasonalEffectsLayer';
import { SeasonalBanner, SeasonalPreviewBar } from '../components/customer/SeasonalBanner';
import { BackToTopButton } from '../components/common/MotionPrimitives';
import { Star } from 'lucide-react';
import type { Product } from '../types/database';

const StorefrontSkeleton: React.FC = () => (
  <div className="pt-28 sm:pt-36 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 space-y-16 animate-pulse">
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
      <div className="lg:col-span-7 space-y-5">
        <div className="h-4 w-48 bg-coffee-beige/60 rounded" />
        <div className="h-14 w-5/6 bg-coffee-beige/70 rounded" />
        <div className="h-14 w-2/3 bg-coffee-beige/60 rounded" />
        <div className="h-5 w-3/4 bg-coffee-beige/40 rounded" />
        <div className="flex gap-4 pt-4">
          <div className="h-12 w-44 bg-coffee-beige/70 rounded-brand" />
          <div className="h-12 w-40 bg-coffee-beige/40 rounded-brand" />
        </div>
      </div>
      <div className="lg:col-span-5">
        <div className="aspect-[4/5] w-full max-w-md mx-auto bg-coffee-beige/50 rounded-brand" />
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8 border-t border-coffee-beige/40">
      {[1, 2, 3].map((i) => (
        <div key={i} className="space-y-3">
          <div className="aspect-[4/5] bg-coffee-beige/50 rounded-brand" />
          <div className="h-6 w-2/3 bg-coffee-beige/60 rounded" />
          <div className="h-4 w-full bg-coffee-beige/40 rounded" />
        </div>
      ))}
    </div>
  </div>
);

export const CustomerHomePage: React.FC = () => {
  const { sections, loading, settings, themeMode } = useSiteData();
  const { effectiveTheme } = useSeasonalTheme();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [searchParams] = useSearchParams();
  const tableNumber = searchParams.get('table');

  // Synchronize active or previewed seasonal theme tokens onto CSS custom properties
  useEffect(() => {
    const root = document.documentElement;
    if (!effectiveTheme) return;

    const { tokens, key: themeKey } = effectiveTheme;

    const DARK_VARIANT_BY_KEY: Record<
      string,
      {
        primary: string;
        background: string;
        surface: string;
        text: string;
        textMuted: string;
        border: string;
      }
    > = {
      christmas: {
        primary: '#C83E46',
        background: '#0E1915',
        surface: '#162620',
        text: '#F2F7F4',
        textMuted: '#9FB8AD',
        border: '#243D33',
      },
      valentine: {
        primary: '#F43F5E',
        background: '#1A0D13',
        surface: '#26131C',
        text: '#FDF2F6',
        textMuted: '#CFA3B5',
        border: '#3D1E2C',
      },
      tet: {
        primary: '#EAB308',
        background: '#1A0E0B',
        surface: '#271510',
        text: '#FFF7ED',
        textMuted: '#D6B39A',
        border: '#42241B',
      },
      summer: {
        primary: '#38BDF8',
        background: '#0B1822',
        surface: '#122433',
        text: '#F0F9FF',
        textMuted: '#93B8D4',
        border: '#1E3A52',
      },
    };

    const LIGHT_VARIANT_BY_KEY: Record<
      string,
      {
        primary: string;
        background: string;
        surface: string;
        text: string;
        textMuted: string;
        border: string;
      }
    > = {
      halloween: {
        primary: '#9333EA',
        background: '#F8F4FC',
        surface: '#EFE7F8',
        text: '#231433',
        textMuted: '#6D5488',
        border: '#DCCCEB',
      },
      black_friday: {
        primary: '#DC2626',
        background: '#F6F5F3',
        surface: '#ECEAE6',
        text: '#141416',
        textMuted: '#63636B',
        border: '#D6D3CD',
      },
      mid_autumn: {
        primary: '#D97706',
        background: '#F3F6FB',
        surface: '#E6ECF7',
        text: '#142038',
        textMuted: '#586A8F',
        border: '#C9D5EC',
      },
    };

    const inherentlyDark =
      themeKey === 'halloween' ||
      themeKey === 'black_friday' ||
      themeKey === 'mid_autumn';

    const resolved =
      themeMode === 'dark' && !inherentlyDark
        ? DARK_VARIANT_BY_KEY[themeKey] || {
            primary: tokens.primary,
            background: '#13100E',
            surface: '#1D1815',
            text: '#F5EFE6',
            textMuted: '#A9988A',
            border: '#2E2621',
          }
        : themeMode === 'light' && inherentlyDark
        ? LIGHT_VARIANT_BY_KEY[themeKey] || tokens
        : tokens;

    const prev = {
      primary: root.style.getPropertyValue('--color-primary'),
      bgSecondary: root.style.getPropertyValue('--color-bg-secondary'),
      bgPrimary: root.style.getPropertyValue('--color-bg-primary'),
      textPrimary: root.style.getPropertyValue('--color-text-primary'),
      textMuted: root.style.getPropertyValue('--color-text-muted'),
      accent: root.style.getPropertyValue('--color-accent'),
    };

    root.dataset.seasonalActive = '1';
    root.style.setProperty('--color-primary', resolved.primary);
    root.style.setProperty('--color-bg-secondary', resolved.surface || tokens.secondary);
    root.style.setProperty('--color-bg-primary', resolved.background);
    root.style.setProperty('--color-text-primary', resolved.text);
    root.style.setProperty('--color-text-muted', resolved.textMuted);
    root.style.setProperty('--color-accent', resolved.border || tokens.accent);

    root.style.setProperty('--theme-primary', tokens.primary);
    root.style.setProperty('--theme-secondary', tokens.secondary);
    root.style.setProperty('--theme-accent', tokens.accent);
    root.style.setProperty('--theme-background', tokens.background);
    root.style.setProperty('--theme-surface', tokens.surface);
    root.style.setProperty('--theme-text', tokens.text);
    root.style.setProperty('--theme-border', tokens.border);
    root.style.setProperty('--theme-header', tokens.headerBg);
    root.style.setProperty('--theme-footer', tokens.footerBg);
    root.style.setProperty('--theme-button', tokens.buttonBg);
    root.style.setProperty('--theme-glow', tokens.glow);

    return () => {
      delete root.dataset.seasonalActive;
      if (prev.primary) root.style.setProperty('--color-primary', prev.primary);
      if (prev.bgSecondary) root.style.setProperty('--color-bg-secondary', prev.bgSecondary);
      if (prev.bgPrimary) root.style.setProperty('--color-bg-primary', prev.bgPrimary);
      if (prev.textPrimary) root.style.setProperty('--color-text-primary', prev.textPrimary);
      if (prev.textMuted) root.style.setProperty('--color-text-muted', prev.textMuted);
      if (prev.accent) root.style.setProperty('--color-accent', prev.accent);
    };
  }, [effectiveTheme, settings, themeMode]);

  useEffect(() => {
    if (tableNumber) {
      trackQrTableScan(tableNumber);
    }
  }, [tableNumber]);

  const orderedSections = useMemo(() => {
    return [...sections].sort((a, b) => a.sort_order - b.sort_order);
  }, [sections]);

  const renderSection = (key: string) => {
    switch (key) {
      case 'hero':
        return <HeroSection key="hero" />;
      case 'about':
        return <AboutSection key="about" />;
      case 'featured':
        return (
          <FeaturedSection
            key="featured"
            onSelectProduct={(prod) => setSelectedProduct(prod)}
          />
        );
      case 'menu':
        return (
          <MenuSection
            key="menu"
            onSelectProduct={(prod) => setSelectedProduct(prod)}
          />
        );
      case 'promotions':
        return <PromotionsSection key="promotions" />;
      case 'gallery':
        return <GallerySection key="gallery" />;
      case 'contact':
        return <ContactSection key="contact" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-ivory-light text-coffee-dark relative">
      <SeasonalEffectsLayer />
      <CustomerHeader />
      <SeasonalBanner />
      <main className="flex-1 relative">
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 max-w-[calc(100vw-2rem)]">
          {tableNumber && (
            <div className="px-3.5 py-2 bg-[#241914]/95 backdrop-blur-sm text-[#F7F5EF] border border-[#4B2E24] rounded-full shadow-lg text-xs font-medium whitespace-nowrap">
              Đang xem tại <strong className="text-[#D5C6AD]">Bàn {tableNumber}</strong>
            </div>
          )}
          <button
            type="button"
            onClick={() => setFeedbackOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-ivory-light/95 backdrop-blur-sm text-coffee-dark border border-coffee-beige hover:border-coffee rounded-full shadow-lg text-xs font-semibold transition-colors whitespace-nowrap"
          >
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
            <span>Đánh giá</span>
          </button>
        </div>
        {loading ? (
          <StorefrontSkeleton />
        ) : (
          orderedSections.map((sec) =>
            sec.is_enabled ? renderSection(sec.section_key) : null
          )
        )}
      </main>
      <CustomerFooter />
      <BackToTopButton />
      <SeasonalPreviewBar />

      <ProductDetailModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />

      <TableFeedbackModal
        open={feedbackOpen}
        tableNumber={tableNumber}
        onClose={() => setFeedbackOpen(false)}
      />
    </div>
  );
};
