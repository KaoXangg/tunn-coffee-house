import React, { useState, useMemo } from 'react';
import { useSiteData } from '../contexts/SiteDataContext';
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

export const CustomerHomePage: React.FC = () => {
  const { sections } = useSiteData();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

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
        {orderedSections.map((sec) =>
          sec.is_enabled ? renderSection(sec.section_key) : null
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
