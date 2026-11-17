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
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSiteData } from '../../contexts/SiteDataContext';
import { formatVND, formatDateVi } from '../../lib/utils';
import { fetchCustomerEvents, type CustomerEventRecord } from '../../lib/analytics';

export const AdminDashboardPage: React.FC = () => {
  const { user, isOwnerAdmin } = useAuth();
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

  useEffect(() => {
    fetchCustomerEvents().then(({ events, source }) => {
      setCustomerEvents(events);
      setAnalyticsSource(source);
    });
  }, [loading]);

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

    const productById = new Map(products.map((p) => [p.id, p]));
    const productByName = new Map(products.map((p) => [p.name, p]));

    const syncedProductViews = customerEvents
      .filter((e) => e.event_type === 'product_view' && e.product_name)
      .map((e) => {
        const matched =
          (e.product_id ? productById.get(e.product_id) : undefined) ||
          (e.product_name ? productByName.get(e.product_name) : undefined);
        return matched ? { event: e, product: matched } : null;
      })
      .filter((entry): entry is NonNullable<typeof entry> => entry !== null);

    const productViewCounts = new Map<string, { name: string; count: number }>();
    syncedProductViews.forEach(({ product }) => {
      const prev = productViewCounts.get(product.id);
      productViewCounts.set(product.id, {
        name: product.name,
        count: (prev?.count || 0) + 1,
      });
    });

    const topProducts = Array.from(productViewCounts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const slotBuckets = [
      { key: 'morning', label: 'Sáng (06h–12h)', count: 0 },
      { key: 'noon', label: 'Trưa (12h–15h)', count: 0 },
      { key: 'afternoon', label: 'Chiều (15h–18h)', count: 0 },
      { key: 'evening', label: 'Tối (18h–24h)', count: 0 },
      { key: 'night', label: 'Khuya (00h–06h)', count: 0 },
    ];
    totalQrScans.forEach((e) => {
      const hour = new Date(e.created_at).getHours();
      if (hour >= 6 && hour < 12) slotBuckets[0].count += 1;
      else if (hour >= 12 && hour < 15) slotBuckets[1].count += 1;
      else if (hour >= 15 && hour < 18) slotBuckets[2].count += 1;
      else if (hour >= 18) slotBuckets[3].count += 1;
      else slotBuckets[4].count += 1;
    });
    const qrTimeSlots = slotBuckets.filter(
      (slot) => slot.key !== 'night' || slot.count > 0
    );
    const peakQrSlot =
      totalQrScans.length > 0
        ? [...qrTimeSlots].sort((a, b) => b.count - a.count)[0]
        : null;

    return {
      todayQrCount: todayQrScans.length,
      totalQrCount: totalQrScans.length,
      activeTablesToday: Array.from(tableCounts.entries()).sort((a, b) => b[1] - a[1]),
      qrTimeSlots,
      peakQrSlot,
      totalProductViews: syncedProductViews.length,
      topProducts,
    };
  }, [customerEvents, products]);

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
          <h1 className="font-serif text-3xl font-semibold text-coffee-dark">
            Tổng Quan Hệ Thống (Dashboard)
          </h1>
          <p className="text-sm text-coffee-muted mt-1">
            Quản lý thực đơn, hình ảnh, thương hiệu và nội dung trang chủ TUNN Coffee House.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => refreshAll()}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider border border-coffee-beige bg-white text-coffee-dark hover:bg-ivory rounded-brand transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Đồng bộ dữ liệu</span>
          </button>
          <Link
            to="/admin/products"
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider bg-coffee text-ivory-light hover:bg-coffee-dark rounded-brand transition-colors"
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
              className="h-28 bg-white border border-coffee-beige rounded-brand p-5 animate-pulse"
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
                className="group bg-white border border-coffee-beige hover:border-coffee rounded-brand p-5 transition-all shadow-xs flex items-start justify-between"
              >
                <div>
                  <p className="text-xs font-medium text-coffee-muted">
                    {stat.label}
                  </p>
                  <p className="font-serif text-4xl font-bold text-coffee-dark mt-2">
                    {stat.value}
                  </p>
                  <p className="text-xs text-coffee-muted mt-1">{stat.sub}</p>
                </div>
                <div className="w-11 h-11 rounded-brand bg-ivory text-coffee group-hover:bg-coffee group-hover:text-ivory-light flex items-center justify-center transition-colors">
                  <Icon className="w-5 h-5" />
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white border border-coffee-beige rounded-brand p-6">
        <h2 className="font-serif text-xl font-semibold text-coffee-dark mb-4">
          Thao Tác Nhanh (Quick Actions)
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <Link
            to="/admin/products"
            className="flex items-center justify-between p-4 border border-coffee-beige rounded-brand hover:bg-ivory/40 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Coffee className="w-5 h-5 text-coffee" />
              <span className="text-xs font-semibold uppercase tracking-wider">
                Quản lý Thực đơn
              </span>
            </div>
            <ArrowUpRight className="w-4 h-4 text-coffee-muted" />
          </Link>

          <Link
            to="/admin/media"
            className="flex items-center justify-between p-4 border border-coffee-beige rounded-brand hover:bg-ivory/40 transition-colors"
          >
            <div className="flex items-center gap-3">
              <ImageIcon className="w-5 h-5 text-coffee" />
              <span className="text-xs font-semibold uppercase tracking-wider">
                Upload Hình ảnh
              </span>
            </div>
            <ArrowUpRight className="w-4 h-4 text-coffee-muted" />
          </Link>

          {isOwnerAdmin ? (
            <>
              <Link
                to="/admin/sections/hero"
                className="flex items-center justify-between p-4 border border-coffee-beige rounded-brand hover:bg-ivory/40 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-coffee" />
                  <span className="text-xs font-semibold uppercase tracking-wider">
                    Chỉnh sửa Hero Banner
                  </span>
                </div>
                <ArrowUpRight className="w-4 h-4 text-coffee-muted" />
              </Link>

              <Link
                to="/admin/brand"
                className="flex items-center justify-between p-4 border border-coffee-beige rounded-brand hover:bg-ivory/40 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Award className="w-5 h-5 text-coffee" />
                  <span className="text-xs font-semibold uppercase tracking-wider">
                    Đổi Logo & Thương hiệu
                  </span>
                </div>
                <ArrowUpRight className="w-4 h-4 text-coffee-muted" />
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/admin/categories"
                className="flex items-center justify-between p-4 border border-coffee-beige rounded-brand hover:bg-ivory/40 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <FolderTree className="w-5 h-5 text-coffee" />
                  <span className="text-xs font-semibold uppercase tracking-wider">
                    Quản lý Danh mục
                  </span>
                </div>
                <ArrowUpRight className="w-4 h-4 text-coffee-muted" />
              </Link>

              <Link
                to="/admin/promotions"
                className="flex items-center justify-between p-4 border border-coffee-beige rounded-brand hover:bg-ivory/40 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Megaphone className="w-5 h-5 text-coffee" />
                  <span className="text-xs font-semibold uppercase tracking-wider">
                    Quản lý Khuyến mãi
                  </span>
                </div>
                <ArrowUpRight className="w-4 h-4 text-coffee-muted" />
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Customer Interest & QR Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white border border-coffee-beige rounded-brand p-6">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-coffee" />
              <h2 className="font-serif text-xl font-semibold text-coffee-dark">
                Món Được Khách Xem Nhiều Nhất
              </h2>
            </div>
            <span className="text-[11px] font-medium text-coffee-muted">
              {analyticsSummary.totalProductViews} lượt xem ·{' '}
              {analyticsSource === 'supabase' ? 'Đồng bộ máy chủ' : 'Trình duyệt hiện tại'}
            </span>
          </div>

          {analyticsSummary.topProducts.length === 0 ? (
            <div className="py-8 text-center border border-dashed border-coffee-beige rounded-brand bg-ivory-light/50 p-4">
              <p className="text-sm font-medium text-coffee-dark">
                Chưa ghi nhận lượt xem chi tiết món nào
              </p>
              <p className="text-xs text-coffee-muted mt-1">
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
                      <span className="font-semibold text-coffee-dark truncate pr-3">
                        #{idx + 1} · {item.name}
                      </span>
                      <span className="font-semibold text-coffee shrink-0">
                        {item.count} lượt xem
                      </span>
                    </div>
                    <div className="h-2 bg-ivory rounded-full overflow-hidden">
                      <div
                        className="h-full bg-coffee rounded-full transition-all duration-500"
                        style={{ width: `${widthPct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="lg:col-span-5 bg-white border border-coffee-beige rounded-brand p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <QrCode className="w-4 h-4 text-coffee" />
                <h2 className="font-serif text-xl font-semibold text-coffee-dark">
                  Lượt Quét Mã QR Đặt Bàn
                </h2>
              </div>
              {isOwnerAdmin && (
                <Link
                  to="/admin/settings/backup"
                  className="text-xs font-semibold uppercase tracking-wider text-coffee hover:underline"
                >
                  Tạo mã QR →
                </Link>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-4 bg-ivory-light border border-coffee-beige rounded-brand">
                <p className="text-xs font-medium text-coffee-muted">
                  Hôm nay
                </p>
                <p className="font-serif text-3xl font-bold text-coffee-dark mt-1">
                  {analyticsSummary.todayQrCount}
                </p>
              </div>
              <div className="p-4 bg-ivory-light border border-coffee-beige rounded-brand">
                <p className="text-xs font-medium text-coffee-muted">
                  Tổng lượt quét
                </p>
                <p className="font-serif text-3xl font-bold text-coffee mt-1">
                  {analyticsSummary.totalQrCount}
                </p>
              </div>
            </div>

            {analyticsSummary.activeTablesToday.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs font-medium text-coffee-muted">
                  Bàn quét QR hôm nay:
                </p>
                <div className="flex flex-wrap gap-2">
                  {analyticsSummary.activeTablesToday.map(([table, cnt]) => (
                    <span
                      key={table}
                      className="px-2.5 py-1 text-xs font-semibold bg-ivory text-coffee-dark rounded-brand"
                    >
                      Bàn {table}: {cnt} lượt
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-xs text-coffee-muted">
                Chưa có lượt quét QR theo số bàn nào trong hôm nay (ví dụ: link có <code className="font-mono">?table=01</code>).
              </p>
            )}

            <div className="mt-5 pt-4 border-t border-coffee-beige/70 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-medium text-coffee-muted">
                  Khung giờ đông khách (Tổng QR)
                </p>
                {analyticsSummary.peakQrSlot && analyticsSummary.peakQrSlot.count > 0 && (
                  <span className="text-[11px] font-semibold text-coffee">
                    Cao điểm: {analyticsSummary.peakQrSlot.label}
                  </span>
                )}
              </div>
              <div className="space-y-2">
                {analyticsSummary.qrTimeSlots.map((slot) => {
                  const maxSlot = Math.max(
                    1,
                    ...analyticsSummary.qrTimeSlots.map((s) => s.count)
                  );
                  const pct =
                    analyticsSummary.totalQrCount > 0
                      ? Math.round((slot.count / maxSlot) * 100)
                      : 0;
                  return (
                    <div key={slot.key} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-coffee-dark">{slot.label}</span>
                        <span className="text-coffee-muted font-semibold tabular-nums">
                          {slot.count} lượt
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-ivory rounded-full overflow-hidden">
                        <div
                          className="h-full bg-coffee rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Split: Featured Products Overview & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Products */}
        <div className="lg:col-span-7 bg-white border border-coffee-beige rounded-brand p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-xl font-semibold text-coffee-dark">
              Sản Phẩm Trong Thực Đơn
            </h2>
            <Link
              to="/admin/products"
              className="text-xs font-semibold uppercase tracking-wider text-coffee hover:underline"
            >
              Xem tất cả →
            </Link>
          </div>

          {products.length === 0 ? (
            <div className="py-10 text-center text-sm text-coffee-muted">
              Chưa có sản phẩm nào. Hãy thêm sản phẩm đầu tiên.
            </div>
          ) : (
            <div className="divide-y divide-ivory">
              {products.slice(0, 5).map((prod) => (
                <div
                  key={prod.id}
                  className="py-3 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={prod.image_url}
                      alt={prod.name}
                      className="w-11 h-11 rounded-brand object-cover border border-coffee-beige shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-coffee-dark truncate">
                        {prod.name}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-coffee-muted">
                        <span>{formatVND(prod.sale_price || prod.price)}</span>
                        {prod.is_featured && (
                          <span className="px-1.5 py-0.5 text-[10px] bg-ivory text-coffee rounded font-medium">
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
        <div className="lg:col-span-5 bg-white border border-coffee-beige rounded-brand p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-coffee" />
              <h2 className="font-serif text-xl font-semibold text-coffee-dark">
                {isOwnerAdmin ? 'Hoạt Động Gần Đây' : 'Hoạt Động Của Bạn'}
              </h2>
            </div>
            {isOwnerAdmin && (
              <Link
                to="/admin/settings/security"
                className="text-xs font-semibold uppercase tracking-wider text-coffee hover:underline"
              >
                Chi tiết →
              </Link>
            )}
          </div>

          {displayedLogs.length === 0 ? (
            <div className="py-10 text-center border border-dashed border-coffee-beige rounded-brand bg-ivory-light/50 p-4">
              <p className="text-sm font-medium text-coffee-dark">
                Chưa có nhật ký chỉnh sửa mới
              </p>
              <p className="text-xs text-coffee-muted mt-1">
                Mọi thao tác thêm, sửa, xóa sản phẩm sẽ được ghi lại tại đây.
              </p>
            </div>
          ) : (
            <div className="space-y-3.5 max-h-80 overflow-y-auto pr-1">
              {displayedLogs.slice(0, 15).map((log) => (
                <div
                  key={log.id}
                  className="p-3 bg-ivory-light border border-coffee-beige/70 rounded-brand text-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-coffee-dark">{log.action}</span>
                    <span className="text-[10px] text-coffee-muted">
                      {formatDateVi(log.created_at)}
                    </span>
                  </div>
                  {log.entity_name && (
                    <p className="text-coffee mt-0.5 font-medium">
                      Đối tượng: {log.entity_name}
                    </p>
                  )}
                  {log.actor_email && (
                    <p className="text-[10px] text-coffee-muted mt-1">
                      Bởi: {log.actor_email}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
