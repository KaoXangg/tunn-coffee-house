import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Plus,
  Edit3,
  Trash2,
  Image as ImageIcon,
  Check,
  X,
  Loader2,
  FolderTree,
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { useSiteData } from '../../contexts/SiteDataContext';
import { useToast } from '../../contexts/ToastContext';
import { slugify } from '../../lib/utils';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { Skeleton } from '../../components/common/Skeleton';
import { MediaPickerModal } from '../../components/common/MediaPickerModal';
import type { Category } from '../../types/database';

const categorySchema = z.object({
  name: z.string().min(2, 'Tên danh mục cần ít nhất 2 ký tự'),
  slug: z.string().min(2, 'Slug không hợp lệ'),
  description: z.string().optional(),
  image_url: z.string().optional(),
  is_active: z.boolean(),
  sort_order: z.coerce.number().int(),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

export const AdminCategoriesPage: React.FC = () => {
  const { categories, products, loading, isLiveDatabase, refreshAll, logAdminActivity } =
    useSiteData();
  const showSkeleton = loading && !isLiveDatabase;
  const toast = useToast();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [saving, setSaving] = useState(false);
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState(false);

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      slug: '',
      description: '',
      image_url: '',
      is_active: true,
      sort_order: categories.length + 1,
    },
  });

  const watchedImage = form.watch('image_url');

  const openCreateModal = () => {
    setEditingCategory(null);
    form.reset({
      name: '',
      slug: '',
      description: '',
      image_url: '',
      is_active: true,
      sort_order: categories.length + 1,
    });
    setModalOpen(true);
  };

  const openEditModal = (cat: Category) => {
    setEditingCategory(cat);
    form.reset({
      name: cat.name,
      slug: cat.slug,
      description: cat.description || '',
      image_url: cat.image_url || '',
      is_active: cat.is_active,
      sort_order: cat.sort_order,
    });
    setModalOpen(true);
  };

  const onSubmit = async (values: CategoryFormValues) => {
    if (!isSupabaseConfigured) {
      toast.error('Chưa kết nối Supabase Database', 'Vui lòng cấu hình file .env');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: values.name.trim(),
        slug: values.slug.trim() || slugify(values.name),
        description: values.description?.trim() || '',
        image_url: values.image_url?.trim() || '',
        is_active: values.is_active,
        sort_order: Number(values.sort_order),
      };

      if (editingCategory) {
        const { error } = await supabase
          .from('categories')
          .update(payload)
          .eq('id', editingCategory.id);
        if (error) throw error;
        await logAdminActivity('Cập nhật danh mục', 'categories', payload.name);
        toast.success('Đã cập nhật danh mục', payload.name);
      } else {
        const { error } = await supabase.from('categories').insert(payload);
        if (error) throw error;
        await logAdminActivity('Tạo danh mục mới', 'categories', payload.name);
        toast.success('Đã tạo danh mục mới', payload.name);
      }

      await refreshAll();
      setModalOpen(false);
    } catch (err: unknown) {
      toast.error('Lỗi lưu danh mục', err instanceof Error ? err.message : undefined);
    } finally {
      setSaving(false);
    }
  };

  const handleRequestDelete = (cat: Category) => {
    const linkedProductsCount = products.filter((p) => p.category_id === cat.id).length;
    if (linkedProductsCount > 0) {
      toast.error(
        'Không thể xóa danh mục đang có sản phẩm',
        `Danh mục "${cat.name}" hiện đang chứa ${linkedProductsCount} món đồ uống. Vui lòng chuyển các món sang danh mục khác hoặc xóa sản phẩm trước.`
      );
      return;
    }
    setDeleteTarget(cat);
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
        .from('categories')
        .delete()
        .eq('id', deleteTarget.id);

      if (error) throw error;
      await logAdminActivity('Xóa danh mục', 'categories', deleteTarget.name);
      await refreshAll();
      toast.success('Đã xóa danh mục', deleteTarget.name);
      setDeleteTarget(null);
    } catch (err: unknown) {
      toast.error('Không thể xóa danh mục', err instanceof Error ? err.message : undefined);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-coffee-dark">
            Quản Lý Danh Mục Menu
          </h1>
          <p className="text-sm text-coffee-muted mt-1">
            Danh mục được đồng bộ trực tiếp với bộ lọc Thực đơn trên trang khách hàng.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold uppercase tracking-wider bg-coffee text-ivory-light hover:bg-coffee-dark rounded-brand transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm Danh Mục</span>
        </button>
      </div>

      {/* Category Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {showSkeleton
          ? Array.from({ length: 6 }).map((_, idx) => (
              <div
                key={`cat-skeleton-${idx}`}
                className="bg-white border border-coffee-beige rounded-brand overflow-hidden shadow-xs"
              >
                <Skeleton className="h-36 w-full rounded-none" />
                <div className="p-5 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <Skeleton className="h-6 w-36" />
                    <Skeleton className="h-4 w-12" />
                  </div>
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-3.5 w-full" />
                </div>
                <div className="px-5 py-3 bg-ivory-light border-t border-coffee-beige flex justify-end gap-2">
                  <Skeleton className="h-7 w-14" />
                  <Skeleton className="h-7 w-14" />
                </div>
              </div>
            ))
          : categories.map((cat) => {
          const count = products.filter((p) => p.category_id === cat.id).length;
          return (
            <div
              key={cat.id}
              className="bg-white border border-coffee-beige rounded-brand overflow-hidden flex flex-col justify-between shadow-xs"
            >
              <div>
                <div className="h-36 bg-ivory relative overflow-hidden border-b border-coffee-beige">
                  {cat.image_url ? (
                    <img
                      src={cat.image_url}
                      alt={cat.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-coffee-muted">
                      <FolderTree className="w-8 h-8 stroke-1" />
                    </div>
                  )}
                  <div className="absolute top-3 left-3 flex items-center gap-2">
                    <span className="px-2.5 py-1 text-[10px] font-semibold bg-coffee-dark/85 text-ivory-light rounded-brand">
                      Thứ tự #{cat.sort_order}
                    </span>
                    <span
                      className={`px-2.5 py-1 text-[10px] uppercase tracking-wider font-semibold rounded-brand ${
                        cat.is_active
                          ? 'bg-emerald-700 text-white'
                          : 'bg-stone-600 text-white'
                      }`}
                    >
                      {cat.is_active ? 'Đang bật' : 'Tạm ẩn'}
                    </span>
                  </div>
                </div>

                <div className="p-5">
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="font-serif text-xl font-semibold text-coffee-dark">
                      {cat.name}
                    </h3>
                    <span className="text-xs font-semibold text-coffee">
                      {count} món
                    </span>
                  </div>
                  <p className="text-xs font-mono text-coffee-muted mt-0.5">/{cat.slug}</p>
                  {cat.description && (
                    <p className="text-xs text-coffee-muted mt-2 leading-relaxed line-clamp-2">
                      {cat.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="px-5 py-3 bg-ivory-light border-t border-coffee-beige flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => openEditModal(cat)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-coffee hover:bg-ivory rounded-brand transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Sửa</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleRequestDelete(cat)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 rounded-brand transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Xóa</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <div
            onClick={() => setModalOpen(false)}
            className="fixed inset-0 bg-coffee-dark/60 backdrop-blur-[2px]"
          />
          <div className="relative z-10 w-full max-w-lg bg-ivory-light border border-coffee-beige rounded-brand shadow-2xl overflow-hidden">
            <div className="px-6 py-4 bg-ivory border-b border-coffee-beige flex items-center justify-between">
              <h3 className="font-serif text-xl font-semibold text-coffee-dark">
                {editingCategory ? `Sửa danh mục: ${editingCategory.name}` : 'Thêm Danh Mục Mới'}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1 text-coffee-muted hover:text-coffee-dark"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-coffee-dark mb-1.5">
                  Tên danh mục *
                </label>
                <input
                  type="text"
                  {...form.register('name', {
                    onChange: (e) => {
                      if (!editingCategory) {
                        form.setValue('slug', slugify(e.target.value));
                      }
                    },
                  })}
                  placeholder="VD: Trà Sữa Nguyên Lá"
                  className="w-full px-3.5 py-2 text-sm bg-white border border-coffee-beige rounded-brand"
                />
                {form.formState.errors.name && (
                  <p className="text-xs text-red-700 mt-1">
                    {form.formState.errors.name.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-coffee-dark mb-1.5">
                    Slug *
                  </label>
                  <input
                    type="text"
                    {...form.register('slug')}
                    className="w-full px-3.5 py-2 text-sm bg-white border border-coffee-beige rounded-brand font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-coffee-dark mb-1.5">
                    Thứ tự hiển thị
                  </label>
                  <input
                    type="number"
                    {...form.register('sort_order')}
                    className="w-full px-3.5 py-2 text-sm bg-white border border-coffee-beige rounded-brand"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-coffee-dark mb-1.5">
                  Mô tả ngắn
                </label>
                <textarea
                  rows={2}
                  {...form.register('description')}
                  className="w-full px-3.5 py-2 text-sm bg-white border border-coffee-beige rounded-brand"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-coffee-dark mb-1.5">
                  Ảnh đại diện danh mục
                </label>
                <div className="flex items-center gap-3">
                  {watchedImage && (
                    <img
                      src={watchedImage}
                      alt="Preview"
                      className="w-16 h-16 rounded-brand object-cover border border-coffee-beige"
                    />
                  )}
                  <div className="flex-1 space-y-2">
                    <input
                      type="text"
                      {...form.register('image_url')}
                      placeholder="https://..."
                      className="w-full px-3 py-1.5 text-sm bg-white border border-coffee-beige rounded-brand"
                    />
                    <button
                      type="button"
                      onClick={() => setMediaPickerOpen(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-ivory text-coffee-dark rounded-brand"
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>Chọn từ Media Library</span>
                    </button>
                  </div>
                </div>
              </div>

              <label className="flex items-center gap-2 text-xs font-semibold text-coffee-dark pt-2">
                <input
                  type="checkbox"
                  {...form.register('is_active')}
                  className="rounded border-coffee-beige"
                />
                <span>Kích hoạt hiển thị danh mục trên Menu</span>
              </label>

              <div className="pt-4 border-t border-coffee-beige flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold uppercase tracking-wider border border-coffee-beige rounded-brand"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold uppercase tracking-wider bg-coffee text-ivory-light rounded-brand"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  <span>Lưu Danh Mục</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <MediaPickerModal
        open={mediaPickerOpen}
        onClose={() => setMediaPickerOpen(false)}
        onSelect={(url) => form.setValue('image_url', url)}
        folder="categories"
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Xóa danh mục?"
        description={`Bạn có chắc chắn muốn xóa danh mục "${deleteTarget?.name}"?`}
        confirmLabel="Xóa danh mục"
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
