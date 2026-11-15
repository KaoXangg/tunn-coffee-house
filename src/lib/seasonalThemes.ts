import type { SeasonalTheme, SeasonalCategory } from '../types/seasonalTheme';

export const SEASONAL_THEMES_STORAGE_KEY = 'tunn_seasonal_themes_v1';
export const SEASONAL_PREVIEW_SESSION_KEY = 'tunn_seasonal_preview_theme_id';

const nowIso = '2026-11-01T00:00:00.000Z';

export const PRESET_SEASONAL_THEMES: SeasonalTheme[] = [
  {
    id: 'preset-christmas',
    key: 'christmas',
    name: 'Giáng Sinh An Lành (Christmas)',
    category: 'holiday',
    description:
      'Không khí Giáng Sinh sang trọng với đỏ burgundy, xanh thông, trắng tuyết và ánh vàng kim ấm áp.',
    is_preset: true,
    tokens: {
      primary: '#8B1E24',
      secondary: '#EDE6DB',
      accent: '#D4AF37',
      background: '#FAF6F0',
      surface: '#F1EAE0',
      text: '#1F1412',
      textMuted: '#6D544C',
      border: '#D5C0A5',
      headerBg: '#1B4332',
      footerBg: '#142F23',
      buttonBg: '#8B1E24',
      buttonText: '#FAF6F0',
      glow: 'rgba(212, 175, 55, 0.35)',
      gradient: 'linear-gradient(135deg, #1B4332 0%, #8B1E24 100%)',
    },
    banner: {
      enabled: true,
      eyebrow: 'MÙA LỄ HỘI GIÁNG SINH',
      title: 'Ấm Áp Mùa Đông Cùng TUNN Coffee House',
      subtitle: 'Thưởng thức hương vị quế, cacao rang mộc và trà ô long nướng bên ánh đèn Giáng Sinh.',
      imageUrl: '',
      ctaLabel: 'Khám phá Menu Lễ Hội',
      ctaUrl: '#menu',
      showCountdown: false,
    },
    decorations: {
      enabled: true,
      particlesEnabled: true,
      particleType: 'snow',
      intensity: 'balanced',
      particleDensity: 55,
      speed: 1,
      glowIntensity: 60,
      enableDesktop: true,
      enableMobile: true,
      cornerLeftAssetUrl: '',
      cornerRightAssetUrl: '',
    },
    is_active: false,
    schedule_start: null,
    schedule_end: null,
    timezone: 'Asia/Ho_Chi_Minh',
    priority: 20,
    created_at: nowIso,
    updated_at: nowIso,
  },
  {
    id: 'preset-halloween',
    key: 'halloween',
    name: 'Đêm Hội Halloween',
    category: 'holiday',
    description:
      'Phong cách Halloween cao cấp với nền tím than huyền bí, cam bí ngô, sương mù nhẹ và ánh sáng ma thuật.',
    is_preset: true,
    tokens: {
      primary: '#F97316',
      secondary: '#1D1426',
      accent: '#A855F7',
      background: '#120C18',
      surface: '#1D1426',
      text: '#F5EFE6',
      textMuted: '#B3A2C7',
      border: '#3E2B52',
      headerBg: '#120C18',
      footerBg: '#0B0710',
      buttonBg: '#F97316',
      buttonText: '#120C18',
      glow: 'rgba(168, 85, 247, 0.42)',
      gradient: 'linear-gradient(135deg, #1E112B 0%, #7C2D12 100%)',
    },
    banner: {
      enabled: true,
      eyebrow: 'HALLOWEEN NIGHT EDITION',
      title: 'Bí Ẩn Hương Vị Đêm Lễ Hội',
      subtitle: 'Bộ sưu tập đồ uống than tre, bí đỏ gia vị và cà phê ủ lạnh đặc biệt.',
      imageUrl: '',
      ctaLabel: 'Thử Món Đặc Biệt',
      ctaUrl: '#menu',
      showCountdown: false,
    },
    decorations: {
      enabled: true,
      particlesEnabled: true,
      particleType: 'bats_sparks',
      intensity: 'balanced',
      particleDensity: 45,
      speed: 1,
      glowIntensity: 70,
      enableDesktop: true,
      enableMobile: true,
      cornerLeftAssetUrl: '',
      cornerRightAssetUrl: '',
    },
    is_active: false,
    schedule_start: null,
    schedule_end: null,
    timezone: 'Asia/Ho_Chi_Minh',
    priority: 20,
    created_at: nowIso,
    updated_at: nowIso,
  },
  {
    id: 'preset-tet',
    key: 'tet',
    name: 'Tết Nguyên Đán (Lunar New Year)',
    category: 'holiday',
    description:
      'Tết Việt Nam sang trọng với sắc đỏ son, vàng kim, hoa mai – hoa đào rơi nhẹ và lồng đèn truyền thống.',
    is_preset: true,
    tokens: {
      primary: '#9E1B1B',
      secondary: '#F8ECD7',
      accent: '#D97706',
      background: '#FFFDF7',
      surface: '#FBF3E4',
      text: '#2B1310',
      textMuted: '#7C5349',
      border: '#E5C384',
      headerBg: '#7F1D1D',
      footerBg: '#5C1111',
      buttonBg: '#9E1B1B',
      buttonText: '#FFFDF7',
      glow: 'rgba(234, 179, 8, 0.38)',
      gradient: 'linear-gradient(135deg, #9E1B1B 0%, #B45309 100%)',
    },
    banner: {
      enabled: true,
      eyebrow: 'CHÚC MỪNG NĂM MỚI · XUÂN AN KHANG',
      title: 'Khai Xuân Sum Vầy — Đón Lộc Đầu Năm',
      subtitle: 'Hương trà sen, ô long thượng hạng và cà phê rang mộc cho những cuộc hẹn đầu xuân trọn vẹn.',
      imageUrl: '',
      ctaLabel: 'Xem Thực Đơn Tết',
      ctaUrl: '#menu',
      showCountdown: false,
    },
    decorations: {
      enabled: true,
      particlesEnabled: true,
      particleType: 'tet_petals',
      intensity: 'balanced',
      particleDensity: 50,
      speed: 0.9,
      glowIntensity: 65,
      enableDesktop: true,
      enableMobile: true,
      cornerLeftAssetUrl: '',
      cornerRightAssetUrl: '',
    },
    is_active: false,
    schedule_start: null,
    schedule_end: null,
    timezone: 'Asia/Ho_Chi_Minh',
    priority: 30,
    created_at: nowIso,
    updated_at: nowIso,
  },
  {
    id: 'preset-valentine',
    key: 'valentine',
    name: "Lễ Tình Nhân (Valentine's Day)",
    category: 'holiday',
    description:
      'Sắc hồng phấn, đỏ rượu vang và kem dịu dàng cùng hiệu ứng trái tim bay nhẹ lãng mạn.',
    is_preset: true,
    tokens: {
      primary: '#BE185D',
      secondary: '#FCE7F3',
      accent: '#F43F5E',
      background: '#FFF8FA',
      surface: '#FDF0F4',
      text: '#2D121D',
      textMuted: '#835668',
      border: '#F3C6D7',
      headerBg: '#831843',
      footerBg: '#500724',
      buttonBg: '#BE185D',
      buttonText: '#FFF8FA',
      glow: 'rgba(244, 63, 94, 0.28)',
      gradient: 'linear-gradient(135deg, #9D174D 0%, #E11D48 100%)',
    },
    banner: {
      enabled: true,
      eyebrow: 'SWEET VALENTINE EDITION',
      title: 'Ngọt Ngào Khoảnh Khắc Đôi Lứa',
      subtitle: 'Ưu đãi cặp đôi dành riêng cho mùa yêu thương tại TUNN Coffee House.',
      imageUrl: '',
      ctaLabel: 'Khám phá Vị Ngọt',
      ctaUrl: '#menu',
      showCountdown: false,
    },
    decorations: {
      enabled: true,
      particlesEnabled: true,
      particleType: 'hearts',
      intensity: 'subtle',
      particleDensity: 35,
      speed: 0.85,
      glowIntensity: 45,
      enableDesktop: true,
      enableMobile: true,
      cornerLeftAssetUrl: '',
      cornerRightAssetUrl: '',
    },
    is_active: false,
    schedule_start: null,
    schedule_end: null,
    timezone: 'Asia/Ho_Chi_Minh',
    priority: 15,
    created_at: nowIso,
    updated_at: nowIso,
  },
  {
    id: 'preset-black-friday',
    key: 'black_friday',
    name: 'Black Friday — Siêu Ưu Đãi',
    category: 'campaign',
    description:
      'Chiến dịch chuyển đổi cao với nền đen nhám sang trọng, điểm nhấn vàng kim và đếm ngược Flash Sale.',
    is_preset: true,
    tokens: {
      primary: '#EAB308',
      secondary: '#17171B',
      accent: '#EF4444',
      background: '#0B0B0D',
      surface: '#16161B',
      text: '#F8F7F4',
      textMuted: '#A1A1AA',
      border: '#2E2E38',
      headerBg: '#0B0B0D',
      footerBg: '#050507',
      buttonBg: '#EAB308',
      buttonText: '#0B0B0D',
      glow: 'rgba(234, 179, 8, 0.35)',
      gradient: 'linear-gradient(135deg, #18181B 0%, #7F1D1D 100%)',
    },
    banner: {
      enabled: true,
      eyebrow: 'BLACK FRIDAY · FLASH CAMPAIGN',
      title: 'Ưu Đãi Đặc Quyền Lớn Nhất Năm',
      subtitle: 'Săn ngay combo đồ uống và ưu đãi giờ vàng trước khi đồng hồ đếm ngược kết thúc.',
      imageUrl: '',
      ctaLabel: 'Săn Ưu Đãi Ngay',
      ctaUrl: '#promotions',
      showCountdown: true,
    },
    decorations: {
      enabled: true,
      particlesEnabled: true,
      particleType: 'gold_shimmer',
      intensity: 'subtle',
      particleDensity: 35,
      speed: 1,
      glowIntensity: 60,
      enableDesktop: true,
      enableMobile: true,
      cornerLeftAssetUrl: '',
      cornerRightAssetUrl: '',
    },
    is_active: false,
    schedule_start: null,
    schedule_end: null,
    timezone: 'Asia/Ho_Chi_Minh',
    priority: 25,
    created_at: nowIso,
    updated_at: nowIso,
  },
  {
    id: 'preset-mid-autumn',
    key: 'mid_autumn',
    name: 'Tết Trung Thu (Mid-Autumn)',
    category: 'holiday',
    description:
      'Đêm trăng rằm xanh navy sâu lắng, ánh vàng trăng sáng, lồng đèn và hạt sáng ấm áp.',
    is_preset: true,
    tokens: {
      primary: '#F59E0B',
      secondary: '#172554',
      accent: '#FB923C',
      background: '#0B1120',
      surface: '#152038',
      text: '#FEF3C7',
      textMuted: '#B6C2DF',
      border: '#2B3B5E',
      headerBg: '#0B1120',
      footerBg: '#060A14',
      buttonBg: '#F59E0B',
      buttonText: '#0B1120',
      glow: 'rgba(245, 158, 11, 0.4)',
      gradient: 'linear-gradient(135deg, #0F172A 0%, #78350F 100%)',
    },
    banner: {
      enabled: true,
      eyebrow: 'ĐÊM HỘI TRĂNG RẰM',
      title: 'Thưởng Trà Ngắm Trăng — Trọn Vị Đoàn Viên',
      subtitle: 'Trà sen vàng, trà ô long nướng và bánh trung thu thủ công dưới ánh trăng rằm.',
      imageUrl: '',
      ctaLabel: 'Xem Bộ Sưu Tập Trung Thu',
      ctaUrl: '#menu',
      showCountdown: false,
    },
    decorations: {
      enabled: true,
      particlesEnabled: true,
      particleType: 'lantern_glow',
      intensity: 'balanced',
      particleDensity: 45,
      speed: 0.9,
      glowIntensity: 65,
      enableDesktop: true,
      enableMobile: true,
      cornerLeftAssetUrl: '',
      cornerRightAssetUrl: '',
    },
    is_active: false,
    schedule_start: null,
    schedule_end: null,
    timezone: 'Asia/Ho_Chi_Minh',
    priority: 20,
    created_at: nowIso,
    updated_at: nowIso,
  },
  {
    id: 'preset-summer',
    key: 'summer',
    name: 'Mùa Hè Nhiệt Đới (Summer Breeze)',
    category: 'seasonal',
    description:
      'Tươi mát với xanh đại dương, san hô nhiệt đới, ánh nắng vàng và bong bóng nhẹ bồng bềnh.',
    is_preset: true,
    tokens: {
      primary: '#0284C7',
      secondary: '#E0F2FE',
      accent: '#FB7185',
      background: '#F7FBFF',
      surface: '#ECF6FF',
      text: '#0F2940',
      textMuted: '#4B6B88',
      border: '#BAE6FD',
      headerBg: '#0369A1',
      footerBg: '#0C4A6E',
      buttonBg: '#0284C7',
      buttonText: '#FFFFFF',
      glow: 'rgba(14, 165, 233, 0.25)',
      gradient: 'linear-gradient(135deg, #0284C7 0%, #FB7185 100%)',
    },
    banner: {
      enabled: true,
      eyebrow: 'SUMMER REFRESHERS',
      title: 'Giải Nhiệt Mùa Hè Với Trà Trái Cây Tươi',
      subtitle: 'Trà lài nhãn nhục, trà đào tuyết sơn và cold brew cam vàng mát lạnh sảng khoái.',
      imageUrl: '',
      ctaLabel: 'Chọn Món Giải Nhiệt',
      ctaUrl: '#menu',
      showCountdown: false,
    },
    decorations: {
      enabled: true,
      particlesEnabled: true,
      particleType: 'bubbles',
      intensity: 'subtle',
      particleDensity: 40,
      speed: 1,
      glowIntensity: 45,
      enableDesktop: true,
      enableMobile: true,
      cornerLeftAssetUrl: '',
      cornerRightAssetUrl: '',
    },
    is_active: false,
    schedule_start: null,
    schedule_end: null,
    timezone: 'Asia/Ho_Chi_Minh',
    priority: 10,
    created_at: nowIso,
    updated_at: nowIso,
  },
];

