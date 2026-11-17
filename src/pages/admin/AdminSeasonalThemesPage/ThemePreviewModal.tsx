import React from 'react';
import { CheckCircle2, ExternalLink, Monitor, Smartphone, Tablet, X } from 'lucide-react';
import type { SeasonalTheme } from '../../../types/seasonalTheme';

type PreviewViewport = 'desktop' | 'tablet' | 'mobile';

interface ThemePreviewModalProps {
  previewModalTheme: SeasonalTheme;
  previewViewport: PreviewViewport;
  onChangeViewport: (viewport: PreviewViewport) => void;
  onClose: () => void;
  onOpenFullSitePreview: (theme: SeasonalTheme) => void;
  onActivate: (theme: SeasonalTheme) => void;
}

export const ThemePreviewModal: React.FC<ThemePreviewModalProps> = ({
  previewModalTheme,
  previewViewport,
  onChangeViewport: setPreviewViewport,
  onClose,
  onOpenFullSitePreview: openFullSitePreview,
  onActivate: handleActivate,
}) => {
  return (
        <div className="!mt-0 fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-white border border-coffee-beige rounded-brand shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden">
            <div className="px-5 py-4 border-b border-ivory flex flex-wrap lg:flex-nowrap items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] uppercase tracking-[0.2em] text-coffee-muted font-semibold">
                  LIVE THEME PREVIEW
                </p>
                <h3
                  className="font-serif text-lg sm:text-xl font-semibold text-coffee-dark truncate"
                  title={previewModalTheme.name}
                >
                  {previewModalTheme.name}
                </h3>
              </div>

              <div className="flex items-center gap-1.5 bg-ivory-light p-1 rounded-brand border border-ivory shrink-0">
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
                          ? 'bg-coffee text-ivory-light'
                          : 'text-coffee-muted hover:text-coffee-dark'
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
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold border border-coffee text-coffee hover:bg-ivory-light rounded-brand"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Mở Preview Toàn Trang</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleActivate(previewModalTheme);
                    onClose();
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-coffee text-ivory-light hover:bg-coffee-dark rounded-brand"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Kích hoạt ngay</span>
                </button>
                <button
                  type="button"
                  onClick={() => onClose()}
                  className="p-2 text-coffee-muted hover:text-coffee-dark"
                  aria-label="Đóng"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto bg-ivory p-6 flex justify-center">
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
  );
};
