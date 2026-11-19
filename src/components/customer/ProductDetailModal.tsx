import React, { useEffect, useState } from 'react';
import { X, CheckCircle2, Plus, Minus, ClipboardList, Share2, Check } from 'lucide-react';
import { AnimatePresence, m } from 'framer-motion';
import { formatVND } from '../../lib/utils';
import { trackProductView } from '../../lib/analytics';
import { useSiteData } from '../../contexts/SiteDataContext';
import type { Product } from '../../types/database';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
}) => {
  const { categories, settings } = useSiteData();
  const [noteQty, setNoteQty] = useState<number>(0);
  const [copiedProductId, setCopiedProductId] = useState<string | null>(null);

  useEffect(() => {
    if (!product) return;
    const syncQty = () => {
      try {
        const raw = localStorage.getItem('tunn_table_order_note_v1');
        const map = raw ? (JSON.parse(raw) as Record<string, number>) : {};
        setNoteQty(map[product.id] || 0);
      } catch {
        setNoteQty(0);
      }
    };
    syncQty();
    window.addEventListener('tunn-order-note-updated', syncQty);
    return () => window.removeEventListener('tunn-order-note-updated', syncQty);
  }, [product]);

  const updateModalNoteQty = (delta: number) => {
    if (!product) return;
    try {
      const raw = localStorage.getItem('tunn_table_order_note_v1');
      const map = raw ? (JSON.parse(raw) as Record<string, number>) : {};
      const nextQty = Math.max(0, (map[product.id] || 0) + delta);
      if (nextQty === 0) {
        delete map[product.id];
      } else {
        map[product.id] = nextQty;
      }
      localStorage.setItem('tunn_table_order_note_v1', JSON.stringify(map));
      setNoteQty(nextQty);
      window.dispatchEvent(new Event('tunn-order-note-updated'));
    } catch {
      // Ignore storage errors
    }
  };

  useEffect(() => {
    if (!product) return;
    trackProductView(product.id, product.name);

    // Record in Recently Viewed list (max 6 items)
    try {
      const raw = localStorage.getItem('tunn_recently_viewed_v1');
      const prevIds = raw ? (JSON.parse(raw) as string[]) : [];
      const nextIds = [product.id, ...prevIds.filter((id) => id !== product.id)].slice(0, 6);
      localStorage.setItem('tunn_recently_viewed_v1', JSON.stringify(nextIds));
      window.dispatchEvent(new Event('tunn-recently-viewed-updated'));
    } catch {
      // Ignore storage errors
    }

    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [product, onClose]);

  if (!product) return null;

  const categoryName =
    categories.find((c) => c.id === product.category_id)?.name || 'TUNN Signature';

  const hasDiscount =
    product.sale_price !== null &&
    product.sale_price !== undefined &&
    Number(product.sale_price) > 0 &&
    Number(product.sale_price) < Number(product.price);

  const shareCopied = copiedProductId === product.id;

  const handleShareProduct = async () => {
    const shareUrl = `${window.location.origin}${window.location.pathname}?product=${encodeURIComponent(
      product.slug || product.id
    )}#menu`;
    const effectivePrice = formatVND(hasDiscount ? product.sale_price : product.price);
    const shareTitle = `${product.name} — ${settings.brand_name || 'TUNN Coffee House'}`;
    const shareText = `${product.name} (${effectivePrice}) tại ${
      settings.brand_name || 'TUNN Coffee House'
    }`;

    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
        return;
      } catch {
        // Fallback to clipboard copy if user cancels or share fails
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      const targetId = product.id;
      setCopiedProductId(targetId);
      window.setTimeout(() => {
        setCopiedProductId((curr) => (curr === targetId ? null : curr));
      }, 2200);
    } catch {
      // Ignore clipboard errors
    }
  };

  return (
    <AnimatePresence>
      {product && (
        <div
          className="fixed inset-0 z-[85] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="product-modal-title"
        >
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#241914]/75"
          />
          <m.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            className="relative z-10 w-full max-w-3xl bg-ivory-light border border-coffee-beige rounded-2xl overflow-hidden shadow-2xl grid grid-cols-1 md:grid-cols-12"
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute top-3.5 right-3.5 z-20 p-2 bg-ivory-light/90 text-coffee-dark rounded-full hover:bg-ivory transition-colors"
              aria-label="Đóng"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="md:col-span-5 aspect-square md:aspect-auto bg-ivory overflow-hidden">
              <img
                src={product.image_url}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="md:col-span-7 p-6 sm:p-8 flex flex-col justify-between">
              <div>
                <div className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-coffee font-semibold border-b border-coffee-beige pb-1">
                  <span>{categoryName}</span>
                </div>

                <h3
                  id="product-modal-title"
                  className="font-serif text-2xl sm:text-3xl font-semibold text-coffee-dark mt-2.5"
                >
                  {product.name}
                </h3>

                <div className="mt-3 flex items-baseline gap-2.5">
                  <span className="font-serif text-2xl font-bold text-coffee">
                    {formatVND(hasDiscount ? product.sale_price : product.price)}
                  </span>
                  {hasDiscount && (
                    <span className="text-sm text-coffee-muted line-through">
                      {formatVND(product.price)}
                    </span>
                  )}
                </div>

                <p className="text-sm text-coffee-muted mt-4 leading-relaxed">
                  {product.description}
                </p>

                <div className="mt-5 pt-4 border-t border-coffee-beige/60 space-y-2 text-xs text-coffee-dark/80">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-coffee" />
                    <span>
                      Trạng thái:{' '}
                      <strong>
                        {product.is_available ? 'Đang phục vụ tại quán' : 'Tạm hết hôm nay'}
                      </strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-coffee" />
                    <span>Tùy chỉnh mức đường &amp; đá theo sở thích riêng</span>
                  </div>
                </div>
              </div>

              <div className="mt-7 pt-4 border-t border-coffee-beige/60 space-y-2.5">
                {product.is_available && (
                  noteQty > 0 ? (
                    <div className="flex items-center justify-between gap-3 px-4 py-2.5 bg-ivory border border-coffee-beige rounded-xl">
                      <span className="inline-flex items-center gap-2 text-xs font-semibold text-coffee-dark whitespace-nowrap">
                        <ClipboardList className="w-4 h-4 text-coffee shrink-0" />
                        <span>Đã có trong Sổ ghi món</span>
                      </span>
                      <div className="inline-flex items-center gap-1.5 bg-coffee text-ivory-light rounded-full px-2 py-0.5 text-xs font-semibold shrink-0">
                        <button
                          type="button"
                          onClick={() => updateModalNoteQty(-1)}
                          className="w-6 h-6 rounded-full inline-flex items-center justify-center hover:bg-white/15"
                          aria-label="Giảm số lượng"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="min-w-[22px] text-center tabular-nums">{noteQty}</span>
                        <button
                          type="button"
                          onClick={() => updateModalNoteQty(1)}
                          className="w-6 h-6 rounded-full inline-flex items-center justify-center hover:bg-white/15"
                          aria-label="Tăng số lượng"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => updateModalNoteQty(1)}
                      className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 text-xs font-semibold bg-coffee text-ivory-light hover:opacity-95 transition-opacity rounded-xl"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Thêm vào Sổ ghi món tại bàn</span>
                    </button>
                  )
                )}
                <div className="flex flex-col sm:flex-row items-stretch gap-2.5">
                  <button
                    type="button"
                    onClick={handleShareProduct}
                    className="sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-medium border border-coffee-beige text-coffee-dark hover:bg-ivory transition-colors rounded-xl whitespace-nowrap"
                  >
                    {shareCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                          Đã chép link món
                        </span>
                      </>
                    ) : (
                      <>
                        <Share2 className="w-3.5 h-3.5 text-coffee shrink-0" />
                        <span>Chia sẻ món này</span>
                      </>
                    )}
                  </button>
                  <a
                    href="#contact"
                    onClick={onClose}
                    className="flex-1 inline-flex items-center justify-center px-4 py-2.5 text-xs font-medium border border-coffee-beige text-coffee-dark hover:bg-ivory transition-colors rounded-xl whitespace-nowrap"
                  >
                    {settings.hotline ? `Liên hệ quán · ${settings.hotline}` : 'Xem địa chỉ & giờ mở cửa'}
                  </a>
                </div>
              </div>
            </div>
          </m.div>
        </div>
      )}
    </AnimatePresence>
  );
};
