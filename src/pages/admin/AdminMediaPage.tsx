import React, { useState, useRef } from 'react';
import {
  Upload,
  Search,
  Copy,
  Trash2,
  Eye,
  FolderOpen,
  Loader2,
  Check,
  X,
  Link2,
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { useSiteData } from '../../contexts/SiteDataContext';
import { useToast } from '../../contexts/ToastContext';
import { uploadMediaFile, deleteMediaAsset } from '../../lib/mediaService';
import { formatBytes, formatDateVi } from '../../lib/utils';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import type { MediaAsset } from '../../types/database';

const FOLDERS = [
  { id: 'all', label: 'Tất cả thư mục' },
  { id: 'products', label: 'Sản phẩm (products)' },
  { id: 'hero', label: 'Hero Banner (hero)' },
  { id: 'promotions', label: 'Ưu đãi (promotions)' },
  { id: 'gallery', label: 'Không gian (gallery)' },
  { id: 'brand', label: 'Thương hiệu (brand)' },
  { id: 'general', label: 'Chung (general)' },
];

export const AdminMediaPage: React.FC = () => {
  const {
    mediaAssets,
    products,
    promotions,
    refreshAll,
    updateSiteSettings,
    updatePageSection,
    logAdminActivity,
  } = useSiteData();
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [selectedFolder, setSelectedFolder] = useState('all');
  const [uploadFolder, setUploadFolder] = useState('products');
  const [allowSvgUpload, setAllowSvgUpload] = useState(false);
  const [search, setSearch] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState('');

  const [selectedAsset, setSelectedAsset] = useState<MediaAsset | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MediaAsset | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Quick-assign state inside detail drawer
  const [assignTargetType, setAssignTargetType] = useState<
    'hero' | 'about' | 'logo' | 'product' | 'promotion' | 'gallery'
  >('product');
  const [assignProductId, setAssignProductId] = useState(products[0]?.id || '');
  const [assignPromoId, setAssignPromoId] = useState(promotions[0]?.id || '');
  const [assigning, setAssigning] = useState(false);

  const filteredAssets = mediaAssets.filter((asset) => {
    if (selectedFolder !== 'all' && asset.folder !== selectedFolder) return false;
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      asset.file_name.toLowerCase().includes(q) ||
      asset.folder.toLowerCase().includes(q) ||
      asset.alt_text?.toLowerCase().includes(q)
    );
  });

  const handleFilesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    const files = Array.from(fileList);
    setUploading(true);
    let successCount = 0;

    try {
      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        setUploadProgressText(`Đang tải (${i + 1}/${files.length}): ${f.name}...`);
        const { asset, error } = await uploadMediaFile(f, {
          folder: uploadFolder,
          allowSvg: allowSvgUpload,
        });
        if (error) {
          toast.error(`Lỗi tải file ${f.name}`, error);
        } else if (asset) {
          successCount++;
        }
      }

      if (successCount > 0) {
        await logAdminActivity(
          `Upload ${successCount} hình ảnh`,
          'media_assets',
          `Thư mục: ${uploadFolder}`
        );
        await refreshAll();
        toast.success(
          'Tải ảnh lên hoàn tất',
          `Đã lưu ${successCount}/${files.length} ảnh vào Supabase Storage.`
        );
      }
    } finally {
      setUploading(false);
      setUploadProgressText('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleCopyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Đã sao chép URL ảnh', url);
    } catch {
      toast.info('URL Hình ảnh', url);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const { error } = await deleteMediaAsset(deleteTarget);
      if (error) {
        toast.error('Không thể xóa ảnh', error);
      } else {
        await logAdminActivity('Xóa hình ảnh', 'media_assets', deleteTarget.file_name);
        await refreshAll();
        toast.success('Đã xóa ảnh khỏi Supabase Storage', deleteTarget.file_name);
        if (selectedAsset?.id === deleteTarget.id) setSelectedAsset(null);
      }
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  const handleQuickAssign = async () => {
    if (!selectedAsset) return;
    setAssigning(true);
    try {
      const url = selectedAsset.public_url;

      if (assignTargetType === 'hero') {
        const { error } = await updatePageSection('hero', {
          content: { hero_image_url: url },
        });
        if (error) throw new Error(error);
        toast.success('Đã gắn ảnh vào Hero Section!');
      } else if (assignTargetType === 'about') {
        const { error } = await updatePageSection('about', {
          content: { main_image_url: url },
        });
        if (error) throw new Error(error);
        toast.success('Đã gắn ảnh vào About Section!');
      } else if (assignTargetType === 'logo') {
        const { error } = await updateSiteSettings({ logo_url: url });
        if (error) throw new Error(error);
        toast.success('Đã cập nhật Logo thương hiệu!');
      } else if (assignTargetType === 'product') {
        if (!isSupabaseConfigured || !assignProductId) {
          throw new Error('Vui lòng chọn sản phẩm và kết nối Supabase.');
        }
        const { error } = await supabase
          .from('products')
          .update({ image_url: url })
          .eq('id', assignProductId);
        if (error) throw error;
        await refreshAll();
        toast.success('Đã gắn ảnh cho Sản phẩm!');
      } else if (assignTargetType === 'promotion') {
        if (!isSupabaseConfigured || !assignPromoId) {
          throw new Error('Vui lòng chọn chương trình khuyến mãi.');
        }
        const { error } = await supabase
          .from('promotions')
          .update({ banner_image_url: url })
          .eq('id', assignPromoId);
        if (error) throw error;
        await refreshAll();
        toast.success('Đã gắn ảnh cho Banner Ưu đãi!');
      } else if (assignTargetType === 'gallery') {
        if (!isSupabaseConfigured) {
          throw new Error('Chưa kết nối Supabase.');
        }
        const { error } = await supabase.from('gallery_items').insert({
          title: selectedAsset.file_name.replace(/\.[^/.]+$/, ''),
          caption: selectedAsset.alt_text || '',
          category: 'Không gian',
          image_url: url,
          aspect_ratio: 'portrait',
          is_visible: true,
          sort_order: 1,
        });
        if (error) throw error;
        await refreshAll();
        toast.success('Đã thêm ảnh vào Gallery!');
      }
    } catch (err: unknown) {
      toast.error('Lỗi gắn hình ảnh', err instanceof Error ? err.message : undefined);
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-coffee-dark">
            Thư Viện Hình Ảnh (Supabase Storage Media Library)
          </h1>
          <p className="text-sm text-coffee-muted mt-1">
            Tải nhiều ảnh từ máy tính, kiểm tra kích thước, sao chép URL và gắn trực tiếp vào Sản phẩm, Hero, Banner hoặc Gallery.
          </p>
        </div>
      </div>

      {/* Upload Dropzone Panel */}
      <div className="bg-white border border-coffee-beige rounded-brand p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-coffee-muted mb-1">
                Thư mục lưu trữ
              </label>
              <select
                value={uploadFolder}
                onChange={(e) => setUploadFolder(e.target.value)}
                className="px-3 py-1.5 text-xs font-medium bg-ivory-light border border-coffee-beige rounded-brand"
              >
                <option value="products">Sản phẩm (products)</option>
                <option value="hero">Hero Banner (hero)</option>
                <option value="promotions">Khuyến mãi (promotions)</option>
                <option value="gallery">Gallery (gallery)</option>
                <option value="brand">Logo & Favicon (brand)</option>
                <option value="general">Chung (general)</option>
              </select>
            </div>

            <label className="flex items-center gap-2 text-xs font-medium text-coffee-dark mt-5 cursor-pointer">
              <input
                type="checkbox"
                checked={allowSvgUpload}
                onChange={(e) => setAllowSvgUpload(e.target.checked)}
                className="rounded border-coffee-beige"
              />
              <span>Cho phép SVG (Chỉ dành cho Logo & Favicon, có kiểm tra bảo mật)</span>
            </label>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={
            allowSvgUpload
              ? '.jpg,.jpeg,.png,.webp,.svg'
              : '.jpg,.jpeg,.png,.webp'
          }
          onChange={handleFilesUpload}
          className="hidden"
        />

        <div
          onClick={() => !uploading && fileInputRef.current?.click()}
          className="cursor-pointer border-2 border-dashed border-coffee-beige hover:border-coffee bg-ivory-light/70 rounded-brand p-8 text-center transition-colors"
        >
          {uploading ? (
            <div className="flex flex-col items-center">
              <Loader2 className="w-9 h-9 text-coffee animate-spin mb-2.5" />
              <p className="text-sm font-semibold text-coffee-dark">
                {uploadProgressText || 'Đang tải hình ảnh lên Supabase Storage...'}
              </p>
            </div>
          ) : (
            <>
              <Upload className="w-9 h-9 text-coffee mx-auto mb-2.5 stroke-1" />
              <p className="font-serif text-xl font-semibold text-coffee-dark">
                Nhấn để chọn một hoặc nhiều hình ảnh từ máy tính
              </p>
              <p className="text-xs text-coffee-muted mt-1">
                Định dạng hỗ trợ: JPG, JPEG, PNG, WebP {allowSvgUpload ? ', SVG' : ''} · Tối đa 5MB/ảnh · Lưu trữ trực tiếp tại bucket <code className="font-mono">tunn-media</code>
              </p>
            </>
          )}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white border border-coffee-beige rounded-brand p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex flex-wrap gap-1.5">
          {FOLDERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setSelectedFolder(f.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-brand transition-colors ${
                selectedFolder === f.id
                  ? 'bg-coffee text-ivory-light'
                  : 'bg-ivory-light text-coffee-dark hover:bg-ivory'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-coffee-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm tên file ảnh..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-ivory-light border border-coffee-beige rounded-brand"
          />
        </div>
      </div>

      {/* Media Grid & Inspector Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className={selectedAsset ? 'lg:col-span-8' : 'lg:col-span-12'}>
          {filteredAssets.length === 0 ? (
            <div className="bg-white border border-coffee-beige rounded-brand py-16 px-4 text-center">
              <FolderOpen className="w-12 h-12 text-coffee-muted mx-auto mb-3 stroke-1" />
              <h3 className="font-serif text-xl font-semibold text-coffee-dark">
                Thư viện Media hiện đang trống
              </h3>
              <p className="text-xs text-coffee-muted mt-1 max-w-md mx-auto">
                Hãy nhấn vào khung tải ảnh phía trên để upload hình ảnh đồ uống, logo hoặc không gian quán lên Supabase Storage.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {filteredAssets.map((asset) => {
                const isSelected = selectedAsset?.id === asset.id;
                return (
                  <div
                    key={asset.id}
                    onClick={() => setSelectedAsset(asset)}
                    className={`group cursor-pointer bg-white border rounded-brand overflow-hidden transition-all ${
                      isSelected
                        ? 'border-coffee ring-2 ring-coffee/30'
                        : 'border-coffee-beige hover:border-coffee'
                    }`}
                  >
                    <div className="aspect-square bg-ivory/40 relative overflow-hidden">
                      <img
                        src={asset.public_url}
                        alt={asset.alt_text || asset.file_name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      <span className="absolute top-2 left-2 px-2 py-0.5 text-[10px] uppercase tracking-wider font-semibold bg-coffee-dark/80 text-ivory-light rounded">
                        {asset.folder}
                      </span>
                    </div>

                    <div className="p-3">
                      <p className="text-xs font-semibold text-coffee-dark truncate">
                        {asset.file_name}
                      </p>
                      <div className="flex items-center justify-between text-[10px] text-coffee-muted mt-1">
                        <span>{formatBytes(asset.file_size)}</span>
                        {asset.width && asset.height && (
                          <span>
                            {asset.width}×{asset.height}px
                          </span>
                        )}
                      </div>

                      <div className="mt-2.5 pt-2 border-t border-ivory flex items-center justify-between">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyUrl(asset.public_url);
                          }}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-coffee hover:underline"
                        >
                          <Copy className="w-3 h-3" />
                          <span>Copy URL</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteTarget(asset);
                          }}
                          className="p-1 text-red-700 hover:bg-red-50 rounded"
                          title="Xóa ảnh"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Inspector & Quick-Assign Panel */}
        {selectedAsset && (
          <div className="lg:col-span-4 bg-white border border-coffee-beige rounded-brand p-5 sticky top-20 space-y-5">
            <div className="flex items-center justify-between border-b border-coffee-beige pb-3">
              <h3 className="font-serif text-lg font-semibold text-coffee-dark">
                Chi Tiết Hình Ảnh
              </h3>
              <button
                type="button"
                onClick={() => setSelectedAsset(null)}
                className="p-1 text-coffee-muted hover:text-coffee-dark"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="aspect-video bg-ivory/40 rounded-brand overflow-hidden border border-coffee-beige flex items-center justify-center">
              <img
                src={selectedAsset.public_url}
                alt={selectedAsset.file_name}
                className="max-h-full max-w-full object-contain"
              />
            </div>

            <div className="space-y-1.5 text-xs">
              <p className="font-semibold text-coffee-dark break-all">
                {selectedAsset.file_name}
              </p>
              <p className="text-coffee-muted">
                Dung lượng: <strong>{formatBytes(selectedAsset.file_size)}</strong>
              </p>
              {selectedAsset.width && selectedAsset.height && (
                <p className="text-coffee-muted">
                  Kích thước: <strong>{selectedAsset.width} × {selectedAsset.height} px</strong>
                </p>
              )}
              <p className="text-coffee-muted">
                Định dạng: <strong>{selectedAsset.mime_type}</strong>
              </p>
              <p className="text-coffee-muted">
                Ngày tải lên: <strong>{formatDateVi(selectedAsset.created_at)}</strong>
              </p>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleCopyUrl(selectedAsset.public_url)}
                className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold bg-ivory text-coffee-dark hover:bg-coffee-beige rounded-brand"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy URL</span>
              </button>
              <a
                href={selectedAsset.public_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold border border-coffee-beige text-coffee-dark rounded-brand"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Mở ảnh</span>
              </a>
            </div>

            {/* Quick Assign Feature */}
            <div className="pt-4 border-t border-coffee-beige space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-coffee">
                <Link2 className="w-3.5 h-3.5" />
                <span>Gắn nhanh ảnh này vào Website</span>
              </div>

              <select
                value={assignTargetType}
                onChange={(e) => setAssignTargetType(e.target.value as 'product' | 'hero' | 'about' | 'promotion' | 'gallery')}
                className="w-full px-3 py-2 text-xs bg-ivory-light border border-coffee-beige rounded-brand font-medium"
              >
                <option value="product">Gắn vào Sản phẩm (Product)</option>
                <option value="hero">Làm ảnh chính Hero Section</option>
                <option value="about">Làm ảnh chính About Section</option>
                <option value="promotion">Gắn vào Banner Khuyến mãi</option>
                <option value="gallery">Thêm vào Thư viện Gallery</option>
                <option value="logo">Đặt làm Logo Thương hiệu</option>
              </select>

              {assignTargetType === 'product' && (
                <select
                  value={assignProductId}
                  onChange={(e) => setAssignProductId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-coffee-beige rounded-brand"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              )}

              {assignTargetType === 'promotion' && (
                <select
                  value={assignPromoId}
                  onChange={(e) => setAssignPromoId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-coffee-beige rounded-brand"
                >
                  {promotions.map((pr) => (
                    <option key={pr.id} value={pr.id}>
                      {pr.title}
                    </option>
                  ))}
                </select>
              )}

              <button
                type="button"
                disabled={assigning}
                onClick={handleQuickAssign}
                className="w-full py-2.5 px-4 bg-coffee hover:bg-coffee-dark text-ivory-light text-xs font-semibold uppercase tracking-wider rounded-brand transition-colors flex items-center justify-center gap-1.5"
              >
                {assigning ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                <span>Áp Dụng Ngay</span>
              </button>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Xóa hình ảnh khỏi Supabase Storage?"
        description={`Bạn có chắc chắn muốn xóa file "${deleteTarget?.file_name}"?`}
        confirmLabel="Xóa file"
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
