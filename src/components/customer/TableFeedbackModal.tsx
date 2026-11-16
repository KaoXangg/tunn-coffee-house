import React, { useState, useEffect } from 'react';
import { Star, X, Send, CheckCircle2, MessageSquareHeart, AlertCircle } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { submitTableFeedback, validateGmailFormat } from '../../lib/feedback';
import { useToast } from '../../contexts/ToastContext';

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error, record } = await submitTableFeedback({
      tableNumber,
      customerName,
      customerEmail,
      honeypot,
      rating,
      tags: selectedTags,
      comment,
    });
    setSubmitting(false);

    if (error) {
      toast.error(error);
      return;
    }

    if (record && record.rating >= 4) {
      window.dispatchEvent(
        new CustomEvent('tunn:review-submitted', { detail: record })
      );
    }

    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setCustomerName('');
      setCustomerEmail('');
      setHoneypot('');
      setComment('');
      setSelectedTags([]);
      setRating(5);
      onClose();
    }, 1700);
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
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#140F0C]/75 backdrop-blur-xs"
          />

          <motion.div
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
                  {tableNumber && (
                    <p className="text-[11px] text-coffee-muted">
                      Gửi từ <strong>Bàn {tableNumber}</strong> · Không cần đăng nhập
                    </p>
                  )}
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

            {submitted ? (
              <div className="p-8 text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                <h4 className="font-serif text-2xl font-semibold">Cảm ơn bạn thật nhiều!</h4>
                <p className="text-sm text-coffee-muted leading-relaxed">
                  Góp ý của bạn đã được gửi đến đội ngũ TUNN Coffee House để phục vụ bạn ngày một tốt hơn.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-6 space-y-5">
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
                        className="p-1 transition-transform hover:scale-110 active:scale-95"
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
                          className={`px-3 py-1.5 text-xs rounded-brand border transition-colors ${
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

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 text-xs uppercase tracking-[0.18em] font-semibold bg-coffee text-ivory-light hover:bg-coffee-dark rounded-brand transition-colors disabled:opacity-60"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submitting ? 'Đang gửi...' : 'Gửi Đánh Giá'}</span>
                </button>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
