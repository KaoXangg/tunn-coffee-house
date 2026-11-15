import React, { useState, useEffect } from 'react';
import { Save, Image as ImageIcon, Loader2, RotateCcw, Eye } from 'lucide-react';
import { useSiteData } from '../../contexts/SiteDataContext';
import { useToast } from '../../contexts/ToastContext';
import { BrandLogo } from '../../components/common/BrandLogo';
import { MediaPickerModal } from '../../components/common/MediaPickerModal';

export const AdminBrandPage: React.FC = () => {
  const { settings, updateSiteSettings } = useSiteData();
  const toast = useToast();

  const [brandName, setBrandName] = useState(settings.brand_name);
  const [siteTitle, setSiteTitle] = useState(settings.site_title);
  const [slogan, setSlogan] = useState(settings.slogan);
  const [logoUrl, setLogoUrl] = useState(settings.logo_url);
  const [faviconUrl, setFaviconUrl] = useState(settings.favicon_url);
  const [footerDescription, setFooterDescription] = useState(settings.footer_description);
  const [copyrightText, setCopyrightText] = useState(settings.copyright_text);

  const [saving, setSaving] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<'logo' | 'favicon' | null>(null);

  useEffect(() => {
    setBrandName(settings.brand_name);
    setSiteTitle(settings.site_title);
    setSlogan(settings.slogan);
    setLogoUrl(settings.logo_url);
    setFaviconUrl(settings.favicon_url);
    setFooterDescription(settings.footer_description);
    setCopyrightText(settings.copyright_text);
  }, [settings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { error } = await updateSiteSettings({
        brand_name: brandName.trim(),
        site_title: siteTitle.trim(),
        slogan: slogan.trim(),
        logo_url: logoUrl.trim() || '/logo.png',
        favicon_url: faviconUrl.trim() || '/logo.png',
        footer_description: footerDescription.trim(),
        copyright_text: copyrightText.trim(),
      });

      if (error) {
        toast.info('Đã áp dụng tạm thời trên giao diện', error);
      } else {
        toast.success(
          'Đã cập nhật Nhận diện Thương hiệu!',
          'Logo và tên thương hiệu đã được đồng bộ trên toàn bộ Website & Admin.'
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
            Nhận Diện Thương Hiệu (Brand Settings)
          </h1>
          <p className="text-sm text-[#8C7565] mt-1">
            Quản lý Logo TUNN Coffee House, Favicon, tên thương hiệu, slogan và nội dung chân trang.
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
          <span>Lưu Nhận Diện Thương Hiệu</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <form
          onSubmit={handleSave}
          className="lg:col-span-7 bg-white border border-[#D5C6AD] rounded-brand p-6 space-y-5"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#241914] mb-1.5">
                Tên thương hiệu (Brand Name)
              </label>
              <input
                type="text"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-[#F7F5EF] border border-[#D5C6AD] rounded-brand"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#241914] mb-1.5">
                Slogan thương hiệu
              </label>
              <input
                type="text"
                value={slogan}
                onChange={(e) => setSlogan(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-[#F7F5EF] border border-[#D5C6AD] rounded-brand"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#241914] mb-1.5">
              Tiêu đề Website (Site Title)
            </label>
            <input
              type="text"
              value={siteTitle}
              onChange={(e) => setSiteTitle(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-[#F7F5EF] border border-[#D5C6AD] rounded-brand"
            />
          </div>

          {/* Logo Setting */}
          <div className="pt-4 border-t border-[#D5C6AD] space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-[#241914]">
                Logo Thương Hiệu (Đồng bộ Header, Footer, Admin, Login)
              </label>
              <button
                type="button"
                onClick={() => setLogoUrl('/logo.png')}
                className="inline-flex items-center gap-1 text-xs text-[#4B2E24] hover:underline"
              >
                <RotateCcw className="w-3 h-3" /> Khôi phục Logo gốc (/logo.png)
              </button>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-[#E9E6D8] border border-[#D5C6AD] overflow-hidden shrink-0 flex items-center justify-center">
                <img
                  src={logoUrl || '/logo.png'}
                  alt="Logo Preview"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex-1 space-y-2">
                <input
                  type="text"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-[#F7F5EF] border border-[#D5C6AD] rounded-brand font-mono"
                />
                <button
                  type="button"
                  onClick={() => setPickerTarget('logo')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-[#E9E6D8] text-[#241914] hover:bg-[#D5C6AD] rounded-brand"
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Tải lên / Chọn Logo mới</span>
                </button>
              </div>
            </div>
          </div>

          {/* Favicon Setting */}
          <div className="pt-4 border-t border-[#D5C6AD] space-y-3">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#241914]">
              Favicon (Biểu tượng trên Tab trình duyệt)
            </label>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-brand bg-[#E9E6D8] border border-[#D5C6AD] overflow-hidden shrink-0 flex items-center justify-center">
                <img
                  src={faviconUrl || '/logo.png'}
                  alt="Favicon Preview"
                  className="w-8 h-8 object-contain"
                />
              </div>
              <div className="flex-1 space-y-2">
                <input
                  type="text"
                  value={faviconUrl}
                  onChange={(e) => setFaviconUrl(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-[#F7F5EF] border border-[#D5C6AD] rounded-brand font-mono"
                />
                <button
                  type="button"
                  onClick={() => setPickerTarget('favicon')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-[#E9E6D8] text-[#241914] hover:bg-[#D5C6AD] rounded-brand"
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Chọn Favicon</span>
                </button>
              </div>
            </div>
          </div>

          {/* Footer description & copyright */}
          <div className="pt-4 border-t border-[#D5C6AD] space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#241914] mb-1.5">
                Giới thiệu thương hiệu ở Footer
              </label>
              <textarea
                rows={3}
                value={footerDescription}
                onChange={(e) => setFooterDescription(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-[#F7F5EF] border border-[#D5C6AD] rounded-brand"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#241914] mb-1.5">
                Bản quyền (Copyright)
              </label>
              <input
                type="text"
                value={copyrightText}
                onChange={(e) => setCopyrightText(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-[#F7F5EF] border border-[#D5C6AD] rounded-brand"
              />
            </div>
          </div>
        </form>

        {/* Live Brand Preview */}
        <div className="lg:col-span-5 sticky top-20 space-y-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#4B2E24]">
            <Eye className="w-4 h-4" />
            <span>Xem Trước Đồng Bộ Thương Hiệu (Live Preview)</span>
          </div>

          {/* Header Preview */}
          <div className="bg-[#F7F5EF] border border-[#D5C6AD] rounded-brand p-5 space-y-3 shadow-xs">
            <span className="text-[10px] uppercase tracking-widest text-[#8C7565] font-semibold">
              1. Hiển thị trên Header Website
            </span>
            <div className="p-4 bg-[#E9E6D8] border border-[#D5C6AD] rounded-brand flex items-center justify-between">
              <BrandLogo
                size="md"
                subtitle="COFFEE HOUSE"
                logoUrlOverride={logoUrl}
                brandNameOverride={brandName}
              />
              <span className="px-3 py-1.5 text-[10px] uppercase tracking-wider font-semibold bg-[#4B2E24] text-[#F7F5EF] rounded-brand">
                Khám phá Menu
              </span>
            </div>
          </div>

          {/* Footer Preview */}
          <div className="bg-[#241914] text-[#F7F5EF] border border-[#4B2E24] rounded-brand p-6 space-y-3 shadow-md">
            <span className="text-[10px] uppercase tracking-widest text-[#D5C6AD] font-semibold">
              2. Hiển thị trên Footer & Admin Sidebar
            </span>
            <div className="pt-1">
              <BrandLogo
                size="lg"
                subtitle="COFFEE HOUSE"
                logoUrlOverride={logoUrl}
                brandNameOverride={brandName}
                textClassName="text-[#F7F5EF]"
              />
            </div>
            <p className="text-xs text-[#D5C6AD]/85 leading-relaxed">
              {footerDescription}
            </p>
            <p className="font-serif italic text-sm text-[#D5C6AD]">“{slogan}”</p>
            <p className="text-[11px] text-[#D5C6AD]/60 pt-2 border-t border-[#4B2E24]">
              {copyrightText}
            </p>
          </div>
        </div>
      </div>

      <MediaPickerModal
        open={Boolean(pickerTarget)}
        onClose={() => setPickerTarget(null)}
        onSelect={(url) => {
          if (pickerTarget === 'logo') setLogoUrl(url);
          if (pickerTarget === 'favicon') setFaviconUrl(url);
        }}
        folder="brand"
        allowSvg={true}
        title="Chọn Logo hoặc Favicon (Hỗ trợ PNG, JPG, WebP, SVG)"
      />
    </div>
  );
};
