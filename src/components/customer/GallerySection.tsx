import React, { useState, useEffect, useCallback } from 'react';
import { Maximize2, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSiteData } from '../../contexts/SiteDataContext';
import type { GalleryItem } from '../../types/database';

export const GallerySection: React.FC = () => {
  const { gallery, getSection } = useSiteData();
  const section = getSection('gallery');

  const [selectedCategory, setSelectedCategory] = useState<string>('Tất cả');
  const [lightboxItem, setLightboxItem] = useState<GalleryItem | null>(null);

  const visibleItems = gallery
    .filter((g) => g.is_visible)
    .sort((a, b) => a.sort_order - b.sort_order);

  const categories = ['Tất cả', 'Không gian', 'Đồ uống', 'Thương hiệu', 'Sự kiện'];

  const filteredItems =
    selectedCategory === 'Tất cả'
      ? visibleItems
      : visibleItems.filter((item) => item.category === selectedCategory);

  const navigateLightbox = useCallback(
    (direction: -1 | 1) => {
      if (!lightboxItem || filteredItems.length <= 1) return;
      const currentIdx = filteredItems.findIndex((i) => i.id === lightboxItem.id);
      if (currentIdx === -1) return;
      const nextIdx = (currentIdx + direction + filteredItems.length) % filteredItems.length;
      setLightboxItem(filteredItems[nextIdx]);
    },
    [lightboxItem, filteredItems]
  );

  useEffect(() => {
    if (!lightboxItem) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxItem(null);
      if (e.key === 'ArrowLeft') navigateLightbox(-1);
      if (e.key === 'ArrowRight') navigateLightbox(1);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [lightboxItem, navigateLightbox]);

  if (section && !section.is_enabled) return null;
  if (visibleItems.length === 0) return null;

  return (
    <section
      id="gallery"
      className="py-20 sm:py-28 lg:py-32 bg-ivory-light border-b border-coffee-beige/60 dark:border-b-0"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
        {/* Header & Filter */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 pb-6 border-b border-coffee-beige/70 dark:border-b-0 dark:pb-0">
          <div>
            <p className="text-[11px] uppercase tracking-[0.25em] text-coffee font-semibold mb-2.5">
              {String(section?.content?.eyebrow || 'NHẬT KÝ HÌNH ẢNH')}
            </p>
            <h2 className="font-serif text-3xl sm:text-5xl font-normal text-coffee-dark">
              {section?.title || 'Không Gian & Khoảnh Khắc'}
            </h2>
            <p className="text-sm text-coffee-muted mt-2 max-w-lg">
              {section?.subtitle || String(section?.content?.description || '')}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`relative px-4 py-2 text-xs uppercase tracking-wider font-medium rounded-brand transition-colors ${
                    isSelected
                      ? 'text-ivory-light'
                      : 'bg-ivory text-coffee-dark/80 hover:text-coffee'
                  }`}
                >
                  {isSelected && (
                    <motion.span
                      layoutId="galleryCategoryPill"
                      transition={{ type: 'spring', stiffness: 360, damping: 30 }}
                      className="absolute inset-0 bg-coffee rounded-brand"
                    />
                  )}
                  <span className="relative z-10">{cat}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Editorial Masonry Grid */}
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
          {filteredItems.map((item, idx) => {
            const aspectClass =
              item.aspect_ratio === 'portrait'
                ? 'aspect-[4/5]'
                : item.aspect_ratio === 'landscape'
                ? 'aspect-[16/11]'
                : 'aspect-square';

            return (
              <motion.figure
                key={item.id}
                role="button"
                tabIndex={0}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: (idx % 3) * 0.08 }}
                onClick={() => setLightboxItem(item)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setLightboxItem(item);
                  }
                }}
                className="group relative break-inside-avoid cursor-pointer rounded-brand overflow-hidden border border-coffee-beige bg-ivory hover:border-coffee transition-colors"
              >
                <div className={`w-full overflow-hidden ${aspectClass}`}>
                  <img
                    src={item.image_url}
                    alt={item.title || item.caption}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    loading="lazy"
                  />
                </div>

                <figcaption className="p-4 bg-ivory-light border-t border-coffee-beige/60 flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] uppercase tracking-[0.18em] text-coffee font-semibold">
                      {item.category}
                    </span>
                    {item.title && (
                      <h3 className="font-serif text-lg font-semibold text-coffee-dark mt-0.5">
                        {item.title}
                      </h3>
                    )}
                    {item.caption && (
                      <p className="text-xs text-coffee-muted mt-1 leading-relaxed">
                        {item.caption}
                      </p>
                    )}
                  </div>
                  <Maximize2 className="w-4 h-4 text-coffee-muted group-hover:text-coffee shrink-0 mt-1 transition-colors" />
                </figcaption>
              </motion.figure>
            );
          })}
        </div>
      </div>

      {/* Lightbox Modal with Keyboard & Prev/Next Navigation */}
      <AnimatePresence>
        {lightboxItem && (
          <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setLightboxItem(null)}
              className="fixed inset-0 bg-[#241914]/85 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="relative z-10 max-w-4xl w-full bg-ivory-light border border-coffee-beige rounded-brand overflow-hidden shadow-2xl"
            >
              <button
                type="button"
                onClick={() => setLightboxItem(null)}
                className="absolute top-4 right-4 z-20 p-2 bg-ivory-light/90 text-coffee-dark rounded-full hover:bg-ivory transition-colors"
                aria-label="Đóng"
              >
                <X className="w-5 h-5" />
              </button>

              {filteredItems.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => navigateLightbox(-1)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 z-20 p-2 bg-ivory-light/85 text-coffee-dark rounded-full hover:bg-ivory transition-colors"
                    aria-label="Ảnh trước"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => navigateLightbox(1)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 z-20 p-2 bg-ivory-light/85 text-coffee-dark rounded-full hover:bg-ivory transition-colors"
                    aria-label="Ảnh tiếp theo"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}

              <div className="max-h-[72vh] bg-[#140F0C] flex items-center justify-center overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={lightboxItem.id}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                    src={lightboxItem.image_url}
                    alt={lightboxItem.title}
                    className="max-h-[72vh] w-auto object-contain"
                  />
                </AnimatePresence>
              </div>
              <div className="p-6 bg-ivory-light flex items-start justify-between gap-4">
                <div>
                  <span className="text-[10px] uppercase tracking-[0.2em] text-coffee font-semibold">
                    {lightboxItem.category}
                  </span>
                  <h3 className="font-serif text-2xl font-semibold text-coffee-dark mt-1">
                    {lightboxItem.title}
                  </h3>
                  {lightboxItem.caption && (
                    <p className="text-sm text-coffee-muted mt-1.5">
                      {lightboxItem.caption}
                    </p>
                  )}
                </div>
                <span className="text-xs font-serif italic text-coffee-muted shrink-0">
                  {filteredItems.findIndex((i) => i.id === lightboxItem.id) + 1} /{' '}
                  {filteredItems.length}
                </span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
};
