import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Star,
  Trash2,
  RefreshCw,
  Search,
  MessageSquareText,
  ThumbsUp,
  MapPin,
  Database,
  User,
  Mail,
  ShieldCheck,
  Download,
  Reply,
  Check,
  X,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSiteData } from '../../contexts/SiteDataContext';
import { useToast } from '../../contexts/ToastContext';
import { formatDateTimeVi } from '../../lib/utils';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { subscribeLiveSync, broadcastLiveSync } from '../../lib/liveSync';
import { downloadStyledXlsx } from '../../lib/exportXlsx';
import { Skeleton } from '../../components/common/Skeleton';
import {
  fetchTableFeedback,
  deleteTableFeedback,
  type TableFeedbackRecord,
} from '../../lib/feedback';

const QUICK_REPLY_TEMPLATES = [
  'Cảm ơn bạn đã ghé TUNN Coffee House, hẹn gặp lại bạn nhé!',
  'Tụi mình rất vui vì bạn hợp vị đồ uống của quán. Chúc bạn ngày mới thật vui!',
  'TUNN đã ghi nhận góp ý của bạn để phục vụ chu đáo hơn. Cảm ơn bạn rất nhiều!',
];

export const AdminFeedbackPage: React.FC = () => {
  const { isOwnerAdmin } = useAuth();
  const { getSection, updatePageSection } = useSiteData();
  const toast = useToast();

  const contactSection = getSection('contact');
  const reviewReplies = useMemo(() => {
    const raw = contactSection?.content?.review_replies;
    return raw && typeof raw === 'object'
      ? (raw as Record<string, { text: string; updated_at: string }>)
      : {};
  }, [contactSection?.content?.review_replies]);

  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [replyDraft, setReplyDraft] = useState<string>('');
  const [savingReply, setSavingReply] = useState<boolean>(false);

  const handleSaveReply = async (feedbackId: string, textToSave: string) => {
    setSavingReply(true);
    try {
      const clean = textToSave.trim();
      const nextReplies = { ...reviewReplies };
      if (clean) {
        nextReplies[feedbackId] = {
          text: clean,
          updated_at: new Date().toISOString(),
        };
      } else {
        delete nextReplies[feedbackId];
      }

      const { error } = await updatePageSection('contact', {
        content: {
          ...(contactSection?.content || {}),
          review_replies: nextReplies,
        },
      });
      if (error) {
        toast.info('Đã lưu tạm phản hồi', error);
      } else {
        broadcastLiveSync('cms');
        toast.success(clean ? 'Đã đăng phản hồi của quán!' : 'Đã xóa phản hồi của quán.');
      }
      setReplyingId(null);
      setReplyDraft('');
    } finally {
      setSavingReply(false);
    }
  };

  const [items, setItems] = useState<TableFeedbackRecord[]>([]);
  const [source, setSource] = useState<'supabase' | 'local'>('local');
  const [loading, setLoading] = useState(true);
  const [ratingFilter, setRatingFilter] = useState<number | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadFeedback = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetchTableFeedback();
      setItems(res.items);
      setSource(res.source);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadFeedback(false);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadFeedback]);

  // Instant live sync when a customer submits feedback (same browser or across devices)
  useEffect(() => {
    const unsubLocal = subscribeLiveSync((scope) => {
      if (scope === 'feedback' || scope === 'all') {
        loadFeedback(true);
      }
    });

    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        loadFeedback(true);
      }
    };
    const onFocus = () => loadFeedback(true);

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('focus', onFocus);

    const pollTimer = isSupabaseConfigured
      ? window.setInterval(() => {
          if (document.visibilityState === 'visible') {
            loadFeedback(true);
          }
        }, 8_000)
      : null;

    const channel = isSupabaseConfigured
      ? supabase
          .channel('tunn-admin-feedback-realtime')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'table_feedback' },
            () => {
              loadFeedback(true);
            }
          )
          .subscribe()
      : null;

    return () => {
      unsubLocal();
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('focus', onFocus);
      if (pollTimer) window.clearInterval(pollTimer);
      if (channel) supabase.removeChannel(channel);
    };
  }, [loadFeedback]);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const { error } = await deleteTableFeedback(id);
      if (error) {
        toast.error(error);
        return;
      }
      setItems((prev) => prev.filter((item) => item.id !== id));
      toast.success('Đã xóa đánh giá.');
    } finally {
      setDeletingId(null);
    }
  };

  const stats = useMemo(() => {
    const total = items.length;
    const avg =
      total > 0
        ? Number((items.reduce((acc, i) => acc + i.rating, 0) / total).toFixed(1))
        : 0;
    const positiveCount = items.filter((i) => i.rating >= 4).length;
    const positiveRate = total > 0 ? Math.round((positiveCount / total) * 100) : 0;
    const uniqueTables = new Set(
      items.map((i) => i.table_number).filter((t): t is string => Boolean(t))
    ).size;

    const distribution = [5, 4, 3, 2, 1].map((star) => {
      const count = items.filter((i) => i.rating === star).length;
      const pct = total > 0 ? Math.round((count / total) * 100) : 0;
      return { star, count, pct };
    });

    return { total, avg, positiveRate, uniqueTables, distribution };
  }, [items]);

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return items.filter((item) => {
      if (ratingFilter !== 'all' && item.rating !== ratingFilter) {
        return false;
      }
      if (!q) return true;
      const tableMatch = (item.table_number || '').toLowerCase().includes(q);
      const nameMatch = (item.customer_name || '').toLowerCase().includes(q);
      const emailMatch = (item.customer_email || '').toLowerCase().includes(q);
      const commentMatch = (item.comment || '').toLowerCase().includes(q);
      const tagMatch = (item.tags || []).some((t) => t.toLowerCase().includes(q));
      return tableMatch || nameMatch || emailMatch || commentMatch || tagMatch;
    });
  }, [items, ratingFilter, searchQuery]);

  const handleExportExcel = () => {
    if (filteredItems.length === 0) {
      toast.info('Chưa có đánh giá nào để xuất');
      return;
    }

    const todayStr = new Date().toISOString().slice(0, 10);
    downloadStyledXlsx({
      filename: `danh-gia-tunn-${todayStr}.xlsx`,
      sheetName: 'Danh gia khach hang',
      title: 'TUNN Coffee House — Báo cáo Đánh giá Khách hàng',
      subtitle: `Xuất ngày ${new Date().toLocaleDateString('vi-VN')} · Tổng ${filteredItems.length} đánh giá`,
      columns: [
        { header: 'Thời gian', width: 22 },
        { header: 'Số sao', width: 10 },
        { header: 'Số bàn', width: 12 },
        { header: 'Khách hàng', width: 24 },
        { header: 'Email', width: 30 },
        { header: 'Nội dung góp ý', width: 48 },
      ],
      rows: filteredItems.map((item) => [
        formatDateTimeVi(item.created_at),
        Number(item.rating),
        item.table_number ? `Bàn ${item.table_number}` : 'Khách chung',
        item.customer_name || 'Khách ẩn danh',
        item.customer_email || '',
        item.comment || '',
      ]),
    });

    toast.success(`Đã xuất ${filteredItems.length} đánh giá ra file Excel (.xlsx)`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-coffee-dark">
            Đánh Giá Trải Nghiệm Tại Bàn
          </h1>
          <p className="text-sm text-coffee-muted mt-1">
            Theo dõi mức độ hài lòng và góp ý trực tiếp từ khách hàng khi quét QR tại quán.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium border border-coffee-beige bg-white text-coffee rounded-brand">
            <Database className="w-3.5 h-3.5 text-coffee-muted" />
            <span>{source === 'supabase' ? 'Dữ liệu Cloud' : 'Bộ nhớ cục bộ'}</span>
          </span>
          <button
            type="button"
            onClick={handleExportExcel}
            disabled={loading || filteredItems.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold border border-coffee-beige bg-white text-coffee-dark hover:bg-ivory rounded-brand transition-colors disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Xuất Excel</span>
          </button>
          <button
            type="button"
            onClick={() => loadFeedback(false)}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold uppercase tracking-wider bg-coffee text-ivory-light hover:bg-coffee-dark rounded-brand transition-colors disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-coffee-beige rounded-brand p-5">
          <div className="flex items-center justify-between text-coffee-muted mb-2">
            <span className="text-xs uppercase tracking-wider font-semibold">Điểm trung bình</span>
            <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
          </div>
          <p className="font-serif text-3xl font-bold text-coffee-dark">
            {stats.total > 0 ? `${stats.avg} / 5` : '—'}
          </p>
          <p className="text-xs text-coffee-muted mt-1">Dựa trên {stats.total} lượt đánh giá</p>
        </div>

        <div className="bg-white border border-coffee-beige rounded-brand p-5">
          <div className="flex items-center justify-between text-coffee-muted mb-2">
            <span className="text-xs uppercase tracking-wider font-semibold">Tổng góp ý</span>
            <MessageSquareText className="w-4 h-4 text-coffee" />
          </div>
          <p className="font-serif text-3xl font-bold text-coffee-dark">{stats.total}</p>
          <p className="text-xs text-coffee-muted mt-1">Tất cả đánh giá ghi nhận</p>
        </div>

        <div className="bg-white border border-coffee-beige rounded-brand p-5">
          <div className="flex items-center justify-between text-coffee-muted mb-2">
            <span className="text-xs uppercase tracking-wider font-semibold">Tỷ lệ hài lòng</span>
            <ThumbsUp className="w-4 h-4 text-emerald-700" />
          </div>
          <p className="font-serif text-3xl font-bold text-coffee-dark">
            {stats.total > 0 ? `${stats.positiveRate}%` : '—'}
          </p>
          <p className="text-xs text-coffee-muted mt-1">Đánh giá từ 4★ đến 5★</p>
        </div>

        <div className="bg-white border border-coffee-beige rounded-brand p-5">
          <div className="flex items-center justify-between text-coffee-muted mb-2">
            <span className="text-xs uppercase tracking-wider font-semibold">Số bàn phản hồi</span>
            <MapPin className="w-4 h-4 text-coffee" />
          </div>
          <p className="font-serif text-3xl font-bold text-coffee-dark">{stats.uniqueTables}</p>
          <p className="text-xs text-coffee-muted mt-1">Bàn có quét QR & gửi đánh giá</p>
        </div>
      </div>

      {/* Rating Breakdown + Filter Toolbar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white border border-coffee-beige rounded-brand p-5 space-y-2.5">
          <h2 className="font-serif text-base font-semibold text-coffee-dark mb-3">
            Phân bổ số sao
          </h2>
          {stats.distribution.map((row) => (
            <button
              key={row.star}
              type="button"
              onClick={() =>
                setRatingFilter((prev) => (prev === row.star ? 'all' : row.star))
              }
              className={`w-full flex items-center gap-3 px-2 py-1 rounded-brand transition-colors ${
                ratingFilter === row.star ? 'bg-ivory-light ring-1 ring-coffee/30' : 'hover:bg-ivory-light/60'
              }`}
            >
              <span className="w-10 text-xs font-semibold text-coffee-dark text-left">
                {row.star} ★
              </span>
              <div className="flex-1 h-2 bg-ivory rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-400 rounded-full transition-all"
                  style={{ width: `${row.pct}%` }}
                />
              </div>
              <span className="w-8 text-xs text-coffee-muted text-right">{row.count}</span>
            </button>
          ))}
        </div>

        <div className="lg:col-span-2 bg-white border border-coffee-beige rounded-brand p-5 flex flex-col justify-between gap-4">
          <div className="space-y-3">
            <h2 className="font-serif text-base font-semibold text-coffee-dark">
              Bộ lọc & Tìm kiếm
            </h2>
            <div className="relative">
              <Search className="w-4 h-4 text-coffee-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm theo tên khách, Gmail, số bàn (VD: 05), góp ý hoặc tag..."
                className="w-full pl-9 pr-4 py-2 text-sm bg-ivory-light border border-coffee-beige rounded-brand focus:outline-none focus:border-coffee"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setRatingFilter('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-brand border transition-colors ${
                ratingFilter === 'all'
                  ? 'bg-coffee text-ivory-light border-coffee'
                  : 'bg-ivory-light text-coffee border-coffee-beige hover:border-coffee'
              }`}
            >
              Tất cả ({items.length})
            </button>
            {[5, 4, 3, 2, 1].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRatingFilter(star)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-brand border transition-colors ${
                  ratingFilter === star
                    ? 'bg-coffee text-ivory-light border-coffee'
                    : 'bg-ivory-light text-coffee border-coffee-beige hover:border-coffee'
                }`}
              >
                {star} ★
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Feedback List */}
      {loading ? (
        <div className="space-y-3" aria-label="Đang tải danh sách đánh giá">
          {Array.from({ length: 5 }).map((_, idx) => (
            <div
              key={idx}
              className="bg-white border border-coffee-beige rounded-brand p-5 space-y-3"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-10 h-10 rounded-full shrink-0" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-36" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-8 w-8" />
                </div>
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
            </div>
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-white border border-dashed border-coffee-beige rounded-brand p-12 text-center">
          <Star className="w-8 h-8 text-coffee-beige mx-auto mb-2" />
          <p className="font-serif text-lg font-semibold text-coffee-dark">
            Không có đánh giá nào phù hợp
          </p>
          <p className="text-xs text-coffee-muted mt-1">
            {items.length === 0
              ? 'Khách hàng có thể bấm nút "Đánh giá" ở cạnh dưới màn hình khi xem thực đơn.'
              : 'Thử bỏ bộ lọc số sao hoặc xóa từ khóa tìm kiếm.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((fb) => (
            <div
              key={fb.id}
              className="p-5 bg-white border border-coffee-beige rounded-brand flex flex-col justify-between gap-3 shadow-sm"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-4 h-4 ${
                          s <= fb.rating
                            ? 'fill-amber-400 text-amber-500'
                            : 'text-coffee-beige'
                        }`}
                      />
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 text-[10px] font-semibold bg-coffee text-ivory-light rounded-brand">
                      {fb.table_number ? `Bàn ${fb.table_number}` : 'Khách chung'}
                    </span>
                    {isOwnerAdmin && (
                      <button
                        type="button"
                        disabled={deletingId === fb.id}
                        onClick={() => handleDelete(fb.id)}
                        className="p-1 text-coffee-muted hover:text-red-600 transition-colors disabled:opacity-50"
                        title="Xóa đánh giá"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Customer Identity & Verification */}
                <div className="mt-3 p-2.5 bg-ivory-light border border-ivory rounded-brand space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-coffee-dark truncate">
                      <User className="w-3.5 h-3.5 text-coffee shrink-0" />
                      <span className="truncate">{fb.customer_name || 'Khách ẩn danh'}</span>
                    </span>
                    {fb.email_verified_status && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-brand shrink-0">
                        <ShieldCheck className="w-3 h-3" />
                        <span>
                          {fb.email_verified_status === 'mx_verified' ? 'MX Verified' : 'Gmail hợp lệ'}
                        </span>
                      </span>
                    )}
                  </div>
                  {fb.customer_email && (
                    <p className="inline-flex items-center gap-1.5 text-[11px] text-coffee-muted truncate max-w-full">
                      <Mail className="w-3 h-3 shrink-0" />
                      <span className="truncate">{fb.customer_email}</span>
                    </p>
                  )}
                </div>

                {fb.tags && fb.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {fb.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 text-[11px] bg-ivory-light border border-coffee-beige text-coffee rounded-brand"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {fb.comment ? (
                  <p className="text-sm text-coffee-dark mt-3 leading-relaxed">
                    &ldquo;{fb.comment}&rdquo;
                  </p>
                ) : (
                  <p className="text-xs italic text-coffee-muted mt-3">
                    Không có lời nhắn kèm theo.
                  </p>
                )}

                {/* Store Reply Section */}
                <div className="mt-3 pt-2.5 border-t border-ivory">
                  {replyingId === fb.id ? (
                    <div className="space-y-2 bg-ivory-light p-2.5 rounded-brand border border-coffee-beige">
                      <textarea
                        rows={2}
                        value={replyDraft}
                        onChange={(e) => setReplyDraft(e.target.value)}
                        placeholder="Nhập lời cảm ơn hoặc phản hồi từ TUNN Coffee House..."
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-coffee-beige rounded-brand text-coffee-dark focus:outline-none focus:border-coffee"
                      />
                      <div className="flex flex-wrap gap-1">
                        {QUICK_REPLY_TEMPLATES.map((tpl, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setReplyDraft(tpl)}
                            className="px-2 py-0.5 text-[10px] bg-white border border-coffee-beige rounded text-coffee-muted hover:text-coffee-dark hover:border-coffee transition-colors text-left truncate max-w-full"
                          >
                            + Mẫu {idx + 1}: {tpl.slice(0, 34)}...
                          </button>
                        ))}
                      </div>
                      <div className="flex items-center justify-end gap-1.5 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setReplyingId(null);
                            setReplyDraft('');
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-coffee-muted hover:text-coffee-dark"
                        >
                          <X className="w-3 h-3" />
                          <span>Hủy</span>
                        </button>
                        <button
                          type="button"
                          disabled={savingReply}
                          onClick={() => handleSaveReply(fb.id, replyDraft)}
                          className="inline-flex items-center gap-1 px-3 py-1 text-[11px] font-semibold bg-coffee text-ivory-light rounded-brand hover:bg-coffee-dark disabled:opacity-50"
                        >
                          <Check className="w-3 h-3" />
                          <span>Lưu phản hồi</span>
                        </button>
                      </div>
                    </div>
                  ) : reviewReplies[fb.id]?.text ? (
                    <div className="p-2.5 bg-ivory/70 border-l-2 border-coffee rounded-r-brand space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-coffee">
                          Phản hồi từ TUNN Coffee House
                        </span>
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setReplyingId(fb.id);
                              setReplyDraft(reviewReplies[fb.id].text);
                            }}
                            className="text-[11px] font-semibold text-coffee hover:underline"
                          >
                            Sửa
                          </button>
                          <button
                            type="button"
                            disabled={savingReply}
                            onClick={() => handleSaveReply(fb.id, '')}
                            className="text-[11px] text-red-700 hover:underline"
                          >
                            Xóa
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-coffee-dark leading-relaxed">
                        {reviewReplies[fb.id].text}
                      </p>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setReplyingId(fb.id);
                        setReplyDraft(QUICK_REPLY_TEMPLATES[0]);
                      }}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-coffee hover:underline"
                    >
                      <Reply className="w-3.5 h-3.5" />
                      <span>Viết phản hồi của quán</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-ivory flex items-center justify-between text-[11px] text-coffee-muted">
                <span>{formatDateTimeVi(fb.created_at)}</span>
                <span>{fb.rating}/5 điểm</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
