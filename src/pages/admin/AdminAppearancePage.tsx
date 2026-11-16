import React, { useState } from 'react';
import { Save, RotateCcw, Loader2, Eye } from 'lucide-react';
import { useSiteData } from '../../contexts/SiteDataContext';
import { useToast } from '../../contexts/ToastContext';
import { DEFAULT_SITE_SETTINGS } from '../../lib/defaultData';

export const AdminAppearancePage: React.FC = () => {
  const { settings, updateSiteSettings } = useSiteData();
  const toast = useToast();

  const [primaryColor, setPrimaryColor] = useState(settings.primary_color);
  const [secondaryBgColor, setSecondaryBgColor] = useState(settings.secondary_bg_color);
  const [primaryBgColor, setPrimaryBgColor] = useState(settings.primary_bg_color);
  const [textPrimaryColor, setTextPrimaryColor] = useState(settings.text_primary_color);
  const [textMutedColor, setTextMutedColor] = useState(settings.text_muted_color);
  const [accentColor, setAccentColor] = useState(settings.accent_color);
  const [headingFont, setHeadingFont] = useState(settings.heading_font);
  const [bodyFont, setBodyFont] = useState(settings.body_font);
  const [borderRadius, setBorderRadius] = useState(settings.border_radius);
  const [buttonStyle, setButtonStyle] = useState<'editorial' | 'rounded' | 'pill'>(
    settings.button_style
  );
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>(settings.theme_mode);
  const [saving, setSaving] = useState(false);

  const [prevSettings, setPrevSettings] = useState(settings);
  if (settings !== prevSettings) {
    setPrevSettings(settings);
    setPrimaryColor(settings.primary_color);
    setSecondaryBgColor(settings.secondary_bg_color);
    setPrimaryBgColor(settings.primary_bg_color);
    setTextPrimaryColor(settings.text_primary_color);
    setTextMutedColor(settings.text_muted_color);
    setAccentColor(settings.accent_color);
    setHeadingFont(settings.heading_font);
    setBodyFont(settings.body_font);
    setBorderRadius(settings.border_radius);
    setButtonStyle(settings.button_style);
    setThemeMode(settings.theme_mode);
  }

  const handleResetPalette = () => {
    setPrimaryColor(DEFAULT_SITE_SETTINGS.primary_color);
    setSecondaryBgColor(DEFAULT_SITE_SETTINGS.secondary_bg_color);
    setPrimaryBgColor(DEFAULT_SITE_SETTINGS.primary_bg_color);
    setTextPrimaryColor(DEFAULT_SITE_SETTINGS.text_primary_color);
    setTextMutedColor(DEFAULT_SITE_SETTINGS.text_muted_color);
    setAccentColor(DEFAULT_SITE_SETTINGS.accent_color);
    setHeadingFont(DEFAULT_SITE_SETTINGS.heading_font);
    setBodyFont(DEFAULT_SITE_SETTINGS.body_font);
    setBorderRadius(DEFAULT_SITE_SETTINGS.border_radius);
    setButtonStyle(DEFAULT_SITE_SETTINGS.button_style);
    setThemeMode('light');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { error } = await updateSiteSettings({
        primary_color: primaryColor,
        secondary_bg_color: secondaryBgColor,
        primary_bg_color: primaryBgColor,
        text_primary_color: textPrimaryColor,
        text_muted_color: textMutedColor,
        accent_color: accentColor,
        heading_font: headingFont,
        body_font: bodyFont,
        border_radius: borderRadius,
        button_style: buttonStyle,
        theme_mode: themeMode,
      });

      if (error) {
        toast.info('Đã áp dụng bảng màu trên trình duyệt', error);
      } else {
        toast.success('Đã lưu Cấu hình Giao diện (Appearance Settings)!');
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
            Tùy Chỉnh Giao Diện & Hệ Thống Thiết Kế (Appearance)
          </h1>
          <p className="text-sm text-[#8C7565] mt-1">
            Điều chỉnh bảng màu Warm Luxury, font chữ Serif/Sans-serif, độ bo góc và kiểu nút bấm mà không làm vỡ bố cục.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleResetPalette}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold uppercase tracking-wider border border-[#D5C6AD] bg-white text-[#241914] hover:bg-[#E9E6D8] rounded-brand"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Màu chuẩn TUNN</span>
          </button>
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
            <span>Lưu Giao Diện</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <form
          onSubmit={handleSave}
          className="lg:col-span-7 bg-white border border-[#D5C6AD] rounded-brand p-6 space-y-6"
        >
          <h2 className="font-serif text-xl font-semibold text-[#241914] pb-3 border-b border-[#D5C6AD]">
            1. Bảng Màu Thương Hiệu (Brand Color Palette)
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3 bg-[#F7F5EF] border border-[#D5C6AD] rounded-brand flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-[#241914]">
                  Màu chủ đạo (Coffee Brown)
                </p>
                <p className="text-[11px] font-mono text-[#8C7565]">{primaryColor}</p>
              </div>
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="w-10 h-10 rounded cursor-pointer border border-[#D5C6AD]"
              />
            </div>

            <div className="p-3 bg-[#F7F5EF] border border-[#D5C6AD] rounded-brand flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-[#241914]">
                  Nền chính (Cream White)
                </p>
                <p className="text-[11px] font-mono text-[#8C7565]">{primaryBgColor}</p>
              </div>
              <input
                type="color"
                value={primaryBgColor}
                onChange={(e) => setPrimaryBgColor(e.target.value)}
                className="w-10 h-10 rounded cursor-pointer border border-[#D5C6AD]"
              />
            </div>

            <div className="p-3 bg-[#F7F5EF] border border-[#D5C6AD] rounded-brand flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-[#241914]">
                  Nền phụ (Warm Ivory)
                </p>
                <p className="text-[11px] font-mono text-[#8C7565]">
                  {secondaryBgColor}
                </p>
              </div>
              <input
                type="color"
                value={secondaryBgColor}
                onChange={(e) => setSecondaryBgColor(e.target.value)}
                className="w-10 h-10 rounded cursor-pointer border border-[#D5C6AD]"
              />
            </div>

            <div className="p-3 bg-[#F7F5EF] border border-[#D5C6AD] rounded-brand flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-[#241914]">
                  Màu chữ chính (Dark Espresso)
                </p>
                <p className="text-[11px] font-mono text-[#8C7565]">
                  {textPrimaryColor}
                </p>
              </div>
              <input
                type="color"
                value={textPrimaryColor}
                onChange={(e) => setTextPrimaryColor(e.target.value)}
                className="w-10 h-10 rounded cursor-pointer border border-[#D5C6AD]"
              />
            </div>

            <div className="p-3 bg-[#F7F5EF] border border-[#D5C6AD] rounded-brand flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-[#241914]">
                  Màu chữ phụ (Muted Brown)
                </p>
                <p className="text-[11px] font-mono text-[#8C7565]">{textMutedColor}</p>
              </div>
              <input
                type="color"
                value={textMutedColor}
                onChange={(e) => setTextMutedColor(e.target.value)}
                className="w-10 h-10 rounded cursor-pointer border border-[#D5C6AD]"
              />
            </div>

            <div className="p-3 bg-[#F7F5EF] border border-[#D5C6AD] rounded-brand flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-[#241914]">
                  Màu đường viền (Warm Beige)
                </p>
                <p className="text-[11px] font-mono text-[#8C7565]">{accentColor}</p>
              </div>
              <input
                type="color"
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                className="w-10 h-10 rounded cursor-pointer border border-[#D5C6AD]"
              />
            </div>
          </div>

          <h2 className="font-serif text-xl font-semibold text-[#241914] pt-4 pb-3 border-b border-[#D5C6AD]">
            2. Typography & Hình Thái Nút Bấm
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#241914] mb-1.5">
                Font tiêu đề (Serif chuẩn Tiếng Việt)
              </label>
              <select
                value={headingFont}
                onChange={(e) => setHeadingFont(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-[#F7F5EF] border border-[#D5C6AD] rounded-brand"
              >
                <option value="Lora">
                  Lora (Chuẩn dấu Tiếng Việt — Sang trọng)
                </option>
                <option value="Playfair Display">
                  Playfair Display (Cổ điển — Tương phản cao)
                </option>
                <option value="Be Vietnam Pro">
                  Be Vietnam Pro (Hiện đại — Rõ nét)
                </option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#241914] mb-1.5">
                Font nội dung (Sans-serif chuẩn Tiếng Việt)
              </label>
              <select
                value={bodyFont}
                onChange={(e) => setBodyFont(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-[#F7F5EF] border border-[#D5C6AD] rounded-brand"
              >
                <option value="Be Vietnam Pro">
                  Be Vietnam Pro (Chuẩn Tiếng Việt — Khuyên dùng)
                </option>
                <option value="Plus Jakarta Sans">
                  Plus Jakarta Sans (Tối giản hiện đại)
                </option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#241914] mb-1.5">
                Độ bo góc khung (Border Radius)
              </label>
              <select
                value={borderRadius}
                onChange={(e) => setBorderRadius(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-[#F7F5EF] border border-[#D5C6AD] rounded-brand"
              >
                <option value="0px">Vuông sắc nét (0px - Brutalist Editorial)</option>
                <option value="0.25rem">Tinh tế nhẹ (4px - Mặc định TUNN)</option>
                <option value="0.5rem">Mềm mại vừa phải (8px)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#241914] mb-1.5">
                Kiểu nút bấm (Button Style)
              </label>
              <select
                value={buttonStyle}
                onChange={(e) => setButtonStyle(e.target.value as 'editorial' | 'rounded' | 'pill')}
                className="w-full px-3.5 py-2 text-sm bg-[#F7F5EF] border border-[#D5C6AD] rounded-brand"
              >
                <option value="editorial">Editorial (Bo góc tối giản)</option>
                <option value="rounded">Rounded (Bo góc 8px)</option>
                <option value="pill">Pill (Bo tròn hai đầu)</option>
              </select>
            </div>
          </div>
        </form>

        {/* Live Design System Preview Card */}
        <div className="lg:col-span-5 sticky top-20 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#4B2E24]">
            <Eye className="w-4 h-4" />
            <span>Xem Trước Design System</span>
          </div>

          <div
            style={{
              backgroundColor: primaryBgColor,
              color: textPrimaryColor,
              borderColor: accentColor,
              borderRadius,
              fontFamily: `"${bodyFont}", sans-serif`,
            }}
            className="border p-6 shadow-md space-y-5"
          >
            <div
              style={{
                backgroundColor: secondaryBgColor,
                borderColor: accentColor,
                borderRadius,
              }}
              className="p-4 border"
            >
              <p
                style={{ color: primaryColor }}
                className="text-[10px] uppercase tracking-[0.22em] font-semibold"
              >
                TUNN DESIGN SYSTEM PREVIEW
              </p>
              <h3
                style={{ fontFamily: `"${headingFont}", serif` }}
                className="text-3xl font-normal mt-1"
              >
                Một chút ngọt ngào, cho ngày thêm trọn vẹn.
              </h3>
              <p style={{ color: textMutedColor }} className="text-xs mt-2 leading-relaxed">
                Sự kết hợp hài hòa giữa sắc kem ấm áp, nâu cà phê trầm mặc và nghệ thuật sắp đặt chữ có chủ đích.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span
                style={{
                  backgroundColor: primaryColor,
                  color: primaryBgColor,
                  borderRadius:
                    buttonStyle === 'pill'
                      ? '9999px'
                      : buttonStyle === 'rounded'
                      ? '0.5rem'
                      : borderRadius,
                }}
                className="px-5 py-2.5 text-xs uppercase tracking-widest font-semibold"
              >
                Khám phá Menu
              </span>
              <span
                style={{
                  borderColor: primaryColor,
                  color: textPrimaryColor,
                  borderRadius:
                    buttonStyle === 'pill'
                      ? '9999px'
                      : buttonStyle === 'rounded'
                      ? '0.5rem'
                      : borderRadius,
                }}
                className="px-4 py-2.5 text-xs uppercase tracking-widest font-semibold border"
              >
                Câu chuyện
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
