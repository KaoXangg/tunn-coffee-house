import React, { useEffect, useState, useMemo, useRef } from 'react';
import {
  Star,
  Quote,
  MessageSquarePlus,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { fetchPublicPositiveReviews, type PublicReviewRecord } from '../../lib/feedback';
import { useSiteData } from '../../contexts/SiteDataContext';
import { subscribeLiveSync } from '../../lib/liveSync';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { formatDateVi } from '../../lib/utils';

interface CustomerReviewsSectionProps {
  onOpenFeedback?: () => void;
  refreshTrigger?: number;
}

export const CustomerReviewsSection: React.FC<CustomerReviewsSectionProps> = ({
  onOpenFeedback,
  refreshTrigger = 0,
}) => {
  const { getSection } = useSiteData();
  const contactContent = (getSection('contact')?.content || {}) as Record<string, unknown>;
  const [liveReviews, setLiveReviews] = useState<PublicReviewRecord[]>([]);
  const [newlyAddedId, setNewlyAddedId] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const isPausedRef = useRef(false);
  const manualPauseUntilRef = useRef(0);
  const isDraggingRef = useRef(false);
  const dragStartXRef = useRef(0);
  const dragScrollLeftRef = useRef(0);

  useEffect(() => {
    fetchPublicPositiveReviews().then((items) => {
      setLiveReviews(items);
    });
  }, [refreshTrigger]);

  useEffect(() => {
    const unsubLocal = subscribeLiveSync((scope) => {
      if (scope === 'feedback' || scope === 'all') {
        fetchPublicPositiveReviews().then(setLiveReviews);
      }
    });

    const channel = isSupabaseConfigured
      ? supabase
          .channel('tunn-public-reviews-realtime')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'table_feedback' },
            () => {
              fetchPublicPositiveReviews().then(setLiveReviews);
            }
          )
          .subscribe()
      : null;

    return () => {
      unsubLocal();
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    const onNewReview = (event: Event) => {
      const custom = event as CustomEvent<PublicReviewRecord>;
      const rec = custom.detail;
      if (!rec || rec.rating < 4) return;
      manualPauseUntilRef.current = Date.now() + 3800;
      setLiveReviews((prev) => [rec, ...prev.filter((r) => r.id !== rec.id)]);
      setNewlyAddedId(rec.id);
      if (scrollRef.current) {
        scrollRef.current.scrollLeft = 0;
      }
      window.setTimeout(() => {
        setNewlyAddedId((curr) => (curr === rec.id ? null : curr));
      }, 6500);
    };
    window.addEventListener('tunn:review-submitted', onNewReview);
    return () => window.removeEventListener('tunn:review-submitted', onNewReview);
  }, []);

  const displayedReviews = useMemo(() => liveReviews.slice(0, 24), [liveReviews]);

  const avgScore = useMemo(() => {
    if (displayedReviews.length === 0) return '5.0';
    const sum = displayedReviews.reduce((acc, r) => acc + r.rating, 0);
    return (sum / displayedReviews.length).toFixed(1);
  }, [displayedReviews]);

  // Smooth 60fps auto-glide using delta time (prevents micro-stutter on 60Hz/120Hz screens)
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || displayedReviews.length === 0) return;

    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    let rafId = 0;
    let lastTime = performance.now();
    let carry = 0;
    const SPEED_PX_PER_SEC = 42;

    const tick = (now: number) => {
      const dt = Math.min(0.05, Math.max(0, (now - lastTime) / 1000));
      lastTime = now;

      if (
        !isPausedRef.current &&
        !isDraggingRef.current &&
        Date.now() >= manualPauseUntilRef.current &&
        el
      ) {
        carry += SPEED_PX_PER_SEC * dt;
        if (carry >= 1) {
          const step = Math.floor(carry);
          carry -= step;
          el.scrollLeft += step;
          const half = el.scrollWidth / 2;
          if (half > 0 && el.scrollLeft >= half) {
            el.scrollLeft -= half;
          }
        }
      }
      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(rafId);
  }, [displayedReviews.length]);

  const handleStepScroll = (direction: -1 | 1) => {
    const el = scrollRef.current;
    if (!el) return;
    manualPauseUntilRef.current = Date.now() + 1800;
    const step = window.innerWidth < 640 ? 306 : 360;
    const half = el.scrollWidth / 2;
    if (direction === -1 && el.scrollLeft <= 12 && half > 0) {
      el.scrollLeft = half;
    }
    el.scrollBy({ left: direction * step, behavior: 'smooth' });
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = scrollRef.current;
    if (!el) return;
    isDraggingRef.current = true;
    dragStartXRef.current = e.pageX - el.offsetLeft;
    dragScrollLeftRef.current = el.scrollLeft;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - dragStartXRef.current) * 1.25;
    scrollRef.current.scrollLeft = dragScrollLeftRef.current - walk;
  };

  const stopDragging = () => {
    isDraggingRef.current = false;
  };

  const shouldLoop = displayedReviews.length >= 2;

  return (
    <section
      id="reviews"
      className="py-16 sm:py-24 bg-ivory-light border-b border-coffee-beige/60 dark:border-b-0 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10 sm:mb-12"
        >
          <div>
            <p className="text-[11px] uppercase tracking-[0.25em] text-coffee font-semibold mb-2">
              {String(contactContent.reviews_eyebrow || 'CẢM NHẬN TỪ KHÁCH HÀNG')}
            </p>
            <h2 className="font-serif text-3xl sm:text-5xl font-normal text-coffee-dark">
              {String(contactContent.reviews_title || 'Khách Hàng Nói Gì Về TUNN')}
            </h2>
            <p className="text-sm sm:text-base text-coffee-muted mt-2.5 max-w-xl leading-relaxed">
              {String(
                contactContent.reviews_subtitle ||
                  'Những chia sẻ chân thực từ khách ghé quán là động lực để chúng tôi chăm chút từng ly trà và cà phê mỗi ngày.'
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 shrink-0">
            <div className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-ivory dark:bg-white/[0.04] border border-coffee-beige/70 dark:border-white/[0.08]">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className="w-3.5 h-3.5 fill-amber-400 text-amber-500"
                  />
                ))}
              </div>
              <span className="font-serif text-base font-bold text-coffee-dark">
                {avgScore}
              </span>
              <span className="text-xs text-coffee-muted">
                · {displayedReviews.length} đánh giá tích cực
              </span>
            </div>

            {onOpenFeedback && (
              <button
                type="button"
                onClick={onOpenFeedback}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-xs uppercase tracking-wider font-semibold bg-coffee text-ivory-light hover:bg-coffee-dark hover:-translate-y-0.5 active:scale-[0.98] transition-all touch-manipulation"
              >
                <MessageSquarePlus className="w-3.5 h-3.5" />
                <span>{String(contactContent.reviews_cta_label || 'Viết đánh giá')}</span>
              </button>
            )}

            {shouldLoop && (
              <div className="hidden sm:flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleStepScroll(-1)}
                  aria-label="Xem đánh giá trước"
                  className="w-9 h-9 rounded-full border border-coffee-beige/80 dark:border-white/[0.1] bg-ivory dark:bg-white/[0.04] text-coffee-dark hover:border-coffee hover:bg-coffee hover:text-ivory-light inline-flex items-center justify-center transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleStepScroll(1)}
                  aria-label="Xem đánh giá tiếp theo"
                  className="w-9 h-9 rounded-full border border-coffee-beige/80 dark:border-white/[0.1] bg-ivory dark:bg-white/[0.04] text-coffee-dark hover:border-coffee hover:bg-coffee hover:text-ivory-light inline-flex items-center justify-center transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </motion.div>

        {displayedReviews.length === 0 ? (
          <div className="p-10 text-center rounded-2xl bg-ivory/50 dark:bg-white/[0.03] border border-dashed border-coffee-beige/70 dark:border-white/[0.1]">
            <p className="font-serif text-xl text-coffee-dark">
              Hãy là vị khách đầu tiên chia sẻ cảm nhận về TUNN Coffee House
            </p>
            <p className="text-xs text-coffee-muted mt-1.5">
              Mỗi góp ý của bạn giúp tụi mình phục vụ tốt hơn mỗi ngày.
            </p>
          </div>
        ) : (
          /* Interactive Auto-Gliding Reviews Track (Supports Touch Swipe + Mouse Drag) */
          <div
            ref={scrollRef}
            onMouseEnter={() => {
              isPausedRef.current = true;
            }}
            onMouseLeave={() => {
              isPausedRef.current = false;
              stopDragging();
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={stopDragging}
            onTouchStart={() => {
              isPausedRef.current = true;
            }}
            onTouchEnd={() => {
              window.setTimeout(() => {
                isPausedRef.current = false;
              }, 1200);
            }}
            className="-mx-4 px-4 sm:mx-0 sm:px-0 py-3 overflow-x-auto no-scrollbar cursor-grab active:cursor-grabbing select-none"
          >
            <div className="flex items-stretch w-max">
              {(shouldLoop ? [0, 1] : [0]).map((dupIndex) => (
                <div
                  key={dupIndex}
                  aria-hidden={dupIndex === 1}
                  className="flex items-stretch gap-4 sm:gap-5 pr-4 sm:pr-5 shrink-0"
                >
                  {displayedReviews.map((rev) => {
                    const isJustAdded = rev.id === newlyAddedId;
                    return (
                      <motion.article
                        key={`${dupIndex}-${rev.id}`}
                        initial={
                          isJustAdded
                            ? { opacity: 0, scale: 0.8, y: -22 }
                            : false
                        }
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
                        className={`w-[290px] sm:w-[340px] shrink-0 p-6 rounded-2xl border shadow-sm hover:-translate-y-1 transition-transform duration-300 flex flex-col justify-between gap-4 ${
                          isJustAdded
                            ? 'bg-ivory dark:bg-white/[0.07] border-coffee/70 shadow-editorial'
                            : 'bg-ivory/65 dark:bg-white/[0.03] border-coffee-beige/60 dark:border-white/[0.08]'
                        }`}
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-0.5">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <Star
                                  key={s}
                                  className={`w-4 h-4 ${
                                    s <= rev.rating
                                      ? 'fill-amber-400 text-amber-500'
                                      : 'text-coffee-beige'
                                  }`}
                                />
                              ))}
                            </div>
                            <Quote className="w-5 h-5 text-coffee/30" />
                          </div>

                          {rev.comment ? (
                            <p className="text-sm text-coffee-dark/90 leading-relaxed line-clamp-3 min-h-[3.75rem]">
                              &ldquo;{rev.comment}&rdquo;
                            </p>
                          ) : (
                            <p className="text-sm italic text-coffee-muted min-h-[3.75rem]">
                              Trải nghiệm tuyệt vời tại TUNN Coffee House.
                            </p>
                          )}

                          {rev.tags && rev.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {rev.tags.map((tag) => (
                                <span
                                  key={tag}
                                  className="px-2.5 py-0.5 text-[10px] font-medium rounded-full bg-coffee/10 text-coffee"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="pt-3 border-t border-coffee-beige/50 dark:border-white/[0.07] flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-full bg-coffee text-ivory-light flex items-center justify-center font-serif text-xs font-bold shrink-0">
                              {(rev.customer_name || 'K').charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-coffee-dark truncate">
                                {rev.customer_name || 'Khách TUNN'}
                              </p>
                              <p className="text-[10px] text-coffee-muted">
                                {rev.table_number
                                  ? `Bàn ${rev.table_number}`
                                  : 'Khách ghé quán'}
                              </p>
                            </div>
                          </div>
                          <div className="text-right shrink-0 leading-tight">
                            <p className="text-[10px] font-medium text-coffee-dark/75">
                              {formatDateVi(rev.created_at)}
                            </p>
                            <p className="text-[10px] text-coffee-muted mt-0.5">
                              {new Intl.DateTimeFormat('vi-VN', {
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit',
                                hour12: false,
                              }).format(new Date(rev.created_at))}
                            </p>
                          </div>
                        </div>
                      </motion.article>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
