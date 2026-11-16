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
  Calendar,
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { useSiteData } from '../../contexts/SiteDataContext';
import { useToast } from '../../contexts/ToastContext';
import { formatDateVi, getPromotionScheduleStatus } from '../../lib/utils';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { MediaPickerModal } from '../../components/common/MediaPickerModal';
import type { Promotion } from '../../types/database';

const promoSchema = z.object({
  title: z.string().min(2, 'Vui lòng nhập tiêu đề ưu đãi'),
  subtitle: z.string().optional(),
  description: z.string().min(4, 'Vui lòng nhập nội dung chi tiết'),
  banner_image_url: z.string().min(1, 'Vui lòng chọn ảnh banner'),
  tag: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  cta_label: z.string().min(1, 'Vui lòng nhập nhãn nút CTA'),
  cta_url: z.string().min(1, 'Vui lòng nhập đường dẫn CTA'),
  is_active: z.boolean(),
  sort_order: z.coerce.number().int(),
});

type PromoFormValues = z.infer<typeof promoSchema>;

export const AdminPromotionsPage: React.FC = () => {
  const { promotions, refreshAll, logAdminActivity } = useSiteData();
  const toast = useToast();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<Promotion | null>(null);
  const [saving, setSaving] = useState(false);
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Promotion | null>(null);
  const [deleting, setDeleting] = useState(false);

  const form = useForm<PromoFormValues>({
    resolver: zodResolver(promoSchema),
    defaultValues: {
      title: '',
      subtitle: '',
      description: '',
      banner_image_url: '',
      tag: 'Ưu đãi đặc biệt',
      start_date: '',
      end_date: '',
      cta_label: 'Khám phá ngay',
      cta_url: '#menu',
      is_active: true,
      sort_order: promotions.length + 1,
    },
  });

  const watchedBanner = form.watch('banner_image_url');

  const openCreateModal = () => {
    setEditingPromo(null);
    form.reset({
      title: '',
      subtitle: 'SEASONAL OFFER',
      description: '',
      banner_image_url:
        'https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&w=1200&q=85',
      tag: 'Ưu đãi đặc biệt',
      start_date: '',
      end_date: '',
      cta_label: 'Khám phá ngay',
      cta_url: '#menu',
      is_active: true,
      sort_order: promotions.length + 1,
    });
    setModalOpen(true);
  };

  const openEditModal = (promo: Promotion) => {
    setEditingPromo(promo);
    form.reset({
      title: promo.title,
      subtitle: promo.subtitle || '',
      description: promo.description,
      banner_image_url: promo.banner_image_url,
      tag: promo.tag || '',
      start_date: promo.start_date ? promo.start_date.slice(0, 10) : '',
      end_date: promo.end_date ? promo.end_date.slice(0, 10) : '',
      cta_label: promo.cta_label,
      cta_url: promo.cta_url,
      is_active: promo.is_active,
      sort_order: promo.sort_order,
    });
    setModalOpen(true);
  };

  const onSubmit = async (values: PromoFormValues) => {
    if (!isSupabaseConfigured) {
      toast.error('Chưa kết nối Supabase Database');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: values.title.trim(),
        subtitle: values.subtitle?.trim() || '',
        description: values.description.trim(),
        banner_image_url: values.banner_image_url.trim(),
        tag: values.tag?.trim() || 'Ưu đãi',
        start_date: values.start_date ? new Date(values.start_date).toISOString() : null,
        end_date: values.end_date ? new Date(values.end_date).toISOString() : null,
        cta_label: values.cta_label.trim(),
        cta_url: values.cta_url.trim(),
        is_active: values.is_active,
        sort_order: Number(values.sort_order),
      };

      if (editingPromo) {
        const { error } = await supabase
          .from('promotions')
          .update(payload)
          .eq('id', editingPromo.id);
        if (error) throw error;
        await logAdminActivity('Cập nhật khuyến mãi', 'promotions', payload.title);
        toast.success('Đã cập nhật chương trình khuyến mãi');
      } else {
        const { error } = await supabase.from('promotions').insert(payload);
        if (error) throw error;
        await logAdminActivity('Thêm khuyến mãi mới', 'promotions', payload.title);
        toast.success('Đã tạo chương trình khuyến mãi mới');
      }

      await refreshAll();
      setModalOpen(false);
    } catch (err: unknown) {
      toast.error('Lỗi lưu khuyến mãi', err instanceof Error ? err.message : undefined);
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget || !isSupabaseConfigured) return;
    setDeleting(true);
    try {
      const { error } = await supabase
        .from('promotions')
        .delete()
        .eq('id', deleteTarget.id);
      if (error) throw error;
      await logAdminActivity('Xóa khuyến mãi', 'promotions', deleteTarget.title);
      await refreshAll();
      toast.success('Đã xóa chương trình khuyến mãi');
      setDeleteTarget(null);
    } catch (err: unknown) {
      toast.error('Lỗi xóa khuyến mãi', err instanceof Error ? err.message : undefined);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-[#241914]">
            Quản Lý Khuyến Mãi & Banner
          </h1>
          <p className="text-sm text-[#8C7565] mt-1">
            Quản lý các chương trình ưu đãi, bộ sưu tập theo mùa và combo trên trang chủ.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold uppercase tracking-wider bg-[#4B2E24] text-[#F7F5EF] hover:bg-[#241914] rounded-brand"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm Chương Trình Mới</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {promotions.map((promo) => {
          const schedule = getPromotionScheduleStatus(promo);
          const statusMeta =
            schedule.reason === 'active'
              ? { label: 'Đang hiển thị trên Web', cls: 'bg-emerald-700 text-white' }
              : schedule.reason === 'outside_daily_window'
              ? {
                  label: `Chờ khung giờ ${schedule.dailyWindow?.start}–${schedule.dailyWindow?.end}`,
                  cls: 'bg-amber-600 text-white',
                }
              : schedule.reason === 'not_started'
              ? { label: 'Chưa tới ngày mở', cls: 'bg-sky-700 text-white' }
              : schedule.reason === 'expired'
              ? { label: 'Đã hết hạn', cls: 'bg-red-700 text-white' }
              : { label: 'Tạm dừng', cls: 'bg-stone-600 text-white' };

          return (
          <div
            key={promo.id}
            className="bg-white border border-[#D5C6AD] rounded-brand overflow-hidden flex flex-col justify-between shadow-xs"
          >
            <div>
              <div className="aspect-[16/9] bg-[#E9E6D8] relative overflow-hidden border-b border-[#D5C6AD]">
                <img
                  src={promo.banner_image_url}
                  alt={promo.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 left-3 flex items-center gap-2">
                  <span className="px-2.5 py-1 text-[10px] font-semibold bg-[#241914]/85 text-[#F7F5EF] rounded-brand">
                    #{promo.sort_order} · {promo.tag}
                  </span>
                  <span
                    className={`px-2.5 py-1 text-[10px] uppercase tracking-wider font-semibold rounded-brand ${statusMeta.cls}`}
                  >
                    {statusMeta.label}
                  </span>
                </div>
              </div>

              <div className="p-5">
                {promo.subtitle && (
                  <p className="text-[10px] uppercase tracking-widest text-[#4B2E24] font-semibold">
                    {promo.subtitle}
                  </p>
                )}
                <h3 className="font-serif text-2xl font-semibold text-[#241914] mt-1">
                  {promo.title}
                </h3>
                <p className="text-xs text-[#8C7565] mt-2 leading-relaxed">
                  {promo.description}
                </p>

                {(promo.start_date || promo.end_date) && (
                  <div className="mt-3 inline-flex items-center gap-1.5 text-xs text-[#4B2E24]">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>
                      {promo.start_date ? formatDateVi(promo.start_date) : '...'} →{' '}
                      {promo.end_date ? formatDateVi(promo.end_date) : '...'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="px-5 py-3 bg-[#F7F5EF] border-t border-[#D5C6AD] flex items-center justify-between">
              <span className="text-xs font-medium text-[#8C7565]">
                CTA: <strong>{promo.cta_label}</strong> ({promo.cta_url})
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openEditModal(promo)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-[#4B2E24] hover:bg-[#E9E6D8] rounded-brand"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Sửa
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(promo)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 rounded-brand"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Xóa
                </button>
              </div>
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
            className="fixed inset-0 bg-[#241914]/60 backdrop-blur-[2px]"
          />
          <div className="relative z-10 w-full max-w-xl bg-[#F7F5EF] border border-[#D5C6AD] rounded-brand shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 bg-[#E9E6D8] border-b border-[#D5C6AD] flex items-center justify-between">
              <h3 className="font-serif text-xl font-semibold text-[#241914]">
                {editingPromo ? 'Chỉnh Sửa Khuyến Mãi' : 'Thêm Chương Trình Khuyến Mãi'}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1 text-[#8C7565]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="p-6 overflow-y-auto space-y-4 flex-1"
            >
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#241914] mb-1.5">
                  Tiêu đề chương trình *
                </label>
                <input
                  type="text"
                  {...form.register('title')}
                  className="w-full px-3.5 py-2 text-sm bg-white border border-[#D5C6AD] rounded-brand"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#241914] mb-1.5">
                    Tiêu đề phụ (hoặc Khung giờ vàng)
                  </label>
                  <input
                    type="text"
                    {...form.register('subtitle')}
                    placeholder="VD: EVERYDAY 07:30 — 10:30"
                    className="w-full px-3.5 py-2 text-sm bg-white border border-[#D5C6AD] rounded-brand"
                  />
                  <p className="text-[11px] text-[#8C7565] mt-1">
                    Ghi khung giờ (VD: <code className="font-mono">07:30 — 10:30</code>) để tự động bật/tắt theo giờ mỗi ngày.
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#241914] mb-1.5">
                    Nhãn Tag
                  </label>
                  <input
                    type="text"
                    {...form.register('tag')}
                    className="w-full px-3.5 py-2 text-sm bg-white border border-[#D5C6AD] rounded-brand"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#241914] mb-1.5">
                  Nội dung chi tiết *
                </label>
                <textarea
                  rows={3}
                  {...form.register('description')}
                  className="w-full px-3.5 py-2 text-sm bg-white border border-[#D5C6AD] rounded-brand"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#241914] mb-1.5">
                    Ngày bắt đầu
                  </label>
                  <input
                    type="date"
                    {...form.register('start_date')}
                    className="w-full px-3.5 py-2 text-sm bg-white border border-[#D5C6AD] rounded-brand"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#241914] mb-1.5">
                    Ngày kết thúc
                  </label>
                  <input
                    type="date"
                    {...form.register('end_date')}
                    className="w-full px-3.5 py-2 text-sm bg-white border border-[#D5C6AD] rounded-brand"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#241914] mb-1.5">
                    Nhãn nút CTA *
                  </label>
                  <input
                    type="text"
                    {...form.register('cta_label')}
                    className="w-full px-3.5 py-2 text-sm bg-white border border-[#D5C6AD] rounded-brand"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#241914] mb-1.5">
                    Đường dẫn CTA *
                  </label>
                  <input
                    type="text"
                    {...form.register('cta_url')}
                    className="w-full px-3.5 py-2 text-sm bg-white border border-[#D5C6AD] rounded-brand font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#241914] mb-1.5">
                  Hình ảnh Banner *
                </label>
                <div className="flex items-center gap-3">
                  {watchedBanner && (
                    <img
                      src={watchedBanner}
                      alt="Preview"
                      className="w-24 h-16 object-cover rounded-brand border border-[#D5C6AD]"
                    />
                  )}
                  <div className="flex-1 space-y-1.5">
                    <input
                      type="text"
                      {...form.register('banner_image_url')}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-[#D5C6AD] rounded-brand"
                    />
                    <button
                      type="button"
                      onClick={() => setMediaPickerOpen(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[#E9E6D8] rounded-brand"
                    >
                      <ImageIcon className="w-3.5 h-3.5" /> Chọn từ Media Library
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#241914] mb-1">
                    Thứ tự hiển thị
                  </label>
                  <input
                    type="number"
                    {...form.register('sort_order')}
                    className="w-full px-3 py-1.5 text-sm bg-white border border-[#D5C6AD] rounded-brand"
                  />
                </div>
                <label className="flex items-center gap-2 text-xs font-semibold text-[#241914] mt-6">
                  <input
                    type="checkbox"
                    {...form.register('is_active')}
                    className="rounded border-[#D5C6AD]"
                  />
                  <span>Hiển thị trên Website</span>
                </label>
              </div>

              <div className="pt-4 border-t border-[#D5C6AD] flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold uppercase tracking-wider border border-[#D5C6AD] rounded-brand"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold uppercase tracking-wider bg-[#4B2E24] text-[#F7F5EF] rounded-brand"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  <span>Lưu Khuyến Mãi</span>
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
          form.setValue('banner_image_url', url, { shouldValidate: true })
        }
        folder="promotions"
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Xóa chương trình khuyến mãi?"
        description={`Bạn có chắc chắn muốn xóa "${deleteTarget?.title}"?`}
        confirmLabel="Xóa"
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
