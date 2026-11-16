import React from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { Check, Image as ImageIcon, Loader2, X } from 'lucide-react';
import { MediaPickerModal } from '../../../components/common/MediaPickerModal';
import { slugify } from '../../../lib/utils';
import type { Category, Product } from '../../../types/database';
import type { ProductFormValues } from './index';

interface ProductFormModalProps {
  open: boolean;
  editingProduct: Product | null;
  categories: Category[];
  form: UseFormReturn<ProductFormValues>;
  watchedImage: string | undefined;
  saving: boolean;
  mediaPickerOpen: boolean;
  onOpenMediaPicker: (open: boolean) => void;
  onSubmit: (values: ProductFormValues) => Promise<void> | void;
  onClose: () => void;
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  open,
  editingProduct,
  categories,
  form,
  watchedImage,
  saving,
  mediaPickerOpen,
  onOpenMediaPicker: setMediaPickerOpen,
  onSubmit,
  onClose,
}) => {
  if (!open) return null;
  return (
    <>
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <div
            onClick={() => onClose()}
            className="fixed inset-0 bg-[#241914]/60 backdrop-blur-[2px]"
          />
          <div className="relative z-10 w-full max-w-2xl bg-[#F7F5EF] border border-[#D5C6AD] rounded-brand shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 bg-[#E9E6D8] border-b border-[#D5C6AD] flex items-center justify-between">
              <h3 className="font-serif text-xl font-semibold text-[#241914]">
                {editingProduct
                  ? `Chỉnh sửa: ${editingProduct.name}`
                  : 'Thêm Món Đồ Uống Mới'}
              </h3>
              <button
                type="button"
                onClick={() => onClose()}
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
                  onClick={() => onClose()}
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
      <MediaPickerModal
        open={mediaPickerOpen}
        onClose={() => setMediaPickerOpen(false)}
        onSelect={(url) => form.setValue('image_url', url, { shouldValidate: true })}
        folder="products"
        title="Chọn ảnh cho Sản phẩm"
      />
    </>
  );
};
