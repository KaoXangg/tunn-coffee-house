import React, { useState } from 'react';
import {
  Save,
  Image as ImageIcon,
  Loader2,
  Eye,
  RotateCcw,
} from 'lucide-react';
import { useSiteData } from '../../contexts/SiteDataContext';
import { useToast } from '../../contexts/ToastContext';
import { DEFAULT_HERO_CONTENT } from '../../lib/defaultData';
import { MediaPickerModal } from '../../components/common/MediaPickerModal';
import type { HeroSectionContent } from '../../types/database';

export const AdminHeroEditorPage: React.FC = () => {
  const { getSection, updatePageSection } = useSiteData();
  const toast = useToast();

  const heroSection = getSection('hero');

  const [formState, setFormState] = useState<HeroSectionContent>({
    ...DEFAULT_HERO_CONTENT,
    ...(heroSection?.content || {}),
  });
  const [isEnabled, setIsEnabled] = useState<boolean>(heroSection?.is_enabled ?? true);
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<'main' | 'secondary' | null>(null);

  const [prevHeroSection, setPrevHeroSection] = useState(heroSection);
  if (heroSection && heroSection !== prevHeroSection) {
    setPrevHeroSection(heroSection);
    if (!isDirty) {
      setFormState({
        ...DEFAULT_HERO_CONTENT,
        ...(heroSection.content || {}),
      });
      setIsEnabled(heroSection.is_enabled);
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { error } = await updatePageSection('hero', {
        title: formState.headline,
        subtitle: formState.subheadline,
        is_enabled: isEnabled,
        content: formState,
      });

      if (error) {
        toast.info('Đã cập nhật bản xem trước', error);
      } else {
        setIsDirty(false);
        toast.success(
          'Đã xuất bản Hero Section!',
          'Trang khách hàng đã tự động nhận nội dung mới.'
        );
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="space-y-6"
      onInputCapture={() => setIsDirty(true)}
      onChangeCapture={() => setIsDirty(true)}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-coffee-dark">
            Trình Chỉnh Sửa Hero Section
          </h1>
          <p className="text-sm text-coffee-muted mt-1">
            Tùy chỉnh Headline, Subtitle, hình ảnh, màu nền, độ phủ Overlay và bố cục Hero ngay lập tức.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setFormState(DEFAULT_HERO_CONTENT)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold uppercase tracking-wider border border-coffee-beige bg-white text-coffee-dark hover:bg-ivory rounded-brand"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Khôi phục mặc định</span>
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold uppercase tracking-wider bg-coffee text-ivory-light hover:bg-coffee-dark rounded-brand disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>Lưu & Xuất Bản (Publish)</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Form Controls */}
        <form
          onSubmit={handleSave}
          className="lg:col-span-7 bg-white border border-coffee-beige rounded-brand p-6 space-y-5"
        >
          <div className="flex items-center justify-between pb-3 border-b border-coffee-beige">
            <h2 className="font-serif text-xl font-semibold text-coffee-dark">
              Nội Dung & Bố Cục Hero
            </h2>
            <label className="flex items-center gap-2 text-xs font-semibold text-coffee-dark cursor-pointer">
              <input
                type="checkbox"
                checked={isEnabled}
                onChange={(e) => setIsEnabled(e.target.checked)}
                className="rounded border-coffee-beige"
              />
              <span>Hiển thị Hero Section</span>
            </label>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-coffee-dark mb-1.5">
              Dòng nhãn phía trên (Eyebrow Badge)
            </label>
            <input
              type="text"
              value={formState.badge}
              onChange={(e) => setFormState({ ...formState, badge: e.target.value })}
              className="w-full px-3.5 py-2 text-sm bg-ivory-light border border-coffee-beige rounded-brand"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-coffee-dark mb-1.5">
              Tiêu đề chính (Headline - Hỗ trợ xuống dòng)
            </label>
            <textarea
              rows={2}
              value={formState.headline}
              onChange={(e) =>
                setFormState({ ...formState, headline: e.target.value })
              }
              className="w-full px-3.5 py-2 text-sm bg-ivory-light border border-coffee-beige rounded-brand font-serif text-lg"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-coffee-dark mb-1.5">
              Mô tả phụ (Subtitle)
            </label>
            <textarea
              rows={3}
              value={formState.subheadline}
              onChange={(e) =>
                setFormState({ ...formState, subheadline: e.target.value })
              }
              className="w-full px-3.5 py-2 text-sm bg-ivory-light border border-coffee-beige rounded-brand"
            />
          </div>

          {/* CTAs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-coffee-dark mb-1.5">
                Nút CTA Chính (Nhãn)
              </label>
              <input
                type="text"
                value={formState.primary_cta_label}
                onChange={(e) =>
                  setFormState({ ...formState, primary_cta_label: e.target.value })
                }
                className="w-full px-3.5 py-2 text-sm bg-ivory-light border border-coffee-beige rounded-brand"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-coffee-dark mb-1.5">
                Liên kết CTA Chính (Href)
              </label>
              <input
                type="text"
                value={formState.primary_cta_href}
                onChange={(e) =>
                  setFormState({ ...formState, primary_cta_href: e.target.value })
                }
                className="w-full px-3.5 py-2 text-sm bg-ivory-light border border-coffee-beige rounded-brand font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-coffee-dark mb-1.5">
                Nút CTA Phụ (Nhãn)
              </label>
              <input
                type="text"
                value={formState.secondary_cta_label}
                onChange={(e) =>
                  setFormState({ ...formState, secondary_cta_label: e.target.value })
                }
                className="w-full px-3.5 py-2 text-sm bg-ivory-light border border-coffee-beige rounded-brand"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-coffee-dark mb-1.5">
                Liên kết CTA Phụ
              </label>
              <input
                type="text"
                value={formState.secondary_cta_href}
                onChange={(e) =>
                  setFormState({ ...formState, secondary_cta_href: e.target.value })
                }
                className="w-full px-3.5 py-2 text-sm bg-ivory-light border border-coffee-beige rounded-brand font-mono"
              />
            </div>
          </div>

          {/* Images */}
          <div className="space-y-4 pt-3 border-t border-coffee-beige">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-coffee-dark mb-1.5">
                Hình ảnh sản phẩm lớn (Main Hero Image)
              </label>
              <div className="flex gap-3 items-center">
                <img
                  src={formState.hero_image_url}
                  alt="Hero Main"
                  className="w-16 h-20 object-cover rounded-brand border border-coffee-beige"
                />
                <div className="flex-1 space-y-2">
                  <input
                    type="text"
                    value={formState.hero_image_url}
                    onChange={(e) =>
                      setFormState({ ...formState, hero_image_url: e.target.value })
                    }
                    className="w-full px-3 py-1.5 text-xs bg-ivory-light border border-coffee-beige rounded-brand"
                  />
                  <button
                    type="button"
                    onClick={() => setPickerTarget('main')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-ivory text-coffee-dark rounded-brand"
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>Chọn / Upload ảnh chính</span>
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-coffee-dark mb-1.5">
                Hình ảnh phụ bất đối xứng (Secondary Image)
              </label>
              <div className="flex gap-3 items-center">
                {formState.secondary_image_url && (
                  <img
                    src={formState.secondary_image_url}
                    alt="Hero Secondary"
                    className="w-16 h-20 object-cover rounded-brand border border-coffee-beige"
                  />
                )}
                <div className="flex-1 space-y-2">
                  <input
                    type="text"
                    value={formState.secondary_image_url}
                    onChange={(e) =>
                      setFormState({
                        ...formState,
                        secondary_image_url: e.target.value,
                      })
                    }
                    className="w-full px-3 py-1.5 text-xs bg-ivory-light border border-coffee-beige rounded-brand"
                  />
                  <button
                    type="button"
                    onClick={() => setPickerTarget('secondary')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-ivory text-coffee-dark rounded-brand"
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>Chọn / Upload ảnh phụ</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Colors, Overlay & Alignment */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-3 border-t border-coffee-beige">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-coffee-dark mb-1.5">
                Màu nền
              </label>
              <input
                type="color"
                value={formState.background_color}
                onChange={(e) =>
                  setFormState({ ...formState, background_color: e.target.value })
                }
                className="w-full h-9 rounded border border-coffee-beige cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-coffee-dark mb-1.5">
                Màu chữ
              </label>
              <input
                type="color"
                value={formState.text_color}
                onChange={(e) =>
                  setFormState({ ...formState, text_color: e.target.value })
                }
                className="w-full h-9 rounded border border-coffee-beige cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-coffee-dark mb-1.5">
                Độ tối Overlay ({Math.round(formState.overlay_opacity * 100)}%)
              </label>
              <input
                type="range"
                min="0"
                max="0.7"
                step="0.05"
                value={formState.overlay_opacity}
                onChange={(e) =>
                  setFormState({
                    ...formState,
                    overlay_opacity: parseFloat(e.target.value),
                  })
                }
                className="w-full mt-2 accent-coffee"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-coffee-dark mb-1.5">
                Căn lề chữ
              </label>
              <select
                value={formState.alignment}
                onChange={(e) =>
                  setFormState({
                    ...formState,
                    alignment: e.target.value as 'left' | 'center' | 'right',
                  })
                }
                className="w-full px-2.5 py-2 text-xs bg-ivory-light border border-coffee-beige rounded-brand"
              >
                <option value="left">Trái (Editorial)</option>
                <option value="center">Giữa (Centered)</option>
                <option value="right">Phải (Right)</option>
              </select>
            </div>
          </div>

          {/* Tasting Note Card */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-coffee-beige">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-coffee-dark mb-1.5">
                Tiêu đề Tasting Note trên ảnh
              </label>
              <input
                type="text"
                value={formState.featured_note_title}
                onChange={(e) =>
                  setFormState({
                    ...formState,
                    featured_note_title: e.target.value,
                  })
                }
                className="w-full px-3.5 py-2 text-sm bg-ivory-light border border-coffee-beige rounded-brand"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-coffee-dark mb-1.5">
                Mô tả Tasting Note
              </label>
              <input
                type="text"
                value={formState.featured_note_subtitle}
                onChange={(e) =>
                  setFormState({
                    ...formState,
                    featured_note_subtitle: e.target.value,
                  })
                }
                className="w-full px-3.5 py-2 text-sm bg-ivory-light border border-coffee-beige rounded-brand"
              />
            </div>
          </div>
        </form>

        {/* Live Interactive Preview */}
        <div className="lg:col-span-5 sticky top-20 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-coffee">
            <Eye className="w-4 h-4" />
            <span>Xem Trước Trực Tiếp (Live Preview)</span>
          </div>

          <div
            style={{
              backgroundColor: formState.background_color,
              color: formState.text_color,
            }}
            className="border border-coffee-beige rounded-brand p-6 shadow-md space-y-5 overflow-hidden"
          >
            <span className="inline-block px-2.5 py-1 text-[10px] uppercase tracking-widest font-semibold border border-coffee-beige bg-white/70 rounded">
              {formState.badge}
            </span>

            <h3 className="font-serif text-3xl leading-tight whitespace-pre-line">
              {formState.headline}
            </h3>

            <p className="text-xs opacity-80 leading-relaxed">
              {formState.subheadline}
            </p>

            <div className="flex flex-wrap gap-2">
              <span className="px-4 py-2 text-[10px] uppercase tracking-wider font-semibold bg-coffee text-ivory-light rounded-brand">
                {formState.primary_cta_label}
              </span>
              {formState.secondary_cta_label && (
                <span className="px-4 py-2 text-[10px] uppercase tracking-wider font-semibold border border-current rounded-brand">
                  {formState.secondary_cta_label}
                </span>
              )}
            </div>

            <div className="relative aspect-[4/3] rounded-brand overflow-hidden border border-coffee-beige">
              <img
                src={formState.hero_image_url}
                alt="Hero Preview"
                className="w-full h-full object-cover"
              />
              <div
                className="absolute inset-0 bg-coffee-dark"
                style={{ opacity: formState.overlay_opacity }}
              />
              <div className="absolute bottom-3 left-3 right-3 bg-ivory-light/95 p-3 rounded-brand border border-coffee-beige text-coffee-dark">
                <p className="font-serif text-sm font-semibold">
                  {formState.featured_note_title}
                </p>
                <p className="text-[11px] text-coffee-muted">
                  {formState.featured_note_subtitle}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <MediaPickerModal
        open={Boolean(pickerTarget)}
        onClose={() => setPickerTarget(null)}
        onSelect={(url) => {
          if (pickerTarget === 'main') {
            setFormState((prev) => ({ ...prev, hero_image_url: url }));
          } else if (pickerTarget === 'secondary') {
            setFormState((prev) => ({ ...prev, secondary_image_url: url }));
          }
        }}
        folder="hero"
        title="Chọn hình ảnh cho Hero Section"
      />
    </div>
  );
};
