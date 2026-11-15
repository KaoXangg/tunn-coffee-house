import React from 'react';
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
} from 'lucide-react';
import { useSiteData } from '../../contexts/SiteDataContext';
import { formatVND, formatDateVi } from '../../lib/utils';

export const AdminDashboardPage: React.FC = () => {
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
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-[#4B2E24]" />
            <h2 className="font-serif text-xl font-semibold text-[#241914]">
              Hoạt Động Gần Đây
            </h2>
          </div>

          {activityLogs.length === 0 ? (
            <div className="py-10 text-center border border-dashed border-[#D5C6AD] rounded-brand bg-[#F7F5EF]/50 p-4">
              <p className="text-sm font-medium text-[#241914]">
                Chưa có nhật ký chỉnh sửa mới
              </p>
              <p className="text-xs text-[#8C7565] mt-1">
                Mọi thao tác thêm, sửa, xóa sản phẩm hoặc cập nhật giao diện sẽ được ghi lại tại đây.
              </p>
            </div>
          ) : (
            <div className="space-y-3.5 max-h-80 overflow-y-auto pr-1">
              {activityLogs.map((log) => (
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
    </div>
  );
};
