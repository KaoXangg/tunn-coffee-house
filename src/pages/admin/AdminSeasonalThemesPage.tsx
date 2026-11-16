import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Eye,
  Power,
  PowerOff,
  SlidersHorizontal,
  Copy,
  Trash2,
  Plus,
  CheckCircle2,
  Clock,
  Upload,
  Monitor,
  Tablet,
  Smartphone,
  X,
  Save,
  ExternalLink,
} from 'lucide-react';
import { useSeasonalTheme } from '../../contexts/SeasonalThemeContext';
import { useToast } from '../../contexts/ToastContext';
import {
  CATEGORY_LABELS,
  createBlankCustomTheme,
  getThemeScheduleState,
} from '../../lib/seasonalThemes';
import { uploadMediaFile } from '../../lib/mediaService';
import type {
  SeasonalTheme,
  SeasonalCategory,
  AnimationIntensity,
  ParticleEffectType,
} from '../../types/seasonalTheme';

type EditorTab = 'colors' | 'banner' | 'effects' | 'schedule';
type PreviewViewport = 'desktop' | 'tablet' | 'mobile';

const PARTICLE_OPTIONS: { value: ParticleEffectType; label: string }[] = [
  { value: 'snow', label: 'Tuyết rơi Giáng Sinh (Snowfall)' },
  { value: 'tet_petals', label: 'Hoa mai & Hoa đào rơi (Tết)' },
  { value: 'bats_sparks', label: 'Dơi & Đốm sáng Halloween' },
  { value: 'hearts', label: 'Trái tim bay nhẹ (Valentine)' },
  { value: 'gold_shimmer', label: 'Hạt ánh kim (Black Friday)' },
  { value: 'lantern_glow', label: 'Đèn lồng & Ánh trăng (Trung Thu)' },
  { value: 'bubbles', label: 'Bong bóng biển (Mùa Hè)' },
  { value: 'none', label: 'Không dùng hạt bay' },
];

const INTENSITY_OPTIONS: { value: AnimationIntensity; label: string }[] = [
  { value: 'off', label: 'Tắt (Off)' },
  { value: 'subtle', label: 'Nhẹ nhàng (Subtle)' },
  { value: 'balanced', label: 'Cân bằng (Balanced)' },
  { value: 'enhanced', label: 'Sống động (Enhanced)' },
];

const TIMEZONE_OPTIONS = [
  'Asia/Ho_Chi_Minh',
  'Asia/Bangkok',
  'Asia/Singapore',
  'Asia/Tokyo',
  'UTC',
];

