import React, { useState, useMemo } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSiteData } from '../../contexts/SiteDataContext';
import { formatVND } from '../../lib/utils';
import type { Product } from '../../types/database';

interface MenuSectionProps {
  onSelectProduct?: (product: Product) => void;
}

type SortOption = 'default' | 'price-asc' | 'price-desc' | 'name-asc';
type QuickTagFilter = 'all' | 'bestseller' | 'promo';

export const MenuSection: React.FC<MenuSectionProps> = ({ onSelectProduct }) => {
  const { categories, products, getSection } = useSiteData();
  const section = getSection('menu');

  const [activeCategoryId, setActiveCategoryId] = useState<string>('all');
  const [quickFilter, setQuickFilter] = useState<QuickTagFilter>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<SortOption>('default');

  const activeCategories = useMemo(
    () =>
      categories
        .filter((c) => c.is_active)
        .sort((a, b) => a.sort_order - b.sort_order),
    [categories]
  );

  const selectedCategoryObj = useMemo(
    () => activeCategories.find((c) => c.id === activeCategoryId) || null,
    [activeCategories, activeCategoryId]
  );

  const visibleProducts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    const filtered = products.filter((p) => {
      if (!p.is_visible) return false;
      if (activeCategoryId !== 'all' && p.category_id !== activeCategoryId) {
        return false;
      }
      if (quickFilter === 'bestseller' && !p.is_best_seller && p.badge !== 'Best Seller') {
        return false;
      }
      if (
        quickFilter === 'promo' &&
        !(p.sale_price && Number(p.sale_price) > 0 && Number(p.sale_price) < Number(p.price))
      ) {
        return false;
      }
      if (q) {
        const matchName = p.name.toLowerCase().includes(q);
        const matchDesc = p.description.toLowerCase().includes(q);
        const matchBadge = p.badge?.toLowerCase().includes(q);
        return matchName || matchDesc || matchBadge;
      }
      return true;
    });

    return [...filtered].sort((a, b) => {
      const priceA = a.sale_price && a.sale_price > 0 ? a.sale_price : a.price;
      const priceB = b.sale_price && b.sale_price > 0 ? b.sale_price : b.price;

      if (sortBy === 'price-asc') return priceA - priceB;
      if (sortBy === 'price-desc') return priceB - priceA;
      if (sortBy === 'name-asc') return a.name.localeCompare(b.name, 'vi');
      return a.sort_order - b.sort_order;
    });
  }, [products, activeCategoryId, quickFilter, searchQuery, sortBy]);

  if (section && !section.is_enabled) return null;

  return (
    <section
      id="menu"
      className="py-20 sm:py-28 lg:py-32 bg-ivory-light border-b border-coffee-beige/60"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
        {/* Editorial Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-[11px] uppercase tracking-[0.25em] text-coffee font-semibold mb-3">
            {section?.content?.eyebrow || 'THỰC ĐƠN THỦ CÔNG'}
          </p>
          <h2 className="font-serif text-3xl sm:text-5xl font-normal text-coffee-dark">
            {section?.title || 'Thực Đơn Tinh Tuyển'}
          </h2>
          <p className="text-sm sm:text-base text-coffee-muted mt-3">
            {section?.subtitle || 'Khám phá trọn vẹn hương vị trà và cà phê thủ công'}
          </p>
        </div>

        {/* Dynamic Category Tabs with Fluid Active Indicator */}
        <div className="flex items-center justify-start sm:justify-center gap-2 overflow-x-auto pb-3 mb-4 no-scrollbar border-b border-coffee-beige/60">
          <button
            type="button"
            onClick={() => setActiveCategoryId('all')}
            className={`relative px-5 py-2.5 text-xs uppercase tracking-[0.16em] font-semibold whitespace-nowrap rounded-brand transition-colors ${
              activeCategoryId === 'all'
                ? 'text-ivory-light'
                : 'text-coffee-dark/80 hover:text-coffee hover:bg-ivory/60'
            }`}
          >
            {activeCategoryId === 'all' && (
              <motion.span
                layoutId="menuCategoryPill"
                transition={{ type: 'spring', stiffness: 360, damping: 30 }}
                className="absolute inset-0 bg-coffee rounded-brand shadow-xs -z-0"
              />
            )}
            <span className="relative z-10">
              Tất cả ({products.filter((p) => p.is_visible).length})
            </span>
          </button>

          {activeCategories.map((cat) => {
            const count = products.filter(
              (p) => p.is_visible && p.category_id === cat.id
            ).length;
            const isActive = activeCategoryId === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategoryId(cat.id)}
                className={`relative px-5 py-2.5 text-xs uppercase tracking-[0.16em] font-semibold whitespace-nowrap rounded-brand transition-colors ${
                  isActive
                    ? 'text-ivory-light'
                    : 'text-coffee-dark/80 hover:text-coffee hover:bg-ivory/60'
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="menuCategoryPill"
                    transition={{ type: 'spring', stiffness: 360, damping: 30 }}
                    className="absolute inset-0 bg-coffee rounded-brand shadow-xs -z-0"
                  />
                )}
                <span className="relative z-10">
                  {cat.name} ({count})
                </span>
              </button>
            );
          })}
        </div>

        {/* Active Category Tasting Note */}
        {selectedCategoryObj?.description && (
          <p className="text-center font-serif italic text-sm text-coffee-muted mb-8">
            “{selectedCategoryObj.description}”
          </p>
        )}

        {/* Search, Quick Filters & Sort Controls */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 mt-6 mb-12">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-coffee-muted absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm món trà sữa, cà phê, matcha..."
                className="w-full pl-11 pr-9 py-2.5 text-sm bg-ivory/60 border border-coffee-beige rounded-brand text-coffee-dark placeholder:text-coffee-muted focus:outline-none focus:border-coffee focus:bg-ivory-light transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-coffee-muted hover:text-coffee-dark"
                  aria-label="Xóa tìm kiếm"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              {[
                { key: 'all', label: 'Mọi dòng vị' },
                { key: 'bestseller', label: 'Được yêu thích' },
                { key: 'promo', label: 'Giá ưu đãi' },
              ].map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setQuickFilter(f.key as QuickTagFilter)}
                  className={`px-3 py-2 text-[11px] uppercase tracking-wider font-semibold rounded-brand border transition-colors ${
                    quickFilter === f.key
                      ? 'bg-ivory border-coffee text-coffee'
                      : 'bg-transparent border-coffee-beige/70 text-coffee-muted hover:text-coffee-dark'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 self-end lg:self-auto">
            <div className="inline-flex items-center gap-2 text-xs uppercase tracking-wider text-coffee-muted font-medium">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Sắp xếp:</span>
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              aria-label="Sắp xếp thực đơn"
              className="px-4 py-2.5 text-xs font-medium bg-ivory/60 border border-coffee-beige rounded-brand text-coffee-dark focus:outline-none focus:border-coffee"
            >
              <option value="default">Thứ tự đề xuất</option>
              <option value="price-asc">Giá: Thấp đến Cao</option>
              <option value="price-desc">Giá: Cao đến Thấp</option>
              <option value="name-asc">Tên món: A → Z</option>
            </select>
          </div>
        </div>

        {/* Editorial Menu List / 2-Column Tasting Index */}
        {visibleProducts.length === 0 ? (
          <div className="py-16 text-center border border-dashed border-coffee-beige rounded-brand bg-ivory/30">
            <p className="font-serif text-2xl text-coffee-dark">
              Không tìm thấy thức uống phù hợp
            </p>
            <p className="text-sm text-coffee-muted mt-1 mb-5">
              Vui lòng thử từ khóa khác hoặc chọn xem toàn bộ thực đơn.
            </p>
            <button
              type="button"
              onClick={() => {
                setActiveCategoryId('all');
                setQuickFilter('all');
                setSearchQuery('');
              }}
              className="px-5 py-2.5 text-xs uppercase tracking-wider font-semibold bg-coffee text-ivory-light rounded-brand"
            >
              Xem toàn bộ Thực đơn
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-8">
            <AnimatePresence mode="popLayout">
              {visibleProducts.map((item) => {
                const hasSale =
                  item.sale_price !== null &&
                  item.sale_price !== undefined &&
                  Number(item.sale_price) > 0 &&
                  Number(item.sale_price) < Number(item.price);

                return (
                  <motion.div
                    layout
                    key={item.id}
                    role="button"
                    tabIndex={0}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.25 }}
                    onClick={() => onSelectProduct?.(item)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onSelectProduct?.(item);
                      }
                    }}
                    className={`group cursor-pointer flex items-start gap-4 sm:gap-5 px-3 -mx-3 pt-3 pb-7 rounded-brand border-b border-coffee-beige/70 hover:bg-ivory/45 transition-all duration-200 ${
                      !item.is_available ? 'opacity-65' : ''
                    }`}
                  >
                    {/* Thumbnail */}
                    <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-brand overflow-hidden shrink-0 border border-coffee-beige bg-ivory">
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                      {!item.is_available && (
                        <div className="absolute inset-0 bg-coffee-dark/75 flex items-center justify-center">
                          <span className="text-[10px] uppercase tracking-widest font-semibold text-ivory-light px-2 py-0.5 border border-ivory-light/40">
                            Tạm hết
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Text & Classic Printed-Menu Dotted Leader Price */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2">
                        <h3 className="font-serif text-xl sm:text-2xl font-semibold text-coffee-dark group-hover:text-coffee transition-colors">
                          {item.name}
                        </h3>
                        <span
                          aria-hidden="true"
                          className="flex-1 border-b border-dotted border-coffee-beige/90 min-w-[16px] hidden sm:inline-block"
                        />
                        <div className="text-right shrink-0 ml-auto">
                          <span className="font-serif text-lg sm:text-xl font-bold text-coffee">
                            {formatVND(hasSale ? item.sale_price : item.price)}
                          </span>
                          {hasSale && (
                            <span className="block text-[11px] text-coffee-muted line-through">
                              {formatVND(item.price)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Badges */}
                      {(item.badge || item.is_best_seller || !item.is_available) && (
                        <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                          {item.badge && (
                            <span className="inline-block px-2 py-0.5 text-[10px] uppercase tracking-wider font-semibold bg-ivory text-coffee border border-coffee-beige rounded-brand">
                              {item.badge}
                            </span>
                          )}
                          {item.is_best_seller && item.badge !== 'Best Seller' && (
                            <span className="inline-block px-2 py-0.5 text-[10px] uppercase tracking-wider font-semibold bg-coffee text-ivory-light rounded-brand">
                              Bán chạy
                            </span>
                          )}
                        </div>
                      )}

                      <p className="text-xs sm:text-sm text-coffee-muted mt-2 line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {/* Footnote */}
        {section?.content?.note && (
          <p className="mt-12 text-center text-xs italic text-coffee-muted">
            * {section.content.note}
          </p>
        )}
      </div>
    </section>
  );
};
