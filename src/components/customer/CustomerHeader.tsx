import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, ArrowUpRight, ShieldCheck, Clock, Phone } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useSiteData } from '../../contexts/SiteDataContext';
import { useAuth } from '../../contexts/AuthContext';
import { BrandLogo } from '../common/BrandLogo';

export const CustomerHeader: React.FC = () => {
  const { settings } = useSiteData();
  const { isAdmin } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeHash, setActiveHash] = useState('#hero');

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 36);

      const sectionIds = [
        'hero',
        'about',
        'featured',
        'menu',
        'promotions',
        'gallery',
        'contact',
      ];
      for (const id of sectionIds) {
        const el = document.getElementById(id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 160 && rect.bottom >= 160) {
            setActiveHash(`#${id}`);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [mobileOpen]);

  const navItems =
    Array.isArray(settings.nav_items) && settings.nav_items.length > 0
      ? settings.nav_items
      : [
          { label: 'Trang chủ', href: '#hero' },
          { label: 'Câu chuyện', href: '#about' },
          { label: 'Tuyển chọn', href: '#featured' },
          { label: 'Thực đơn', href: '#menu' },
          { label: 'Mùa vị mới', href: '#promotions' },
          { label: 'Không gian', href: '#gallery' },
          { label: 'Điểm hẹn', href: '#contact' },
        ];

  const handleNavClick = (href: string) => {
    setMobileOpen(false);
    setActiveHash(href);
  };

  const buttonRadiusClass =
    settings.button_style === 'pill'
      ? 'rounded-full'
      : settings.button_style === 'rounded'
      ? 'rounded-lg'
      : 'rounded-brand';

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-ivory-light/95 backdrop-blur-md border-b border-coffee-beige/80 shadow-xs'
          : 'bg-ivory-light/90 backdrop-blur-sm border-b border-coffee-beige/50'
      }`}
    >
      {/* Top Editorial Utility Strip (collapses on scroll) */}
      <div
        className={`hidden lg:block bg-[#241914] text-[#E9E6D8] overflow-hidden transition-all duration-300 ${
          scrolled ? 'max-h-0 opacity-0' : 'max-h-9 opacity-100 border-b border-[#4B2E24]'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 h-8 flex items-center justify-between text-[11px] tracking-wider">
          <span className="uppercase tracking-[0.18em] text-[#D5C6AD]">
            {settings.brand_name} — Trà Nguyên Lá &amp; Cà Phê Rang Mộc Thủ Công
          </span>
          <div className="flex items-center gap-6 text-[#D5C6AD]">
            <span className="inline-flex items-center gap-1.5">
              <Clock className="w-3 h-3 text-[#D5C6AD]/80" />
              <span>{settings.opening_hours || '07:30 — 22:30 (Mỗi ngày)'}</span>
            </span>
            {settings.hotline && (
              <a
                href={`tel:${settings.hotline}`}
                className="inline-flex items-center gap-1.5 hover:text-white transition-colors"
              >
                <Phone className="w-3 h-3 text-[#D5C6AD]/80" />
                <span>{settings.hotline}</span>
              </a>
            )}
          </div>
        </div>
      </div>

      <div
        className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 flex items-center justify-between gap-4 transition-all duration-300 ${
          scrolled ? 'py-3' : 'py-3.5 sm:py-4'
        }`}
      >
        {/* Brand Logo */}
        <a
          href="#hero"
          onClick={() => handleNavClick('#hero')}
          className="focus:outline-none group"
        >
          <BrandLogo
            size="md"
            subtitle="COFFEE HOUSE"
            className="transition-transform duration-300 group-hover:scale-[1.01]"
          />
        </a>

        {/* Desktop Navigation */}
        <nav
          className="hidden lg:flex items-center gap-6 xl:gap-8"
          aria-label="Điều hướng chính"
        >
          {navItems.map((item, idx) => {
            const isActive = activeHash === item.href;
            return (
              <a
                key={`${item.href}-${idx}`}
                href={item.href}
                onClick={() => handleNavClick(item.href)}
                className={`relative text-xs uppercase tracking-[0.16em] font-medium transition-colors py-1.5 ${
                  isActive
                    ? 'text-coffee font-semibold'
                    : 'text-coffee-dark/80 hover:text-coffee'
                }`}
              >
                {item.label}
                {isActive && (
                  <motion.span
                    layoutId="activeNavUnderline"
                    className="absolute left-0 right-0 bottom-0 h-[1.5px] bg-coffee"
                  />
                )}
              </a>
            );
          })}
        </nav>

        {/* Actions */}
        <div className="hidden lg:flex items-center gap-3">
          {isAdmin && (
            <Link
              to="/admin/dashboard"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-[11px] uppercase tracking-wider font-medium text-coffee border border-coffee-beige hover:bg-ivory transition-colors rounded-brand"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Quản trị CMS</span>
            </Link>
          )}
          <a
            href={settings.header_cta_href || '#menu'}
            className={`inline-flex items-center gap-2 px-5 py-2.5 text-xs uppercase tracking-[0.16em] font-semibold bg-coffee text-ivory-light hover:bg-coffee-dark transition-all duration-300 ${buttonRadiusClass}`}
          >
            <span>{settings.header_cta_label || 'Khám phá Thực đơn'}</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Mobile Menu Trigger */}
        <button
          type="button"
          onClick={() => setMobileOpen((prev) => !prev)}
          className="lg:hidden p-2.5 text-coffee-dark hover:text-coffee border border-coffee-beige/80 rounded-brand bg-ivory/50"
          aria-label={mobileOpen ? 'Đóng menu điều hướng' : 'Mở menu điều hướng'}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22 }}
            className="lg:hidden bg-ivory-light border-b border-coffee-beige overflow-hidden shadow-lg"
          >
            <div className="px-5 py-5 flex flex-col gap-2">
              {navItems.map((item, idx) => (
                <a
                  key={`mob-${item.href}-${idx}`}
                  href={item.href}
                  onClick={() => handleNavClick(item.href)}
                  className={`flex items-center justify-between text-xs uppercase tracking-[0.18em] py-2.5 border-b border-coffee-beige/40 ${
                    activeHash === item.href
                      ? 'text-coffee font-semibold'
                      : 'text-coffee-dark/85'
                  }`}
                >
                  <span>{item.label}</span>
                  <span className="font-serif text-[11px] text-coffee-muted">
                    0{idx + 1}
                  </span>
                </a>
              ))}

              <div className="pt-3 flex flex-col sm:flex-row gap-2.5">
                <a
                  href={settings.header_cta_href || '#menu'}
                  onClick={() => setMobileOpen(false)}
                  className={`inline-flex items-center justify-center gap-2 px-5 py-3 text-xs uppercase tracking-[0.16em] font-semibold bg-coffee text-ivory-light ${buttonRadiusClass}`}
                >
                  <span>{settings.header_cta_label || 'Khám phá Thực đơn'}</span>
                  <ArrowUpRight className="w-4 h-4" />
                </a>
                {isAdmin && (
                  <Link
                    to="/admin/dashboard"
                    onClick={() => setMobileOpen(false)}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-3 text-xs uppercase tracking-wider font-medium text-coffee border border-coffee-beige rounded-brand"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Quản trị CMS</span>
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
