import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Search,
  SlidersHorizontal,
  X,
  Coffee,
  ChevronLeft,
  ChevronRight,
  Plus,
  Minus,
  ClipboardList,
  Trash2,
  Maximize2,
  Minimize2,
  MessageSquareText,
  Clock,
} from 'lucide-react';
import { m, AnimatePresence } from 'framer-motion';
import { useSiteData } from '../../contexts/SiteDataContext';
import { formatVND } from '../../lib/utils';
import { Skeleton } from '../common/Skeleton';
import type { Product } from '../../types/database';

interface MenuSectionProps {
  onSelectProduct?: (product: Product) => void;
}

type SortOption = 'default' | 'price-asc' | 'price-desc' | 'name-asc';
type QuickTagFilter = 'all' | 'bestseller' | 'refreshing' | 'creamy' | 'bold' | 'promo';

const ITEMS_PER_PAGE = 8;
const DRINK_NOTE_OPTIONS = ['Bình thường', 'Ít ngọt', 'Không đường', 'Ít đá', 'Riêng đá', 'Nóng'];
const TABLE_NOTE_SUGGESTIONS = ['Cho thêm nước lọc', 'Mang ra cùng lúc', 'Ít ngọt cả bàn'];

function getDrinkFlavorProfile(product: Product): {
  key: 'refreshing' | 'creamy' | 'bold';
  label: string;
} {
  const text = `${product.name} ${product.description} ${product.badge || ''}`.toLowerCase();
  if (
    text.includes('đào') ||
    text.includes('nhãn') ||
    text.includes('hạt sen') ||
    text.includes('trái cây') ||
    text.includes('cam') ||
    text.includes('thanh mát') ||
    text.includes('hoa hồng') ||
    text.includes('dâu') ||
    text.includes('vải')
  ) {
    return { key: 'refreshing', label: 'Thanh mát · Ít cafein' };
  }
  if (
    text.includes('espresso') ||
    text.includes('cold brew') ||
    text.includes('cà phê') ||
    text.includes('shan tuyết') ||
    text.includes('đậm')
  ) {
    return { key: 'bold', label: 'Đậm vị · Tỉnh táo' };
  }
  return { key: 'creamy', label: 'Béo thơm · Kem mịn' };
}

