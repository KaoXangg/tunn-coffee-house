import React, { useState } from 'react';
import { Maximize2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSiteData } from '../../contexts/SiteDataContext';
import type { GalleryItem } from '../../types/database';

export const GallerySection: React.FC = () => {
  const { gallery, getSection } = useSiteData();
  const section = getSection('gallery');

  const [selectedCategory, setSelectedCategory] = useState<string>('Tất cả');
  const [lightboxItem, setLightboxItem] = useState<GalleryItem | null>(null);

  if (section && !section.is_enabled) return null;

  const visibleItems = gallery
    .filter((g) => g.is_visible)
    .sort((a, b) => a.sort_order - b.sort_order);

  if (visibleItems.length === 0) return null;

  const categories = ['Tất cả', 'Không gian', 'Đồ uống', 'Thương hiệu', 'Sự kiện'];

  const filteredItems =
    selectedCategory === 'Tất cả'
      ? visibleItems
      : visibleItems.filter((item) => item.category === selectedCategory);

  return (
    <section
      id="gallery"
      className="py-20 sm:py-28 lg:py-32 bg-ivory-light border-b border-coffee-beige/60"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
        {/* Header & Filter */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <p className="text-[11px] uppercase tracking-[0.26em] text-coffee font-semibold mb-2.5">
              {section?.content?.eyebrow || 'VISUAL JOURNAL'}
            </p>
            <h2 className="font-serif text-3xl sm:text-5xl font-normal text-coffee-dark">
              {section?.title || 'Không Gian & Khoảnh Khắc'}
            </h2>
            <p className="text-sm text-coffee-muted mt-2 max-w-lg">
              {section?.content?.description || section?.subtitle}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 text-xs uppercase tracking-wider font-medium rounded-brand transition-colors ${
                  selectedCategory === cat
                    ? 'bg-coffee text-ivory-light'
                    : 'bg-ivory text-coffee-dark/80 hover:text-coffee'
                }`}
              >
                {cat}
              </button>
            ))}
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
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: (idx % 3) * 0.08 }}
                onClick={() => setLightboxItem(item)}
                className="group relative break-inside-avoid cursor-pointer rounded-brand overflow-hidden border border-coffee-beige bg-ivory"
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

      {/* Lightbox Modal */}
      <AnimatePresence>
        {lightboxItem && (
          <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setLightboxItem(null)}
              className="fixed inset-0 bg-[#241914]/85 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
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
              <div className="max-h-[72vh] bg-[#241914] flex items-center justify-center overflow-hidden">
                <img
                  src={lightboxItem.image_url}
                  alt={lightboxItem.title}
                  className="max-h-[72vh] w-auto object-contain"
                />
              </div>
              <div className="p-6 bg-ivory-light">
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
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
};
