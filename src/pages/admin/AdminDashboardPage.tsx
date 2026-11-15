import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Coffee,
  FolderTree,
  Megaphone,
  Image as ImageIcon,
  Eye,
  EyeOff,
  Plus,
  Sparkles,
  Award,
  Clock,
  ArrowUpRight,
  RefreshCw,
  QrCode,
  TrendingUp,
  Star,
  Trash2,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSiteData } from '../../contexts/SiteDataContext';
import { useToast } from '../../contexts/ToastContext';
import { formatVND, formatDateVi } from '../../lib/utils';
import { fetchCustomerEvents, type CustomerEventRecord } from '../../lib/analytics';
import {
  fetchTableFeedback,
  deleteTableFeedback,
  type TableFeedbackRecord,
} from '../../lib/feedback';

export const AdminDashboardPage: React.FC = () => {
  const { user, isOwnerAdmin } = useAuth();
  const toast = useToast();
  const {
    products,
    categories,
    promotions,
    gallery,
    mediaAssets,
    activityLogs,
    loading,
    refreshAll,
  } = useSiteData();

  const [customerEvents, setCustomerEvents] = useState<CustomerEventRecord[]>([]);
  const [analyticsSource, setAnalyticsSource] = useState<'supabase' | 'local'>('local');
  const [feedbackItems, setFeedbackItems] = useState<TableFeedbackRecord[]>([]);

  useEffect(() => {
    fetchCustomerEvents().then(({ events, source }) => {
      setCustomerEvents(events);
      setAnalyticsSource(source);
    });
    fetchTableFeedback().then(({ items }) => {
      setFeedbackItems(items);
    });
  }, [loading]);

  const avgRating = useMemo(() => {
    if (feedbackItems.length === 0) return 0;
    const sum = feedbackItems.reduce((acc, item) => acc + item.rating, 0);
    return Number((sum / feedbackItems.length).toFixed(1));
  }, [feedbackItems]);

  const handleDeleteFeedback = async (id: string) => {
    const { error } = await deleteTableFeedback(id);
    if (error) {
      toast.error(error);
      return;
    }
    setFeedbackItems((prev) => prev.filter((item) => item.id !== id));
    toast.success('Đã xóa đánh giá.');
  };

  const analyticsSummary = useMemo(() => {
    const todayPrefix = new Date().toISOString().slice(0, 10);
    const todayQrScans = customerEvents.filter(
      (e) => e.event_type === 'qr_scan' && e.created_at.startsWith(todayPrefix)
    );
    const totalQrScans = customerEvents.filter((e) => e.event_type === 'qr_scan');

    const tableCounts = new Map<string, number>();
    todayQrScans.forEach((e) => {
      if (e.table_number) {
        tableCounts.set(e.table_number, (tableCounts.get(e.table_number) || 0) + 1);
      }
    });

    const productViewCounts = new Map<string, { name: string; count: number }>();
    customerEvents
      .filter((e) => e.event_type === 'product_view' && e.product_name)
      .forEach((e) => {
        const key = e.product_id || e.product_name || 'unknown';
        const prev = productViewCounts.get(key);
        productViewCounts.set(key, {
          name: e.product_name || 'Sản phẩm',
          count: (prev?.count || 0) + 1,
        });
      });

    const topProducts = Array.from(productViewCounts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      todayQrCount: todayQrScans.length,
      totalQrCount: totalQrScans.length,
      activeTablesToday: Array.from(tableCounts.entries()).sort((a, b) => b[1] - a[1]),
      totalProductViews: customerEvents.filter((e) => e.event_type === 'product_view').length,
      topProducts,
    };
  }, [customerEvents]);

  const displayedLogs = isOwnerAdmin
    ? activityLogs.filter((l) => l.entity_type !== 'session_heartbeat')
    : activityLogs.filter(
        (l) =>
          l.entity_type !== 'session_heartbeat' &&
          (l.actor_email || '').toLowerCase() === (user?.email || '').toLowerCase()
      );

  const visibleProductsCount = products.filter((p) => p.is_visible).length;
  const hiddenProductsCount = products.filter((p) => !p.is_visible).length;
  const totalImagesCount = mediaAssets.length + gallery.length;

  const stats = [
    {
      label: 'Tổng sản phẩm',
      value: products.length,
      sub: `${products.filter((p) => p.is_featured).length} món nổi bật`,
      icon: Coffee,
      to: '/admin/products',
    },
    {
      label: 'Tổng danh mục',
      value: categories.length,
      sub: `${categories.filter((c) => c.is_active).length} đang hoạt động`,
      icon: FolderTree,
      to: '/admin/categories',
    },
    {
      label: 'Tổng banner ưu đãi',
      value: promotions.length,
      sub: `${promotions.filter((p) => p.is_active).length} đang hiển thị`,
      icon: Megaphone,
      to: '/admin/promotions',
    },
    {
      label: 'Tổng hình ảnh',
      value: totalImagesCount,
      sub: `${mediaAssets.length} trong Media Library`,
      icon: ImageIcon,
      to: '/admin/media',
    },
    {
      label: 'Sản phẩm đang hiển thị',
      value: visibleProductsCount,
      sub: `${products.filter((p) => p.is_available).length} còn món`,
      icon: Eye,
      to: '/admin/products',
    },
    {
      label: 'Sản phẩm tạm ẩn',
      value: hiddenProductsCount,
      sub: `${products.filter((p) => !p.is_available).length} tạm hết món`,
      icon: EyeOff,
      to: '/admin/products',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-[#241914]">
            Tổng Quan Hệ Thống (Dashboard)
          </h1>
          <p className="text-sm text-[#8C7565] mt-1">
            Quản lý thực đơn, hình ảnh, thương hiệu và nội dung trang chủ TUNN Coffee House.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => refreshAll()}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider border border-[#D5C6AD] bg-white text-[#241914] hover:bg-[#E9E6D8] rounded-brand transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Đồng bộ dữ liệu</span>
          </button>
          <Link
            to="/admin/products"
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider bg-[#4B2E24] text-[#F7F5EF] hover:bg-[#241914] rounded-brand transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm món mới</span>
          </Link>
        </div>
      </div>

      {/* Statistics Cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-28 bg-white border border-[#D5C6AD] rounded-brand p-5 animate-pulse"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <Link
                key={idx}
                to={stat.to}
                className="group bg-white border border-[#D5C6AD] hover:border-[#4B2E24] rounded-brand p-5 transition-all shadow-xs flex items-start justify-between"
              >
                <div>
                  <p className="text-xs uppercase tracking-wider text-[#8C7565] font-semibold">
                    {stat.label}
                  </p>
                  <p className="font-serif text-4xl font-bold text-[#241914] mt-2">
                    {stat.value}
                  </p>
                  <p className="text-xs text-[#8C7565] mt-1">{stat.sub}</p>
                </div>
                <div className="w-11 h-11 rounded-brand bg-[#E9E6D8] text-[#4B2E24] group-hover:bg-[#4B2E24] group-hover:text-[#F7F5EF] flex items-center justify-center transition-colors">
                  <Icon className="w-5 h-5" />
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white border border-[#D5C6AD] rounded-brand p-6">
        <h2 className="font-serif text-xl font-semibold text-[#241914] mb-4">
          Thao Tác Nhanh (Quick Actions)
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <Link
            to="/admin/products"
            className="flex items-center justify-between p-4 border border-[#D5C6AD] rounded-brand hover:bg-[#E9E6D8]/40 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Coffee className="w-5 h-5 text-[#4B2E24]" />
              <span className="text-xs font-semibold uppercase tracking-wider">
                Quản lý Thực đơn
              </span>
            </div>
            <ArrowUpRight className="w-4 h-4 text-[#8C7565]" />
          </Link>

          <Link
            to="/admin/media"
            className="flex items-center justify-between p-4 border border-[#D5C6AD] rounded-brand hover:bg-[#E9E6D8]/40 transition-colors"
          >
            <div className="flex items-center gap-3">
              <ImageIcon className="w-5 h-5 text-[#4B2E24]" />
              <span className="text-xs font-semibold uppercase tracking-wider">
                Upload Hình ảnh
              </span>
            </div>
            <ArrowUpRight className="w-4 h-4 text-[#8C7565]" />
          </Link>

          {isOwnerAdmin ? (
            <>
              <Link
                to="/admin/sections/hero"
                className="flex items-center justify-between p-4 border border-[#D5C6AD] rounded-brand hover:bg-[#E9E6D8]/40 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-[#4B2E24]" />
                  <span className="text-xs font-semibold uppercase tracking-wider">
                    Chỉnh sửa Hero Banner
                  </span>
                </div>
                <ArrowUpRight className="w-4 h-4 text-[#8C7565]" />
              </Link>

              <Link
                to="/admin/brand"
                className="flex items-center justify-between p-4 border border-[#D5C6AD] rounded-brand hover:bg-[#E9E6D8]/40 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Award className="w-5 h-5 text-[#4B2E24]" />
                  <span className="text-xs font-semibold uppercase tracking-wider">
                    Đổi Logo & Thương hiệu
                  </span>
                </div>
                <ArrowUpRight className="w-4 h-4 text-[#8C7565]" />
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/admin/categories"
                className="flex items-center justify-between p-4 border border-[#D5C6AD] rounded-brand hover:bg-[#E9E6D8]/40 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <FolderTree className="w-5 h-5 text-[#4B2E24]" />
                  <span className="text-xs font-semibold uppercase tracking-wider">
                    Quản lý Danh mục
                  </span>
                </div>
                <ArrowUpRight className="w-4 h-4 text-[#8C7565]" />
              </Link>

              <Link
                to="/admin/promotions"
                className="flex items-center justify-between p-4 border border-[#D5C6AD] rounded-brand hover:bg-[#E9E6D8]/40 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Megaphone className="w-5 h-5 text-[#4B2E24]" />
                  <span className="text-xs font-semibold uppercase tracking-wider">
                    Quản lý Khuyến mãi
                  </span>
                </div>
                <ArrowUpRight className="w-4 h-4 text-[#8C7565]" />
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Customer Interest & QR Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white border border-[#D5C6AD] rounded-brand p-6">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#4B2E24]" />
              <h2 className="font-serif text-xl font-semibold text-[#241914]">
                Món Được Khách Xem Nhiều Nhất
              </h2>
            </div>
            <span className="text-[11px] font-medium text-[#8C7565]">
              {analyticsSummary.totalProductViews} lượt xem ·{' '}
              {analyticsSource === 'supabase' ? 'Đồng bộ máy chủ' : 'Trình duyệt hiện tại'}
            </span>
          </div>

          {analyticsSummary.topProducts.length === 0 ? (
            <div className="py-8 text-center border border-dashed border-[#D5C6AD] rounded-brand bg-[#F7F5EF]/50 p-4">
              <p className="text-sm font-medium text-[#241914]">
                Chưa ghi nhận lượt xem chi tiết món nào
              </p>
              <p className="text-xs text-[#8C7565] mt-1">
                Khi khách hàng nhấn xem chi tiết thức uống trên trang chủ, bảng xếp hạng sẽ tự động cập nhật tại đây.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {analyticsSummary.topProducts.map((item, idx) => {
                const maxCount = analyticsSummary.topProducts[0]?.count || 1;
                const widthPct = Math.max(12, Math.round((item.count / maxCount) * 100));
                return (
                  <div key={item.name} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-[#241914] truncate pr-3">
                        #{idx + 1} · {item.name}
                      </span>
                      <span className="font-semibold text-[#4B2E24] shrink-0">
                        {item.count} lượt xem
                      </span>
                    </div>
                    <div className="h-2 bg-[#E9E6D8] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#4B2E24] rounded-full transition-all duration-500"
                        style={{ width: `${widthPct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="lg:col-span-5 bg-white border border-[#D5C6AD] rounded-brand p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <QrCode className="w-4 h-4 text-[#4B2E24]" />
                <h2 className="font-serif text-xl font-semibold text-[#241914]">
                  Lượt Quét Mã QR Đặt Bàn
                </h2>
              </div>
              {isOwnerAdmin && (
                <Link
                  to="/admin/settings/backup"
                  className="text-xs font-semibold uppercase tracking-wider text-[#4B2E24] hover:underline"
                >
                  Tạo mã QR →
                </Link>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-4 bg-[#F7F5EF] border border-[#D5C6AD] rounded-brand">
                <p className="text-[11px] uppercase tracking-wider text-[#8C7565] font-semibold">
                  Hôm nay
                </p>
                <p className="font-serif text-3xl font-bold text-[#241914] mt-1">
                  {analyticsSummary.todayQrCount}
                </p>
              </div>
              <div className="p-4 bg-[#F7F5EF] border border-[#D5C6AD] rounded-brand">
                <p className="text-[11px] uppercase tracking-wider text-[#8C7565] font-semibold">
                  Tổng lượt quét
                </p>
                <p className="font-serif text-3xl font-bold text-[#4B2E24] mt-1">
                  {analyticsSummary.totalQrCount}
                </p>
              </div>
            </div>

            {analyticsSummary.activeTablesToday.length > 0 ? (
              <div className="space-y-2">
                <p className="text-[11px] uppercase tracking-wider font-semibold text-[#8C7565]">
                  Bàn quét QR hôm nay:
                </p>
                <div className="flex flex-wrap gap-2">
                  {analyticsSummary.activeTablesToday.map(([table, cnt]) => (
                    <span
                      key={table}
                      className="px-2.5 py-1 text-xs font-semibold bg-[#E9E6D8] text-[#241914] rounded-brand"
                    >
                      Bàn {table}: {cnt} lượt
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-xs text-[#8C7565]">
                Chưa có lượt quét QR theo số bàn nào trong hôm nay (ví dụ: link có <code className="font-mono">?table=01</code>).
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Split: Featured Products Overview & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Products */}
        <div className="lg:col-span-7 bg-white border border-[#D5C6AD] rounded-brand p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-xl font-semibold text-[#241914]">
              Sản Phẩm Trong Thực Đơn
            </h2>
            <Link
              to="/admin/products"
              className="text-xs font-semibold uppercase tracking-wider text-[#4B2E24] hover:underline"
            >
              Xem tất cả →
            </Link>
          </div>

          {products.length === 0 ? (
            <div className="py-10 text-center text-sm text-[#8C7565]">
              Chưa có sản phẩm nào. Hãy thêm sản phẩm đầu tiên.
            </div>
          ) : (
            <div className="divide-y divide-[#E9E6D8]">
              {products.slice(0, 5).map((prod) => (
                <div
                  key={prod.id}
                  className="py-3 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={prod.image_url}
                      alt={prod.name}
                      className="w-11 h-11 rounded-brand object-cover border border-[#D5C6AD] shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#241914] truncate">
                        {prod.name}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-[#8C7565]">
                        <span>{formatVND(prod.sale_price || prod.price)}</span>
                        {prod.is_featured && (
                          <span className="px-1.5 py-0.5 text-[10px] bg-[#E9E6D8] text-[#4B2E24] rounded font-medium">
                            Featured
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-1 text-[10px] uppercase tracking-wider font-semibold rounded-brand shrink-0 ${
                      prod.is_available && prod.is_visible
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-stone-100 text-stone-600 border border-stone-200'
                    }`}
                  >
                    {prod.is_visible
                      ? prod.is_available
                        ? 'Đang bán'
                        : 'Tạm hết'
                      : 'Đang ẩn'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Admin Activity Logs */}
        <div className="lg:col-span-5 bg-white border border-[#D5C6AD] rounded-brand p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#4B2E24]" />
              <h2 className="font-serif text-xl font-semibold text-[#241914]">
                {isOwnerAdmin ? 'Hoạt Động Gần Đây' : 'Hoạt Động Của Bạn'}
              </h2>
            </div>
            {isOwnerAdmin && (
              <Link
                to="/admin/settings/security"
                className="text-xs font-semibold uppercase tracking-wider text-[#4B2E24] hover:underline"
              >
                Chi tiết →
              </Link>
            )}
          </div>

          {displayedLogs.length === 0 ? (
            <div className="py-10 text-center border border-dashed border-[#D5C6AD] rounded-brand bg-[#F7F5EF]/50 p-4">
              <p className="text-sm font-medium text-[#241914]">
                Chưa có nhật ký chỉnh sửa mới
              </p>
              <p className="text-xs text-[#8C7565] mt-1">
                Mọi thao tác thêm, sửa, xóa sản phẩm sẽ được ghi lại tại đây.
              </p>
            </div>
          ) : (
            <div className="space-y-3.5 max-h-80 overflow-y-auto pr-1">
              {displayedLogs.slice(0, 15).map((log) => (
                <div
                  key={log.id}
                  className="p-3 bg-[#F7F5EF] border border-[#D5C6AD]/70 rounded-brand text-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-[#241914]">{log.action}</span>
                    <span className="text-[10px] text-[#8C7565]">
                      {formatDateVi(log.created_at)}
                    </span>
                  </div>
                  {log.entity_name && (
                    <p className="text-[#4B2E24] mt-0.5 font-medium">
                      Đối tượng: {log.entity_name}
                    </p>
                  )}
                  {log.actor_email && (
                    <p className="text-[10px] text-[#8C7565] mt-1">
                      Bởi: {log.actor_email}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Customer Table Feedback Summary */}
      <div className="bg-white border border-[#D5C6AD] rounded-brand p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
          <div className="flex items-center gap-2.5">
            <Star className="w-5 h-5 fill-amber-400 text-amber-500" />
            <div>
              <h2 className="font-serif text-xl font-semibold text-[#241914]">
                Đánh Giá Trải Nghiệm Tại Bàn
              </h2>
              <p className="text-xs text-[#8C7565]">
                Tổng hợp góp ý nhanh từ khách hàng khi quét mã QR tại quán
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="px-4 py-2 bg-[#F7F5EF] border border-[#D5C6AD] rounded-brand text-center">
              <p className="font-serif text-xl font-bold text-[#241914]">
                {feedbackItems.length > 0 ? `${avgRating} ★` : '—'}
              </p>
              <p className="text-[10px] uppercase tracking-wider text-[#8C7565]">
                {feedbackItems.length} đánh giá
              </p>
            </div>
          </div>
        </div>

        {feedbackItems.length === 0 ? (
          <div className="py-8 text-center border border-dashed border-[#D5C6AD] rounded-brand bg-[#F7F5EF]/50 p-4">
            <p className="text-sm font-medium text-[#241914]">
              Chưa có đánh giá nào từ khách hàng
            </p>
            <p className="text-xs text-[#8C7565] mt-1">
              Khách hàng có thể bấm nút &ldquo;Đánh giá&rdquo; ở góc màn hình khi xem thực đơn.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {feedbackItems.slice(0, 9).map((fb) => (
              <div
                key={fb.id}
                className="p-4 bg-[#F7F5EF] border border-[#D5C6AD]/80 rounded-brand flex flex-col justify-between gap-3"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-3.5 h-3.5 ${
                            s <= fb.rating
                              ? 'fill-amber-400 text-amber-500'
                              : 'text-[#D5C6AD]'
                          }`}
                        />
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      {fb.table_number && (
                        <span className="px-2 py-0.5 text-[10px] font-semibold bg-[#4B2E24] text-[#F7F5EF] rounded-brand">
                          Bàn {fb.table_number}
                        </span>
                      )}
                      {isOwnerAdmin && (
                        <button
                          type="button"
                          onClick={() => handleDeleteFeedback(fb.id)}
                          className="text-[#8C7565] hover:text-red-600 transition-colors"
                          title="Xóa đánh giá"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {fb.tags && fb.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {fb.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 text-[10px] bg-white border border-[#D5C6AD] text-[#4B2E24] rounded-brand"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {fb.comment && (
                    <p className="text-xs text-[#241914] mt-2 leading-relaxed">
                      &ldquo;{fb.comment}&rdquo;
                    </p>
                  )}
                </div>

                <p className="text-[10px] text-[#8C7565]">
                  {formatDateVi(fb.created_at)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
