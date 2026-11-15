import React from 'react';
import { Calendar, ArrowUpRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useSiteData } from '../../contexts/SiteDataContext';
import { formatDateVi, getPromotionScheduleStatus } from '../../lib/utils';

export const PromotionsSection: React.FC = () => {
  const { promotions, settings, getSection } = useSiteData();
  const section = getSection('promotions');

  if (section && !section.is_enabled) return null;

  const now = new Date();
  const activePromos = promotions
    .filter((p) => getPromotionScheduleStatus(p, now).isCurrentlyVisible)
    .sort((a, b) => a.sort_order - b.sort_order);

  if (activePromos.length === 0) return null;

  const buttonRadiusClass =
    settings.button_style === 'pill'
      ? 'rounded-full'
      : settings.button_style === 'rounded'
      ? 'rounded-lg'
      : 'rounded-brand';

  return (
    <section
      id="promotions"
      className="py-20 sm:py-28 bg-ivory border-b border-coffee-beige/60"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
        {/* Heading */}
        <div className="mb-14 pb-6 border-b border-coffee-beige/70">
          <p className="text-[11px] uppercase tracking-[0.25em] text-coffee font-semibold mb-2.5">
            {section?.content?.eyebrow || 'ƯU ĐÃI ĐẶC BIỆT'}
          </p>
          <h2 className="font-serif text-3xl sm:text-5xl font-normal text-coffee-dark">
            {section?.title || 'Ưu Đãi & Mùa Vị Mới'}
          </h2>
          {section?.subtitle && (
            <p className="text-sm sm:text-base text-coffee-muted mt-2">
              {section.subtitle}
            </p>
          )}
        </div>

        {/* Editorial Split Banner Stack */}
        <div className="space-y-10">
          {activePromos.map((promo, index) => {
            const isEven = index % 2 === 0;
            return (
              <motion.div
                key={promo.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="group grid grid-cols-1 lg:grid-cols-12 bg-ivory-light border border-coffee-beige rounded-brand overflow-hidden shadow-editorial hover:border-coffee/60 transition-colors duration-300"
              >
                {/* Banner Image */}
                <div
                  className={`lg:col-span-6 relative aspect-[16/10] lg:aspect-auto overflow-hidden bg-ivory ${
                    !isEven ? 'lg:order-2' : ''
                  }`}
                >
                  <img
                    src={promo.banner_image_url}
                    alt={promo.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    loading="lazy"
                  />
                  {promo.tag && (
                    <span className="absolute top-4 left-4 inline-flex items-center gap-2 px-3.5 py-1.5 text-[10px] uppercase tracking-[0.2em] font-semibold bg-coffee-dark/90 text-ivory-light rounded-brand backdrop-blur-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span>{promo.tag}</span>
                    </span>
                  )}
                </div>

                {/* Editorial Copy */}
                <div
                  className={`lg:col-span-6 p-7 sm:p-10 lg:p-12 flex flex-col justify-center ${
                    !isEven ? 'lg:order-1' : ''
                  }`}
                >
                  {promo.subtitle && (
                    <p className="text-[11px] uppercase tracking-[0.22em] text-coffee font-semibold">
                      {promo.subtitle}
                    </p>
                  )}
                  <h3 className="font-serif text-2xl sm:text-4xl font-normal text-coffee-dark mt-2 leading-tight">
                    {promo.title}
                  </h3>
                  <p className="text-sm sm:text-base text-coffee-muted mt-4 leading-relaxed">
                    {promo.description}
                  </p>

                  {(promo.start_date || promo.end_date) && (
                    <div className="mt-5 inline-flex items-center gap-2 text-xs text-coffee-muted">
                      <Calendar className="w-3.5 h-3.5 text-coffee" />
                      <span>
                        Thời gian áp dụng:{' '}
                        {promo.start_date ? formatDateVi(promo.start_date) : 'Hôm nay'} —{' '}
                        {promo.end_date ? formatDateVi(promo.end_date) : 'Khi có thông báo mới'}
                      </span>
                    </div>
                  )}

                  <div className="mt-8">
                    <a
                      href={promo.cta_url || '#menu'}
                      className={`inline-flex items-center gap-2.5 px-6 py-3.5 text-xs uppercase tracking-[0.18em] font-semibold bg-coffee text-ivory-light hover:bg-coffee-dark transition-colors ${buttonRadiusClass}`}
                    >
                      <span>{promo.cta_label || 'Khám phá ngay'}</span>
                      <ArrowUpRight className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