export const CATEGORY_LABELS: Record<SeasonalCategory, string> = {
  seasonal: 'Theo mùa (Seasonal)',
  holiday: 'Lễ hội (Holiday)',
  campaign: 'Chiến dịch Sale',
  event: 'Sự kiện đặc biệt',
  custom: 'Tùy chỉnh (Custom)',
};

export function loadLocalSeasonalThemes(): SeasonalTheme[] {
  try {
    const raw = localStorage.getItem(SEASONAL_THEMES_STORAGE_KEY);
    if (!raw) return PRESET_SEASONAL_THEMES;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return PRESET_SEASONAL_THEMES;
    return parsed as SeasonalTheme[];
  } catch {
    return PRESET_SEASONAL_THEMES;
  }
}

export function saveLocalSeasonalThemes(themes: SeasonalTheme[]) {
  try {
    localStorage.setItem(SEASONAL_THEMES_STORAGE_KEY, JSON.stringify(themes));
  } catch {
    // ignore storage quota errors
  }
}

export type ThemeScheduleState = 'active_manual' | 'active_scheduled' | 'upcoming' | 'expired' | 'inactive';

export function getThemeScheduleState(
  theme: SeasonalTheme,
  now: Date = new Date()
): ThemeScheduleState {
  const nowMs = now.getTime();
  const startMs = theme.schedule_start ? new Date(theme.schedule_start).getTime() : null;
  const endMs = theme.schedule_end ? new Date(theme.schedule_end).getTime() : null;

  if (endMs && !Number.isNaN(endMs) && nowMs > endMs) {
    return 'expired';
  }

  if (startMs && !Number.isNaN(startMs)) {
    if (nowMs < startMs) return 'upcoming';
    return 'active_scheduled';
  }

  if (theme.is_active) return 'active_manual';
  return 'inactive';
}

