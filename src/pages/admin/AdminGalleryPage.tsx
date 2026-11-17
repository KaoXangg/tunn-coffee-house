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
  Eye,
  EyeOff,
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { useSiteData } from '../../contexts/SiteDataContext';
import { useToast } from '../../contexts/ToastContext';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { MediaPickerModal } from '../../components/common/MediaPickerModal';
import type { GalleryItem } from '../../types/database';

const gallerySchema = z.object({
  title: z.string().min(2, 'Vui lòng nhập tiêu đề ảnh'),
  caption: z.string().optional(),
  category: z.enum(['Đồ uống', 'Không gian', 'Thương hiệu', 'Sự kiện']),
  image_url: z.string().min(1, 'Vui lòng chọn hình ảnh'),
  aspect_ratio: z.enum(['portrait', 'landscape', 'square']),
  is_visible: z.boolean(),
  sort_order: z.coerce.number().int(),
});

type GalleryFormValues = z.infer<typeof gallerySchema>;

export const AdminGalleryPage: React.FC = () => {
  const { gallery, refreshAll, logAdminActivity } = useSiteData();
  const toast = useToast();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<GalleryItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<GalleryItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const form = useForm<GalleryFormValues>({
    resolver: zodResolver(gallerySchema),
    defaultValues: {
      title: '',
      caption: '',
      category: 'Không gian',
      image_url: '',
      aspect_ratio: 'portrait',
      is_visible: true,
      sort_order: gallery.length + 1,
    },
  });

  const watchedImage = form.watch('image_url');

  const openCreateModal = () => {
    setEditingItem(null);
    form.reset({
      title: '',
      caption: '',
      category: 'Không gian',
      image_url: '',
      aspect_ratio: 'portrait',
      is_visible: true,
      sort_order: gallery.length + 1,
    });
    setModalOpen(true);
  };

  const openEditModal = (item: GalleryItem) => {
    setEditingItem(item);
    form.reset({
      title: item.title,
      caption: item.caption || '',
      category: item.category,
      image_url: item.image_url,
      aspect_ratio: item.aspect_ratio,
      is_visible: item.is_visible,
      sort_order: item.sort_order,
    });
    setModalOpen(true);
  };

  const onSubmit = async (values: GalleryFormValues) => {
    if (!isSupabaseConfigured) {
      toast.error('Chưa kết nối Supabase Database');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: values.title.trim(),
        caption: values.caption?.trim() || '',
        category: values.category,
        image_url: values.image_url.trim(),
        aspect_ratio: values.aspect_ratio,
        is_visible: values.is_visible,
        sort_order: Number(values.sort_order),
      };

      if (editingItem) {
        const { error } = await supabase
          .from('gallery_items')
          .update(payload)
          .eq('id', editingItem.id);
        if (error) throw error;
        await logAdminActivity('Cập nhật ảnh Gallery', 'gallery_items', payload.title);
        toast.success('Đã cập nhật mục Gallery');
      } else {
        const { error } = await supabase.from('gallery_items').insert(payload);
        if (error) throw error;
        await logAdminActivity('Thêm ảnh Gallery', 'gallery_items', payload.title);
        toast.success('Đã thêm ảnh mới vào Gallery');
      }

      await refreshAll();
      setModalOpen(false);
    } catch (err: unknown) {
      toast.error('Lỗi lưu Gallery', err instanceof Error ? err.message : undefined);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleVisible = async (item: GalleryItem) => {
    if (!isSupabaseConfigured) return;
    await supabase
      .from('gallery_items')
      .update({ is_visible: !item.is_visible })
      .eq('id', item.id);
    await refreshAll();
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget || !isSupabaseConfigured) return;
    setDeleting(true);
    try {
      const { error } = await supabase
        .from('gallery_items')
        .delete()
        .eq('id', deleteTarget.id);
      if (error) throw error;
      await logAdminActivity('Xóa ảnh Gallery', 'gallery_items', deleteTarget.title);
      await refreshAll();
      toast.success('Đã xóa ảnh khỏi Gallery');
      setDeleteTarget(null);
    } catch (err: unknown) {
      toast.error('Lỗi xóa ảnh', err instanceof Error ? err.message : undefined);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-coffee-dark">
            Quản Lý Thư Viện Không Gian (Editorial Gallery)
          </h1>
          <p className="text-sm text-coffee-muted mt-1">
            Tải lên hình ảnh không gian quán, đồ uống, sự kiện và điều chỉnh tỷ lệ khung hình Masonry.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold uppercase tracking-wider bg-coffee text-ivory-light hover:bg-coffee-dark rounded-brand"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm Ảnh Vào Gallery</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {gallery.map((item) => (
          <div
            key={item.id}
            className="bg-white border border-coffee-beige rounded-brand overflow-hidden flex flex-col justify-between shadow-xs"
          >
            <div>
              <div className="aspect-[4/3] bg-ivory relative overflow-hidden border-b border-coffee-beige">
                <img
                  src={item.image_url}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 left-3 flex items-center gap-1.5">
                  <span className="px-2.5 py-0.5 text-[10px] font-semibold bg-coffee-dark/85 text-ivory-light rounded">
                    #{item.sort_order} · {item.category}
                  </span>
                  <span className="px-2 py-0.5 text-[10px] uppercase bg-white/90 text-coffee-dark rounded font-medium">
                    {item.aspect_ratio}
                  </span>
                </div>
              </div>

              <div className="p-4">
                <h3 className="font-serif text-lg font-semibold text-coffee-dark">
                  {item.title}
                </h3>
                {item.caption && (
                  <p className="text-xs text-coffee-muted mt-1 line-clamp-2">
                    {item.caption}
                  </p>
                )}
              </div>
            </div>

            <div className="px-4 py-3 bg-ivory-light border-t border-coffee-beige flex items-center justify-between">
              <button
                type="button"
                onClick={() => handleToggleVisible(item)}
                className={`inline-flex items-center gap-1 text-xs font-semibold ${
                  item.is_visible ? 'text-emerald-700' : 'text-coffee-muted'
                }`}
              >
                {item.is_visible ? (
                  <>
                    <Eye className="w-3.5 h-3.5" /> Đang hiện
                  </>
                ) : (
                  <>
                    <EyeOff className="w-3.5 h-3.5" /> Đang ẩn
                  </>
                )}
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openEditModal(item)}
                  className="p-1.5 text-coffee hover:bg-ivory rounded"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(item)}
                  className="p-1.5 text-red-700 hover:bg-red-50 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
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
                {editingItem ? 'Sửa Ảnh Gallery' : 'Thêm Ảnh Mới Vào Gallery'}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1 text-coffee-muted"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-coffee-dark mb-1.5">
                  Tiêu đề khoảnh khắc *
                </label>
                <input
                  type="text"
                  {...form.register('title')}
                  className="w-full px-3.5 py-2 text-sm bg-white border border-coffee-beige rounded-brand"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-coffee-dark mb-1.5">
                    Phân loại
                  </label>
                  <select
                    {...form.register('category')}
                    className="w-full px-3 py-2 text-sm bg-white border border-coffee-beige rounded-brand"
                  >
                    <option value="Không gian">Không gian</option>
                    <option value="Đồ uống">Đồ uống</option>
                    <option value="Thương hiệu">Thương hiệu</option>
                    <option value="Sự kiện">Sự kiện</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-coffee-dark mb-1.5">
                    Tỷ lệ khung hình
                  </label>
                  <select
                    {...form.register('aspect_ratio')}
                    className="w-full px-3 py-2 text-sm bg-white border border-coffee-beige rounded-brand"
                  >
                    <option value="portrait">Dọc (Portrait 4:5)</option>
                    <option value="landscape">Ngang (Landscape 16:11)</option>
                    <option value="square">Vuông (Square 1:1)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-coffee-dark mb-1.5">
                  Chú thích (Caption)
                </label>
                <textarea
                  rows={2}
                  {...form.register('caption')}
                  className="w-full px-3.5 py-2 text-sm bg-white border border-coffee-beige rounded-brand"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-coffee-dark mb-1.5">
                  Hình ảnh *
                </label>
                <div className="flex items-center gap-3">
                  {watchedImage && (
                    <img
                      src={watchedImage}
                      alt="Preview"
                      className="w-20 h-20 object-cover rounded-brand border border-coffee-beige"
                    />
                  )}
                  <div className="flex-1 space-y-2">
                    <input
                      type="text"
                      {...form.register('image_url')}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-coffee-beige rounded-brand"
                    />
                    <button
                      type="button"
                      onClick={() => setMediaPickerOpen(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-ivory rounded-brand"
                    >
                      <ImageIcon className="w-3.5 h-3.5" /> Chọn / Upload ảnh
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-coffee-dark mb-1">
                    Thứ tự sắp xếp
                  </label>
                  <input
                    type="number"
                    {...form.register('sort_order')}
                    className="w-full px-3 py-1.5 text-sm bg-white border border-coffee-beige rounded-brand"
                  />
                </div>
                <label className="flex items-center gap-2 text-xs font-semibold text-coffee-dark mt-6">
                  <input
                    type="checkbox"
                    {...form.register('is_visible')}
                    className="rounded border-coffee-beige"
                  />
                  <span>Hiển thị trên Website</span>
                </label>
              </div>

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
                  <span>Lưu Vào Gallery</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <MediaPickerModal
        open={mediaPickerOpen}
        onClose={() => setMediaPickerOpen(false)}
        onSelect={(url) =>
          form.setValue('image_url', url, { shouldValidate: true })
        }
        folder="gallery"
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Xóa ảnh khỏi Gallery?"
        description={`Bạn có chắc chắn muốn xóa "${deleteTarget?.title}"?`}
        confirmLabel="Xóa"
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
