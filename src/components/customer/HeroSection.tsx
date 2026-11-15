import React, { useRef } from 'react';
import { ArrowDownRight } from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useSiteData } from '../../contexts/SiteDataContext';
import { useSeasonalTheme } from '../../contexts/SeasonalThemeContext';
import { DEFAULT_HERO_CONTENT } from '../../lib/defaultData';
import { TUNN_EASE } from '../common/MotionPrimitives';
import { sanitizeUrl } from '../../lib/utils';
import type { HeroSectionContent } from '../../types/database';

export const HeroSection: React.FC = () => {
  const { settings, getSection, themeMode } = useSiteData();
  const { effectiveTheme } = useSeasonalTheme();
  const section = getSection('hero');
  const sectionRef = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  });
  const imageParallaxY = useTransform(scrollYProgress, [0, 1], [0, 28]);

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
      ref={sectionRef}
      id="hero"
      style={
        themeMode === 'dark' || effectiveTheme
          ? undefined
          : {
              backgroundColor: content.background_color || settings.secondary_bg_color || '#E9E6D8',
              color: content.text_color || settings.text_primary_color || '#241914',
            }
      }
      className="relative min-h-[85vh] pt-12 pb-16 sm:pt-16 sm:pb-24 lg:pt-20 lg:pb-28 overflow-hidden bg-ivory text-coffee-dark border-b border-coffee-beige/70 flex items-center"
    >
      {/* Subtle architectural frame lines */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-1/2 -translate-x-1/2 w-full max-w-7xl border-x border-coffee-beige/35 hidden xl:block"
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-12 items-center">
          {/* Left Column: Editorial Masthead & Craft Narrative */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            className={`lg:col-span-7 flex flex-col ${alignmentClass}`}
          >
            {/* Editorial Masthead Stamp */}
            <div className="inline-flex items-center mb-7 pb-2 border-b border-coffee/30">
              <span className="text-[11px] uppercase tracking-[0.22em] font-semibold text-coffee">
                {content.badge || 'TRÀ NGUYÊN LÁ & CÀ PHÊ THỦ CÔNG'}
              </span>
            </div>

            {/* Large Editorial Headline */}
            <h1 className="font-serif text-[clamp(2.25rem,4.6vw,4.25rem)] font-normal leading-[1.09] tracking-tight whitespace-pre-line">
              {content.headline || 'Một chút ngọt ngào,\ncho ngày thêm trọn vẹn.'}
            </h1>

            {/* Subtitle */}
            <p className="mt-6 text-base sm:text-lg text-coffee-muted max-w-xl leading-relaxed font-normal">
              {content.subheadline}
            </p>

            {/* Primary & Secondary Actions */}
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <a
                href={sanitizeUrl(content.primary_cta_href, '#menu')}
                className={`group inline-flex items-center gap-3 px-7 py-4 text-xs uppercase tracking-[0.18em] font-semibold bg-coffee text-ivory-light hover:bg-coffee-dark transition-all duration-300 shadow-editorial active:scale-[0.98] ${buttonRadiusClass}`}
              >
                <span>{content.primary_cta_label || 'Khám phá Thực đơn'}</span>
                <ArrowDownRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:translate-y-0.5" />
              </a>

              {content.secondary_cta_label && (
                <a
                  href={sanitizeUrl(content.secondary_cta_href, '#about')}
                  className={`inline-flex items-center gap-2 px-6 py-4 text-xs uppercase tracking-[0.18em] font-semibold border border-coffee/45 text-coffee-dark hover:border-coffee hover:bg-ivory-light/70 transition-all duration-300 active:scale-[0.98] ${buttonRadiusClass}`}
                >
                  <span>{content.secondary_cta_label}</span>
                </a>
              )}
            </div>

            {/* Roastery & Tea Bar Specification Ledger */}
            <div className="mt-12 pt-8 border-t border-coffee-beige/80 grid grid-cols-3 gap-6 sm:gap-10 w-full max-w-xl">
              <div className="border-l-2 border-coffee/30 pl-3.5">
                <p className="font-serif text-2xl sm:text-3xl font-semibold text-coffee">
                  100%
                </p>
                <p className="text-[11px] uppercase tracking-wider text-coffee-muted mt-1">
                  Trà Nguyên Lá &amp; Hạt Mộc
                </p>
              </div>
              <div className="border-l-2 border-coffee/30 pl-3.5">
                <p className="font-serif text-2xl sm:text-3xl font-semibold text-coffee">
                  18 Giờ
                </p>
                <p className="text-[11px] uppercase tracking-wider text-coffee-muted mt-1">
                  Ủ Lạnh Chiết Xuất Chậm
                </p>
              </div>
              <div className="border-l-2 border-coffee/30 pl-3.5">
                <p className="font-serif text-2xl sm:text-3xl font-semibold text-coffee">
                  Uji Kyoto
                </p>
                <p className="text-[11px] uppercase tracking-wider text-coffee-muted mt-1">
                  Matcha Nghiền Cối Đá
                </p>
              </div>
            </div>
          </motion.div>

          {/* Right Column: Asymmetric Archival Framing with Subtle Parallax */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, delay: 0.12, ease: TUNN_EASE }}
            style={{ y: imageParallaxY }}
            className="lg:col-span-5 relative will-change-transform"
          >
            {/* Main Tall Frame */}
            <div className="group relative mx-auto max-w-md lg:max-w-none aspect-[4/5] overflow-hidden rounded-brand border border-coffee-beige shadow-editorial-lg bg-ivory-light p-2.5">
              <div className="relative w-full h-full overflow-hidden rounded-brand">
                <img
                  src={content.hero_image_url}
                  alt={content.headline}
                  className="w-full h-full object-cover transition-transform duration-1000 ease-out group-hover:scale-[1.03]"
                  loading="eager"
                />
                <div
                  className="absolute inset-0 bg-[#241914] pointer-events-none"
                  style={{ opacity: Number(content.overlay_opacity ?? 0.15) }}
                />

                {/* Editorial Tasting Note Label */}
                <div className="absolute bottom-3.5 left-3.5 right-3.5 sm:right-auto sm:max-w-xs bg-ivory-light/95 backdrop-blur-sm border border-coffee-beige px-4 py-3.5 rounded-brand shadow-md">
                  <div className="flex items-center justify-between gap-3 text-[10px] uppercase tracking-[0.2em] text-coffee font-semibold border-b border-coffee-beige/60 pb-1.5">
                    <span>Gợi ý từ Barista</span>
                    <span className="font-serif italic normal-case tracking-normal">
                      Signature
                    </span>
                  </div>
                  <p className="font-serif text-lg font-semibold text-coffee-dark mt-2 leading-snug">
                    {content.featured_note_title || 'Ô Long Nướng Kem Phô Mai'}
                  </p>
                  <p className="text-xs text-coffee-muted mt-0.5">
                    {content.featured_note_subtitle || 'Hương khói nhẹ · Hậu vị ngọt thanh'}
                  </p>
                </div>
              </div>
            </div>

            {/* Secondary Inset Frame */}
            {content.secondary_image_url && (
              <div className="hidden sm:block absolute -top-5 -left-7 w-36 h-44 rounded-brand overflow-hidden border-4 border-ivory-light shadow-lg bg-ivory">
                <img
                  src={content.secondary_image_url}
                  alt="Nghệ thuật pha chế thủ công tại TUNN"
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
