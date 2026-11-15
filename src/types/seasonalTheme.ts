export type SeasonalCategory = 'seasonal' | 'holiday' | 'campaign' | 'event' | 'custom';

export type AnimationIntensity = 'off' | 'subtle' | 'balanced' | 'enhanced';

export type ParticleEffectType =
  | 'none'
  | 'snow'
  | 'bats_sparks'
  | 'tet_petals'
  | 'hearts'
  | 'gold_shimmer'
  | 'lantern_glow'
  | 'bubbles';

export interface SeasonalThemeTokens {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textMuted: string;
  border: string;
  headerBg: string;
  footerBg: string;
  buttonBg: string;
  buttonText: string;
  glow: string;
  gradient: string;
}

export interface SeasonalBannerConfig {
  enabled: boolean;
  eyebrow: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  ctaLabel: string;
  ctaUrl: string;
  showCountdown: boolean;
}

export interface SeasonalDecorationsConfig {
  enabled: boolean;
  particlesEnabled: boolean;
  particleType: ParticleEffectType;
  intensity: AnimationIntensity;
  particleDensity: number; // 10 - 100
  speed: number; // 0.5 - 2.0
  glowIntensity: number; // 0 - 100
  enableDesktop: boolean;
  enableMobile: boolean;
  cornerLeftAssetUrl: string;
  cornerRightAssetUrl: string;
}

export interface SeasonalTheme {
  id: string;
  key: string;
  name: string;
  category: SeasonalCategory;
  description: string;
  is_preset: boolean;
  tokens: SeasonalThemeTokens;
  banner: SeasonalBannerConfig;
  decorations: SeasonalDecorationsConfig;
  is_active: boolean;
  schedule_start: string | null;
  schedule_end: string | null;
  timezone: string;
  priority: number;
  created_at: string;
  updated_at: string;
}
