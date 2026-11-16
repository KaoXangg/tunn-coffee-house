import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Star,
  X,
  Send,
  CheckCircle2,
  MessageSquareHeart,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { AnimatePresence, m } from 'framer-motion';
import { submitTableFeedback, validateGmailFormat, type PublicReviewRecord } from '../../lib/feedback';
import { useToast } from '../../contexts/ToastContext';

const TURNSTILE_SITE_KEY = (import.meta.env.VITE_TURNSTILE_SITE_KEY || '').trim();

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          theme?: 'light' | 'dark' | 'auto';
          callback: (token: string) => void;
          'expired-callback'?: () => void;
          'error-callback'?: () => void;
        }
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
    };
  }
}

interface TableFeedbackModalProps {
  open: boolean;
  tableNumber?: string | null;
  onClose: () => void;
}

const FEEDBACK_TAGS = [
  'Đồ uống ngon',
  'Không gian đẹp',
  'Phục vụ chu đáo',
  'Âm nhạc dễ chịu',
  'Wi-Fi ổn định',
  'Giá hợp lý',
];

const RATING_LABELS: Record<number, string> = {
  1: 'Cần cải thiện nhiều',
  2: 'Chưa hài lòng',
  3: 'Tạm ổn',
  4: 'Rất hài lòng',
  5: 'Tuyệt vời!',
};

