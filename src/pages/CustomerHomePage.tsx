import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSiteData } from '../contexts/SiteDataContext';
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
  const { sections, loading } = useSiteData();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchParams] = useSearchParams();
  const tableNumber = searchParams.get('table');

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
    <div className="min-h-screen flex flex-col bg-ivory-light text-coffee-dark">
      <CustomerHeader />
      <main className="flex-1">
        {tableNumber && (
          <div className="fixed bottom-4 left-4 z-40 px-4 py-2 bg-[#241914] text-[#F7F5EF] border border-[#4B2E24] rounded-brand shadow-lg text-xs font-medium">
            Đang xem thực đơn tại <strong className="text-[#D5C6AD]">Bàn {tableNumber}</strong>
          </div>
        )}
        {loading ? (
          <StorefrontSkeleton />
        ) : (
          orderedSections.map((sec) =>
            sec.is_enabled ? renderSection(sec.section_key) : null
          )
        )}
      </main>
      <CustomerFooter />

      <ProductDetailModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />
    </div>
  );
};
