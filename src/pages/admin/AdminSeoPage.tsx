import React, { useState, useEffect } from 'react';
import { Save, Image as ImageIcon, Loader2, Globe, Share2 } from 'lucide-react';
import { useSiteData } from '../../contexts/SiteDataContext';
import { useToast } from '../../contexts/ToastContext';
import { MediaPickerModal } from '../../components/common/MediaPickerModal';

export const AdminSeoPage: React.FC = () => {
  const { settings, updateSiteSettings } = useSiteData();
  const toast = useToast();

  const [seoTitle, setSeoTitle] = useState(settings.seo_title);
  const [seoDescription, setSeoDescription] = useState(settings.seo_description);
  const [seoKeywords, setSeoKeywords] = useState(settings.seo_keywords);
  const [ogImageUrl, setOgImageUrl] = useState(settings.og_image_url);
  const [faviconUrl, setFaviconUrl] = useState(settings.favicon_url);
  const [saving, setSaving] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<'og' | 'favicon' | null>(null);

  useEffect(() => {
    setSeoTitle(settings.seo_title);
    setSeoDescription(settings.seo_description);
    setSeoKeywords(settings.seo_keywords);
    setOgImageUrl(settings.og_image_url);
    setFaviconUrl(settings.favicon_url);
  }, [settings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { error } = await updateSiteSettings({
        seo_title: seoTitle.trim(),
        seo_description: seoDescription.trim(),
        seo_keywords: seoKeywords.trim(),
        og_image_url: ogImageUrl.trim() || '/logo.png',
        favicon_url: faviconUrl.trim() || '/logo.png',
      });

      if (error) {
        toast.info('Đã cập nhật thẻ SEO trên trình duyệt', error);
      } else {
        toast.success(
          'Đã lưu cấu hình SEO & Open Graph!',
          'Thẻ meta title, description và ảnh chia sẻ mạng xã hội đã được cập nhật.'
        );
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-[#241914]">
            Cấu Hình SEO & Chia Sẻ Mạng Xã Hội (Open Graph)
          </h1>
          <p className="text-sm text-[#8C7565] mt-1">
            Tối ưu hóa hiển thị trên Google Search, Facebook, Zalo và thiết lập Favicon.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold uppercase tracking-wider bg-[#4B2E24] text-[#F7F5EF] hover:bg-[#241914] rounded-brand"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          <span>Lưu Cấu Hình SEO</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <form
          onSubmit={handleSave}
          className="lg:col-span-7 bg-white border border-[#D5C6AD] rounded-brand p-6 space-y-5"
        >
          <div>
            <div className="flex justify-between mb-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-[#241914]">
                SEO Meta Title (Tiêu đề trên Google)
              </label>
              <span className="text-xs text-[#8C7565]">{seoTitle.length}/70 ký tự</span>
            </div>
            <input
              type="text"
              value={seoTitle}
              onChange={(e) => setSeoTitle(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-[#F7F5EF] border border-[#D5C6AD] rounded-brand"
            />
          </div>

          <div>
            <div className="flex justify-between mb-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-[#241914]">
                SEO Meta Description (Mô tả trên Google)
              </label>
              <span className="text-xs text-[#8C7565]">
                {seoDescription.length}/160 ký tự
              </span>
            </div>
            <textarea
              rows={3}
              value={seoDescription}
              onChange={(e) => setSeoDescription(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-[#F7F5EF] border border-[#D5C6AD] rounded-brand"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#241914] mb-1.5">
              Từ khóa SEO (Keywords - cách nhau bởi dấu phẩy)
            </label>
            <input
              type="text"
              value={seoKeywords}
              onChange={(e) => setSeoKeywords(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-[#F7F5EF] border border-[#D5C6AD] rounded-brand"
            />
          </div>

          <div className="pt-4 border-t border-[#D5C6AD] space-y-3">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#241914]">
              Ảnh đại diện khi chia sẻ link (Open Graph Image - 1200×630px)
            </label>
            <div className="flex items-center gap-4">
              <img
                src={ogImageUrl || '/logo.png'}
                alt="OG Preview"
                className="w-24 h-16 object-cover rounded-brand border border-[#D5C6AD] bg-[#E9E6D8]"
              />
              <div className="flex-1 space-y-2">
                <input
                  type="text"
                  value={ogImageUrl}
                  onChange={(e) => setOgImageUrl(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-[#F7F5EF] border border-[#D5C6AD] rounded-brand font-mono"
                />
                <button
                  type="button"
                  onClick={() => setPickerTarget('og')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[#E9E6D8] text-[#241914] rounded-brand"
                >
                  <ImageIcon className="w-3.5 h-3.5" /> Chọn ảnh Open Graph
                </button>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[#D5C6AD] space-y-3">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#241914]">
              Favicon URL
            </label>
            <div className="flex items-center gap-4">
              <img
                src={faviconUrl || '/logo.png'}
                alt="Favicon"
                className="w-10 h-10 object-contain rounded border border-[#D5C6AD] bg-[#E9E6D8] p-1"
              />
              <div className="flex-1 space-y-2">
                <input
                  type="text"
                  value={faviconUrl}
                  onChange={(e) => setFaviconUrl(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-[#F7F5EF] border border-[#D5C6AD] rounded-brand font-mono"
                />
                <button
                  type="button"
                  onClick={() => setPickerTarget('favicon')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[#E9E6D8] text-[#241914] rounded-brand"
                >
                  <ImageIcon className="w-3.5 h-3.5" /> Chọn Favicon
                </button>
              </div>
            </div>
          </div>
        </form>

        {/* Live Search & Social Card Preview */}
        <div className="lg:col-span-5 space-y-5 sticky top-20">
          {/* Google Search Preview */}
          <div className="bg-white border border-[#D5C6AD] rounded-brand p-5 space-y-2 shadow-xs">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#4B2E24] mb-2">
              <Globe className="w-4 h-4" />
              <span>Xem trước trên Google Search</span>
            </div>
            <p className="text-xs text-stone-500">https://tunncoffee.pages.dev</p>
            <p className="text-base font-medium text-blue-800 hover:underline line-clamp-1">
              {seoTitle || 'TUNN Coffee House'}
            </p>
            <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">
              {seoDescription}
            </p>
          </div>

          {/* Social Share Card Preview */}
          <div className="bg-white border border-[#D5C6AD] rounded-brand overflow-hidden shadow-xs">
            <div className="px-5 py-3 bg-[#E9E6D8] border-b border-[#D5C6AD] flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#241914]">
              <Share2 className="w-4 h-4 text-[#4B2E24]" />
              <span>Xem trước khi chia sẻ Facebook / Zalo</span>
            </div>
            <div className="aspect-[16/9] bg-[#E9E6D8] overflow-hidden">
              <img
                src={ogImageUrl || '/logo.png'}
                alt="Social Share Preview"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-4 bg-[#F7F5EF] border-t border-[#D5C6AD]">
              <p className="text-[10px] uppercase tracking-wider text-[#8C7565]">
                TUNNCOFFEE.PAGES.DEV
              </p>
              <p className="font-serif text-lg font-semibold text-[#241914] mt-0.5 line-clamp-1">
                {seoTitle}
              </p>
              <p className="text-xs text-[#8C7565] mt-1 line-clamp-2">
                {seoDescription}
              </p>
            </div>
          </div>
        </div>
      </div>

      <MediaPickerModal
        open={Boolean(pickerTarget)}
        onClose={() => setPickerTarget(null)}
        onSelect={(url) => {
          if (pickerTarget === 'og') setOgImageUrl(url);
          if (pickerTarget === 'favicon') setFaviconUrl(url);
        }}
        folder="brand"
        allowSvg={pickerTarget === 'favicon'}
      />
    </div>
  );
};