export const TableFeedbackModal: React.FC<TableFeedbackModalProps> = ({
  open,
  tableNumber,
  onClose,
}) => {
  const toast = useToast();
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [rateLimited, setRateLimited] = useState(false);
  const [countdownSec, setCountdownSec] = useState(5);
  const [turnstileToken, setTurnstileToken] = useState('');
  const turnstileContainerRef = useRef<HTMLDivElement | null>(null);
  const turnstileWidgetIdRef = useRef<string | null>(null);
  const formatCurrentTime = () => {
    const d = new Date();
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${hh}:${mm} · ${dd}/${mo}/${yyyy}`;
  };
  const [nowStr, setNowStr] = useState(formatCurrentTime);
  const pendingRecordRef = useRef<PublicReviewRecord | null>(null);
  const closeTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!open) return;
    const initTimer = window.setTimeout(() => {
      setNowStr(formatCurrentTime());
    }, 0);
    const clockTimer = window.setInterval(() => {
      setNowStr(formatCurrentTime());
    }, 15_000);
    return () => {
      window.clearTimeout(initTimer);
      window.clearInterval(clockTimer);
    };
  }, [open]);

  useEffect(() => {
    if (!submitted) return;
    const interval = window.setInterval(() => {
      setCountdownSec((prev) => (prev > 1 ? prev - 1 : 1));
    }, 1000);
    return () => window.clearInterval(interval);
  }, [submitted]);

  const finishAndRevealReview = useCallback(() => {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    const rec = pendingRecordRef.current;
    pendingRecordRef.current = null;

    setSubmitted(false);
    setRateLimited(false);
    setTurnstileToken('');
    setCustomerName('');
    setCustomerEmail('');
    setHoneypot('');
    setComment('');
    setSelectedTags([]);
    setRating(5);
    onClose();

    if (rec && rec.rating >= 4) {
      const reviewsEl = document.getElementById('reviews');
      if (reviewsEl) {
        reviewsEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      window.setTimeout(() => {
        window.dispatchEvent(
          new CustomEvent('tunn:review-submitted', { detail: rec })
        );
      }, 650);
    }
  }, [onClose]);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
    };
  }, []);

  const emailCheck = customerEmail.trim()
    ? validateGmailFormat(customerEmail)
    : null;

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  useEffect(() => {
    if (!open || submitted || !TURNSTILE_SITE_KEY) return;

    let cancelled = false;
    let rafId = 0;
    const renderWidget = () => {
      if (cancelled || !window.turnstile) return;
      if (!turnstileContainerRef.current) {
        rafId = window.requestAnimationFrame(renderWidget);
        return;
      }
      if (turnstileWidgetIdRef.current) {
        try {
          window.turnstile.remove(turnstileWidgetIdRef.current);
        } catch {
          // ignore
        }
        turnstileWidgetIdRef.current = null;
      }
      turnstileWidgetIdRef.current = window.turnstile.render(turnstileContainerRef.current, {
        sitekey: TURNSTILE_SITE_KEY,
        theme: 'light',
        callback: (token: string) => setTurnstileToken(token),
        'expired-callback': () => setTurnstileToken(''),
        'error-callback': () => setTurnstileToken(''),
      });
    };

    if (window.turnstile) {
      renderWidget();
    } else {
      const existingScript = document.querySelector<HTMLScriptElement>(
        'script[src^="https://challenges.cloudflare.com/turnstile/v0/api.js"]'
      );
      if (existingScript) {
        existingScript.addEventListener('load', renderWidget, { once: true });
      } else {
        const script = document.createElement('script');
        script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
        script.async = true;
        script.defer = true;
        script.onload = renderWidget;
        document.head.appendChild(script);
      }
    }

    return () => {
      cancelled = true;
      if (rafId) window.cancelAnimationFrame(rafId);
      if (turnstileWidgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(turnstileWidgetIdRef.current);
        } catch {
          // ignore
        }
        turnstileWidgetIdRef.current = null;
      }
    };
  }, [open, submitted]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (TURNSTILE_SITE_KEY && !turnstileToken) {
      toast.error('Vui lòng hoàn tất xác minh bảo mật trước khi gửi.');
      return;
    }

    setSubmitting(true);
    const { error, record, rateLimited: isRateLimited } = await submitTableFeedback({
      tableNumber,
      customerName,
      customerEmail,
      honeypot,
      rating,
      tags: selectedTags,
      comment,
      turnstileToken,
    });
    setSubmitting(false);

    if (error) {
      if (turnstileWidgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.reset(turnstileWidgetIdRef.current);
        } catch {
          // ignore
        }
      }
      setTurnstileToken('');
      toast.error('Gửi đánh giá thất bại', error);
      return;
    }

    pendingRecordRef.current = isRateLimited ? null : (record ?? null);
    setRateLimited(Boolean(isRateLimited));
    setCountdownSec(5);
    setSubmitted(true);
    if (isRateLimited) {
      toast.info('Bạn vừa gửi đánh giá rồi, cảm ơn bạn!');
    } else {
      toast.success('Gửi đánh giá thành công!');
    }
    closeTimerRef.current = window.setTimeout(() => {
      finishAndRevealReview();
    }, 5000);
  };

  const displayRating = hoverRating || rating;

  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="table-feedback-title"
        >
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#140F0C]/80"
          />

          <m.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 w-full max-w-md max-h-[90vh] overflow-y-auto bg-ivory-light border border-coffee-beige rounded-brand shadow-2xl text-coffee-dark"
          >
            <div className="px-6 py-4 bg-ivory border-b border-coffee-beige flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquareHeart className="w-5 h-5 text-coffee" />
                <div>
                  <h3 id="table-feedback-title" className="font-serif text-xl font-semibold">
                    Đánh Giá Trải Nghiệm
                  </h3>
                  <p className="inline-flex items-center gap-1.5 text-[11px] text-coffee-muted mt-0.5">
                    <Clock className="w-3 h-3 text-coffee" />
                    <span>{nowStr}</span>
                    {tableNumber && (
                      <>
                        <span>·</span>
                        <span>
                          <strong>Bàn {tableNumber}</strong>
                        </span>
                      </>
                    )}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-full text-coffee-muted hover:text-coffee-dark hover:bg-ivory-light transition-colors"
                aria-label="Đóng"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <AnimatePresence mode="wait">
              {submitted ? (
                <m.div
                  key="thank-you"
                  initial={{ opacity: 0, scale: 0.92, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.94, y: -10 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  className="p-8 text-center space-y-4 relative overflow-hidden"
                >
                  <m.div
                    initial={{ scale: 0, rotate: -25 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 280, damping: 18, delay: 0.08 }}
                    className="relative w-16 h-16 mx-auto rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center"
                  >
                    <CheckCircle2 className="w-9 h-9 text-emerald-600" />
                    <m.span
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: [0, 1, 0], scale: [0.6, 1.35, 1.6] }}
                      transition={{ duration: 1.6, repeat: Infinity }}
                      className="absolute inset-0 rounded-full border border-emerald-500/40"
                    />
                  </m.div>

                  <div className="space-y-2">
                    <p className="text-xs font-medium text-coffee/80">
                      TUNN Coffee House
                    </p>
                    <h4 className="font-serif text-2xl font-semibold text-coffee-dark">
                      {rateLimited
                        ? 'Bạn vừa gửi đánh giá rồi, cảm ơn bạn!'
                        : `Cảm ơn ${customerName.trim() || 'bạn'} đã ghé quán!`}
                    </h4>
                    <p className="text-sm text-coffee-muted leading-relaxed">
                      {rateLimited ? (
                        'Hệ thống đã ghi nhận đánh giá trước đó của bạn trong phút này. Chúc bạn có những phút giây thật thư giãn tại TUNN nhé.'
                      ) : (
                        <>
                          Tụi mình đã nhận được chia sẻ của bạn lúc{' '}
                          <strong className="text-coffee-dark">{nowStr}</strong>. Chúc bạn có những phút giây thật thư giãn bên ly trà và cà phê tại TUNN nhé.
                        </>
                      )}
                    </p>
                  </div>

                  {/* 5-second smooth progress bar */}
                  <div className="pt-2 space-y-2.5">
                    <div className="w-full h-1.5 bg-coffee-beige/50 rounded-full overflow-hidden">
                      <m.div
                        initial={{ scaleX: 1 }}
                        animate={{ scaleX: 0 }}
                        transition={{ duration: 5, ease: 'linear' }}
                        style={{ transformOrigin: 'left' }}
                        className="h-full bg-coffee rounded-full"
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-coffee-muted">
                      <span>Tự động đóng sau {countdownSec}s...</span>
                      <button
                        type="button"
                        onClick={finishAndRevealReview}
                        className="px-3 py-1 rounded-full bg-coffee/10 text-coffee font-semibold hover:bg-coffee hover:text-ivory-light transition-colors"
                      >
                        Xem đánh giá ngay
                      </button>
                    </div>
                  </div>
                </m.div>
              ) : (
                <m.form
                  key="feedback-form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onSubmit={handleSubmit}
                  className="p-6 space-y-5"
                >
                {/* Star Selector */}
                <div className="text-center space-y-2">
                  <div className="flex items-center justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => setRating(star)}
                        className="p-1 transition-transform hover:scale-110 active:scale-95 touch-manipulation select-none"
                        aria-label={`${star} sao`}
                      >
                        <Star
                          className={`w-8 h-8 transition-colors ${
                            star <= displayRating
                              ? 'fill-amber-400 text-amber-500'
                              : 'text-coffee-beige'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  <p className="text-xs font-semibold text-coffee">
                    {RATING_LABELS[displayRating]}
                  </p>
                </div>

                {/* Honeypot anti-bot field */}
                <input
                  type="text"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                  className="hidden"
                />

                {/* Customer Name & Verified Gmail */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="feedback-name"
                      className="block text-[11px] uppercase tracking-wider font-semibold text-coffee-muted mb-1"
                    >
                      Tên của bạn *
                    </label>
                    <input
                      id="feedback-name"
                      type="text"
                      required
                      maxLength={80}
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="VD: Minh Anh"
                      className="w-full px-3 py-2 text-sm bg-ivory/50 border border-coffee-beige rounded-brand text-coffee-dark placeholder:text-coffee-muted focus:outline-none focus:border-coffee"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="feedback-gmail"
                      className="block text-[11px] uppercase tracking-wider font-semibold text-coffee-muted mb-1"
                    >
                      Gmail *
                    </label>
                    <div className="relative">
                      <input
                        id="feedback-gmail"
                        type="email"
                        required
                        maxLength={120}
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        placeholder="tenban@gmail.com"
                        className={`w-full pl-3 py-2 text-sm bg-ivory/50 border border-coffee-beige rounded-brand text-coffee-dark placeholder:text-coffee-muted focus:outline-none focus:border-coffee ${
                          emailCheck?.valid ? 'pr-8' : 'pr-3'
                        }`}
                      />
                      {emailCheck?.valid && (
                        <CheckCircle2
                          className="w-4 h-4 text-emerald-600 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
                          aria-hidden="true"
                        />
                      )}
                    </div>
                  </div>
                </div>
                {emailCheck && !emailCheck.valid && customerEmail.includes('@') && (
                  <p className="-mt-2.5 flex items-center gap-1.5 text-[11px] text-red-600">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{emailCheck.reason}</span>
                  </p>
                )}

                {/* Quick Tags */}
                <div>
                  <p className="text-[11px] uppercase tracking-wider font-semibold text-coffee-muted mb-2">
                    Điều bạn ấn tượng (Chọn nhanh)
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {FEEDBACK_TAGS.map((tag) => {
                      const active = selectedTags.includes(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => toggleTag(tag)}
                          className={`px-3 py-1.5 text-xs rounded-brand border transition-colors touch-manipulation active:scale-95 select-none ${
                            active
                              ? 'bg-coffee text-ivory-light border-coffee font-medium'
                              : 'bg-ivory/60 text-coffee-dark border-coffee-beige hover:border-coffee'
                          }`}
                        >
                          {tag}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Short Comment */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      htmlFor="feedback-comment"
                      className="text-[11px] uppercase tracking-wider font-semibold text-coffee-muted"
                    >
                      Góp ý thêm (Tùy chọn)
                    </label>
                    <span className="text-[10px] text-coffee-muted">
                      {comment.length}/300
                    </span>
                  </div>
                  <textarea
                    id="feedback-comment"
                    rows={3}
                    maxLength={300}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Chia sẻ cảm nhận về đồ uống, không gian hoặc nhân viên..."
                    className="w-full px-3.5 py-2.5 text-sm bg-ivory/50 border border-coffee-beige rounded-brand text-coffee-dark placeholder:text-coffee-muted focus:outline-none focus:border-coffee"
                  />
                </div>

                {TURNSTILE_SITE_KEY && (
                  <div className="flex justify-center">
                    <div ref={turnstileContainerRef} />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting || (Boolean(TURNSTILE_SITE_KEY) && !turnstileToken)}
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 text-xs uppercase tracking-[0.18em] font-semibold bg-coffee text-ivory-light hover:bg-coffee-dark rounded-brand transition-colors disabled:opacity-60"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submitting ? 'Đang gửi...' : 'Gửi Đánh Giá'}</span>
                </button>
              </m.form>
            )}
            </AnimatePresence>
          </m.div>
        </div>
      )}
    </AnimatePresence>
  );
};
