import React, { useState, useEffect, useMemo } from 'react';
import { ArrowUpRight, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSiteData } from '../../contexts/SiteDataContext';
import { formatVND } from '../../lib/utils';
import type { Product } from '../../types/database';

interface FeaturedSectionProps {
  onSelectProduct?: (product: Product) => void;
}

const AUTOPLAY_MS = 5500;

export const FeaturedSection: React.FC<FeaturedSectionProps> = ({ onSelectProduct }) => {
  const { products, categories, getSection } = useSiteData();
  const section = getSection('featured');

  const featuredProducts = useMemo(
    () =>
      products
        .filter((p) => p.is_visible && p.is_featured)
        .sort((a, b) => a.sort_order - b.sort_order),
    [products]
  );

  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [isPaused, setIsPaused] = useState(false);

  const safeIndex =
    featuredProducts.length > 0 ? activeIndex % featuredProducts.length : 0;

  useEffect(() => {
    if (featuredProducts.length <= 1 || isPaused) return;
    const timer = window.setInterval(() => {
      setDirection(1);
      setActiveIndex((prev) => (prev + 1) % featuredProducts.length);
    }, AUTOPLAY_MS);
    return () => window.clearInterval(timer);
  }, [featuredProducts.length, isPaused]);

  if (section && !section.is_enabled) return null;
  if (featuredProducts.length === 0) return null;

  const activeProduct = featuredProducts[safeIndex];
  const nextProduct =
    featuredProducts.length > 1
      ? featuredProducts[(safeIndex + 1) % featuredProducts.length]
      : null;
  const thirdProduct =
    featuredProducts.length > 2
      ? featuredProducts[(safeIndex + 2) % featuredProducts.length]
      : null;

  const hasDiscount =
    activeProduct.sale_price !== null &&
    activeProduct.sale_price !== undefined &&
    Number(activeProduct.sale_price) > 0 &&
    Number(activeProduct.sale_price) < Number(activeProduct.price);

  const getCategoryName = (catId: string | null) => {
    if (!catId) return 'TUNN Signature';
    return categories.find((c) => c.id === catId)?.name || 'TUNN Signature';
  };

  const handlePrev = () => {
    setDirection(-1);
    setActiveIndex(
      (prev) => (prev - 1 + featuredProducts.length) % featuredProducts.length
    );
  };

  const handleNext = () => {
    setDirection(1);
    setActiveIndex((prev) => (prev + 1) % featuredProducts.length);
  };

  const handleSelectIndex = (idx: number) => {
    setDirection(idx >= safeIndex ? 1 : -1);
    setActiveIndex(idx);
  };

  return (
    <section
      id="featured"
      className="py-16 sm:py-24 lg:py-28 bg-ivory border-b border-coffee-beige/60 dark:border-b-0 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
        {/* Editorial Heading */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 sm:gap-6 mb-8 sm:mb-12 pb-5 sm:pb-6 border-b border-coffee-beige/70 dark:border-b-0 dark:pb-0">
          <div>
            <p className="text-[11px] uppercase tracking-[0.25em] text-coffee font-semibold mb-2">
              {section?.content?.eyebrow || 'TUYỂN CHỌN ĐẶC SẮC'}
            </p>
            <h2 className="font-serif text-3xl sm:text-5xl font-normal text-coffee-dark">
              {section?.title || 'Tác Phẩm Nổi Bật'}
            </h2>
          </div>

          <div className="flex items-center justify-between md:justify-end gap-4">
            <p className="text-sm text-coffee-muted max-w-md leading-relaxed">
              {section?.subtitle || section?.content?.description}
            </p>

            {featuredProducts.length > 1 && (
              <div className="hidden sm:flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handlePrev}
                  aria-label="Món nổi bật trước"
                  className="w-10 h-10 rounded-full border border-coffee-beige bg-ivory-light text-coffee-dark hover:border-coffee hover:bg-coffee hover:text-ivory-light inline-flex items-center justify-center transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  aria-label="Món nổi bật tiếp theo"
                  className="w-10 h-10 rounded-full border border-coffee-beige bg-ivory-light text-coffee-dark hover:border-coffee hover:bg-coffee hover:text-ivory-light inline-flex items-center justify-center transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 3D Stacked Tasting Deck + Spotlight */}
        <div
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onTouchStart={() => setIsPaused(true)}
          onTouchEnd={() => setIsPaused(false)}
          className="space-y-6"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-center bg-ivory-light border border-coffee-beige/80 dark:border-white/[0.08] rounded-2xl p-4 sm:p-7 lg:p-9 shadow-editorial relative overflow-hidden">
            {/* Ambient subtle glow behind active drink */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-24 -left-24 w-72 h-72 rounded-full bg-coffee/10 blur-3xl"
            />

            {/* Left: 3D Stacked Photo Deck (Swipeable on mobile) */}
            <div className="lg:col-span-6 relative flex items-center justify-center py-2 sm:py-3">
              <div className="relative w-full max-w-[440px] aspect-[4/3] sm:aspect-[5/4]">
                {/* Background Peek Card 2 */}
                {thirdProduct && (
                  <motion.div
                    key={`peek2-${thirdProduct.id}`}
                    aria-hidden="true"
                    initial={false}
                    animate={{ rotate: 4, scale: 0.92, x: 14, y: 8 }}
                    transition={{ type: 'spring', stiffness: 220, damping: 24 }}
                    className="absolute inset-0 rounded-2xl overflow-hidden border border-coffee-beige/70 bg-ivory opacity-55 shadow-sm pointer-events-none"
                  >
                    <img
                      src={thirdProduct.image_url}
                      alt=""
                      className="w-full h-full object-cover blur-[1px]"
                    />
                  </motion.div>
                )}

                {/* Background Peek Card 1 */}
                {nextProduct && (
                  <motion.div
                    key={`peek1-${nextProduct.id}`}
                    aria-hidden="true"
                    initial={false}
                    animate={{ rotate: -3.5, scale: 0.96, x: -12, y: 4 }}
                    transition={{ type: 'spring', stiffness: 240, damping: 24 }}
                    className="absolute inset-0 rounded-2xl overflow-hidden border border-coffee-beige/80 bg-ivory opacity-80 shadow-md pointer-events-none"
                  >
                    <img
                      src={nextProduct.image_url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </motion.div>
                )}

                {/* Active Foreground Card */}
                <AnimatePresence mode="wait" custom={direction}>
                  <motion.div
                    key={activeProduct.id}
                    custom={direction}
                    drag={featuredProducts.length > 1 ? 'x' : false}
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.22}
                    onDragEnd={(_, info) => {
                      if (info.offset.x < -50) handleNext();
                      else if (info.offset.x > 50) handlePrev();
                    }}
                    initial={{
                      opacity: 0,
                      x: direction * 36,
                      scale: 0.94,
                      rotate: direction * 2.5,
                    }}
                    animate={{
                      opacity: 1,
                      x: 0,
                      scale: 1,
                      rotate: 0,
                    }}
                    exit={{
                      opacity: 0,
                      x: direction * -36,
                      scale: 0.94,
                      rotate: direction * -2.5,
                    }}
                    transition={{
                      type: 'spring',
                      stiffness: 280,
                      damping: 26,
                    }}
                    onClick={() => onSelectProduct?.(activeProduct)}
                    className="relative z-10 w-full h-full rounded-2xl overflow-hidden border border-coffee-beige bg-ivory shadow-editorial-lg cursor-pointer group"
                  >
                    <motion.img
                      src={activeProduct.image_url}
                      alt={activeProduct.name}
                      initial={{ scale: 1.06 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 5.2, ease: 'easeOut' }}
                      className="w-full h-full object-cover"
                    />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#140F0C]/55 via-transparent to-black/15" />

                    {/* Top Badges */}
                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 pointer-events-none">
                      <div className="flex flex-wrap gap-1.5">
                        {activeProduct.badge && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 text-[10px] uppercase tracking-[0.16em] font-semibold bg-coffee text-ivory-light rounded-full shadow-sm">
                            <Sparkles className="w-3 h-3" />
                            <span>{activeProduct.badge}</span>
                          </span>
                        )}
                        {activeProduct.is_best_seller &&
                          activeProduct.badge !== 'Best Seller' && (
                            <span className="px-3 py-1 text-[10px] uppercase tracking-[0.14em] font-semibold bg-ivory-light/95 text-coffee-dark rounded-full">
                              Bán chạy
                            </span>
                          )}
                      </div>

                      <span className="px-2.5 py-1 text-[11px] font-semibold rounded-full backdrop-blur-md bg-black/40 border border-white/20 text-[#F7F5EF]">
                        {String(safeIndex + 1).padStart(2, '0')} /{' '}
                        {String(featuredProducts.length).padStart(2, '0')}
                      </span>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            {/* Right: Synchronized Editorial Story & Uniform Footer */}
            <div className="lg:col-span-6 flex flex-col justify-between min-h-[220px] sm:min-h-[260px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`info-${activeProduct.id}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[11px] uppercase tracking-[0.22em] text-coffee font-semibold">
                      {getCategoryName(activeProduct.category_id)}
                    </span>
                    {!activeProduct.is_available && (
                      <span className="px-2.5 py-0.5 text-[10px] uppercase tracking-wider font-semibold bg-coffee-dark text-ivory-light rounded-full">
                        Tạm hết
                      </span>
                    )}
                  </div>

                  <h3
                    onClick={() => onSelectProduct?.(activeProduct)}
                    className="font-serif text-2xl sm:text-3xl lg:text-4xl font-semibold text-coffee-dark mt-2 leading-tight cursor-pointer hover:text-coffee transition-colors line-clamp-2"
                  >
                    {activeProduct.name}
                  </h3>

                  <p className="text-sm sm:text-base text-coffee-muted mt-3 line-clamp-2 sm:line-clamp-3 leading-relaxed">
                    {activeProduct.description}
                  </p>
                </motion.div>
              </AnimatePresence>

              {/* Uniform Footer (Same single-row height whether discounted or not) */}
              <div className="mt-6 pt-4 border-t border-coffee-beige/60 dark:border-white/[0.07] flex items-center justify-between gap-3">
                <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-2 min-w-0">
                  <span className="font-serif text-xl sm:text-2xl lg:text-3xl font-bold text-coffee whitespace-nowrap">
                    {formatVND(
                      hasDiscount ? activeProduct.sale_price : activeProduct.price
                    )}
                  </span>
                  {hasDiscount && (
                    <span className="text-xs sm:text-sm text-coffee-muted line-through whitespace-nowrap">
                      {formatVND(activeProduct.price)}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                  {featuredProducts.length > 1 && (
                    <div className="flex sm:hidden items-center gap-1.5">
                      <button
                        type="button"
                        onClick={handlePrev}
                        aria-label="Món trước"
                        className="w-8 h-8 rounded-full border border-coffee-beige bg-ivory text-coffee-dark inline-flex items-center justify-center"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={handleNext}
                        aria-label="Món sau"
                        className="w-8 h-8 rounded-full border border-coffee-beige bg-ivory text-coffee-dark inline-flex items-center justify-center"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => onSelectProduct?.(activeProduct)}
                    className="group inline-flex items-center gap-1.5 px-4 sm:px-5 py-2.5 text-[11px] sm:text-xs uppercase tracking-[0.15em] font-semibold bg-coffee text-ivory-light hover:bg-coffee-dark rounded-full transition-colors whitespace-nowrap"
                  >
                    <span>Thưởng vị</span>
                    <ArrowUpRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Live Autoplay Progress Bar */}
            {featuredProducts.length > 1 && (
              <div className="absolute inset-x-0 bottom-0 h-[3px] bg-coffee-beige/35">
                {!isPaused && (
                  <motion.div
                    key={`progress-${activeProduct.id}-${safeIndex}`}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: AUTOPLAY_MS / 1000, ease: 'linear' }}
                    style={{ transformOrigin: 'left' }}
                    className="h-full bg-coffee"
                  />
                )}
              </div>
            )}
          </div>

          {/* Interactive Mini-Deck Grid (Always unclipped; auto-paginates cleanly when > 6 items) */}
          {featuredProducts.length > 1 && (() => {
            const DECK_PAGE_SIZE = 6;
            const totalDeckPages = Math.ceil(featuredProducts.length / DECK_PAGE_SIZE);
            const currentDeckPage = Math.floor(safeIndex / DECK_PAGE_SIZE);
            const deckStart = currentDeckPage * DECK_PAGE_SIZE;
            const visibleDeckItems = featuredProducts.slice(
              deckStart,
              deckStart + DECK_PAGE_SIZE
            );

            return (
              <div className="space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
                  {visibleDeckItems.map((item, localIdx) => {
                    const realIdx = deckStart + localIdx;
                    const isSelected = realIdx === safeIndex;
                    const itemSale =
                      item.sale_price !== null &&
                      item.sale_price !== undefined &&
                      Number(item.sale_price) > 0 &&
                      Number(item.sale_price) < Number(item.price);

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSelectIndex(realIdx)}
                        className={`group relative rounded-xl p-2 text-left transition-all duration-300 border flex items-center gap-2.5 min-w-0 ${
                          isSelected
                            ? 'bg-coffee text-ivory-light border-coffee shadow-editorial -translate-y-0.5'
                            : 'bg-ivory-light/90 dark:bg-white/[0.04] text-coffee-dark border-coffee-beige/80 dark:border-white/[0.08] hover:border-coffee dark:hover:bg-white/[0.08] dark:hover:border-coffee/50'
                        }`}
                      >
                        <img
                          src={item.image_url}
                          alt={item.name}
                          loading="lazy"
                          className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg object-cover shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="font-serif text-xs sm:text-[13px] font-semibold truncate">
                            {item.name}
                          </p>
                          <p
                            className={`text-[11px] font-medium mt-0.5 ${
                              isSelected ? 'text-ivory/85' : 'text-coffee'
                            }`}
                          >
                            {formatVND(itemSale ? item.sale_price : item.price)}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {totalDeckPages > 1 && (
                  <div className="flex items-center justify-center gap-1.5 pt-1">
                    {Array.from({ length: totalDeckPages }, (_, pageIdx) => {
                      const activePage = pageIdx === currentDeckPage;
                      return (
                        <button
                          key={pageIdx}
                          type="button"
                          onClick={() => handleSelectIndex(pageIdx * DECK_PAGE_SIZE)}
                          aria-label={`Xem nhóm món nổi bật ${pageIdx + 1}`}
                          className={`h-2 rounded-full transition-all duration-300 ${
                            activePage
                              ? 'w-6 bg-coffee'
                              : 'w-2 bg-coffee-beige hover:bg-coffee/50'
                          }`}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      </div>
    </section>
  );
};