export function resolveEffectiveSeasonalTheme(
  themes: SeasonalTheme[],
  now: Date = new Date()
): SeasonalTheme | null {
  const scheduled = themes
    .filter((t) => getThemeScheduleState(t, now) === 'active_scheduled')
    .sort((a, b) => b.priority - a.priority || b.updated_at.localeCompare(a.updated_at));

  if (scheduled.length > 0) return scheduled[0];

  const manual = themes
    .filter((t) => getThemeScheduleState(t, now) === 'active_manual')
    .sort((a, b) => b.priority - a.priority || b.updated_at.localeCompare(a.updated_at));

  return manual[0] || null;
}

export function createBlankCustomTheme(name = 'Chủ đề Mới'): SeasonalTheme {
  const id = `custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const ts = new Date().toISOString();
  return {
    id,
    key: id,
    name,
    category: 'custom',
    description: 'Chủ đề tùy chỉnh riêng cho chiến dịch của TUNN Coffee House.',
    is_preset: false,
    tokens: {
      primary: '#4B2E24',
      secondary: '#E9E6D8',
      accent: '#C89F72',
      background: '#F7F5EF',
      surface: '#EDE9DF',
      text: '#241914',
      textMuted: '#8C7565',
      border: '#D5C6AD',
      headerBg: '#241914',
      footerBg: '#1A110E',
      buttonBg: '#4B2E24',
      buttonText: '#F7F5EF',
      glow: 'rgba(200, 159, 114, 0.30)',
      gradient: 'linear-gradient(135deg, #4B2E24 0%, #8C5843 100%)',
    },
    banner: {
      enabled: true,
      eyebrow: 'CHIẾN DỊCH ĐẶC BIỆT',
      title: 'Khám Phá Trải Nghiệm Mới Tại TUNN',
      subtitle: 'Thưởng thức hương vị trà và cà phê thủ công phiên bản giới hạn.',
      imageUrl: '',
      ctaLabel: 'Xem Thực Đơn',
      ctaUrl: '#menu',
      showCountdown: false,
    },
    decorations: {
      enabled: true,
      particlesEnabled: true,
      particleType: 'gold_shimmer',
      intensity: 'subtle',
      particleDensity: 35,
      speed: 1,
      glowIntensity: 45,
      enableDesktop: true,
      enableMobile: true,
      cornerLeftAssetUrl: '',
      cornerRightAssetUrl: '',
    },
    is_active: false,
    schedule_start: null,
    schedule_end: null,
    timezone: 'Asia/Ho_Chi_Minh',
    priority: 15,
    created_at: ts,
    updated_at: ts,
  };
}
