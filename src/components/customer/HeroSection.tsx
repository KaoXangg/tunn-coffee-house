import React from 'react';
import { ArrowDownRight, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { useSiteData } from '../../contexts/SiteDataContext';
import { DEFAULT_HERO_CONTENT } from '../../lib/defaultData';
import type { HeroSectionContent } from '../../types/database';

export const HeroSection: React.FC = () => {
  const { settings, getSection } = useSiteData();
  const section = getSection('hero');

  if (section && !section.is_enabled) return null;

  const content: HeroSectionContent = {
    ...DEFAULT_HERO_CONTENT,
    ...(section?.content || {}),
  };

  const alignmentClass =
    content.alignment === 'center'
      ? 'text-center items-center'
      : content.alignment === 'right'
      ? 'text-right items-end'
      : 'text-left items-start';

  const buttonRadiusClass =
    settings.button_style === 'pill'
      ? 'rounded-full'
      : settings.button_style === 'rounded'
      ? 'rounded-lg'
      : 'rounded-brand';

  return (
    <section
      id="hero"
      style={{
        backgroundColor: content.background_color || settings.secondary_bg_color || '#E9E6D8',
        color: content.text_color || settings.text_primary_color || '#241914',
      }}
      className="relative min-h-[92vh] pt-28 pb-16 sm:pt-32 sm:pb-24 lg:pt-36 lg:pb-28 overflow-hidden border-b border-coffee-beige/60 flex items-center"
    >
      {/* Subtle architectural grid lines for editorial feel */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.18]"
        style={{
          backgroundImage:
            'linear-gradient(to right, #8C7565 1px, transparent 1px), linear-gradient(to bottom, #8C7565 1px, transparent 1px)',
          backgroundSize: '6rem 6rem',
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-10 items-center">
          {/* Left Column: Editorial Typography & Brand Stamp */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className={`lg:col-span-7 flex flex-col ${alignmentClass}`}
          >
            {/* Eyebrow / Brand Seal */}
            <div className="inline-flex items-center gap-3 mb-6 px-3.5 py-1.5 border border-coffee-beige bg-ivory-light/70 rounded-brand">
              <img
                src={settings.logo_url || '/logo.png'}
                alt={settings.brand_name}
                className="w-6 h-6 rounded-full object-contain"
              />
              <span className="text-[11px] uppercase tracking-[0.22em] font-semibold text-coffee">
                {content.badge || 'ARTISANAL ROASTERY & TEA BAR'}
              </span>
            </div>

            {/* Large Editorial Headline */}
            <h1 className="font-serif text-4xl sm:text-6xl xl:text-[4.25rem] font-normal leading-[1.08] tracking-tight whitespace-pre-line">
              {content.headline || 'Một chút ngọt ngào,\ncho ngày thêm trọn vẹn.'}
            </h1>

            {/* English / Editorial Subtitle */}
            <p className="mt-6 text-base sm:text-lg text-coffee-muted max-w-xl leading-relaxed font-normal">
              {content.subheadline}
            </p>

            {/* CTAs */}
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <a
                href={content.primary_cta_href || '#menu'}
                className={`inline-flex items-center gap-3 px-7 py-4 text-xs uppercase tracking-[0.2em] font-semibold bg-coffee text-ivory-light hover:bg-coffee-dark transition-all duration-300 shadow-sm ${buttonRadiusClass}`}
              >
                <span>{content.primary_cta_label || 'Khám phá Thực đơn'}</span>
                <ArrowDownRight className="w-4 h-4" />
              </a>

              {content.secondary_cta_label && (
                <a
                  href={content.secondary_cta_href || '#about'}
                  className={`inline-flex items-center gap-2 px-6 py-4 text-xs uppercase tracking-[0.2em] font-semibold border border-coffee/40 text-coffee-dark hover:border-coffee hover:bg-ivory-light/60 transition-all duration-300 ${buttonRadiusClass}`}
                >
                  <span>{content.secondary_cta_label}</span>
                </a>
              )}
            </div>

            {/* Editorial Footnote Metrics */}
            <div className="mt-12 pt-8 border-t border-coffee-beige/80 grid grid-cols-3 gap-6 sm:gap-10 w-full max-w-lg">
              <div>
                <p className="font-serif text-2xl sm:text-3xl font-semibold text-coffee">
                  100%
                </p>
                <p className="text-[11px] uppercase tracking-wider text-coffee-muted mt-1">
                  Trà Nguyên Lá & Hạt Mộc
                </p>
              </div>
              <div>
                <p className="font-serif text-2xl sm:text-3xl font-semibold text-coffee">
                  18h
                </p>
                <p className="text-[11px] uppercase tracking-wider text-coffee-muted mt-1">
                  Ủ Lạnh Chiết Xuất Chậm
                </p>
              </div>
              <div>
                <p className="font-serif text-2xl sm:text-3xl font-semibold text-coffee">
                  Uji
                </p>
                <p className="text-[11px] uppercase tracking-wider text-coffee-muted mt-1">
                  Matcha Chuẩn Lễ Trà
                </p>
              </div>
            </div>
          </motion.div>

          {/* Right Column: Asymmetric Layered Composition */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-5 relative"
          >
            {/* Main Tall Frame */}
            <div className="relative mx-auto max-w-md lg:max-w-none aspect-[4/5] overflow-hidden rounded-brand border border-coffee-beige shadow-xl bg-ivory-light">
              <img
                src={content.hero_image_url}
                alt={content.headline}
                className="w-full h-full object-cover"
                loading="eager"
              />
              <div
                className="absolute inset-0 bg-[#241914] pointer-events-none"
                style={{ opacity: Number(content.overlay_opacity ?? 0.15) }}
              />

              {/* Floating Editorial Tasting Note Card */}
              <div className="absolute bottom-4 left-4 right-4 sm:right-auto sm:max-w-xs bg-ivory-light/95 backdrop-blur-md border border-coffee-beige p-4 rounded-brand shadow-lg">
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-coffee font-semibold">
                  <Sparkles className="w-3 h-3" />
                  <span>Tasting Note</span>
                </div>
                <p className="font-serif text-lg font-semibold text-coffee-dark mt-1">
                  {content.featured_note_title || 'Ô Long Nướng Kem Phô Mai'}
                </p>
                <p className="text-xs text-coffee-muted mt-0.5">
                  {content.featured_note_subtitle || 'Hương khói nhẹ · Hậu vị ngọt thanh'}
                </p>
              </div>
            </div>

            {/* Secondary Inset Frame (Asymmetric overlap on desktop) */}
            {content.secondary_image_url && (
              <div className="hidden sm:block absolute -top-6 -left-8 w-36 h-44 rounded-brand overflow-hidden border-2 border-ivory-light shadow-lg bg-ivory">
                <img
                  src={content.secondary_image_url}
                  alt="Artisanal Tea & Coffee"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
};
