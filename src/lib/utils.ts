import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const IDLE_TIMEOUT_STORAGE_KEY = 'tunn_admin_idle_timeout_minutes';
export const SESSION_ID_STORAGE_KEY = 'tunn_admin_session_id';
export const SESSION_START_STORAGE_KEY = 'tunn_admin_session_start';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatVND(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(Number(amount))) return '0 ₫';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(Number(amount));
}

export function slugify(text: string): string {
  return text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function formatBytes(bytes: number, decimals = 1): string {
  if (!bytes || bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function formatDateVi(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  try {
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(dateStr));
  } catch {
    return '';
  }
}

export function formatDateTimeVi(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  try {
    return new Intl.DateTimeFormat('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(dateStr));
  } catch {
    return '';
  }
}

export function formatDurationVi(seconds: number | null | undefined): string {
  const totalSec = Math.max(0, Math.round(Number(seconds) || 0));
  if (totalSec === 0) return 'Vừa bắt đầu';
  if (totalSec < 60) return `${totalSec} giây`;

  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;

  if (hours > 0) {
    return minutes > 0 ? `${hours} giờ ${minutes} phút` : `${hours} giờ`;
  }
  return secs > 0 ? `${minutes} phút ${secs} giây` : `${minutes} phút`;
}

export interface StoreOpenStatus {
  isOpen: boolean;
  label: string;
  detail: string;
  openTime: string;
  closeTime: string;
}

export function getStoreOpenStatus(
  openingHours: string | null | undefined,
  now: Date = new Date()
): StoreOpenStatus {
  const timeMatches = (openingHours || '').match(/\b([01]?\d|2[0-3]):([0-5]\d)\b/g);
  const openStr = timeMatches && timeMatches.length >= 2 ? timeMatches[0] : '07:30';
  const closeStr = timeMatches && timeMatches.length >= 2 ? timeMatches[1] : '22:30';

  const toMinutes = (hhmm: string) => {
    const [h, m] = hhmm.split(':').map(Number);
    return h * 60 + m;
  };

  const openMin = toMinutes(openStr);
  const closeMin = toMinutes(closeStr);
  const currentMin = now.getHours() * 60 + now.getMinutes();

  const isOpen =
    closeMin > openMin
      ? currentMin >= openMin && currentMin < closeMin
      : currentMin >= openMin || currentMin < closeMin;

  if (isOpen) {
    return {
      isOpen: true,
      label: 'Đang mở cửa',
      detail: `Phục vụ đến ${closeStr}`,
      openTime: openStr,
      closeTime: closeStr,
    };
  }

  const detail =
    currentMin < openMin
      ? `Mở cửa lúc ${openStr} hôm nay`
      : `Hẹn gặp lại vào ${openStr} sáng mai`;

  return {
    isOpen: false,
    label: 'Đã đóng cửa',
    detail,
    openTime: openStr,
    closeTime: closeStr,
  };
}

export interface PromotionScheduleStatus {
  isCurrentlyVisible: boolean;
  reason: 'active' | 'disabled' | 'not_started' | 'expired' | 'outside_daily_window';
  dailyWindow: { start: string; end: string } | null;
}

export function extractDailyTimeWindow(
  text: string | null | undefined
): { start: string; end: string } | null {
  if (!text) return null;
  const match = text.match(/\b([01]?\d|2[0-3]):([0-5]\d)\s*[—–-]\s*([01]?\d|2[0-3]):([0-5]\d)\b/);
  if (!match) return null;
  const pad = (n: string) => n.padStart(2, '0');
  return {
    start: `${pad(match[1])}:${match[2]}`,
    end: `${pad(match[3])}:${match[4]}`,
  };
}

export function getPromotionScheduleStatus(
  promo: {
    is_active: boolean;
    start_date: string | null;
    end_date: string | null;
    subtitle?: string;
  },
  now: Date = new Date()
): PromotionScheduleStatus {
  const dailyWindow = extractDailyTimeWindow(promo.subtitle);

  if (!promo.is_active) {
    return { isCurrentlyVisible: false, reason: 'disabled', dailyWindow };
  }

  const nowMs = now.getTime();
  if (promo.start_date) {
    const startMs = new Date(promo.start_date).getTime();
    if (!isNaN(startMs) && nowMs < startMs) {
      return { isCurrentlyVisible: false, reason: 'not_started', dailyWindow };
    }
  }

  if (promo.end_date) {
    const endDate = new Date(promo.end_date);
    if (!isNaN(endDate.getTime())) {
      // If stored at midnight UTC/local without explicit time, keep active until end of that day
      if (promo.end_date.length <= 10 || promo.end_date.includes('T00:00:00')) {
        endDate.setHours(23, 59, 59, 999);
      }
      if (nowMs > endDate.getTime()) {
        return { isCurrentlyVisible: false, reason: 'expired', dailyWindow };
      }
    }
  }

  if (dailyWindow) {
    const toMin = (t: string) => {
      const [h, m] = t.split(':').map(Number);
      return h * 60 + m;
    };
    const startMin = toMin(dailyWindow.start);
    const endMin = toMin(dailyWindow.end);
    const currentMin = now.getHours() * 60 + now.getMinutes();

    const inWindow =
      endMin > startMin
        ? currentMin >= startMin && currentMin <= endMin
        : currentMin >= startMin || currentMin <= endMin;

    if (!inWindow) {
      return {
        isCurrentlyVisible: false,
        reason: 'outside_daily_window',
        dailyWindow,
      };
    }
  }

  return { isCurrentlyVisible: true, reason: 'active', dailyWindow };
}

/**
 * Sanitize user/CMS-supplied URLs to prevent javascript:/data: XSS and open redirects.
 * Allows https:, http:, tel:, mailto:, relative paths (/), and in-page anchors (#).
 */
export function sanitizeUrl(rawUrl?: string | null, fallback = '#'): string {
  if (!rawUrl || typeof rawUrl !== 'string') return fallback;
  const trimmed = rawUrl.trim();
  if (!trimmed) return fallback;

  if (trimmed.startsWith('#') || (trimmed.startsWith('/') && !trimmed.startsWith('//'))) {
    return trimmed;
  }

  try {
    const parsed = new URL(trimmed);
    const allowedProtocols = ['https:', 'http:', 'tel:', 'mailto:'];
    if (allowedProtocols.includes(parsed.protocol.toLowerCase())) {
      return trimmed;
    }
  } catch {
    // Reject malformed URLs
  }

  return fallback;
}

/**
 * Validate Google Maps embed iframe URLs strictly (https only, Google Maps hostnames).
 */
export function sanitizeMapEmbedUrl(rawUrl?: string | null): string | null {
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'https:') return null;
    const host = parsed.hostname.toLowerCase();
    if (
      host === 'www.google.com' ||
      host === 'google.com' ||
      host === 'maps.google.com' ||
      host.endsWith('.google.com')
    ) {
      return trimmed;
    }
  } catch {
    return null;
  }

  return null;
}
