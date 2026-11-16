import React, { useEffect, useState, useMemo } from 'react';
import { Star, Quote, MessageSquarePlus, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { fetchPublicPositiveReviews, type PublicReviewRecord } from '../../lib/feedback';
import { formatDateVi } from '../../lib/utils';

interface CustomerReviewsSectionProps {
  onOpenFeedback?: () => void;
  refreshTrigger?: number;
}

const STARTER_POSITIVE_REVIEWS: PublicReviewRecord[] = [
  {
    id: 'starter-1',
    customer_name: 'Minh Anh',
    table_number: '04',
    rating: 5,
    tags: ['Đồ uống ngon', 'Không gian đẹp'],
    comment:
      'Ô Long nướng kem phô mai thơm béo vừa phải, quán yên tĩnh rất hợp ngồi làm việc và trò chuyện cuối tuần.',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'starter-2',
    customer_name: 'Gia Huy',
    table_number: '08',
    rating: 5,
    tags: ['Phục vụ chu đáo', 'Âm nhạc dễ chịu'],
    comment:
      'Cold brew cam vàng quế thanh uống rất sảng khoái, nhân viên thân thiện và lên món nhanh.',
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: 'starter-3',
    customer_name: 'Thảo Vy',
    table_number: '02',
    rating: 5,
    tags: ['Đồ uống ngon', 'Wi-Fi ổn định'],
    comment:
      'Matcha Uji đậm vị, không bị ngọt gắt. Ánh sáng và góc bàn gỗ ngồi rất thư giãn.',
    created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
  },
];

export const CustomerReviewsSection: React.FC<CustomerReviewsSectionProps> = ({
  onOpenFeedback,
  refreshTrigger = 0,
}) => {
  const [liveReviews, setLiveReviews] = useState<PublicReviewRecord[]>([]);

  useEffect(() => {
    fetchPublicPositiveReviews().then((items) => {
      setLiveReviews(items);
    });
  }, [refreshTrigger]);

  const displayedReviews = useMemo(() => {
    if (liveReviews.length >= 3) return liveReviews.slice(0, 6);
    const merged = [...liveReviews];
    for (const sample of STARTER_POSITIVE_REVIEWS) {
      if (merged.length >= 3) break;
      merged.push(sample);
    }
    return merged;
  }, [liveReviews]);

  const avgScore = useMemo(() => {
    if (displayedReviews.length === 0) return '5.0';
    const sum = displayedReviews.reduce((acc, r) => acc + r.rating, 0);
    return (sum / displayedReviews.length).toFixed(1);
  }, [displayedReviews]);

  return (
    <section
      id="reviews"
      className="py-16 sm:py-24 bg-ivory-light border-b border-coffee-beige/60 dark:border-b-0"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10 sm:mb-12">
          <div>
            <p className="text-[11px] uppercase tracking-[0.25em] text-coffee font-semibold mb-2">
              CẢM NHẬN TỪ KHÁCH HÀNG
            </p>
            <h2 className="font-serif text-3xl sm:text-5xl font-normal text-coffee-dark">
              Khách Hàng Nói Gì Về TUNN
            </h2>
            <p className="text-sm sm:text-base text-coffee-muted mt-2.5 max-w-xl leading-relaxed">
              Những chia sẻ chân thực từ khách ghé quán là động lực để chúng tôi chăm chút từng ly trà và cà phê mỗi ngày.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
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
              <span className="text-xs text-coffee-muted">Hài lòng</span>
            </div>

            {onOpenFeedback && (
              <button
                type="button"
                onClick={onOpenFeedback}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-xs uppercase tracking-wider font-semibold bg-coffee text-ivory-light hover:bg-coffee-dark hover:-translate-y-0.5 active:scale-[0.98] transition-all"
              >
                <MessageSquarePlus className="w-3.5 h-3.5" />
                <span>Viết đánh giá</span>
              </button>
            )}
          </div>
        </div>

        {/* Positive Reviews Cards */}
        <div className="flex overflow-x-auto snap-x snap-mandatory -mx-4 px-4 pb-3 gap-4 no-scrollbar md:mx-0 md:px-0 md:pb-0 md:overflow-visible md:grid md:grid-cols-3 md:gap-6">
          {displayedReviews.map((rev, idx) => (
            <motion.article
              key={rev.id}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.45, delay: (idx % 3) * 0.08 }}
              className="w-[82vw] max-w-[330px] shrink-0 snap-start md:w-auto md:max-w-none p-6 rounded-2xl bg-ivory/60 dark:bg-white/[0.03] border border-coffee-beige/60 dark:border-white/[0.08] shadow-sm hover:shadow-editorial hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between gap-4"
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
                  <p className="text-sm text-coffee-dark/90 leading-relaxed line-clamp-4">
                    &ldquo;{rev.comment}&rdquo;
                  </p>
                ) : (
                  <p className="text-sm italic text-coffee-muted">
                    Trải nghiệm tuyệt vời tại TUNN Coffee House.
                  </p>
                )}

                {rev.tags && rev.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {rev.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-semibold rounded-full bg-coffee/10 text-coffee"
                      >
                        <Sparkles className="w-2.5 h-2.5" />
                        <span>{tag}</span>
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
                      {rev.table_number ? `Bàn ${rev.table_number}` : 'Khách ghé quán'}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] text-coffee-muted shrink-0">
                  {formatDateVi(rev.created_at).split(' ')[0]}
                </span>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
};
