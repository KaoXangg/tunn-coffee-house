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

    const { tokens } = effectiveTheme;
    const prev = {
      primary: root.style.getPropertyValue('--color-primary'),
      bgSecondary: root.style.getPropertyValue('--color-bg-secondary'),
      bgPrimary: root.style.getPropertyValue('--color-bg-primary'),
      textPrimary: root.style.getPropertyValue('--color-text-primary'),
      textMuted: root.style.getPropertyValue('--color-text-muted'),
      accent: root.style.getPropertyValue('--color-accent'),
    };

    root.dataset.seasonalActive = '1';
    root.style.setProperty('--color-primary', tokens.primary);
    root.style.setProperty('--color-bg-secondary', tokens.surface || tokens.secondary);
    root.style.setProperty('--color-bg-primary', tokens.background);
    root.style.setProperty('--color-text-primary', tokens.text);
    root.style.setProperty('--color-text-muted', tokens.textMuted);
    root.style.setProperty('--color-accent', tokens.border || tokens.accent);

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
