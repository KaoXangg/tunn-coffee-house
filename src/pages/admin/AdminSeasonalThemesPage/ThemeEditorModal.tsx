import React from 'react';
import { Eye, Save, Upload, X } from 'lucide-react';
import { CATEGORY_LABELS } from '../../../lib/seasonalThemes';
import type {
  AnimationIntensity,
  ParticleEffectType,
  SeasonalCategory,
  SeasonalTheme,
} from '../../../types/seasonalTheme';

type EditorTab = 'colors' | 'banner' | 'effects' | 'schedule';

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

interface ThemeEditorModalProps {
  editingTheme: SeasonalTheme;
  editorTab: EditorTab;
  saving: boolean;
  uploadingField: string | null;
  autoRemoveBg: boolean;
  onChangeTab: (tab: EditorTab) => void;
  onChangeTheme: React.Dispatch<React.SetStateAction<SeasonalTheme | null>>;
  onChangeAutoRemoveBg: (value: boolean) => void;
  onAssetUpload: (
    file: File,
    field: 'banner' | 'cornerLeft' | 'cornerRight'
  ) => void;
  onOpenFullSitePreview: (theme: SeasonalTheme) => void;
  onSave: () => void;
  onClose: () => void;
}

export const ThemeEditorModal: React.FC<ThemeEditorModalProps> = ({
  editingTheme,
  editorTab,
  saving,
  uploadingField,
  autoRemoveBg,
  onChangeTab: setEditorTab,
  onChangeTheme: setEditingTheme,
  onChangeAutoRemoveBg: setAutoRemoveBg,
  onAssetUpload: handleAssetUpload,
  onOpenFullSitePreview: openFullSitePreview,
  onSave: handleSaveEdit,
  onClose,
}) => {
  return (
        <div className="!mt-0 fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs">
          <div className="bg-white border border-coffee-beige rounded-brand shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-ivory flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-coffee-muted font-semibold">
                  THEME STUDIO EDITOR
                </p>
                <h3 className="font-serif text-xl font-semibold text-coffee-dark">
                  {editingTheme.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => onClose()}
                className="p-2 text-coffee-muted hover:text-coffee-dark"
                aria-label="Đóng"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Editor Tabs */}
            <div className="px-6 pt-3 border-b border-ivory flex gap-2 overflow-x-auto">
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
                      ? 'border-coffee text-coffee'
                      : 'border-transparent text-coffee-muted hover:text-coffee-dark'
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
                      <label className="block text-xs font-semibold uppercase tracking-wider text-coffee mb-1.5">
                        Tên Chủ Đề
                      </label>
                      <input
                        type="text"
                        value={editingTheme.name}
                        onChange={(e) =>
                          setEditingTheme({ ...editingTheme, name: e.target.value })
                        }
                        className="w-full px-3.5 py-2 text-sm border border-coffee-beige rounded-brand"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-coffee mb-1.5">
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
                        className="w-full px-3.5 py-2 text-sm border border-coffee-beige rounded-brand bg-white"
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
                    <label className="block text-xs font-semibold uppercase tracking-wider text-coffee mb-1.5">
                      Mô tả chủ đề
                    </label>
                    <input
                      type="text"
                      value={editingTheme.description}
                      onChange={(e) =>
                        setEditingTheme({ ...editingTheme, description: e.target.value })
                      }
                      className="w-full px-3.5 py-2 text-sm border border-coffee-beige rounded-brand"
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
                        <label className="block text-[11px] font-medium text-coffee">
                          {label}
                        </label>
                        <div className="flex items-center gap-2 border border-coffee-beige rounded-brand p-1.5">
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
                          <span className="text-xs font-mono text-coffee-muted">
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
                  <label className="flex items-center gap-2.5 text-sm font-medium text-coffee-dark cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingTheme.banner.enabled}
                      onChange={(e) =>
                        setEditingTheme({
                          ...editingTheme,
                          banner: { ...editingTheme.banner, enabled: e.target.checked },
                        })
                      }
                      className="rounded border-coffee-beige"
                    />
                    <span>Hiển thị Banner Chiến Dịch ở đầu website</span>
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-coffee mb-1">
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
                        className="w-full px-3.5 py-2 text-sm border border-coffee-beige rounded-brand"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-coffee mb-1">
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
                        className="w-full px-3.5 py-2 text-sm border border-coffee-beige rounded-brand"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-coffee mb-1">
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
                      className="w-full px-3.5 py-2 text-sm border border-coffee-beige rounded-brand"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-coffee mb-1">
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
                        className="w-full px-3.5 py-2 text-sm border border-coffee-beige rounded-brand"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-coffee mb-1">
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
                        className="w-full px-3.5 py-2 text-sm border border-coffee-beige rounded-brand"
                      />
                    </div>
                  </div>

                  <label className="flex items-center gap-2.5 text-sm font-medium text-coffee-dark cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingTheme.banner.showCountdown}
                      onChange={(e) =>
                        setEditingTheme({
                          ...editingTheme,
                          banner: { ...editingTheme.banner, showCountdown: e.target.checked },
                        })
                      }
                      className="rounded border-coffee-beige"
                    />
                    <span>Hiển thị đồng hồ đếm ngược (Countdown) trên Banner</span>
                  </label>

                  {/* Upload Custom Banner & Corner Decorations */}
                  <div className="pt-4 border-t border-ivory space-y-3">
                    <label className="inline-flex items-center gap-2 text-xs font-medium text-coffee cursor-pointer">
                      <input
                        type="checkbox"
                        checked={autoRemoveBg}
                        onChange={(e) => setAutoRemoveBg(e.target.checked)}
                        className="rounded border-coffee-beige"
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
                        className="p-3 border border-coffee-beige rounded-brand bg-ivory-light space-y-2"
                      >
                        <p className="text-xs font-semibold text-coffee">{item.label}</p>
                        {item.url && (
                          <div
                            className="relative h-20 rounded overflow-hidden border border-ivory"
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
                        <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white border border-coffee-beige rounded-brand cursor-pointer hover:bg-ivory">
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
                    <label className="flex items-center gap-2 text-sm font-medium text-coffee-dark cursor-pointer">
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
                    <label className="flex items-center gap-2 text-sm font-medium text-coffee-dark cursor-pointer">
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
                      <label className="block text-xs font-semibold uppercase tracking-wider text-coffee mb-1.5">
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
                        className="w-full px-3.5 py-2 text-sm border border-coffee-beige rounded-brand bg-white"
                      >
                        {PARTICLE_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-coffee mb-1.5">
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
                        className="w-full px-3.5 py-2 text-sm border border-coffee-beige rounded-brand bg-white"
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
                      <label className="block text-xs font-semibold text-coffee mb-1">
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
                        className="w-full accent-coffee"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-coffee mb-1">
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
                        className="w-full accent-coffee"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-coffee mb-1">
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
                        className="w-full accent-coffee"
                      />
                    </div>
                  </div>

                  <div className="pt-3 border-t border-ivory flex flex-wrap gap-6">
                    <label className="flex items-center gap-2 text-sm text-coffee-dark cursor-pointer">
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
                    <label className="flex items-center gap-2 text-sm text-coffee-dark cursor-pointer">
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
                  <p className="text-xs text-coffee-muted leading-relaxed bg-ivory-light p-3.5 rounded-brand border border-ivory">
                    Khi cấu hình ngày giờ bắt đầu và kết thúc, hệ thống sẽ tự động kích hoạt chủ đề đúng thời điểm và tự động khôi phục về giao diện mặc định khi hết hạn mà không cần mở trình duyệt Admin.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-coffee mb-1.5">
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
                        className="w-full px-3.5 py-2 text-sm border border-coffee-beige rounded-brand"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-coffee mb-1.5">
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
                        className="w-full px-3.5 py-2 text-sm border border-coffee-beige rounded-brand"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-coffee mb-1.5">
                        Múi giờ (Timezone)
                      </label>
                      <select
                        value={editingTheme.timezone}
                        onChange={(e) =>
                          setEditingTheme({ ...editingTheme, timezone: e.target.value })
                        }
                        className="w-full px-3.5 py-2 text-sm border border-coffee-beige rounded-brand bg-white"
                      >
                        {TIMEZONE_OPTIONS.map((tz) => (
                          <option key={tz} value={tz}>
                            {tz}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-coffee mb-1.5">
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
                        className="w-full px-3.5 py-2 text-sm border border-coffee-beige rounded-brand"
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
            <div className="px-6 py-4 border-t border-ivory bg-ivory-light flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => openFullSitePreview(editingTheme)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold border border-coffee-beige bg-white text-coffee hover:bg-ivory rounded-brand"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Xem Preview</span>
              </button>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => onClose()}
                  className="px-4 py-2 text-xs font-medium text-coffee-muted hover:text-coffee-dark"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={handleSaveEdit}
                  className="inline-flex items-center gap-1.5 px-5 py-2 text-xs uppercase tracking-wider font-semibold bg-coffee text-ivory-light hover:bg-coffee-dark rounded-brand disabled:opacity-60"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{saving ? 'Đang lưu...' : 'Lưu Chủ Đề'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
  );
};
