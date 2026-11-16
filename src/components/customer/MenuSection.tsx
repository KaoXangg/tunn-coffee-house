import React, { useState, useMemo, useRef } from 'react';
import { Search, SlidersHorizontal, X, Coffee, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSiteData } from '../../contexts/SiteDataContext';
import { formatVND } from '../../lib/utils';
import type { Product } from '../../types/database';

interface MenuSectionProps {
  onSelectProduct?: (product: Product) => void;
}

type SortOption = 'default' | 'price-asc' | 'price-desc' | 'name-asc';
type QuickTagFilter = 'all' | 'bestseller' | 'promo';

const ITEMS_PER_PAGE = 8;

export const MenuSection: React.FC<MenuSectionProps> = ({ onSelectProduct }) => {
  const { categories, products, getSection } = useSiteData();
  const section = getSection('menu');
  const menuGridRef = useRef<HTMLDivElement>(null);

  const [activeCategoryId, setActiveCategoryId] = useState<string>('all');
  const [quickFilter, setQuickFilter] = useState<QuickTagFilter>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<SortOption>('default');
  const [currentPage, setCurrentPage] = useState<number>(1);

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

  const filterKey = `${activeCategoryId}|${quickFilter}|${searchQuery}|${sortBy}`;
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey);
    setCurrentPage(1);
  }

  const totalPages = Math.max(1, Math.ceil(visibleProducts.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);

  const paginatedProducts = useMemo(() => {
    const start = (safePage - 1) * ITEMS_PER_PAGE;
    return visibleProducts.slice(start, start + ITEMS_PER_PAGE);
  }, [visibleProducts, safePage]);

  const pageNumbers = useMemo(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages: Array<number | 'ellipsis'> = [1];
    if (safePage > 3) pages.push('ellipsis');
    const start = Math.max(2, safePage - 1);
    const end = Math.min(totalPages - 1, safePage + 1);
    for (let p = start; p <= end; p++) pages.push(p);
    if (safePage < totalPages - 2) pages.push('ellipsis');
    pages.push(totalPages);
    return pages;
  }, [totalPages, safePage]);

  const handlePageChange = (nextPage: number) => {
    const target = Math.max(1, Math.min(totalPages, nextPage));
    if (target === safePage) return;
    setCurrentPage(target);
    if (menuGridRef.current) {
      const y =
        menuGridRef.current.getBoundingClientRect().top + window.scrollY - 135;
      window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
    }
  };

  if (section && !section.is_enabled) return null;

  return (
    <section
      id="menu"
      className="py-20 sm:py-28 lg:py-32 bg-ivory-light border-b border-coffee-beige/60 dark:border-b-0"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
        {/* Editorial Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-[11px] uppercase tracking-[0.25em] text-coffee font-semibold mb-3">
            {String(section?.content?.eyebrow || 'THỰC ĐƠN THỦ CÔNG')}
          </p>
          <h2 className="font-serif text-3xl sm:text-5xl font-normal text-coffee-dark">
            {section?.title || 'Thực Đơn Tinh Tuyển'}
          </h2>
          <p className="text-sm sm:text-base text-coffee-muted mt-3">
            {section?.subtitle || 'Khám phá trọn vẹn hương vị trà và cà phê thủ công'}
          </p>
        </div>

        {/* Editorial Category Visual Marquee (Slow leftward glide, pauses on hover) */}
        {activeCategories.length > 0 && (
          <div className="group/marquee relative overflow-hidden mb-10 py-2 [mask-image:linear-gradient(to_right,transparent,black_4%,black_96%,transparent)]">
            <div
              className="animate-category-marquee"
              style={{
                animationDuration: `${Math.max(24, activeCategories.length * 6)}s`,
              }}
            >
              {[0, 1].map((dupIndex) => (
                <div
                  key={dupIndex}
                  aria-hidden={dupIndex === 1}
                  className="flex items-center gap-3.5 sm:gap-4 pr-3.5 sm:pr-4 shrink-0"
                >
                  {activeCategories.map((cat) => {
                    const count = products.filter(
                      (p) => p.is_visible && p.category_id === cat.id
                    ).length;
                    const isActive = activeCategoryId === cat.id;

                    return (
                      <button
                        key={`${dupIndex}-${cat.id}`}
                        type="button"
                        tabIndex={dupIndex === 1 ? -1 : 0}
                        onClick={() =>
                          setActiveCategoryId((prev) =>
                            prev === cat.id ? 'all' : cat.id
                          )
                        }
                        className={`group relative w-[180px] sm:w-[205px] lg:w-[220px] h-32 sm:h-36 shrink-0 rounded-xl overflow-hidden text-left transition-all duration-300 hover:-translate-y-1 active:scale-[0.98] ${
                          isActive
                            ? 'ring-2 ring-coffee ring-offset-2 ring-offset-ivory-light shadow-editorial-lg'
                            : 'border border-coffee-beige/60 dark:border-white/[0.08] shadow-sm hover:shadow-editorial opacity-95 hover:opacity-100'
                        }`}
                      >
                        {/* Background Image or Artisanal Fallback */}
                        {cat.image_url ? (
                          <img
                            src={cat.image_url}
                            alt={cat.name}
                            loading="lazy"
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                          />
                        ) : (
                          <div className="absolute inset-0 bg-gradient-to-br from-[#4B2E24] via-[#342019] to-[#1D120E] flex items-center justify-center">
                            <Coffee className="w-8 h-8 text-[#D5C6AD]/25 transition-transform duration-500 group-hover:scale-110" />
                          </div>
                        )}

                        {/* Multi-layer Depth Overlay */}
                        <div
                          className={`absolute inset-0 transition-opacity duration-300 ${
                            isActive
                              ? 'bg-gradient-to-t from-[#1A100C]/90 via-[#1A100C]/35 to-[#4B2E24]/20'
                              : 'bg-gradient-to-t from-[#160E0A]/90 via-[#160E0A]/40 to-black/10 group-hover:from-[#160E0A]/95'
                          }`}
                        />

                        {/* Top Row: Count Pill & Active Indicator */}
                        <div className="relative z-10 flex items-center justify-between p-2.5 sm:p-3">
                          <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase rounded-full backdrop-blur-md bg-white/15 border border-white/20 text-[#F7F5EF]">
                            {count} món
                          </span>
                          {isActive && (
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-300 shadow-[0_0_10px_rgba(252,211,77,0.9)]" />
                          )}
                        </div>

                        {/* Bottom Title */}
                        <div className="absolute inset-x-0 bottom-0 z-10 p-3">
                          <p className="font-serif text-sm sm:text-base font-medium text-[#F7F5EF] leading-snug line-clamp-2 drop-shadow-sm">
                            {cat.name}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sticky Category Jump Bar (Wraps cleanly on desktop, horizontal swipe on mobile) */}
        <div className="sticky top-[62px] lg:top-[70px] z-30 bg-ivory-light/95 backdrop-blur-md -mx-4 px-4 sm:mx-0 sm:px-0 pt-2.5 pb-3 mb-4 border-b border-coffee-beige/60 dark:border-white/[0.07] overflow-x-auto sm:overflow-visible no-scrollbar">
          <div className="flex flex-nowrap sm:flex-wrap items-center sm:justify-center gap-2 w-max sm:w-full mx-auto px-1">
            <button
              type="button"
              onClick={() => setActiveCategoryId('all')}
              className={`relative px-4 py-2 text-xs uppercase tracking-[0.14em] font-semibold whitespace-nowrap rounded-full transition-colors shrink-0 ${
                activeCategoryId === 'all'
                  ? 'text-ivory-light'
                  : 'text-coffee-dark/80 hover:text-coffee hover:bg-ivory/70'
              }`}
            >
              {activeCategoryId === 'all' && (
                <motion.span
                  layoutId="menuCategoryPill"
                  transition={{ type: 'spring', stiffness: 360, damping: 30 }}
                  className="absolute inset-0 bg-coffee rounded-full shadow-xs -z-0"
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
                  className={`relative inline-flex items-center gap-2 px-3.5 py-2 text-xs uppercase tracking-[0.14em] font-semibold whitespace-nowrap rounded-full transition-colors shrink-0 ${
                    isActive
                      ? 'text-ivory-light'
                      : 'text-coffee-dark/80 hover:text-coffee hover:bg-ivory/70'
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="menuCategoryPill"
                      transition={{ type: 'spring', stiffness: 360, damping: 30 }}
                      className="absolute inset-0 bg-coffee rounded-full shadow-xs -z-0"
                    />
                  )}
                  {cat.image_url && (
                    <img
                      src={cat.image_url}
                      alt=""
                      className="relative z-10 w-5 h-5 rounded-full object-cover border border-white/30 shrink-0"
                    />
                  )}
                  <span className="relative z-10">
                    {cat.name} ({count})
                  </span>
                </button>
              );
            })}
          </div>
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
        <div ref={menuGridRef} />
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
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <AnimatePresence mode="popLayout">
                {paginatedProducts.map((item) => {
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
                    className={`group cursor-pointer flex items-start gap-4 sm:gap-5 p-3.5 sm:p-4 rounded-xl bg-ivory/40 hover:bg-ivory/85 dark:bg-white/[0.03] dark:hover:bg-white/[0.06] border border-coffee-beige/50 dark:border-white/[0.06] hover:border-coffee/40 dark:hover:border-coffee/40 hover:-translate-y-0.5 hover:shadow-editorial transition-all duration-300 ${
                      !item.is_available ? 'opacity-65' : ''
                    }`}
                  >
                    {/* Thumbnail */}
                    <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-lg overflow-hidden shrink-0 border border-coffee-beige/60 dark:border-white/[0.08] bg-ivory">
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

                    {/* Text & Price */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="font-serif text-xl sm:text-2xl font-semibold text-coffee-dark group-hover:text-coffee transition-colors leading-snug">
                          {item.name}
                        </h3>
                        <div className="text-right shrink-0 pt-0.5">
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
                            <span className="inline-block px-2 py-0.5 text-[10px] uppercase tracking-wider font-semibold bg-ivory text-coffee border border-coffee-beige/70 dark:border-white/[0.1] rounded-brand">
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

            {/* Pagination Bar */}
            {totalPages > 1 && (
              <div className="mt-12 pt-8 border-t border-coffee-beige/60 dark:border-white/[0.07] flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-xs text-coffee-muted">
                  Hiển thị{' '}
                  <strong className="text-coffee-dark font-semibold">
                    {(safePage - 1) * ITEMS_PER_PAGE + 1}–
                    {Math.min(safePage * ITEMS_PER_PAGE, visibleProducts.length)}
                  </strong>{' '}
                  trên tổng{' '}
                  <strong className="text-coffee-dark font-semibold">
                    {visibleProducts.length}
                  </strong>{' '}
                  món
                </p>

                <nav
                  aria-label="Phân trang thực đơn"
                  className="inline-flex items-center gap-1.5"
                >
                  <button
                    type="button"
                    disabled={safePage === 1}
                    onClick={() => handlePageChange(safePage - 1)}
                    aria-label="Trang trước"
                    className="w-9 h-9 inline-flex items-center justify-center rounded-full border border-coffee-beige dark:border-white/[0.1] bg-ivory/60 dark:bg-white/[0.04] text-coffee-dark hover:border-coffee hover:bg-ivory transition-colors disabled:opacity-40 disabled:pointer-events-none"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  {pageNumbers.map((page, idx) =>
                    page === 'ellipsis' ? (
                      <span
                        key={`ellipsis-${idx}`}
                        className="px-1.5 text-xs text-coffee-muted select-none"
                      >
                        ...
                      </span>
                    ) : (
                      <button
                        key={page}
                        type="button"
                        onClick={() => handlePageChange(page)}
                        aria-current={page === safePage ? 'page' : undefined}
                        className={`min-w-[36px] h-9 px-3 inline-flex items-center justify-center rounded-full text-xs font-semibold transition-all ${
                          page === safePage
                            ? 'bg-coffee text-ivory-light shadow-editorial'
                            : 'border border-coffee-beige/80 dark:border-white/[0.1] bg-ivory/50 dark:bg-white/[0.04] text-coffee-dark hover:border-coffee hover:bg-ivory'
                        }`}
                      >
                        {page}
                      </button>
                    )
                  )}

                  <button
                    type="button"
                    disabled={safePage === totalPages}
                    onClick={() => handlePageChange(safePage + 1)}
                    aria-label="Trang sau"
                    className="w-9 h-9 inline-flex items-center justify-center rounded-full border border-coffee-beige dark:border-white/[0.1] bg-ivory/60 dark:bg-white/[0.04] text-coffee-dark hover:border-coffee hover:bg-ivory transition-colors disabled:opacity-40 disabled:pointer-events-none"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </nav>
              </div>
            )}
          </>
        )}

        {/* Footnote */}
        {Boolean(section?.content?.note) && (
          <p className="mt-12 text-center text-xs italic text-coffee-muted">
            * {String(section?.content?.note)}
          </p>
        )}
      </div>
    </section>
  );
};
