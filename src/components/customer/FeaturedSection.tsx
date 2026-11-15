import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useSiteData } from '../../contexts/SiteDataContext';
import { formatVND } from '../../lib/utils';
import type { Product } from '../../types/database';

interface FeaturedSectionProps {
  onSelectProduct?: (product: Product) => void;
}

export const FeaturedSection: React.FC<FeaturedSectionProps> = ({ onSelectProduct }) => {
  const { products, categories, getSection } = useSiteData();
  const section = getSection('featured');

  if (section && !section.is_enabled) return null;

  const featuredProducts = products
    .filter((p) => p.is_visible && p.is_featured)
    .sort((a, b) => a.sort_order - b.sort_order);

  if (featuredProducts.length === 0) return null;

  const getCategoryName = (catId: string | null) => {
    if (!catId) return 'TUNN Signature';
    return categories.find((c) => c.id === catId)?.name || 'TUNN Signature';
  };

  return (
    <section
      id="featured"
      className="py-20 sm:py-28 bg-ivory border-b border-coffee-beige/60"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
        {/* Editorial Heading */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14 pb-6 border-b border-coffee-beige/70">
          <div>
            <p className="text-[11px] uppercase tracking-[0.25em] text-coffee font-semibold mb-2.5">
              {section?.content?.eyebrow || 'TUYỂN CHỌN ĐẶC SẮC'}
            </p>
            <h2 className="font-serif text-3xl sm:text-5xl font-normal text-coffee-dark">
              {section?.title || 'Tác Phẩm Nổi Bật'}
            </h2>
          </div>
          <p className="text-sm text-coffee-muted max-w-md leading-relaxed">
            {section?.subtitle || section?.content?.description}
          </p>
        </div>

        {/* Editorial Curated Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {featuredProducts.map((product, idx) => {
            const hasDiscount =
              product.sale_price !== null &&
              product.sale_price !== undefined &&
              Number(product.sale_price) > 0 &&
              Number(product.sale_price) < Number(product.price);

            return (
              <motion.article
                key={product.id}
                role="button"
                tabIndex={0}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.5, delay: (idx % 3) * 0.08 }}
                onClick={() => onSelectProduct?.(product)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectProduct?.(product);
                  }
                }}
                className="group cursor-pointer flex flex-col bg-ivory-light border border-coffee-beige/80 rounded-brand overflow-hidden hover:border-coffee hover:-translate-y-1 hover:shadow-editorial transition-all duration-300"
              >
                {/* Product Photography */}
                <div className="relative aspect-[4/5] overflow-hidden bg-ivory">
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    loading="lazy"
                  />
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#140F0C]/35 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <span className="pointer-events-none absolute bottom-3.5 right-3.5 px-3 py-1.5 text-[10px] uppercase tracking-[0.16em] font-semibold bg-ivory-light/95 text-coffee-dark border border-coffee-beige rounded-brand opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 shadow-sm">
                    Xem chi tiết
                  </span>

                  {/* Top Badges */}
                  <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between gap-2 pointer-events-none">
                    <div className="flex flex-wrap gap-1.5">
                      {product.badge && (
                        <span className="px-3 py-1 text-[10px] uppercase tracking-[0.16em] font-semibold bg-coffee text-ivory-light rounded-brand">
                          {product.badge}
                        </span>
                      )}
                      {product.is_best_seller && product.badge !== 'Best Seller' && (
                        <span className="px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] font-semibold bg-ivory-light/95 text-coffee-dark border border-coffee-beige rounded-brand">
                          Bán chạy
                        </span>
                      )}
                    </div>

                    {!product.is_available && (
                      <span className="px-2.5 py-1 text-[10px] uppercase tracking-wider font-semibold bg-coffee-dark/90 text-ivory-light rounded-brand">
                        Tạm hết
                      </span>
                    )}
                  </div>
                </div>

                {/* Product Editorial Info */}
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-coffee-muted font-medium">
                      {getCategoryName(product.category_id)}
                    </p>
                    <h3 className="font-serif text-2xl font-semibold text-coffee-dark mt-1 group-hover:text-coffee transition-colors">
                      {product.name}
                    </h3>
                    <p className="text-xs sm:text-sm text-coffee-muted mt-2 line-clamp-2 leading-relaxed">
                      {product.description}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-coffee-beige/60 flex items-center justify-between">
                    <div className="flex items-baseline gap-2">
                      <span className="font-serif text-xl font-bold text-coffee">
                        {formatVND(hasDiscount ? product.sale_price : product.price)}
                      </span>
                      {hasDiscount && (
                        <span className="text-xs text-coffee-muted line-through">
                          {formatVND(product.price)}
                        </span>
                      )}
                    </div>

                    <span className="inline-flex items-center gap-1 text-xs uppercase tracking-[0.16em] font-semibold text-coffee group-hover:translate-x-0.5 transition-transform">
                      <span>Thưởng vị</span>
                      <ArrowUpRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </span>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
};
