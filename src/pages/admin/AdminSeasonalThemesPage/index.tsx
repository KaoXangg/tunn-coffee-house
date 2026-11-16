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
  Clock,
  ExternalLink,
} from 'lucide-react';
import { useSeasonalTheme } from '../../../contexts/SeasonalThemeContext';
import { useToast } from '../../../contexts/ToastContext';
import {
  CATEGORY_LABELS,
  createBlankCustomTheme,
  getThemeScheduleState,
} from '../../../lib/seasonalThemes';
import { uploadMediaFile } from '../../../lib/mediaService';
import { ThemePreviewModal } from './ThemePreviewModal';
import { ThemeEditorModal } from './ThemeEditorModal';
import type { SeasonalTheme, SeasonalCategory } from '../../../types/seasonalTheme';

type EditorTab = 'colors' | 'banner' | 'effects' | 'schedule';
type PreviewViewport = 'desktop' | 'tablet' | 'mobile';

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
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] uppercase tracking-wider font-semibold bg-ivory text-coffee-muted rounded-full">
            Tạm tắt
          </span>
        );
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-coffee-beige pb-5">
        <div>
          <p className="text-[11px] uppercase tracking-[0.22em] text-coffee-muted font-semibold">
            SEASONAL THEME ENGINE
          </p>
          <h1 className="font-serif text-3xl font-semibold text-coffee-dark mt-1">
            Quản Lý Giao Diện Lễ Hội &amp; Chiến Dịch
          </h1>
          <p className="text-sm text-coffee-muted mt-1">
            Kích hoạt hoặc lên lịch chủ đề theo mùa để đồng bộ màu sắc, banner, trang trí và hiệu ứng trên toàn bộ website khách hàng.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {activeTheme && (
            <button
              type="button"
              onClick={handleDeactivateAll}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs uppercase tracking-wider font-semibold border border-coffee-beige bg-white text-coffee hover:bg-ivory-light rounded-brand transition-colors"
            >
              <PowerOff className="w-4 h-4" />
              <span>Về Giao diện Mặc định</span>
            </button>
          )}
          <button
            type="button"
            onClick={handleCreateCustom}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs uppercase tracking-wider font-semibold bg-coffee text-ivory-light hover:bg-coffee-dark rounded-brand transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo Chủ Đề Mới</span>
          </button>
        </div>
      </div>

      {/* Overview KPIs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white border border-coffee-beige rounded-brand p-6 flex flex-col justify-between min-h-[176px]">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] uppercase tracking-[0.2em] text-coffee-muted font-semibold">
                CHỦ ĐỀ ĐANG HIỂN THỊ TRÊN WEBSITE
              </p>
              <h2 className="font-serif text-2xl font-semibold text-coffee-dark mt-1 truncate">
                {activeTheme ? activeTheme.name : 'TUNN Coffee House (Mặc định)'}
              </h2>
              <p className="text-sm text-coffee-muted mt-1 line-clamp-2">
                {activeTheme
                  ? activeTheme.description
                  : 'Đang sử dụng bộ màu sắc thương hiệu gốc của quán. Chọn một chủ đề bên dưới để kích hoạt.'}
              </p>
            </div>
            {activeTheme && renderStatusBadge(activeTheme)}
          </div>

          <div className="mt-4 pt-4 border-t border-ivory flex items-center justify-between gap-3">
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
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-coffee-beige rounded-brand text-coffee hover:bg-ivory-light"
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
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-ivory rounded-brand text-coffee-dark hover:bg-coffee-beige"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    <span>Tùy chỉnh</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-between w-full text-xs text-coffee-muted">
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

        <div className="lg:col-span-5 bg-white border border-coffee-beige rounded-brand p-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] uppercase tracking-[0.2em] text-coffee-muted font-semibold">
              LỊCH SẮP DIỄN RA ({upcomingThemes.length})
            </p>
            <Calendar className="w-4 h-4 text-coffee-muted" />
          </div>
          {upcomingThemes.length === 0 ? (
            <p className="text-sm text-coffee-muted py-4">
              Chưa có chủ đề nào được hẹn lịch tự động. Bấm <strong>Tùy chỉnh → Lịch tự động</strong> trên bất kỳ chủ đề nào để lên lịch.
            </p>
          ) : (
            <ul className="space-y-2.5">
              {upcomingThemes.map((t) => (
                <li
                  key={t.id}
                  className="p-3 rounded-brand bg-ivory-light border border-ivory flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-sm text-coffee-dark truncate">{t.name}</p>
                    <p className="text-xs text-coffee-muted">
                      Bắt đầu: {t.schedule_start ? new Date(t.schedule_start).toLocaleString('vi-VN') : '—'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingTheme(t);
                      setEditorTab('schedule');
                    }}
                    className="text-xs font-semibold text-coffee hover:underline shrink-0"
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
              ? 'bg-coffee text-ivory-light'
              : 'bg-white border border-coffee-beige text-coffee hover:bg-ivory-light'
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
                  ? 'bg-coffee text-ivory-light'
                  : 'bg-white border border-coffee-beige text-coffee hover:bg-ivory-light'
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
                isCurrentActive ? 'border-emerald-500 ring-1 ring-emerald-500/40' : 'border-coffee-beige'
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
                  <p className="text-xs text-coffee-muted leading-relaxed">
                    {theme.description}
                  </p>
                  {(theme.schedule_start || theme.schedule_end) && (
                    <div className="mt-3 p-2.5 rounded-brand bg-ivory-light border border-ivory text-[11px] text-coffee space-y-0.5">
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
                <div className="pt-3 border-t border-ivory flex items-center justify-between gap-1">
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
                        className="inline-flex items-center gap-1 px-2 py-1.5 text-[11px] font-semibold bg-coffee text-ivory-light hover:bg-coffee-dark rounded-brand transition-colors whitespace-nowrap"
                      >
                        <Power className="w-3 h-3 shrink-0" />
                        <span>Kích hoạt</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setPreviewModalTheme(theme)}
                      className="inline-flex items-center gap-1 px-2 py-1.5 text-[11px] font-medium border border-coffee-beige text-coffee hover:bg-ivory-light rounded-brand transition-colors whitespace-nowrap"
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
                      className="inline-flex items-center gap-1 px-2 py-1.5 text-[11px] font-medium border border-coffee-beige text-coffee hover:bg-ivory-light rounded-brand transition-colors whitespace-nowrap"
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
                      className="p-1.5 border border-coffee-beige text-coffee-muted hover:text-coffee hover:bg-ivory-light rounded-brand transition-colors"
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


      {previewModalTheme && (
        <ThemePreviewModal
          previewModalTheme={previewModalTheme}
          previewViewport={previewViewport}
          onChangeViewport={setPreviewViewport}
          onClose={() => setPreviewModalTheme(null)}
          onOpenFullSitePreview={openFullSitePreview}
          onActivate={handleActivate}
        />
      )}

      {editingTheme && (
        <ThemeEditorModal
          editingTheme={editingTheme}
          editorTab={editorTab}
          saving={saving}
          uploadingField={uploadingField}
          autoRemoveBg={autoRemoveBg}
          onChangeTab={setEditorTab}
          onChangeTheme={setEditingTheme}
          onChangeAutoRemoveBg={setAutoRemoveBg}
          onAssetUpload={handleAssetUpload}
          onOpenFullSitePreview={openFullSitePreview}
          onSave={handleSaveEditor}
          onClose={() => setEditingTheme(null)}
        />
      )}
    </div>
  );
};
