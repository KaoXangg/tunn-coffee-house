import React, { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Plus,
  Search,
  Edit3,
  Trash2,
  Image as ImageIcon,
  Star,
  Eye,
  EyeOff,
  Check,
  X,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { useSiteData } from '../../contexts/SiteDataContext';
import { useToast } from '../../contexts/ToastContext';
import { formatVND, slugify } from '../../lib/utils';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { MediaPickerModal } from '../../components/common/MediaPickerModal';
import type { Product } from '../../types/database';

const productSchema = z.object({
  name: z.string().min(2, 'Tên món cần ít nhất 2 ký tự'),
  slug: z.string().min(2, 'Slug không được để trống'),
  description: z.string().min(4, 'Vui lòng nhập mô tả món'),
  image_url: z.string().min(1, 'Vui lòng chọn hoặc nhập URL hình ảnh'),
  price: z.coerce.number().min(0, 'Giá phải lớn hơn hoặc bằng 0'),
  sale_price: z
    .union([z.coerce.number().min(0), z.literal(''), z.null()])
    .optional(),
  category_id: z.string().nullable().optional(),
  badge: z.string().optional(),
  is_featured: z.boolean(),
  is_best_seller: z.boolean(),
  is_available: z.boolean(),
  is_visible: z.boolean(),
  sort_order: z.coerce.number().int(),
});

type ProductFormValues = z.infer<typeof productSchema>;

const ITEMS_PER_PAGE = 8;

export const AdminProductsPage: React.FC = () => {
  const { products, categories, refreshAll, logAdminActivity } = useSiteData();
  const toast = useToast();

  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'visible' | 'hidden' | 'featured'>('all');
  const [sortBy, setSortBy] = useState<'order' | 'price-asc' | 'price-desc' | 'name'>('order');
  const [page, setPage] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      slug: '',
      description: '',
      image_url: '',
      price: 55000,
      sale_price: '',
      category_id: categories[0]?.id || '',
      badge: '',
      is_featured: false,
      is_best_seller: false,
      is_available: true,
      is_visible: true,
      sort_order: products.length + 1,
    },
  });

  const watchedImage = form.watch('image_url');

  const openCreateModal = () => {
    setEditingProduct(null);
    form.reset({
      name: '',
      slug: '',
      description: '',
      image_url:
        'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80',
      price: 59000,
      sale_price: '',
      category_id: categories[0]?.id || '',
      badge: '',
      is_featured: false,
      is_best_seller: false,
      is_available: true,
      is_visible: true,
      sort_order: products.length + 1,
    });
    setModalOpen(true);
  };

  const openEditModal = (prod: Product) => {
    setEditingProduct(prod);
    form.reset({
      name: prod.name,
      slug: prod.slug,
      description: prod.description,
      image_url: prod.image_url,
      price: prod.price,
      sale_price: prod.sale_price ?? '',
      category_id: prod.category_id || '',
      badge: prod.badge || '',
      is_featured: prod.is_featured,
      is_best_seller: prod.is_best_seller,
      is_available: prod.is_available,
      is_visible: prod.is_visible,
      sort_order: prod.sort_order,
    });
    setModalOpen(true);
  };

  const filteredProducts = useMemo(() => {
    const q = search.toLowerCase().trim();
    const list = products.filter((p) => {
      if (filterCategory !== 'all' && p.category_id !== filterCategory) return false;
      if (filterStatus === 'visible' && !p.is_visible) return false;
      if (filterStatus === 'hidden' && p.is_visible) return false;
      if (filterStatus === 'featured' && !p.is_featured) return false;
      if (q) {
        return (
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.slug.toLowerCase().includes(q)
        );
      }
      return true;
    });

    return [...list].sort((a, b) => {
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      if (sortBy === 'name') return a.name.localeCompare(b.name, 'vi');
      return a.sort_order - b.sort_order;
    });
  }, [products, search, filterCategory, filterStatus, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / ITEMS_PER_PAGE));
  const paginatedProducts = filteredProducts.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  const onSubmit = async (values: ProductFormValues) => {
    if (!isSupabaseConfigured) {
      toast.error(
        'Chưa kết nối Supabase Database',
        'Vui lòng cấu hình VITE_SUPABASE_URL và VITE_SUPABASE_ANON_KEY trong file .env để lưu sản phẩm.'
      );
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: values.name.trim(),
        slug: values.slug.trim() || slugify(values.name),
        description: values.description.trim(),
        image_url: values.image_url.trim(),
        price: Number(values.price),
        sale_price:
          values.sale_price === '' ||
          values.sale_price === null ||
          values.sale_price === undefined ||
          Number(values.sale_price) <= 0
            ? null
            : Number(values.sale_price),
        category_id: values.category_id || null,
        badge: values.badge?.trim() || '',
        is_featured: values.is_featured,
        is_best_seller: values.is_best_seller,
        is_available: values.is_available,
        is_visible: values.is_visible,
        sort_order: Number(values.sort_order),
      };

      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update(payload)
          .eq('id', editingProduct.id);

        if (error) throw error;
        await logAdminActivity('Cập nhật sản phẩm', 'products', payload.name);
        toast.success('Đã cập nhật món', payload.name);
      } else {
        const { error } = await supabase.from('products').insert(payload);
        if (error) throw error;
        await logAdminActivity('Thêm sản phẩm mới', 'products', payload.name);
        toast.success('Đã thêm món mới', payload.name);
      }

      await refreshAll();
      setModalOpen(false);
    } catch (err: any) {
      toast.error('Lỗi lưu sản phẩm', err?.message || 'Không thể lưu vào database');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleQuickField = async (
    prod: Product,
    field: 'is_visible' | 'is_featured' | 'is_available'
  ) => {
    if (!isSupabaseConfigured) {
      toast.info('Chưa kết nối Supabase', 'Vui lòng cấu hình .env để lưu thay đổi');
      return;
    }

    const nextVal = !prod[field];
    const { error } = await supabase
      .from('products')
      .update({ [field]: nextVal })
      .eq('id', prod.id);

    if (error) {
      toast.error('Không thể cập nhật trạng thái', error.message);
    } else {
      await refreshAll();
      toast.success('Đã cập nhật trạng thái', prod.name);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    if (!isSupabaseConfigured) {
      toast.error('Chưa kết nối Supabase');
      setDeleteTarget(null);
      return;
    }

    setDeleting(true);
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', deleteTarget.id);

      if (error) throw error;
      await logAdminActivity('Xóa sản phẩm', 'products', deleteTarget.name);
      await refreshAll();
      toast.success('Đã xóa sản phẩm', deleteTarget.name);
      setDeleteTarget(null);
    } catch (err: any) {
      toast.error('Lỗi khi xóa sản phẩm', err?.message);
    } finally {
      setDeleting(false);
    }
  };

  const getCategoryName = (catId: string | null) => {
    if (!catId) return 'Chưa phân loại';
    return categories.find((c) => c.id === catId)?.name || 'Chưa phân loại';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-[#241914]">
            Quản Lý Thực Đơn & Sản Phẩm
          </h1>
          <p className="text-sm text-[#8C7565] mt-1">
            Thêm món mới, điều chỉnh giá VNĐ, hình ảnh, trạng thái còn món và đánh dấu Featured.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-semibold uppercase tracking-wider bg-[#4B2E24] text-[#F7F5EF] hover:bg-[#241914] rounded-brand transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm Món Mới</span>
        </button>
      </div>

      {/* Filters & Search Bar */}
      <div className="bg-white border border-[#D5C6AD] rounded-brand p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3.5 items-center">
        <div className="lg:col-span-5 relative">
          <Search className="w-4 h-4 text-[#8C7565] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Tìm theo tên món, mô tả hoặc slug..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-[#F7F5EF] border border-[#D5C6AD] rounded-brand focus:outline-none focus:border-[#4B2E24]"
          />
        </div>

        <div className="lg:col-span-3">
          <select
            value={filterCategory}
            onChange={(e) => {
              setFilterCategory(e.target.value);
              setPage(1);
            }}
            aria-label="Lọc theo danh mục"
            className="w-full px-3 py-2 text-xs font-medium bg-[#F7F5EF] border border-[#D5C6AD] rounded-brand"
          >
            <option value="all">Tất cả danh mục</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div className="lg:col-span-2">
          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value as any);
              setPage(1);
            }}
            aria-label="Lọc theo trạng thái"
            className="w-full px-3 py-2 text-xs font-medium bg-[#F7F5EF] border border-[#D5C6AD] rounded-brand"
          >
            <option value="all">Mọi trạng thái</option>
            <option value="visible">Đang hiển thị</option>
            <option value="hidden">Đang tạm ẩn</option>
            <option value="featured">Món nổi bật (Featured)</option>
          </select>
        </div>

        <div className="lg:col-span-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            aria-label="Sắp xếp"
            className="w-full px-3 py-2 text-xs font-medium bg-[#F7F5EF] border border-[#D5C6AD] rounded-brand"
          >
            <option value="order">Thứ tự hiển thị</option>
            <option value="price-asc">Giá tăng dần</option>
            <option value="price-desc">Giá giảm dần</option>
            <option value="name">Tên A → Z</option>
          </select>
        </div>
      </div>

      {/* Responsive Table / Mobile Cards */}
      <div className="bg-white border border-[#D5C6AD] rounded-brand overflow-hidden">
        {paginatedProducts.length === 0 ? (
          <div className="py-14 text-center">
            <p className="font-serif text-xl text-[#241914]">
              Không tìm thấy sản phẩm nào
            </p>
            <p className="text-xs text-[#8C7565] mt-1">
              Hãy thử bộ lọc khác hoặc nhấn &ldquo;Thêm Món Mới&rdquo;.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#E9E6D8] border-b border-[#D5C6AD] text-[11px] uppercase tracking-wider text-[#241914] font-semibold">
                  <th className="py-3.5 px-4">Món đồ uống</th>
                  <th className="py-3.5 px-4">Danh mục</th>
                  <th className="py-3.5 px-4">Giá bán</th>
                  <th className="py-3.5 px-4 text-center">Nổi bật</th>
                  <th className="py-3.5 px-4 text-center">Còn món</th>
                  <th className="py-3.5 px-4 text-center">Hiển thị</th>
                  <th className="py-3.5 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E9E6D8] text-sm">
                {paginatedProducts.map((prod) => (
                  <tr
                    key={prod.id}
                    className="hover:bg-[#F7F5EF]/60 transition-colors"
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3 min-w-[220px]">
                        <img
                          src={prod.image_url}
                          alt={prod.name}
                          className="w-12 h-12 rounded-brand object-cover border border-[#D5C6AD] shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="font-semibold text-[#241914] truncate">
                            {prod.name}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[11px] text-[#8C7565]">
                              #{prod.sort_order}
                            </span>
                            {prod.badge && (
                              <span className="px-1.5 py-0.5 text-[10px] bg-[#E9E6D8] text-[#4B2E24] rounded font-semibold">
                                {prod.badge}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-xs text-[#241914] whitespace-nowrap">
                      {getCategoryName(prod.category_id)}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-semibold text-[#4B2E24]">
                        {formatVND(prod.sale_price || prod.price)}
                      </span>
                      {prod.sale_price && prod.sale_price < prod.price && (
                        <span className="block text-[11px] text-[#8C7565] line-through">
                          {formatVND(prod.price)}
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleQuickField(prod, 'is_featured')}
                        className={`p-1.5 rounded-brand transition-colors ${
                          prod.is_featured
                            ? 'bg-amber-100 text-amber-800'
                            : 'text-[#8C7565] hover:bg-[#E9E6D8]'
                        }`}
                        title="Bật/Tắt món nổi bật"
                      >
                        <Star
                          className={`w-4 h-4 ${prod.is_featured ? 'fill-amber-600' : ''}`}
                        />
                      </button>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleQuickField(prod, 'is_available')}
                        className={`px-2.5 py-1 text-[10px] uppercase tracking-wider font-semibold rounded-brand ${
                          prod.is_available
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-red-50 text-red-800 border border-red-200'
                        }`}
                      >
                        {prod.is_available ? 'Còn món' : 'Hết món'}
                      </button>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleQuickField(prod, 'is_visible')}
                        className={`p-1.5 rounded-brand ${
                          prod.is_visible
                            ? 'text-emerald-700 hover:bg-emerald-50'
                            : 'text-[#8C7565] hover:bg-stone-100'
                        }`}
                        title="Hiện / Ẩn trên website"
                      >
                        {prod.is_visible ? (
                          <Eye className="w-4 h-4" />
                        ) : (
                          <EyeOff className="w-4 h-4" />
                        )}
                      </button>
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEditModal(prod)}
                          className="p-2 text-[#4B2E24] hover:bg-[#E9E6D8] rounded-brand transition-colors"
                          title="Chỉnh sửa"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(prod)}
                          className="p-2 text-red-700 hover:bg-red-50 rounded-brand transition-colors"
                          title="Xóa món"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 bg-[#F7F5EF] border-t border-[#D5C6AD] flex items-center justify-between text-xs">
            <span className="text-[#8C7565]">
              Trang {page} / {totalPages} ({filteredProducts.length} món)
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-1.5 border border-[#D5C6AD] bg-white rounded-brand disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 border border-[#D5C6AD] bg-white rounded-brand disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <div
            onClick={() => setModalOpen(false)}
            className="fixed inset-0 bg-[#241914]/60 backdrop-blur-[2px]"
          />
          <div className="relative z-10 w-full max-w-2xl bg-[#F7F5EF] border border-[#D5C6AD] rounded-brand shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 bg-[#E9E6D8] border-b border-[#D5C6AD] flex items-center justify-between">
              <h3 className="font-serif text-xl font-semibold text-[#241914]">
                {editingProduct ? `Chỉnh sửa: ${editingProduct.name}` : 'Thêm Món Đồ Uống Mới'}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1 text-[#8C7565] hover:text-[#241914]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="p-6 overflow-y-auto space-y-5 flex-1"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#241914] mb-1.5">
                    Tên món đồ uống *
                  </label>
                  <input
                    type="text"
                    {...form.register('name', {
                      onChange: (e) => {
                        if (!editingProduct) {
                          form.setValue('slug', slugify(e.target.value));
                        }
                      },
                    })}
                    placeholder="VD: Ô Long Nướng Kem Phô Mai"
                    className="w-full px-3.5 py-2 text-sm bg-white border border-[#D5C6AD] rounded-brand"
                  />
                  {form.formState.errors.name && (
                    <p className="text-xs text-red-700 mt-1">
                      {form.formState.errors.name.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#241914] mb-1.5">
                    Đường dẫn Slug *
                  </label>
                  <input
                    type="text"
                    {...form.register('slug')}
                    placeholder="o-long-nuong-kem-pho-mai"
                    className="w-full px-3.5 py-2 text-sm bg-white border border-[#D5C6AD] rounded-brand font-mono"
                  />
                </div>
              </div>

              {/* Category, Badge, Sort Order */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#241914] mb-1.5">
                    Danh mục
                  </label>
                  <select
                    {...form.register('category_id')}
                    className="w-full px-3 py-2 text-sm bg-white border border-[#D5C6AD] rounded-brand"
                  >
                    <option value="">-- Chọn danh mục --</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#241914] mb-1.5">
                    Nhãn Badge (Tùy chọn)
                  </label>
                  <input
                    type="text"
                    {...form.register('badge')}
                    placeholder="Best Seller, Signature, New..."
                    className="w-full px-3.5 py-2 text-sm bg-white border border-[#D5C6AD] rounded-brand"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#241914] mb-1.5">
                    Thứ tự sắp xếp
                  </label>
                  <input
                    type="number"
                    {...form.register('sort_order')}
                    className="w-full px-3.5 py-2 text-sm bg-white border border-[#D5C6AD] rounded-brand"
                  />
                </div>
              </div>

              {/* Prices */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#241914] mb-1.5">
                    Giá gốc (VNĐ) *
                  </label>
                  <input
                    type="number"
                    step="1000"
                    {...form.register('price')}
                    className="w-full px-3.5 py-2 text-sm bg-white border border-[#D5C6AD] rounded-brand"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#241914] mb-1.5">
                    Giá khuyến mãi (VNĐ - Để trống nếu không giảm)
                  </label>
                  <input
                    type="number"
                    step="1000"
                    {...form.register('sale_price')}
                    placeholder="VD: 59000"
                    className="w-full px-3.5 py-2 text-sm bg-white border border-[#D5C6AD] rounded-brand"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#241914] mb-1.5">
                  Mô tả hương vị & nguyên liệu *
                </label>
                <textarea
                  rows={3}
                  {...form.register('description')}
                  placeholder="Mô tả hương vị đặc trưng của thức uống..."
                  className="w-full px-3.5 py-2 text-sm bg-white border border-[#D5C6AD] rounded-brand"
                />
                {form.formState.errors.description && (
                  <p className="text-xs text-red-700 mt-1">
                    {form.formState.errors.description.message}
                  </p>
                )}
              </div>

              {/* Image Picker */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#241914] mb-1.5">
                  Hình ảnh sản phẩm *
                </label>
                <div className="flex flex-col sm:flex-row gap-3 items-start">
                  {watchedImage && (
                    <img
                      src={watchedImage}
                      alt="Preview"
                      className="w-24 h-24 rounded-brand object-cover border border-[#D5C6AD] shrink-0 bg-white"
                    />
                  )}
                  <div className="flex-1 w-full space-y-2">
                    <input
                      type="text"
                      {...form.register('image_url')}
                      placeholder="https://..."
                      className="w-full px-3.5 py-2 text-sm bg-white border border-[#D5C6AD] rounded-brand"
                    />
                    <button
                      type="button"
                      onClick={() => setMediaPickerOpen(true)}
                      className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold uppercase tracking-wider bg-[#E9E6D8] text-[#241914] hover:bg-[#D5C6AD] rounded-brand transition-colors"
                    >
                      <ImageIcon className="w-4 h-4" />
                      <span>Chọn hoặc Tải ảnh từ Media Library</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Checkboxes */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-[#D5C6AD]">
                <label className="flex items-center gap-2 text-xs font-medium text-[#241914] cursor-pointer">
                  <input
                    type="checkbox"
                    {...form.register('is_featured')}
                    className="rounded border-[#D5C6AD] text-[#4B2E24]"
                  />
                  <span>Món Nổi Bật (Featured)</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-medium text-[#241914] cursor-pointer">
                  <input
                    type="checkbox"
                    {...form.register('is_best_seller')}
                    className="rounded border-[#D5C6AD] text-[#4B2E24]"
                  />
                  <span>Best Seller</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-medium text-[#241914] cursor-pointer">
                  <input
                    type="checkbox"
                    {...form.register('is_available')}
                    className="rounded border-[#D5C6AD] text-[#4B2E24]"
                  />
                  <span>Còn món</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-medium text-[#241914] cursor-pointer">
                  <input
                    type="checkbox"
                    {...form.register('is_visible')}
                    className="rounded border-[#D5C6AD] text-[#4B2E24]"
                  />
                  <span>Hiển thị trên Web</span>
                </label>
              </div>

              <div className="pt-4 border-t border-[#D5C6AD] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider border border-[#D5C6AD] text-[#241914] rounded-brand hover:bg-[#E9E6D8]"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-semibold uppercase tracking-wider bg-[#4B2E24] text-[#F7F5EF] hover:bg-[#241914] rounded-brand disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  <span>{editingProduct ? 'Lưu Thay Đổi' : 'Tạo Sản Phẩm'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <MediaPickerModal
        open={mediaPickerOpen}
        onClose={() => setMediaPickerOpen(false)}
        onSelect={(url) => form.setValue('image_url', url, { shouldValidate: true })}
        folder="products"
        title="Chọn ảnh cho Sản phẩm"
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Xóa sản phẩm khỏi thực đơn?"
        description={`Bạn có chắc chắn muốn xóa món "${deleteTarget?.name}"? Hành động này không thể hoàn tác.`}
        confirmLabel="Xóa vĩnh viễn"
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