export const MenuSection: React.FC<MenuSectionProps> = ({ onSelectProduct }) => {
  const { categories, products, getSection, loading, isLiveDatabase } = useSiteData();
  const showSkeleton = loading && !isLiveDatabase;
  const section = getSection('menu');
  const menuGridRef = useRef<HTMLDivElement>(null);

  const [activeCategoryId, setActiveCategoryId] = useState<string>('all');
  const [quickFilter, setQuickFilter] = useState<QuickTagFilter>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<SortOption>('default');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [orderNoteOpen, setOrderNoteOpen] = useState<boolean>(false);
  const [staffViewMode, setStaffViewMode] = useState<boolean>(false);
  const [tableGeneralNote, setTableGeneralNote] = useState<string>(() => {
    try {
      return localStorage.getItem('tunn_table_order_general_note_v1') || '';
    } catch {
      return '';
    }
  });
  const [recentlyViewedIds, setRecentlyViewedIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem('tunn_recently_viewed_v1');
      return raw ? (JSON.parse(raw) as string[]) : [];
    } catch {
      return [];
    }
  });
  const [orderNote, setOrderNote] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('tunn_table_order_note_v1');
      return saved ? (JSON.parse(saved) as Record<string, number>) : {};
    } catch {
      return {};
    }
  });
  const [orderCustomizations, setOrderCustomizations] = useState<Record<string, string[]>>(() => {
    try {
      const saved = localStorage.getItem('tunn_table_order_custom_v1');
      return saved ? (JSON.parse(saved) as Record<string, string[]>) : {};
    } catch {
      return {};
    }
  });

  const toggleOrderCustomization = (productId: string, option: string) => {
    setOrderCustomizations((prev) => {
      const current = prev[productId] || [];
      let nextList: string[];
      if (option === 'Bình thường') {
        nextList = current.includes('Bình thường') ? [] : ['Bình thường'];
      } else {
        const withoutDefault = current.filter((o) => o !== 'Bình thường');
        nextList = withoutDefault.includes(option)
          ? withoutDefault.filter((o) => o !== option)
          : [...withoutDefault, option];
      }
      const next = { ...prev, [productId]: nextList };
      try {
        localStorage.setItem('tunn_table_order_custom_v1', JSON.stringify(next));
      } catch {
        // Ignore storage errors
      }
      return next;
    });
  };

  useEffect(() => {
    const syncFromStorage = () => {
      try {
        const saved = localStorage.getItem('tunn_table_order_note_v1');
        setOrderNote(saved ? (JSON.parse(saved) as Record<string, number>) : {});
      } catch {
        // Ignore storage errors
      }
    };
    const syncRecentlyViewed = () => {
      try {
        const raw = localStorage.getItem('tunn_recently_viewed_v1');
        setRecentlyViewedIds(raw ? (JSON.parse(raw) as string[]) : []);
      } catch {
        // Ignore storage errors
      }
    };
    window.addEventListener('tunn-order-note-updated', syncFromStorage);
    window.addEventListener('tunn-recently-viewed-updated', syncRecentlyViewed);
    return () => {
      window.removeEventListener('tunn-order-note-updated', syncFromStorage);
      window.removeEventListener('tunn-recently-viewed-updated', syncRecentlyViewed);
    };
  }, []);

  const updateTableGeneralNote = (nextNote: string) => {
    setTableGeneralNote(nextNote);
    try {
      if (nextNote.trim()) {
        localStorage.setItem('tunn_table_order_general_note_v1', nextNote);
      } else {
        localStorage.removeItem('tunn_table_order_general_note_v1');
      }
    } catch {
      // Ignore storage errors
    }
  };

  const clearRecentlyViewed = () => {
    setRecentlyViewedIds([]);
    try {
      localStorage.removeItem('tunn_recently_viewed_v1');
    } catch {
      // Ignore storage errors
    }
  };

  const updateOrderNoteQty = (productId: string, delta: number) => {
    setOrderNote((prev) => {
      const nextQty = Math.max(0, (prev[productId] || 0) + delta);
      const next = { ...prev };
      if (nextQty === 0) {
        delete next[productId];
      } else {
        next[productId] = nextQty;
      }
      try {
        localStorage.setItem('tunn_table_order_note_v1', JSON.stringify(next));
      } catch {
        // Ignore storage quota errors
      }
      return next;
    });
  };

  const clearOrderNote = () => {
    setOrderNote({});
    setOrderCustomizations({});
    setTableGeneralNote('');
    setStaffViewMode(false);
    setOrderNoteOpen(false);
    try {
      localStorage.removeItem('tunn_table_order_note_v1');
      localStorage.removeItem('tunn_table_order_custom_v1');
      localStorage.removeItem('tunn_table_order_general_note_v1');
    } catch {
      // Ignore storage errors
    }
    window.dispatchEvent(new Event('tunn-order-note-updated'));
  };

  const recentlyViewedProducts = useMemo(() => {
    return recentlyViewedIds
      .map((id) => products.find((p) => p.id === id && p.is_visible))
      .filter((p): p is Product => Boolean(p));
  }, [recentlyViewedIds, products]);

  const notedItems = useMemo(() => {
    return Object.entries(orderNote)
      .map(([id, qty]) => {
        const product = products.find((p) => p.id === id && p.is_visible);
        return product && qty > 0 ? { product, qty } : null;
      })
      .filter((entry): entry is NonNullable<typeof entry> => entry !== null);
  }, [orderNote, products]);

  const totalNoteCount = useMemo(
    () => notedItems.reduce((sum, entry) => sum + entry.qty, 0),
    [notedItems]
  );

  const isOrderModalOpen = orderNoteOpen && notedItems.length > 0;

  useEffect(() => {
    if (!isOrderModalOpen) return;
    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOrderNoteOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isOrderModalOpen]);

  const totalNotePrice = useMemo(
    () =>
      notedItems.reduce((sum, { product, qty }) => {
        const unit =
          product.sale_price && Number(product.sale_price) > 0 && Number(product.sale_price) < Number(product.price)
            ? Number(product.sale_price)
            : Number(product.price);
        return sum + unit * qty;
      }, 0),
    [notedItems]
  );

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
      if (
        quickFilter === 'refreshing' ||
        quickFilter === 'creamy' ||
        quickFilter === 'bold'
      ) {
        if (getDrinkFlavorProfile(p).key !== quickFilter) return false;
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
          <p className="text-sm text-coffee font-medium mb-2">
            {String(section?.content?.eyebrow || 'Thực đơn thủ công')}
          </p>
          <h2 className="font-serif text-3xl sm:text-5xl font-normal text-coffee-dark">
            {section?.title || 'Thực Đơn Tinh Tuyển'}
          </h2>
          <p className="text-sm sm:text-base text-coffee-muted mt-3">
            {section?.subtitle || 'Khám phá trọn vẹn hương vị trà và cà phê thủ công'}
          </p>
        </div>

        {showSkeleton ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div
                key={idx}
                className="flex items-start gap-4 sm:gap-5 p-3.5 sm:p-4 rounded-xl bg-ivory/40 border border-coffee-beige/50"
              >
                <Skeleton className="w-24 h-24 sm:w-28 sm:h-28 rounded-lg shrink-0" />
                <div className="flex-1 min-w-0 space-y-2.5 py-1">
                  <div className="flex items-start justify-between gap-3">
                    <Skeleton className="h-6 w-2/3" />
                    <Skeleton className="h-6 w-20 shrink-0" />
                  </div>
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-3.5 w-full" />
                  <Skeleton className="h-3.5 w-4/5" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>

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
                          <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase rounded-full bg-[#1C1410]/75 border border-white/20 text-[#F7F5EF]">
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
        <div className="sticky top-[62px] lg:top-[70px] z-30 bg-ivory-light -mx-4 px-4 sm:mx-0 sm:px-0 pt-2.5 pb-3 mb-4 border-b border-coffee-beige/60 dark:border-white/[0.07] overflow-x-auto sm:overflow-visible no-scrollbar">
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
                <m.span
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
                    <m.span
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

            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { key: 'all', label: 'Mọi dòng vị' },
                { key: 'bestseller', label: 'Được yêu thích' },
                { key: 'refreshing', label: 'Thanh mát · Ít cafein' },
                { key: 'creamy', label: 'Béo thơm · Kem mịn' },
                { key: 'bold', label: 'Đậm vị · Tỉnh táo' },
                { key: 'promo', label: 'Giá ưu đãi' },
              ].map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setQuickFilter(f.key as QuickTagFilter)}
                  className={`px-3 py-2 text-[11px] font-semibold rounded-brand border transition-colors ${
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

        {/* Recently Viewed Strip */}
        {recentlyViewedProducts.length > 0 && (
          <div className="mb-8 p-3.5 sm:p-4 rounded-xl bg-ivory/45 dark:bg-white/[0.03] border border-coffee-beige/60 dark:border-white/[0.06]">
            <div className="flex items-center justify-between gap-2 mb-2.5">
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-coffee">
                <Clock className="w-3.5 h-3.5" />
                <span>Món bạn vừa xem</span>
              </div>
              <button
                type="button"
                onClick={clearRecentlyViewed}
                className="text-[11px] text-coffee-muted hover:text-coffee-dark transition-colors"
              >
                Ẩn
              </button>
            </div>
            <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar pb-0.5">
              {recentlyViewedProducts.map((recent) => {
                const recentHasSale =
                  recent.sale_price !== null &&
                  recent.sale_price !== undefined &&
                  Number(recent.sale_price) > 0 &&
                  Number(recent.sale_price) < Number(recent.price);
                const recentQty = orderNote[recent.id] || 0;
                return (
                  <div
                    key={`recent-${recent.id}`}
                    className="inline-flex items-center gap-2.5 pl-1.5 pr-2.5 py-1.5 rounded-xl bg-ivory-light dark:bg-white/[0.05] border border-coffee-beige/70 dark:border-white/[0.08] shrink-0"
                  >
                    <button
                      type="button"
                      onClick={() => onSelectProduct?.(recent)}
                      className="inline-flex items-center gap-2 text-left min-w-0"
                    >
                      <img
                        src={recent.image_url}
                        alt={recent.name}
                        className="w-9 h-9 rounded-lg object-cover shrink-0"
                      />
                      <div className="max-w-[140px]">
                        <p className="font-serif text-xs font-semibold text-coffee-dark truncate">
                          {recent.name}
                        </p>
                        <p className="text-[11px] font-medium text-coffee tabular-nums">
                          {formatVND(recentHasSale ? recent.sale_price : recent.price)}
                        </p>
                      </div>
                    </button>
                    {recent.is_available && (
                      <button
                        type="button"
                        onClick={() => updateOrderNoteQty(recent.id, 1)}
                        className={`w-6 h-6 rounded-full inline-flex items-center justify-center text-[11px] font-bold transition-colors shrink-0 ${
                          recentQty > 0
                            ? 'bg-coffee text-ivory-light'
                            : 'bg-ivory dark:bg-white/[0.08] text-coffee hover:bg-coffee hover:text-ivory-light'
                        }`}
                        title="Thêm vào Sổ ghi món"
                      >
                        {recentQty > 0 ? recentQty : <Plus className="w-3 h-3" />}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

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
                  <m.div
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
                    className={`group cursor-pointer h-full flex items-stretch gap-4 sm:gap-5 p-3.5 sm:p-4 rounded-xl bg-ivory/40 hover:bg-ivory/85 dark:bg-white/[0.03] dark:hover:bg-white/[0.06] border border-coffee-beige/50 dark:border-white/[0.06] hover:border-coffee/40 dark:hover:border-coffee/40 hover:-translate-y-0.5 hover:shadow-editorial transition-all duration-300 ${
                      !item.is_available ? 'opacity-65' : ''
                    }`}
                  >
                    {/* Thumbnail */}
                    <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-lg overflow-hidden shrink-0 border border-coffee-beige/60 dark:border-white/[0.08] bg-ivory self-start">
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
                    <div className="flex-1 min-w-0 flex flex-col">
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

                      {/* Badges & Flavor Tasting Note */}
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
                        <span className="inline-block px-2 py-0.5 text-[10px] font-medium bg-coffee/[0.07] dark:bg-white/[0.05] text-coffee-muted rounded-brand">
                          {getDrinkFlavorProfile(item).label}
                        </span>
                      </div>

                      <p className="text-xs sm:text-sm text-coffee-muted mt-2 line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>

                      {item.is_available && (
                        <div
                          className="mt-auto pt-3 flex items-center justify-end"
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => e.stopPropagation()}
                        >
                          {(orderNote[item.id] || 0) > 0 ? (
                            <div className="h-7 inline-flex items-center gap-1 bg-coffee text-ivory-light rounded-full px-1 text-xs font-semibold shadow-xs">
                              <button
                                type="button"
                                onClick={() => updateOrderNoteQty(item.id, -1)}
                                className="w-5 h-5 rounded-full inline-flex items-center justify-center hover:bg-white/15 transition-colors"
                                aria-label="Giảm số lượng"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="min-w-[20px] text-center tabular-nums">
                                {orderNote[item.id]}
                              </span>
                              <button
                                type="button"
                                onClick={() => updateOrderNoteQty(item.id, 1)}
                                className="w-5 h-5 rounded-full inline-flex items-center justify-center hover:bg-white/15 transition-colors"
                                aria-label="Tăng số lượng"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => updateOrderNoteQty(item.id, 1)}
                              className="h-7 inline-flex items-center gap-1 px-3 rounded-full text-xs font-medium bg-ivory dark:bg-white/[0.06] text-coffee border border-coffee-beige/80 dark:border-white/[0.1] hover:bg-coffee hover:text-ivory-light hover:border-coffee transition-colors"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Đánh dấu món</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </m.div>
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
          </>
        )}

        {/* Footnote */}
        {Boolean(section?.content?.note) && (
          <p className="mt-12 text-center text-xs italic text-coffee-muted">
            * {String(section?.content?.note)}
          </p>
        )}

        {/* Floating Table Order Note Pill (Left-aligned on mobile to clear Back-to-Top button on right) */}
        <AnimatePresence>
          {totalNoteCount > 0 && (
            <m.div
              key="floating-order-note-bar"
              initial={{ opacity: 0, y: 20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 340, damping: 28 }}
              className="fixed bottom-5 left-4 right-[68px] sm:right-auto sm:left-6 z-40 sm:w-auto max-w-sm"
            >
              <button
                type="button"
                onClick={() => setOrderNoteOpen(true)}
                className="group w-full sm:w-auto flex items-center justify-between gap-3.5 pl-2.5 pr-3 py-2 rounded-2xl bg-coffee text-ivory-light border border-coffee-beige/40 shadow-editorial-lg hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="h-9 px-2.5 rounded-xl bg-ivory-light/15 border border-ivory-light/25 text-ivory-light inline-flex items-center justify-center gap-1.5 shrink-0">
                    <ClipboardList className="w-3.5 h-3.5" />
                    <span className="font-serif text-sm font-bold tabular-nums">
                      {totalNoteCount}
                    </span>
                  </span>
                  <div className="text-left min-w-0 pr-1">
                    <p className="text-xs font-bold text-ivory-light leading-tight truncate">
                      Sổ ghi món tại bàn
                    </p>
                    <p className="text-xs font-serif font-bold text-ivory-light/90 mt-0.5 tabular-nums">
                      {formatVND(totalNotePrice)}
                    </p>
                  </div>
                </div>
                <span className="px-3.5 py-1.5 rounded-xl bg-ivory-light text-coffee text-xs font-bold shrink-0 group-hover:opacity-90 transition-opacity">
                  Mở sổ
                </span>
              </button>
            </m.div>
          )}
        </AnimatePresence>

        {/* Table Order Note Modal */}
        <AnimatePresence>
          {isOrderModalOpen && (
            <div
              className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4 overscroll-contain"
              role="dialog"
              aria-modal="true"
              aria-labelledby="table-order-note-title"
            >
              <m.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => setOrderNoteOpen(false)}
                className="fixed inset-0 bg-black/60 backdrop-blur-[3px] touch-none"
              />
              <m.div
                initial={{ opacity: 0, y: 28, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 24, scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 340, damping: 30 }}
                className={`relative z-10 w-full ${
                  staffViewMode ? 'sm:max-w-[580px]' : 'sm:max-w-[500px]'
                } bg-[#FAF8F3] dark:bg-[#18120E] text-coffee-dark border-t sm:border border-[#E6DFCE] dark:border-white/[0.08] rounded-t-[24px] sm:rounded-2xl shadow-[0_28px_70px_-16px_rgba(0,0,0,0.6)] overflow-hidden max-h-[88vh] sm:max-h-[85vh] flex flex-col overscroll-contain transition-all duration-200`}
              >
                {/* Mobile drag handle */}
                <div className="pt-2.5 pb-0.5 sm:hidden flex justify-center">
                  <span className="w-10 h-1 rounded-full bg-coffee-beige dark:bg-white/15" />
                </div>

                {/* Editorial Header */}
                <div className="px-5 pt-3.5 pb-4 sm:py-4 border-b border-[#EAE3D2] dark:border-white/[0.06] flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-medium text-coffee">
                        {staffViewMode ? 'Chế độ đọc đơn tại bàn' : 'Phiếu gọi món tại bàn'}
                      </span>
                      <span className="text-coffee-muted/50">·</span>
                      <span className="text-[11px] font-semibold text-coffee">
                        {totalNoteCount} ly
                      </span>
                    </div>
                    <h3
                      id="table-order-note-title"
                      className="font-serif text-xl sm:text-[22px] font-semibold text-coffee-dark leading-snug mt-0.5"
                    >
                      {staffViewMode ? 'Đưa màn hình cho Nhân viên' : 'Sổ ghi món của bàn'}
                    </h3>
                    <p className="text-xs text-coffee-muted mt-0.5">
                      {staffViewMode
                        ? 'Chữ phóng to rõ nét để nhân viên nhìn từ xa nhập máy POS'
                        : 'Đưa màn hình này hoặc đọc danh sách cho nhân viên khi gọi món'}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
                    <button
                      type="button"
                      onClick={() => setStaffViewMode((prev) => !prev)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                        staffViewMode
                          ? 'bg-coffee text-ivory-light'
                          : 'bg-[#EFECE2] dark:bg-white/[0.07] text-coffee-dark hover:bg-[#E5E0D0] dark:hover:bg-white/[0.12]'
                      }`}
                      title={
                        staffViewMode
                          ? 'Quay lại chế độ chỉnh sửa'
                          : 'Phóng to chữ để đưa nhân viên xem'
                      }
                    >
                      {staffViewMode ? (
                        <>
                          <Minimize2 className="w-3.5 h-3.5" />
                          <span>Sửa món</span>
                        </>
                      ) : (
                        <>
                          <Maximize2 className="w-3.5 h-3.5" />
                          <span>Đưa NV xem</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setOrderNoteOpen(false)}
                      className="w-8 h-8 rounded-full bg-[#EFECE2] dark:bg-white/[0.06] text-coffee-muted hover:text-coffee-dark hover:bg-[#E5E0D0] dark:hover:bg-white/[0.12] inline-flex items-center justify-center transition-colors"
                      aria-label="Đóng sổ ghi món"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Drink Cards List */}
                <div className="px-4 sm:px-5 py-3.5 overflow-y-auto overscroll-contain touch-pan-y space-y-2.5 flex-1">
                  {staffViewMode ? (
                    /* LARGE-PRINT STAFF READING MODE */
                    <div className="space-y-2.5">
                      {notedItems.map(({ product, qty }, idx) => {
                        const selectedNotes = orderCustomizations[product.id] || [];
                        return (
                          <div
                            key={`staff-${product.id}`}
                            className="p-4 rounded-2xl bg-white dark:bg-[#211914] border border-[#ECE6D6] dark:border-white/[0.07] flex items-center justify-between gap-4"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-coffee-muted tabular-nums">
                                  #{idx + 1}
                                </span>
                                <p className="font-serif text-lg sm:text-xl font-bold text-coffee-dark leading-snug">
                                  {product.name}
                                </p>
                              </div>
                              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                                {selectedNotes.length > 0 ? (
                                  selectedNotes.map((note) => (
                                    <span
                                      key={note}
                                      className="px-2.5 py-1 rounded-lg bg-coffee text-ivory-light text-xs sm:text-sm font-semibold"
                                    >
                                      {note}
                                    </span>
                                  ))
                                ) : (
                                  <span className="px-2.5 py-0.5 rounded-lg bg-[#F4F0E6] dark:bg-white/[0.06] text-coffee-muted text-xs font-medium">
                                    Mặc định (Bình thường)
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="min-w-[60px] h-14 px-3 rounded-2xl bg-coffee/12 dark:bg-coffee/15 border border-coffee/30 flex flex-col items-center justify-center shrink-0">
                              <span className="font-serif text-2xl sm:text-3xl font-bold text-coffee tabular-nums leading-none">
                                {qty}×
                              </span>
                            </div>
                          </div>
                        );
                      })}

                      {tableGeneralNote.trim() && (
                        <div className="p-4 rounded-2xl bg-coffee/10 dark:bg-white/[0.06] border border-coffee/30">
                          <p className="text-xs font-semibold text-coffee uppercase tracking-wider">
                            Ghi chú thêm của bàn
                          </p>
                          <p className="text-base sm:text-lg font-semibold text-coffee-dark mt-1 leading-snug">
                            “{tableGeneralNote.trim()}”
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* NORMAL EDITABLE CUSTOMER MODE */
                    <>
                      <AnimatePresence initial={false}>
                        {notedItems.map(({ product, qty }) => {
                          const unitPrice =
                            product.sale_price &&
                            Number(product.sale_price) > 0 &&
                            Number(product.sale_price) < Number(product.price)
                              ? Number(product.sale_price)
                              : Number(product.price);
                          const selectedNotes = orderCustomizations[product.id] || [];
                          return (
                            <m.div
                              layout
                              key={product.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.96 }}
                              transition={{ duration: 0.18 }}
                              className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-[#211914] border border-[#ECE6D6] dark:border-white/[0.05] shadow-[0_2px_8px_rgba(36,25,20,0.03)] dark:shadow-none"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex items-start gap-3 min-w-0">
                                  <img
                                    src={product.image_url}
                                    alt={product.name}
                                    className="w-14 h-14 rounded-xl object-cover bg-ivory shrink-0"
                                  />
                                  <div className="min-w-0 pt-0.5">
                                    <p className="font-serif text-[15px] sm:text-base font-semibold text-coffee-dark leading-snug line-clamp-2">
                                      {product.name}
                                    </p>
                                    <div className="flex items-baseline gap-1.5 mt-1">
                                      <span className="font-serif text-sm font-bold text-coffee tabular-nums">
                                        {formatVND(unitPrice * qty)}
                                      </span>
                                      {qty > 1 && (
                                        <span className="text-[11px] text-coffee-muted tabular-nums">
                                          ({formatVND(unitPrice)} / ly)
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <div className="inline-flex items-center gap-1 bg-[#F3EFE4] dark:bg-white/[0.06] rounded-full p-1 text-xs font-semibold shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => updateOrderNoteQty(product.id, -1)}
                                    className="w-7 h-7 rounded-full inline-flex items-center justify-center text-coffee-dark hover:bg-white dark:hover:bg-white/[0.12] active:scale-90 transition-all"
                                    aria-label="Giảm số lượng"
                                  >
                                    <Minus className="w-3.5 h-3.5" />
                                  </button>
                                  <span className="min-w-[20px] text-center tabular-nums text-coffee-dark">
                                    {qty}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => updateOrderNoteQty(product.id, 1)}
                                    className="w-7 h-7 rounded-full inline-flex items-center justify-center text-coffee-dark hover:bg-white dark:hover:bg-white/[0.12] active:scale-90 transition-all"
                                    aria-label="Tăng số lượng"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              {/* Soft Borderless Taste Customization Pills */}
                              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                                {DRINK_NOTE_OPTIONS.map((opt) => {
                                  const isSelected = selectedNotes.includes(opt);
                                  return (
                                    <button
                                      key={opt}
                                      type="button"
                                      onClick={() => toggleOrderCustomization(product.id, opt)}
                                      className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all duration-150 active:scale-95 ${
                                        isSelected
                                          ? 'bg-coffee text-ivory-light shadow-2xs'
                                          : 'bg-[#F4F0E6] dark:bg-white/[0.05] text-coffee-muted hover:text-coffee-dark hover:bg-[#EAE4D3] dark:hover:bg-white/[0.1]'
                                      }`}
                                    >
                                      {opt}
                                    </button>
                                  );
                                })}
                              </div>
                            </m.div>
                          );
                        })}
                      </AnimatePresence>

                      {/* Free-text General Note for the Table */}
                      <div className="p-3.5 rounded-2xl bg-white dark:bg-[#211914] border border-[#ECE6D6] dark:border-white/[0.05] space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <label
                            htmlFor="table-general-note-input"
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-coffee-dark"
                          >
                            <MessageSquareText className="w-3.5 h-3.5 text-coffee" />
                            <span>Ghi chú chung cho cả bàn</span>
                          </label>
                          {tableGeneralNote && (
                            <button
                              type="button"
                              onClick={() => updateTableGeneralNote('')}
                              className="text-[11px] text-coffee-muted hover:text-coffee-dark"
                            >
                              Xóa ghi chú
                            </button>
                          )}
                        </div>
                        <input
                          id="table-general-note-input"
                          type="text"
                          value={tableGeneralNote}
                          onChange={(e) => updateTableGeneralNote(e.target.value)}
                          placeholder="Ví dụ: Cho thêm 2 ly nước lọc, mang ra cùng lúc..."
                          className="w-full px-3 py-2 text-xs rounded-xl bg-[#FAF8F3] dark:bg-white/[0.04] border border-[#E6DFCE] dark:border-white/[0.08] text-coffee-dark placeholder:text-coffee-muted focus:outline-none focus:border-coffee"
                        />
                        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                          {TABLE_NOTE_SUGGESTIONS.map((sug) => (
                            <button
                              key={sug}
                              type="button"
                              onClick={() => {
                                const next = tableGeneralNote.includes(sug)
                                  ? tableGeneralNote
                                  : tableGeneralNote.trim()
                                  ? `${tableGeneralNote.trim()}, ${sug.toLowerCase()}`
                                  : sug;
                                updateTableGeneralNote(next);
                              }}
                              className="px-2.5 py-1 rounded-full text-[11px] bg-[#F4F0E6] dark:bg-white/[0.05] text-coffee-muted hover:text-coffee-dark transition-colors"
                            >
                              + {sug}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Clean Summary Footer */}
                <div className="px-5 py-4 bg-white dark:bg-[#1C1511] border-t border-[#EAE3D2] dark:border-white/[0.06] flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs text-coffee-muted">
                      Tạm tính ({totalNoteCount} ly)
                    </p>
                    <p className="font-serif text-xl sm:text-2xl font-bold text-coffee tabular-nums leading-tight mt-0.5">
                      {formatVND(totalNotePrice)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={clearOrderNote}
                      className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-medium text-coffee-muted hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Làm mới</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setOrderNoteOpen(false)}
                      className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-coffee text-ivory-light hover:opacity-95 active:scale-[0.98] transition-all"
                    >
                      Hoàn tất
                    </button>
                  </div>
                </div>
              </m.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};
