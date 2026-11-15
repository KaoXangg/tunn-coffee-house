import React, { useState, useRef } from 'react';
import {
  Upload,
  Image as ImageIcon,
  X,
  Check,
  Search,
  Loader2,
  FolderOpen,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useSiteData } from '../../contexts/SiteDataContext';
import { useToast } from '../../contexts/ToastContext';
import { uploadMediaFile } from '../../lib/mediaService';
import { formatBytes } from '../../lib/utils';

interface MediaPickerModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
  folder?: string;
  allowSvg?: boolean;
  title?: string;
}

export const MediaPickerModal: React.FC<MediaPickerModalProps> = ({
  open,
  onClose,
  onSelect,
  folder = 'general',
  allowSvg = false,
  title = 'Chọn hoặc Tải hình ảnh lên',
}) => {
  const { mediaAssets, refreshAll, logAdminActivity } = useSiteData();
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [tab, setTab] = useState<'library' | 'upload' | 'url'>('library');
  const [search, setSearch] = useState('');
  const [uploading, setUploading] = useState(false);
  const [customUrl, setCustomUrl] = useState('');

  const filteredAssets = mediaAssets.filter((item) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      item.file_name.toLowerCase().includes(q) ||
      item.folder.toLowerCase().includes(q) ||
      item.alt_text?.toLowerCase().includes(q)
    );
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const file = files[0];
      const { asset, error } = await uploadMediaFile(file, {
        folder,
        allowSvg,
      });

      if (error || !asset) {
        toast.error('Không thể tải ảnh lên', error || 'Vui lòng thử lại');
      } else {
        await logAdminActivity('Upload hình ảnh', 'media_assets', asset.file_name);
        await refreshAll();
        toast.success('Tải ảnh lên thành công', asset.file_name);
        onSelect(asset.public_url);
        onClose();
      }
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[85] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#241914]/60 backdrop-blur-[2px]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            className="relative z-10 w-full max-w-3xl bg-[#F7F5EF] border border-[#D5C6AD] rounded-brand shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
          >
            {/* Header */}
            <div className="px-6 py-4 bg-[#E9E6D8] border-b border-[#D5C6AD] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <ImageIcon className="w-5 h-5 text-[#4B2E24]" />
                <h3 className="font-serif text-xl font-semibold text-[#241914]">
                  {title}
                </h3>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 text-[#8C7565] hover:text-[#241914] transition-colors"
                aria-label="Đóng"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="px-6 pt-3 bg-[#E9E6D8]/50 border-b border-[#D5C6AD] flex gap-6 text-xs font-semibold uppercase tracking-wider">
              <button
                type="button"
                onClick={() => setTab('library')}
                className={`pb-3 border-b-2 transition-colors ${
                  tab === 'library'
                    ? 'border-[#4B2E24] text-[#241914]'
                    : 'border-transparent text-[#8C7565] hover:text-[#241914]'
                }`}
              >
                Thư viện Media ({mediaAssets.length})
              </button>
              <button
                type="button"
                onClick={() => setTab('upload')}
                className={`pb-3 border-b-2 transition-colors ${
                  tab === 'upload'
                    ? 'border-[#4B2E24] text-[#241914]'
                    : 'border-transparent text-[#8C7565] hover:text-[#241914]'
                }`}
              >
                Tải ảnh mới từ máy tính
              </button>
              <button
                type="button"
                onClick={() => setTab('url')}
                className={`pb-3 border-b-2 transition-colors ${
                  tab === 'url'
                    ? 'border-[#4B2E24] text-[#241914]'
                    : 'border-transparent text-[#8C7565] hover:text-[#241914]'
                }`}
              >
                Nhập đường dẫn URL
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto flex-1">
              {tab === 'library' && (
                <div>
                  <div className="relative mb-4">
                    <Search className="w-4 h-4 text-[#8C7565] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Tìm kiếm tên ảnh hoặc thư mục..."
                      className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-[#D5C6AD] rounded-brand focus:outline-none focus:border-[#4B2E24]"
                    />
                  </div>

                  {filteredAssets.length === 0 ? (
                    <div className="text-center py-12 border border-dashed border-[#D5C6AD] rounded-brand bg-[#E9E6D8]/30">
                      <FolderOpen className="w-10 h-10 text-[#8C7565] mx-auto mb-2 stroke-1" />
                      <p className="text-sm font-medium text-[#241914]">
                        Chưa có hình ảnh nào trong thư viện
                      </p>
                      <p className="text-xs text-[#8C7565] mt-1 mb-4">
                        Hãy tải ảnh từ máy tính lên Supabase Storage để sử dụng.
                      </p>
                      <button
                        type="button"
                        onClick={() => setTab('upload')}
                        className="px-4 py-2 text-xs font-semibold uppercase tracking-wider bg-[#4B2E24] text-[#F7F5EF] rounded-brand hover:bg-[#241914] transition-colors"
                      >
                        Tải ảnh lên ngay
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
                      {filteredAssets.map((asset) => (
                        <button
                          key={asset.id}
                          type="button"
                          onClick={() => {
                            onSelect(asset.public_url);
                            onClose();
                          }}
                          className="group relative text-left border border-[#D5C6AD] rounded-brand overflow-hidden bg-white hover:border-[#4B2E24] transition-all focus:outline-none"
                        >
                          <div className="aspect-square bg-[#E9E6D8]/40 overflow-hidden">
                            <img
                              src={asset.public_url}
                              alt={asset.alt_text || asset.file_name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              loading="lazy"
                            />
                          </div>
                          <div className="p-2">
                            <p className="text-xs font-medium text-[#241914] truncate">
                              {asset.file_name}
                            </p>
                            <p className="text-[10px] text-[#8C7565] mt-0.5">
                              {formatBytes(asset.file_size)}
                              {asset.width && asset.height
                                ? ` · ${asset.width}×${asset.height}`
                                : ''}
                            </p>
                          </div>
                          <div className="absolute inset-0 bg-[#241914]/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="px-3 py-1.5 bg-[#F7F5EF] text-[#241914] text-xs font-semibold rounded-brand flex items-center gap-1 shadow">
                              <Check className="w-3.5 h-3.5" /> Chọn ảnh
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {tab === 'upload' && (
                <div className="py-8">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={
                      allowSvg
                        ? '.jpg,.jpeg,.png,.webp,.svg'
                        : '.jpg,.jpeg,.png,.webp'
                    }
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div
                    onClick={() => !uploading && fileInputRef.current?.click()}
                    className="cursor-pointer border-2 border-dashed border-[#D5C6AD] hover:border-[#4B2E24] rounded-brand p-10 text-center bg-[#E9E6D8]/30 transition-colors"
                  >
                    {uploading ? (
                      <div className="flex flex-col items-center">
                        <Loader2 className="w-10 h-10 text-[#4B2E24] animate-spin mb-3" />
                        <p className="text-sm font-medium text-[#241914]">
                          Đang tải ảnh lên Supabase Storage...
                        </p>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-10 h-10 text-[#4B2E24] mx-auto mb-3 stroke-1" />
                        <p className="text-base font-serif font-semibold text-[#241914]">
                          Nhấn để chọn ảnh từ máy tính
                        </p>
                        <p className="text-xs text-[#8C7565] mt-1">
                          Hỗ trợ: JPG, JPEG, PNG, WebP {allowSvg ? ', SVG' : ''} (Tối đa 5MB)
                        </p>
                      </>
                    )}
                  </div>
                </div>
              )}

              {tab === 'url' && (
                <div className="py-4 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#241914] mb-2">
                      Đường dẫn hình ảnh (URL)
                    </label>
                    <input
                      type="url"
                      value={customUrl}
                      onChange={(e) => setCustomUrl(e.target.value)}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#D5C6AD] rounded-brand focus:outline-none focus:border-[#4B2E24]"
                    />
                  </div>
                  {customUrl && (
                    <div className="border border-[#D5C6AD] rounded-brand p-3 bg-white">
                      <p className="text-xs text-[#8C7565] mb-2">Xem trước:</p>
                      <img
                        src={customUrl}
                        alt="Preview"
                        className="max-h-48 object-contain mx-auto rounded-brand"
                      />
                    </div>
                  )}
                  <div className="flex justify-end">
                    <button
                      type="button"
                      disabled={!customUrl.trim()}
                      onClick={() => {
                        onSelect(customUrl.trim());
                        onClose();
                      }}
                      className="px-5 py-2.5 text-xs font-semibold uppercase tracking-wider bg-[#4B2E24] text-[#F7F5EF] rounded-brand hover:bg-[#241914] disabled:opacity-50"
                    >
                      Sử dụng ảnh này
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
