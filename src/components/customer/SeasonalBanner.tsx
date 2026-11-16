import React, { useState, useEffect } from 'react';
import { ArrowUpRight, Clock, Eye, Check, X } from 'lucide-react';
import { useSeasonalTheme } from '../../contexts/SeasonalThemeContext';
import { useToast } from '../../contexts/ToastContext';
import { sanitizeUrl } from '../../lib/utils';

export const SeasonalPreviewBar: React.FC = () => {
  const { previewTheme, isPreviewing, exitPreview, activateTheme } = useSeasonalTheme();
  const toast = useToast();
  const [activating, setActivating] = useState(false);

  if (!isPreviewing || !previewTheme) return null;

  const handleActivate = async () => {
    setActivating(true);
    const { error } = await activateTheme(previewTheme.id);
    setActivating(false);
    if (error) {
      toast.error(error);
      return;
    }
    exitPreview();
    toast.success(`Đã kích hoạt giao diện "${previewTheme.name}" cho toàn bộ website!`);
  };

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[95] w-[94vw] max-w-2xl bg-[#1C1410] text-[#F7F5EF] border border-[#D4A574]/50 rounded-brand shadow-2xl px-4 py-3 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2.5 text-xs">
        <span className="p-1.5 rounded-brand bg-[#D4A574]/20 text-[#D4A574]">
          <Eye className="w-4 h-4" />
        </span>
        <div>
          <p className="font-semibold text-[#F7F5EF]">
            Chế độ Xem trước: <span className="text-[#D4A574]">{previewTheme.name}</span>
          </p>
          <p className="text-[11px] text-[#D5C6AD]/80">
            Chỉ hiển thị trong phiên của bạn - khách hàng chưa bị ảnh hưởng.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        <button
          type="button"
          onClick={exitPreview}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-white/20 text-[#E9E6D8] hover:bg-white/10 rounded-brand transition-colors"
        >
          <X className="w-3.5 h-3.5" />
          <span>Thoát Preview</span>
        </button>
        <button
          type="button"
          disabled={activating}
          onClick={handleActivate}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-[#D4A574] text-[#140F0C] hover:bg-[#E5B887] rounded-brand transition-colors disabled:opacity-60"
        >
          <Check className="w-3.5 h-3.5" />
          <span>{activating ? 'Đang bật...' : 'Kích hoạt ngay'}</span>
        </button>
      </div>
    </div>
  );
};

export const SeasonalBanner: React.FC = () => {
  const { effectiveTheme } = useSeasonalTheme();
  const [countdown, setCountdown] = useState<{ d: number; h: number; m: number; s: number } | null>(null);

  useEffect(() => {
    if (!effectiveTheme?.banner.enabled || !effectiveTheme.banner.showCountdown) {
      return;
    }

    const compute = () => {
      const now = Date.now();
      let target = effectiveTheme.schedule_end
        ? new Date(effectiveTheme.schedule_end).getTime()
        : NaN;

      // Fallback to end of current day for campaigns without an explicit end date
      if (Number.isNaN(target) || target <= now) {
        const eod = new Date();
        eod.setHours(23, 59, 59, 999);
        target = eod.getTime();
      }

      const diff = Math.max(0, target - now);
      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
      const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const m = Math.floor((diff / (1000 * 60)) % 60);
      const s = Math.floor((diff / 1000) % 60);
      setCountdown({ d, h, m, s });
    };

    const init = setTimeout(compute, 0);
    const timer = setInterval(compute, 1000);
    return () => {
      clearTimeout(init);
      clearInterval(timer);
    };
  }, [effectiveTheme]);

  if (!effectiveTheme || !effectiveTheme.banner.enabled) return null;

  const { banner, tokens } = effectiveTheme;
  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <section
      style={{
        background: banner.imageUrl
          ? `linear-gradient(to right, rgba(15, 10, 8, 0.78), rgba(15, 10, 8, 0.55)), url(${banner.imageUrl}) center/cover`
          : tokens.gradient,
        borderColor: tokens.border,
      }}
      className="relative border-b text-white overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-4 sm:py-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1 max-w-2xl">
          {banner.eyebrow && (
            <p
              className="text-[10px] uppercase tracking-[0.25em] font-semibold opacity-90"
              style={{ color: tokens.accent }}
            >
              {banner.eyebrow}
            </p>
          )}
          <h2 className="font-serif text-lg sm:text-2xl font-semibold text-white leading-snug">
            {banner.title}
          </h2>
          {banner.subtitle && (
            <p className="text-xs sm:text-sm text-white/85 leading-relaxed">
              {banner.subtitle}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {countdown && (
            <div className="inline-flex items-center gap-2 px-3 py-2 rounded-brand bg-black/35 border border-white/20 text-xs font-mono">
              <Clock className="w-3.5 h-3.5" style={{ color: tokens.accent }} />
              <span>
                {countdown.d > 0 ? `${countdown.d}n ` : ''}
                {pad(countdown.h)}:{pad(countdown.m)}:{pad(countdown.s)}
              </span>
            </div>
          )}

          {banner.ctaLabel && (
            <a
              href={sanitizeUrl(banner.ctaUrl, '#menu')}
              style={{
                backgroundColor: tokens.buttonBg,
                color: tokens.buttonText,
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs uppercase tracking-[0.16em] font-semibold rounded-brand shadow-sm hover:opacity-90 transition-opacity"
            >
              <span>{banner.ctaLabel}</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>
    </section>
  );
};
