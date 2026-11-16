import React, { useEffect } from 'react';
import { X, CheckCircle2 } from 'lucide-react';
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

  useEffect(() => {
    if (!product) return;
    trackProductView(product.id, product.name);
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [product, onClose]);

  if (!product) return null;

  const categoryName =
    categories.find((c) => c.id === product.category_id)?.name || 'TUNN Signature';

  const hasDiscount =
    product.sale_price !== null &&
    product.sale_price !== undefined &&
    Number(product.sale_price) > 0 &&
    Number(product.sale_price) < Number(product.price);

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
            className="relative z-10 w-full max-w-2xl bg-ivory-light border border-coffee-beige rounded-brand overflow-hidden shadow-2xl grid grid-cols-1 md:grid-cols-12"
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute top-3.5 right-3.5 z-20 p-2 bg-ivory-light/90 text-coffee-dark rounded-full hover:bg-ivory transition-colors"
              aria-label="Đóng"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="md:col-span-6 aspect-square md:aspect-auto bg-ivory overflow-hidden">
              <img
                src={product.image_url}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="md:col-span-6 p-6 sm:p-8 flex flex-col justify-between">
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

              <div className="mt-8 pt-4 border-t border-coffee-beige/60 flex items-center justify-between gap-3">
                <a
                  href="#contact"
                  onClick={onClose}
                  className="w-full text-center px-5 py-3 text-xs uppercase tracking-[0.18em] font-semibold bg-coffee text-ivory-light hover:bg-coffee-dark transition-colors rounded-brand"
                >
                  {settings.hotline ? `Đặt món · ${settings.hotline}` : 'Ghé quán thưởng thức'}
                </a>
              </div>
            </div>
          </m.div>
        </div>
      )}
    </AnimatePresence>
  );
};