function toDatetimeLocal(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

export const AdminSeasonalThemesPage: React.FC = () => {
  const {
    themes,
    activeTheme,
    activateTheme,
    deactivateAllThemes,
    saveTheme,
    duplicateTheme,
    deleteTheme,
    startPreview,
  } = useSeasonalTheme();
  const toast = useToast();

  const [categoryFilter, setCategoryFilter] = useState<SeasonalCategory | 'all'>('all');
  const [editingTheme, setEditingTheme] = useState<SeasonalTheme | null>(null);
  const [editorTab, setEditorTab] = useState<EditorTab>('colors');
  const [saving, setSaving] = useState(false);
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [autoRemoveBg, setAutoRemoveBg] = useState<boolean>(true);
  const [previewModalTheme, setPreviewModalTheme] = useState<SeasonalTheme | null>(null);
  const [previewViewport, setPreviewViewport] = useState<PreviewViewport>('desktop');

  const now = useMemo(() => new Date(), []);

  const upcomingThemes = useMemo(
    () => themes.filter((t) => getThemeScheduleState(t, now) === 'upcoming'),
    [themes, now]
  );

  const filteredThemes = useMemo(
    () =>
      categoryFilter === 'all'
        ? themes
        : themes.filter((t) => t.category === categoryFilter),
    [themes, categoryFilter]
  );

  const handleActivate = async (theme: SeasonalTheme) => {
    const { error } = await activateTheme(theme.id);
    if (error) {
      toast.error(error);
    } else {
      toast.success(`Đã kích hoạt chủ đề "${theme.name}" trên toàn bộ website!`);
    }
  };

  const handleDeactivateAll = async () => {
    const { error } = await deactivateAllThemes();
    if (error) {
      toast.error(error);
    } else {
      toast.success('Đã tắt chủ đề lễ hội — website trở về giao diện TUNN mặc định.');
    }
  };

  const handleCreateCustom = () => {
    const fresh = createBlankCustomTheme('Chủ đề Lễ hội Mới');
    setEditingTheme(fresh);
    setEditorTab('colors');
  };

  const handleDuplicate = async (theme: SeasonalTheme) => {
    const { error, created } = await duplicateTheme(theme);
    if (error) {
      toast.error(error);
    } else if (created) {
      toast.success(`Đã nhân bản thành "${created.name}".`);
      setEditingTheme(created);
      setEditorTab('colors');
    }
  };

  const handleDelete = async (theme: SeasonalTheme) => {
    const { error } = await deleteTheme(theme.id);
    if (error) {
      toast.error(error);
    } else {
      toast.success(`Đã xóa chủ đề "${theme.name}".`);
    }
  };

  const handleSaveEditor = async () => {
    if (!editingTheme) return;
    if (!editingTheme.name.trim()) {
      toast.error('Vui lòng nhập tên chủ đề.');
      return;
    }
    setSaving(true);
    const { error } = await saveTheme(editingTheme);
    setSaving(false);
    if (error) {
      toast.error(error);
    } else {
      toast.success(`Đã lưu cấu hình chủ đề "${editingTheme.name}".`);
      setEditingTheme(null);
    }
  };

  const handleAssetUpload = async (
    file: File,
    field: 'banner' | 'cornerLeft' | 'cornerRight'
  ) => {
    if (!editingTheme) return;
    setUploadingField(field);
    const { asset, error } = await uploadMediaFile(file, {
      folder: `seasonal/${editingTheme.key}`,
      altText: `${editingTheme.name} ${field}`,
      removeWhiteBg: field !== 'banner' && autoRemoveBg,
    });
    setUploadingField(null);

    if (error || !asset) {
      toast.error(error || 'Không thể tải ảnh lên.');
      return;
    }

    if (field === 'banner') {
      setEditingTheme({
        ...editingTheme,
        banner: { ...editingTheme.banner, imageUrl: asset.public_url },
      });
    } else if (field === 'cornerLeft') {
      setEditingTheme({
        ...editingTheme,
        decorations: { ...editingTheme.decorations, cornerLeftAssetUrl: asset.public_url },
      });
    } else {
      setEditingTheme({
        ...editingTheme,
        decorations: { ...editingTheme.decorations, cornerRightAssetUrl: asset.public_url },
      });
    }
    toast.success('Đã tải ảnh lên thành công!');
  };

  const openFullSitePreview = (theme: SeasonalTheme) => {
    startPreview(theme.id);
    window.open(`/?preview_theme=${encodeURIComponent(theme.id)}`, '_blank', 'noopener');
  };

  const renderStatusBadge = (theme: SeasonalTheme) => {
    const state = getThemeScheduleState(theme, now);
    switch (state) {
      case 'active_manual':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] uppercase tracking-wider font-semibold bg-emerald-100 text-emerald-800 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
            Đang kích hoạt
          </span>
        );
      case 'active_scheduled':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] uppercase tracking-wider font-semibold bg-emerald-100 text-emerald-800 rounded-full">
            <Clock className="w-3 h-3" />
            Đang chạy theo lịch
          </span>
        );
      case 'upcoming':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] uppercase tracking-wider font-semibold bg-amber-100 text-amber-800 rounded-full">
            <Calendar className="w-3 h-3" />
            Sắp diễn ra
          </span>
        );
      case 'expired':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] uppercase tracking-wider font-semibold bg-stone-200 text-stone-700 rounded-full">
            Đã hết lịch
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] uppercase tracking-wider font-semibold bg-[#E9E6D8] text-[#8C7565] rounded-full">
            Tạm tắt
          </span>
        );
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#D5C6AD] pb-5">
        <div>
          <p className="text-[11px] uppercase tracking-[0.22em] text-[#8C7565] font-semibold">
            SEASONAL THEME ENGINE
          </p>
          <h1 className="font-serif text-3xl font-semibold text-[#241914] mt-1">
            Quản Lý Giao Diện Lễ Hội &amp; Chiến Dịch
          </h1>
          <p className="text-sm text-[#8C7565] mt-1">
            Kích hoạt hoặc lên lịch chủ đề theo mùa để đồng bộ màu sắc, banner, trang trí và hiệu ứng trên toàn bộ website khách hàng.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {activeTheme && (
            <button
              type="button"
              onClick={handleDeactivateAll}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs uppercase tracking-wider font-semibold border border-[#D5C6AD] bg-white text-[#4B2E24] hover:bg-[#F7F5EF] rounded-brand transition-colors"
            >
              <PowerOff className="w-4 h-4" />
              <span>Về Giao diện Mặc định</span>
            </button>
          )}
          <button
            type="button"
            onClick={handleCreateCustom}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs uppercase tracking-wider font-semibold bg-[#4B2E24] text-[#F7F5EF] hover:bg-[#241914] rounded-brand transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo Chủ Đề Mới</span>
          </button>
        </div>
      </div>

      {/* Overview KPIs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white border border-[#D5C6AD] rounded-brand p-6 flex flex-col justify-between min-h-[176px]">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] uppercase tracking-[0.2em] text-[#8C7565] font-semibold">
                CHỦ ĐỀ ĐANG HIỂN THỊ TRÊN WEBSITE
              </p>
              <h2 className="font-serif text-2xl font-semibold text-[#241914] mt-1 truncate">
                {activeTheme ? activeTheme.name : 'TUNN Coffee House (Mặc định)'}
              </h2>
              <p className="text-sm text-[#8C7565] mt-1 line-clamp-2">
                {activeTheme
                  ? activeTheme.description
                  : 'Đang sử dụng bộ màu sắc thương hiệu gốc của quán. Chọn một chủ đề bên dưới để kích hoạt.'}
              </p>
            </div>
            {activeTheme && renderStatusBadge(activeTheme)}
          </div>

          <div className="mt-4 pt-4 border-t border-[#E9E6D8] flex items-center justify-between gap-3">
            {activeTheme ? (
              <>
                <div className="flex items-center gap-2 shrink-0">
                  {[
                    activeTheme.tokens.headerBg,
                    activeTheme.tokens.primary,
                    activeTheme.tokens.accent,
                    activeTheme.tokens.background,
                    activeTheme.tokens.footerBg,
                  ].map((c, idx) => (
                    <span
                      key={idx}
                      className="w-6 h-6 rounded-full border border-black/10"
                      style={{ backgroundColor: c }}
                      title={c}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => openFullSitePreview(activeTheme)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-[#D5C6AD] rounded-brand text-[#4B2E24] hover:bg-[#F7F5EF]"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Xem Website</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingTheme(activeTheme);
                      setEditorTab('effects');
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[#E9E6D8] rounded-brand text-[#241914] hover:bg-[#D5C6AD]"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    <span>Tùy chỉnh</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-between w-full text-xs text-[#8C7565]">
                <div className="flex items-center gap-2">
                  {['#4B2E24', '#D5C6AD', '#F7F5EF', '#E9E6D8', '#241914'].map((c, idx) => (
                    <span
                      key={idx}
                      className="w-6 h-6 rounded-full border border-black/10"
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
                <span className="text-[11px] uppercase tracking-wider font-medium">
                  Giao diện mặc định
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-5 bg-white border border-[#D5C6AD] rounded-brand p-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] uppercase tracking-[0.2em] text-[#8C7565] font-semibold">
              LỊCH SẮP DIỄN RA ({upcomingThemes.length})
            </p>
            <Calendar className="w-4 h-4 text-[#8C7565]" />
          </div>
          {upcomingThemes.length === 0 ? (
            <p className="text-sm text-[#8C7565] py-4">
              Chưa có chủ đề nào được hẹn lịch tự động. Bấm <strong>Tùy chỉnh → Lịch tự động</strong> trên bất kỳ chủ đề nào để lên lịch.
            </p>
          ) : (
            <ul className="space-y-2.5">
              {upcomingThemes.map((t) => (
                <li
                  key={t.id}
                  className="p-3 rounded-brand bg-[#F7F5EF] border border-[#E9E6D8] flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-sm text-[#241914] truncate">{t.name}</p>
                    <p className="text-xs text-[#8C7565]">
                      Bắt đầu: {t.schedule_start ? new Date(t.schedule_start).toLocaleString('vi-VN') : '—'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingTheme(t);
                      setEditorTab('schedule');
                    }}
                    className="text-xs font-semibold text-[#4B2E24] hover:underline shrink-0"
                  >
                    Sửa lịch
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setCategoryFilter('all')}
          className={`px-4 py-2 text-xs uppercase tracking-wider font-semibold rounded-brand transition-colors ${
            categoryFilter === 'all'
              ? 'bg-[#4B2E24] text-[#F7F5EF]'
              : 'bg-white border border-[#D5C6AD] text-[#4B2E24] hover:bg-[#F7F5EF]'
          }`}
        >
          Tất cả ({themes.length})
        </button>
        {(Object.keys(CATEGORY_LABELS) as SeasonalCategory[]).map((cat) => {
          const count = themes.filter((t) => t.category === cat).length;
          if (count === 0) return null;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoryFilter(cat)}
              className={`px-4 py-2 text-xs uppercase tracking-wider font-semibold rounded-brand transition-colors ${
                categoryFilter === cat
                  ? 'bg-[#4B2E24] text-[#F7F5EF]'
                  : 'bg-white border border-[#D5C6AD] text-[#4B2E24] hover:bg-[#F7F5EF]'
              }`}
            >
              {CATEGORY_LABELS[cat]} ({count})
            </button>
          );
        })}
      </div>

      {/* Theme Gallery Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredThemes.map((theme) => {
          const isCurrentActive = activeTheme?.id === theme.id;
          return (
            <article
              key={theme.id}
              className={`bg-white border rounded-brand overflow-hidden flex flex-col transition-shadow hover:shadow-md ${
                isCurrentActive ? 'border-emerald-500 ring-1 ring-emerald-500/40' : 'border-[#D5C6AD]'
              }`}
            >
              {/* Visual Theme Preview Header */}
              <div
                className="p-5 text-white relative overflow-hidden"
                style={{ background: theme.tokens.gradient }}
              >
                <div className="flex items-start justify-between gap-2 relative z-10">
                  <span className="px-2.5 py-0.5 text-[10px] uppercase tracking-wider font-semibold bg-black/30 rounded-full">
                    {CATEGORY_LABELS[theme.category]}
                  </span>
                  {renderStatusBadge(theme)}
                </div>

                <h3 className="font-serif text-xl font-semibold mt-4 relative z-10">
                  {theme.name}
                </h3>

                {/* Color Swatches */}
                <div className="flex items-center gap-1.5 mt-3 relative z-10">
                  {[
                    theme.tokens.primary,
                    theme.tokens.secondary,
                    theme.tokens.accent,
                    theme.tokens.background,
                    theme.tokens.headerBg,
                    theme.tokens.footerBg,
                  ].map((color, idx) => (
                    <span
                      key={idx}
                      className="w-5 h-5 rounded-full border border-white/40 shadow-xs"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>

              {/* Body */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <p className="text-xs text-[#8C7565] leading-relaxed">
                    {theme.description}
                  </p>
                  {(theme.schedule_start || theme.schedule_end) && (
                    <div className="mt-3 p-2.5 rounded-brand bg-[#F7F5EF] border border-[#E9E6D8] text-[11px] text-[#4B2E24] space-y-0.5">
                      {theme.schedule_start && (
                        <p>
                          <strong>Bắt đầu:</strong>{' '}
                          {new Date(theme.schedule_start).toLocaleString('vi-VN')}
                        </p>
                      )}
                      {theme.schedule_end && (
                        <p>
                          <strong>Kết thúc:</strong>{' '}
                          {new Date(theme.schedule_end).toLocaleString('vi-VN')}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Action Bar (Single-row aligned) */}
                <div className="pt-3 border-t border-[#E9E6D8] flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1 min-w-0">
                    {isCurrentActive ? (
                      <button
                        type="button"
                        onClick={handleDeactivateAll}
                        className="inline-flex items-center gap-1 px-2 py-1.5 text-[11px] font-semibold bg-stone-800 text-white hover:bg-stone-900 rounded-brand transition-colors whitespace-nowrap"
                      >
                        <PowerOff className="w-3 h-3 shrink-0" />
                        <span>Tắt</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleActivate(theme)}
                        className="inline-flex items-center gap-1 px-2 py-1.5 text-[11px] font-semibold bg-[#4B2E24] text-[#F7F5EF] hover:bg-[#241914] rounded-brand transition-colors whitespace-nowrap"
                      >
                        <Power className="w-3 h-3 shrink-0" />
                        <span>Kích hoạt</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setPreviewModalTheme(theme)}
                      className="inline-flex items-center gap-1 px-2 py-1.5 text-[11px] font-medium border border-[#D5C6AD] text-[#4B2E24] hover:bg-[#F7F5EF] rounded-brand transition-colors whitespace-nowrap"
                      title="Xem trước"
                    >
                      <Eye className="w-3 h-3 shrink-0" />
                      <span>Preview</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setEditingTheme(theme);
                        setEditorTab('colors');
                      }}
                      className="inline-flex items-center gap-1 px-2 py-1.5 text-[11px] font-medium border border-[#D5C6AD] text-[#4B2E24] hover:bg-[#F7F5EF] rounded-brand transition-colors whitespace-nowrap"
                      title="Tùy chỉnh & Lên lịch"
                    >
                      <SlidersHorizontal className="w-3 h-3 shrink-0" />
                      <span>Tùy chỉnh</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleDuplicate(theme)}
                      className="p-1.5 border border-[#D5C6AD] text-[#8C7565] hover:text-[#4B2E24] hover:bg-[#F7F5EF] rounded-brand transition-colors"
                      title="Nhân bản chủ đề"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>

                    {!theme.is_preset && (
                      <button
                        type="button"
                        onClick={() => handleDelete(theme)}
                        className="p-1.5 border border-red-200 text-red-600 hover:bg-red-50 rounded-brand transition-colors"
                        title="Xóa chủ đề"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {/* Modal 1: Responsive Preview (Desktop / Tablet / Mobile + Full Live Site Preview) */}
      {previewModalTheme && (
        <div className="!mt-0 fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-white border border-[#D5C6AD] rounded-brand shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden">
            <div className="px-5 py-4 border-b border-[#E9E6D8] flex flex-wrap lg:flex-nowrap items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] uppercase tracking-[0.2em] text-[#8C7565] font-semibold">
                  LIVE THEME PREVIEW
                </p>
                <h3
                  className="font-serif text-lg sm:text-xl font-semibold text-[#241914] truncate"
                  title={previewModalTheme.name}
                >
                  {previewModalTheme.name}
                </h3>
              </div>

              <div className="flex items-center gap-1.5 bg-[#F7F5EF] p-1 rounded-brand border border-[#E9E6D8] shrink-0">
                {(
                  [
                    { id: 'desktop', icon: Monitor, label: 'Desktop' },
                    { id: 'tablet', icon: Tablet, label: 'Tablet' },
                    { id: 'mobile', icon: Smartphone, label: 'Mobile' },
                  ] as const
                ).map((vp) => {
                  const Icon = vp.icon;
                  return (
                    <button
                      key={vp.id}
                      type="button"
                      onClick={() => setPreviewViewport(vp.id)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-brand transition-colors ${
                        previewViewport === vp.id
                          ? 'bg-[#4B2E24] text-[#F7F5EF]'
                          : 'text-[#8C7565] hover:text-[#241914]'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{vp.label}</span>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => openFullSitePreview(previewModalTheme)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold border border-[#4B2E24] text-[#4B2E24] hover:bg-[#F7F5EF] rounded-brand"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Mở Preview Toàn Trang</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleActivate(previewModalTheme);
                    setPreviewModalTheme(null);
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-[#4B2E24] text-[#F7F5EF] hover:bg-[#241914] rounded-brand"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Kích hoạt ngay</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewModalTheme(null)}
                  className="p-2 text-[#8C7565] hover:text-[#241914]"
                  aria-label="Đóng"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto bg-[#E9E6D8] p-6 flex justify-center">
              <div
                style={{
                  width:
                    previewViewport === 'mobile'
                      ? '375px'
                      : previewViewport === 'tablet'
                      ? '768px'
                      : '100%',
                  backgroundColor: previewModalTheme.tokens.background,
                  color: previewModalTheme.tokens.text,
                  borderColor: previewModalTheme.tokens.border,
                }}
                className="border rounded-brand overflow-hidden shadow-xl transition-all duration-300 flex flex-col"
              >
                {/* Simulated Header */}
                <div
                  style={{
                    backgroundColor: previewModalTheme.tokens.headerBg,
                    color: '#F7F5EF',
                  }}
                  className="px-5 py-3.5 flex items-center justify-between text-xs"
                >
                  <span className="font-serif font-semibold tracking-wider">TUNN COFFEE HOUSE</span>
                  <span
                    style={{
                      backgroundColor: previewModalTheme.tokens.buttonBg,
                      color: previewModalTheme.tokens.buttonText,
                    }}
                    className="px-3 py-1 rounded-brand font-semibold"
                  >
                    Thực đơn
                  </span>
                </div>

                {/* Simulated Seasonal Banner */}
                {previewModalTheme.banner.enabled && (
                  <div
                    style={{ background: previewModalTheme.tokens.gradient }}
                    className="px-6 py-4 text-white"
                  >
                    <p
                      className="text-[10px] uppercase tracking-widest font-semibold"
                      style={{ color: previewModalTheme.tokens.accent }}
                    >
                      {previewModalTheme.banner.eyebrow}
                    </p>
                    <p className="font-serif text-lg font-semibold mt-0.5">
                      {previewModalTheme.banner.title}
                    </p>
                    <p className="text-xs opacity-85 mt-0.5">
                      {previewModalTheme.banner.subtitle}
                    </p>
                  </div>
                )}

                {/* Simulated Content Cards */}
                <div className="p-6 space-y-5 flex-1">
                  <div>
                    <p
                      className="text-[10px] uppercase tracking-[0.2em] font-semibold"
                      style={{ color: previewModalTheme.tokens.primary }}
                    >
                      BỘ SƯU TẬP THEO MÙA
                    </p>
                    <h4 className="font-serif text-2xl font-semibold mt-1">
                      Trà &amp; Cà Phê Thủ Công
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { name: 'Ô Long Nướng Kem Phô Mai', price: '59.000 đ' },
                      { name: 'Matcha Uji Latte Lạnh', price: '68.000 đ' },
                    ].map((item) => (
                      <div
                        key={item.name}
                        style={{
                          backgroundColor: previewModalTheme.tokens.surface,
                          borderColor: previewModalTheme.tokens.border,
                        }}
                        className="p-4 border rounded-brand flex items-center justify-between gap-3"
                      >
                        <div>
                          <p className="font-serif font-semibold">{item.name}</p>
                          <p
                            className="text-xs mt-1"
                            style={{ color: previewModalTheme.tokens.textMuted }}
                          >
                            Hương vị đặc trưng theo mùa
                          </p>
                        </div>
                        <span
                          className="font-serif font-bold shrink-0"
                          style={{ color: previewModalTheme.tokens.primary }}
                        >
                          {item.price}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Simulated Footer */}
                <div
                  style={{
                    backgroundColor: previewModalTheme.tokens.footerBg,
                    color: '#E9E6D8',
                  }}
                  className="px-6 py-4 text-xs flex items-center justify-between"
                >
                  <span>© TUNN Coffee House</span>
                  <span>Hiệu ứng: {previewModalTheme.decorations.particleType}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Theme Studio Editor (Colors, Banner & Assets, Effects, Scheduler) */}
      {editingTheme && (
        <div className="!mt-0 fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs">
          <div className="bg-white border border-[#D5C6AD] rounded-brand shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-[#E9E6D8] flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-[#8C7565] font-semibold">
                  THEME STUDIO EDITOR
                </p>
                <h3 className="font-serif text-xl font-semibold text-[#241914]">
                  {editingTheme.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingTheme(null)}
                className="p-2 text-[#8C7565] hover:text-[#241914]"
                aria-label="Đóng"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Editor Tabs */}
            <div className="px-6 pt-3 border-b border-[#E9E6D8] flex gap-2 overflow-x-auto">
              {(
                [
                  { id: 'colors', label: 'Màu sắc & Giao diện' },
                  { id: 'banner', label: 'Banner & Tài sản' },
                  { id: 'effects', label: 'Hiệu ứng & Animation' },
                  { id: 'schedule', label: 'Lịch tự động' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setEditorTab(tab.id)}
                  className={`px-4 py-2.5 text-xs uppercase tracking-wider font-semibold border-b-2 whitespace-nowrap transition-colors ${
                    editorTab === tab.id
                      ? 'border-[#4B2E24] text-[#4B2E24]'
                      : 'border-transparent text-[#8C7565] hover:text-[#241914]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Editor Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {editorTab === 'colors' && (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-[#4B2E24] mb-1.5">
                        Tên Chủ Đề
                      </label>
                      <input
                        type="text"
                        value={editingTheme.name}
                        onChange={(e) =>
                          setEditingTheme({ ...editingTheme, name: e.target.value })
                        }
                        className="w-full px-3.5 py-2 text-sm border border-[#D5C6AD] rounded-brand"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-[#4B2E24] mb-1.5">
                        Phân loại
                      </label>
                      <select
                        value={editingTheme.category}
                        onChange={(e) =>
                          setEditingTheme({
                            ...editingTheme,
                            category: e.target.value as SeasonalCategory,
                          })
                        }
                        className="w-full px-3.5 py-2 text-sm border border-[#D5C6AD] rounded-brand bg-white"
                      >
                        {(Object.keys(CATEGORY_LABELS) as SeasonalCategory[]).map((c) => (
                          <option key={c} value={c}>
                            {CATEGORY_LABELS[c]}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#4B2E24] mb-1.5">
                      Mô tả chủ đề
                    </label>
                    <input
                      type="text"
                      value={editingTheme.description}
                      onChange={(e) =>
                        setEditingTheme({ ...editingTheme, description: e.target.value })
                      }
                      className="w-full px-3.5 py-2 text-sm border border-[#D5C6AD] rounded-brand"
                    />
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {(
                      [
                        ['primary', 'Màu chính'],
                        ['secondary', 'Màu phụ'],
                        ['accent', 'Điểm nhấn'],
                        ['background', 'Nền trang'],
                        ['surface', 'Nền thẻ/card'],
                        ['text', 'Chữ chính'],
                        ['textMuted', 'Chữ phụ'],
                        ['border', 'Đường viền'],
                        ['headerBg', 'Nền Header'],
                        ['footerBg', 'Nền Footer'],
                        ['buttonBg', 'Nền Nút bấm'],
                        ['buttonText', 'Chữ Nút bấm'],
                      ] as const
                    ).map(([key, label]) => (
                      <div key={key} className="space-y-1">
                        <label className="block text-[11px] font-medium text-[#4B2E24]">
                          {label}
                        </label>
                        <div className="flex items-center gap-2 border border-[#D5C6AD] rounded-brand p-1.5">
                          <input
                            type="color"
                            value={editingTheme.tokens[key]}
                            onChange={(e) =>
                              setEditingTheme({
                                ...editingTheme,
                                tokens: { ...editingTheme.tokens, [key]: e.target.value },
                              })
                            }
                            className="w-7 h-7 rounded cursor-pointer border-0 p-0"
                          />
                          <span className="text-xs font-mono text-[#8C7565]">
                            {editingTheme.tokens[key]}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {editorTab === 'banner' && (
                <div className="space-y-5">
                  <label className="flex items-center gap-2.5 text-sm font-medium text-[#241914] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingTheme.banner.enabled}
                      onChange={(e) =>
                        setEditingTheme({
                          ...editingTheme,
                          banner: { ...editingTheme.banner, enabled: e.target.checked },
                        })
                      }
                      className="rounded border-[#D5C6AD]"
                    />
                    <span>Hiển thị Banner Chiến Dịch ở đầu website</span>
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-[#4B2E24] mb-1">
                        Nhãn nhỏ (Eyebrow)
                      </label>
                      <input
                        type="text"
                        value={editingTheme.banner.eyebrow}
                        onChange={(e) =>
                          setEditingTheme({
                            ...editingTheme,
                            banner: { ...editingTheme.banner, eyebrow: e.target.value },
                          })
                        }
                        className="w-full px-3.5 py-2 text-sm border border-[#D5C6AD] rounded-brand"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-[#4B2E24] mb-1">
                        Tiêu đề Banner
                      </label>
                      <input
                        type="text"
                        value={editingTheme.banner.title}
                        onChange={(e) =>
                          setEditingTheme({
                            ...editingTheme,
                            banner: { ...editingTheme.banner, title: e.target.value },
                          })
                        }
                        className="w-full px-3.5 py-2 text-sm border border-[#D5C6AD] rounded-brand"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#4B2E24] mb-1">
                      Mô tả ngắn Banner
                    </label>
                    <input
                      type="text"
                      value={editingTheme.banner.subtitle}
                      onChange={(e) =>
                        setEditingTheme({
                          ...editingTheme,
                          banner: { ...editingTheme.banner, subtitle: e.target.value },
                        })
                      }
                      className="w-full px-3.5 py-2 text-sm border border-[#D5C6AD] rounded-brand"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-[#4B2E24] mb-1">
                        Chữ Nút CTA
                      </label>
                      <input
                        type="text"
                        value={editingTheme.banner.ctaLabel}
                        onChange={(e) =>
                          setEditingTheme({
                            ...editingTheme,
                            banner: { ...editingTheme.banner, ctaLabel: e.target.value },
                          })
                        }
                        className="w-full px-3.5 py-2 text-sm border border-[#D5C6AD] rounded-brand"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-[#4B2E24] mb-1">
                        Đường dẫn CTA
                      </label>
                      <input
                        type="text"
                        value={editingTheme.banner.ctaUrl}
                        onChange={(e) =>
                          setEditingTheme({
                            ...editingTheme,
                            banner: { ...editingTheme.banner, ctaUrl: e.target.value },
                          })
                        }
                        className="w-full px-3.5 py-2 text-sm border border-[#D5C6AD] rounded-brand"
                      />
                    </div>
                  </div>

                  <label className="flex items-center gap-2.5 text-sm font-medium text-[#241914] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingTheme.banner.showCountdown}
                      onChange={(e) =>
                        setEditingTheme({
                          ...editingTheme,
                          banner: { ...editingTheme.banner, showCountdown: e.target.checked },
                        })
                      }
                      className="rounded border-[#D5C6AD]"
                    />
                    <span>Hiển thị đồng hồ đếm ngược (Countdown) trên Banner</span>
                  </label>

                  {/* Upload Custom Banner & Corner Decorations */}
                  <div className="pt-4 border-t border-[#E9E6D8] space-y-3">
                    <label className="inline-flex items-center gap-2 text-xs font-medium text-[#4B2E24] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={autoRemoveBg}
                        onChange={(e) => setAutoRemoveBg(e.target.checked)}
                        className="rounded border-[#D5C6AD]"
                      />
                      <span>Tự động tách nền trắng/đồng màu khi tải ảnh trang trí góc</span>
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {(
                      [
                        {
                          key: 'banner',
                          label: 'Ảnh nền Banner',
                          url: editingTheme.banner.imageUrl,
                          clear: () =>
                            setEditingTheme({
                              ...editingTheme,
                              banner: { ...editingTheme.banner, imageUrl: '' },
                            }),
                        },
                        {
                          key: 'cornerLeft',
                          label: 'Trang trí Góc Trái (PNG/WebP)',
                          url: editingTheme.decorations.cornerLeftAssetUrl,
                          clear: () =>
                            setEditingTheme({
                              ...editingTheme,
                              decorations: {
                                ...editingTheme.decorations,
                                cornerLeftAssetUrl: '',
                              },
                            }),
                        },
                        {
                          key: 'cornerRight',
                          label: 'Trang trí Góc Phải (PNG/WebP)',
                          url: editingTheme.decorations.cornerRightAssetUrl,
                          clear: () =>
                            setEditingTheme({
                              ...editingTheme,
                              decorations: {
                                ...editingTheme.decorations,
                                cornerRightAssetUrl: '',
                              },
                            }),
                        },
                      ] as const
                    ).map((item) => (
                      <div
                        key={item.key}
                        className="p-3 border border-[#D5C6AD] rounded-brand bg-[#F7F5EF] space-y-2"
                      >
                        <p className="text-xs font-semibold text-[#4B2E24]">{item.label}</p>
                        {item.url && (
                          <div
                            className="relative h-20 rounded overflow-hidden border border-[#E9E6D8]"
                            style={
                              item.key !== 'banner'
                                ? {
                                    backgroundImage:
                                      'linear-gradient(45deg, #e5e7eb 25%, transparent 25%), linear-gradient(-45deg, #e5e7eb 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e5e7eb 75%), linear-gradient(-45deg, transparent 75%, #e5e7eb 75%)',
                                    backgroundSize: '12px 12px',
                                    backgroundPosition: '0 0, 0 6px, 6px -6px, -6px 0',
                                    backgroundColor: '#ffffff',
                                  }
                                : { backgroundColor: '#ffffff' }
                            }
                          >
                            <img
                              src={item.url}
                              alt={item.label}
                              className="w-full h-full object-contain"
                            />
                            <button
                              type="button"
                              onClick={item.clear}
                              className="absolute top-1 right-1 p-1 bg-white/90 text-red-600 rounded-full shadow"
                              title="Xóa ảnh"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                        <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white border border-[#D5C6AD] rounded-brand cursor-pointer hover:bg-[#E9E6D8]">
                          <Upload className="w-3.5 h-3.5" />
                          <span>
                            {uploadingField === item.key ? 'Đang tải...' : 'Tải ảnh lên'}
                          </span>
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleAssetUpload(file, item.key);
                            }}
                          />
                        </label>
                      </div>
                    ))}
                    </div>
                  </div>
                </div>
              )}

              {editorTab === 'effects' && (
                <div className="space-y-5">
                  <div className="flex flex-wrap gap-6">
                    <label className="flex items-center gap-2 text-sm font-medium text-[#241914] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editingTheme.decorations.enabled}
                        onChange={(e) =>
                          setEditingTheme({
                            ...editingTheme,
                            decorations: {
                              ...editingTheme.decorations,
                              enabled: e.target.checked,
                            },
                          })
                        }
                      />
                      <span>Bật lớp trang trí lễ hội</span>
                    </label>
                    <label className="flex items-center gap-2 text-sm font-medium text-[#241914] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editingTheme.decorations.particlesEnabled}
                        onChange={(e) =>
                          setEditingTheme({
                            ...editingTheme,
                            decorations: {
                              ...editingTheme.decorations,
                              particlesEnabled: e.target.checked,
                            },
                          })
                        }
                      />
                      <span>Bật hiệu ứng hạt bay (Particles)</span>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-[#4B2E24] mb-1.5">
                        Kiểu hiệu ứng đặc trưng
                      </label>
                      <select
                        value={editingTheme.decorations.particleType}
                        onChange={(e) =>
                          setEditingTheme({
                            ...editingTheme,
                            decorations: {
                              ...editingTheme.decorations,
                              particleType: e.target.value as ParticleEffectType,
                            },
                          })
                        }
                        className="w-full px-3.5 py-2 text-sm border border-[#D5C6AD] rounded-brand bg-white"
                      >
                        {PARTICLE_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-[#4B2E24] mb-1.5">
                        Mức độ Animation (Intensity)
                      </label>
                      <select
                        value={editingTheme.decorations.intensity}
                        onChange={(e) =>
                          setEditingTheme({
                            ...editingTheme,
                            decorations: {
                              ...editingTheme.decorations,
                              intensity: e.target.value as AnimationIntensity,
                            },
                          })
                        }
                        className="w-full px-3.5 py-2 text-sm border border-[#D5C6AD] rounded-brand bg-white"
                      >
                        {INTENSITY_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#4B2E24] mb-1">
                        Mật độ hạt ({editingTheme.decorations.particleDensity}%)
                      </label>
                      <input
                        type="range"
                        min={10}
                        max={100}
                        value={editingTheme.decorations.particleDensity}
                        onChange={(e) =>
                          setEditingTheme({
                            ...editingTheme,
                            decorations: {
                              ...editingTheme.decorations,
                              particleDensity: Number(e.target.value),
                            },
                          })
                        }
                        className="w-full accent-[#4B2E24]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#4B2E24] mb-1">
                        Tốc độ chuyển động ({editingTheme.decorations.speed}x)
                      </label>
                      <input
                        type="range"
                        min={0.5}
                        max={2}
                        step={0.1}
                        value={editingTheme.decorations.speed}
                        onChange={(e) =>
                          setEditingTheme({
                            ...editingTheme,
                            decorations: {
                              ...editingTheme.decorations,
                              speed: Number(e.target.value),
                            },
                          })
                        }
                        className="w-full accent-[#4B2E24]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#4B2E24] mb-1">
                        Độ phát sáng nền ({editingTheme.decorations.glowIntensity}%)
                      </label>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={editingTheme.decorations.glowIntensity}
                        onChange={(e) =>
                          setEditingTheme({
                            ...editingTheme,
                            decorations: {
                              ...editingTheme.decorations,
                              glowIntensity: Number(e.target.value),
                            },
                          })
                        }
                        className="w-full accent-[#4B2E24]"
                      />
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#E9E6D8] flex flex-wrap gap-6">
                    <label className="flex items-center gap-2 text-sm text-[#241914] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editingTheme.decorations.enableDesktop}
                        onChange={(e) =>
                          setEditingTheme({
                            ...editingTheme,
                            decorations: {
                              ...editingTheme.decorations,
                              enableDesktop: e.target.checked,
                            },
                          })
                        }
                      />
                      <span>Bật hiệu ứng trên Desktop</span>
                    </label>
                    <label className="flex items-center gap-2 text-sm text-[#241914] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editingTheme.decorations.enableMobile}
                        onChange={(e) =>
                          setEditingTheme({
                            ...editingTheme,
                            decorations: {
                              ...editingTheme.decorations,
                              enableMobile: e.target.checked,
                            },
                          })
                        }
                      />
                      <span>Bật hiệu ứng nhẹ trên Mobile (giảm số hạt tự động)</span>
                    </label>
                  </div>
                </div>
              )}

              {editorTab === 'schedule' && (
                <div className="space-y-5">
                  <p className="text-xs text-[#8C7565] leading-relaxed bg-[#F7F5EF] p-3.5 rounded-brand border border-[#E9E6D8]">
                    Khi cấu hình ngày giờ bắt đầu và kết thúc, hệ thống sẽ tự động kích hoạt chủ đề đúng thời điểm và tự động khôi phục về giao diện mặc định khi hết hạn mà không cần mở trình duyệt Admin.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-[#4B2E24] mb-1.5">
                        Ngày &amp; Giờ Bắt đầu
                      </label>
                      <input
                        type="datetime-local"
                        value={toDatetimeLocal(editingTheme.schedule_start)}
                        onChange={(e) =>
                          setEditingTheme({
                            ...editingTheme,
                            schedule_start: e.target.value
                              ? new Date(e.target.value).toISOString()
                              : null,
                          })
                        }
                        className="w-full px-3.5 py-2 text-sm border border-[#D5C6AD] rounded-brand"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-[#4B2E24] mb-1.5">
                        Ngày &amp; Giờ Kết thúc
                      </label>
                      <input
                        type="datetime-local"
                        value={toDatetimeLocal(editingTheme.schedule_end)}
                        onChange={(e) =>
                          setEditingTheme({
                            ...editingTheme,
                            schedule_end: e.target.value
                              ? new Date(e.target.value).toISOString()
                              : null,
                          })
                        }
                        className="w-full px-3.5 py-2 text-sm border border-[#D5C6AD] rounded-brand"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-[#4B2E24] mb-1.5">
                        Múi giờ (Timezone)
                      </label>
                      <select
                        value={editingTheme.timezone}
                        onChange={(e) =>
                          setEditingTheme({ ...editingTheme, timezone: e.target.value })
                        }
                        className="w-full px-3.5 py-2 text-sm border border-[#D5C6AD] rounded-brand bg-white"
                      >
                        {TIMEZONE_OPTIONS.map((tz) => (
                          <option key={tz} value={tz}>
                            {tz}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-[#4B2E24] mb-1.5">
                        Độ ưu tiên (Số lớn ưu tiên hơn khi trùng lịch)
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={editingTheme.priority}
                        onChange={(e) =>
                          setEditingTheme({
                            ...editingTheme,
                            priority: Number(e.target.value) || 10,
                          })
                        }
                        className="w-full px-3.5 py-2 text-sm border border-[#D5C6AD] rounded-brand"
                      />
                    </div>
                  </div>

                  {(editingTheme.schedule_start || editingTheme.schedule_end) && (
                    <button
                      type="button"
                      onClick={() =>
                        setEditingTheme({
                          ...editingTheme,
                          schedule_start: null,
                          schedule_end: null,
                        })
                      }
                      className="text-xs font-semibold text-red-700 hover:underline"
                    >
                      Xóa lịch hẹn tự động
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Editor Footer */}
            <div className="px-6 py-4 border-t border-[#E9E6D8] bg-[#F7F5EF] flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => openFullSitePreview(editingTheme)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold border border-[#D5C6AD] bg-white text-[#4B2E24] hover:bg-[#E9E6D8] rounded-brand"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Xem Preview</span>
              </button>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingTheme(null)}
                  className="px-4 py-2 text-xs font-medium text-[#8C7565] hover:text-[#241914]"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={handleSaveEditor}
                  className="inline-flex items-center gap-1.5 px-5 py-2 text-xs uppercase tracking-wider font-semibold bg-[#4B2E24] text-[#F7F5EF] hover:bg-[#241914] rounded-brand disabled:opacity-60"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{saving ? 'Đang lưu...' : 'Lưu Chủ Đề'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
