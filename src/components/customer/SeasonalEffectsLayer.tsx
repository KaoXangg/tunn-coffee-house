import React, { useEffect, useRef } from 'react';
import { useSeasonalTheme } from '../../contexts/SeasonalThemeContext';
import type { ParticleEffectType } from '../../types/seasonalTheme';

interface Particle {
  x: number;
  y: number;
  r: number;
  vx: number;
  vy: number;
  alpha: number;
  phase: number;
  color: string;
  rotation: number;
  vr: number;
  variant: number;
}

const INTENSITY_MULTIPLIER = {
  off: 0,
  subtle: 0.55,
  balanced: 1,
  enhanced: 1.5,
} as const;

export const SeasonalEffectsLayer: React.FC = () => {
  const { effectiveTheme } = useSeasonalTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !effectiveTheme) return;

    const { decorations, tokens } = effectiveTheme;
    if (!decorations.enabled || !decorations.particlesEnabled || decorations.intensity === 'off') {
      return;
    }

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const isMobile = window.innerWidth < 768;
    if (isMobile && !decorations.enableMobile) return;
    if (!isMobile && !decorations.enableDesktop) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const onResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', onResize, { passive: true });

    const baseCount = Math.round(
      (decorations.particleDensity / 100) * 55 * INTENSITY_MULTIPLIER[decorations.intensity]
    );
    const maxCount = isMobile ? Math.min(24, Math.round(baseCount * 0.55)) : Math.min(80, baseCount);

    const pType: ParticleEffectType = decorations.particleType;
    const speedMult = decorations.speed || 1;

    const pickColor = (variant: number): string => {
      switch (pType) {
        case 'snow':
          return '#FFFFFF';
        case 'bats_sparks':
          return variant % 3 === 0 ? '#F97316' : variant % 3 === 1 ? '#A855F7' : '#2E1A47';
        case 'tet_petals':
          return variant % 2 === 0 ? '#FACC15' : '#FB7185';
        case 'hearts':
          return variant % 2 === 0 ? '#F43F5E' : '#FB7185';
        case 'gold_shimmer':
          return variant % 2 === 0 ? '#FACC15' : tokens.accent || '#EAB308';
        case 'lantern_glow':
          return variant % 2 === 0 ? '#FBBF24' : '#FB923C';
        case 'bubbles':
          return variant % 2 === 0 ? '#BAE6FD' : '#7DD3FC';
        default:
          return '#FFFFFF';
      }
    };

    const spawnParticle = (initial = false): Particle => {
      const risesUp = pType === 'hearts' || pType === 'lantern_glow' || pType === 'bubbles';
      const variant = Math.floor(Math.random() * 6);
      return {
        x: Math.random() * width,
        y: initial
          ? Math.random() * height
          : risesUp
          ? height + 20
          : -20,
        r:
          pType === 'bubbles'
            ? 5 + Math.random() * 6
            : pType === 'snow'
            ? 5 + Math.random() * 5
            : pType === 'tet_petals'
            ? 5 + Math.random() * 4
            : pType === 'hearts'
            ? 6 + Math.random() * 5
            : 5 + Math.random() * 4,
        vx: (Math.random() - 0.5) * 0.6 * speedMult,
        vy: risesUp
          ? -(0.45 + Math.random() * 0.9) * speedMult
          : (0.6 + Math.random() * 1.2) * speedMult,
        alpha: 0.35 + Math.random() * 0.5,
        phase: Math.random() * Math.PI * 2,
        color: pickColor(variant),
        rotation: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * 0.03,
        variant,
      };
    };

    const particles: Particle[] = Array.from({ length: maxCount }, () => spawnParticle(true));
    let rafId = 0;

    const drawHeart = (x: number, y: number, size: number, color: string, alpha: number) => {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = color;
      ctx.translate(x, y);
      ctx.beginPath();
      const s = size * 0.6;
      ctx.moveTo(0, s);
      ctx.bezierCurveTo(-s * 1.6, -s * 0.4, -s * 0.9, -s * 1.6, 0, -s * 0.6);
      ctx.bezierCurveTo(s * 0.9, -s * 1.6, s * 1.6, -s * 0.4, 0, s);
      ctx.fill();
      ctx.restore();
    };

    const drawPetal = (p: Particle) => {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.beginPath();
      ctx.ellipse(0, 0, p.r * 1.3, p.r * 0.72, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    const drawBat = (p: Particle) => {
      ctx.save();
      ctx.globalAlpha = p.alpha * 0.85;
      ctx.fillStyle = '#2B1840';
      ctx.translate(p.x, p.y);
      const wing = Math.sin(p.phase * 4) * 3;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(-p.r * 1.5, -p.r + wing, -p.r * 2.5, 0);
      ctx.quadraticCurveTo(-p.r, p.r * 0.6, 0, p.r * 0.4);
      ctx.quadraticCurveTo(p.r, p.r * 0.6, p.r * 2.5, 0);
      ctx.quadraticCurveTo(p.r * 1.5, -p.r + wing, 0, 0);
      ctx.fill();
      ctx.restore();
    };

    const drawSnowflake = (p: Particle) => {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1.4;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      const s = p.r;
      for (let k = 0; k < 3; k++) {
        ctx.rotate(Math.PI / 3);
        ctx.beginPath();
        ctx.moveTo(-s, 0);
        ctx.lineTo(s, 0);
        ctx.moveTo(s * 0.55, -s * 0.28);
        ctx.lineTo(s * 0.78, 0);
        ctx.lineTo(s * 0.55, s * 0.28);
        ctx.moveTo(-s * 0.55, -s * 0.28);
        ctx.lineTo(-s * 0.78, 0);
        ctx.lineTo(-s * 0.55, s * 0.28);
        ctx.stroke();
      }
      ctx.restore();
    };

    const drawMiniSnowman = (p: Particle) => {
      ctx.save();
      ctx.globalAlpha = Math.min(0.92, p.alpha + 0.15);
      ctx.translate(p.x, p.y);
      ctx.rotate(Math.sin(p.phase) * 0.15);
      const s = p.r * 0.95;
      // Body & head
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(0, s * 0.55, s * 0.65, 0, Math.PI * 2);
      ctx.arc(0, -s * 0.35, s * 0.45, 0, Math.PI * 2);
      ctx.fill();
      // Red scarf
      ctx.fillStyle = '#B91C1C';
      ctx.fillRect(-s * 0.42, -s * 0.02, s * 0.84, s * 0.22);
      // Mini hat
      ctx.fillStyle = '#1F2937';
      ctx.fillRect(-s * 0.45, -s * 0.82, s * 0.9, s * 0.14);
      ctx.fillRect(-s * 0.28, -s * 1.2, s * 0.56, s * 0.4);
      ctx.restore();
    };

    const drawLuckyCoin = (p: Particle) => {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      const s = p.r * 1.15;
      ctx.fillStyle = '#FACC15';
      ctx.beginPath();
      ctx.arc(0, 0, s, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#B45309';
      ctx.lineWidth = 1.2;
      ctx.stroke();
      // Square center hole
      ctx.fillStyle = '#9E1B1B';
      ctx.fillRect(-s * 0.3, -s * 0.3, s * 0.6, s * 0.6);
      ctx.restore();
    };

    const drawMiniPumpkin = (p: Particle) => {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.translate(p.x, p.y);
      ctx.rotate(Math.sin(p.phase) * 0.2);
      const s = p.r * 1.1;
      ctx.fillStyle = '#F97316';
      ctx.beginPath();
      ctx.ellipse(0, 0, s * 1.15, s * 0.85, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#65A30D';
      ctx.fillRect(-s * 0.15, -s * 1.15, s * 0.3, s * 0.4);
      ctx.restore();
    };

    const drawFourPointStar = (p: Particle, color: string) => {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = color;
      ctx.shadowBlur = 8;
      ctx.shadowColor = color;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      const s = p.r * 1.2;
      ctx.beginPath();
      ctx.moveTo(0, -s);
      ctx.quadraticCurveTo(0, 0, s, 0);
      ctx.quadraticCurveTo(0, 0, 0, s);
      ctx.quadraticCurveTo(0, 0, -s, 0);
      ctx.quadraticCurveTo(0, 0, 0, -s);
      ctx.fill();
      ctx.restore();
    };

    const drawMiniLantern = (p: Particle) => {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.translate(p.x, p.y);
      const s = p.r * 1.05;
      ctx.fillStyle = '#DC2626';
      ctx.beginPath();
      ctx.ellipse(0, 0, s * 0.85, s, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#FBBF24';
      ctx.fillRect(-s * 0.45, -s * 1.05, s * 0.9, s * 0.22);
      ctx.fillRect(-s * 0.45, s * 0.85, s * 0.9, s * 0.22);
      ctx.restore();
    };

    const drawMiniStarfish = (p: Particle) => {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = '#FB7185';
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      const s = p.r * 1.1;
      ctx.beginPath();
      for (let k = 0; k < 5; k++) {
        const outerA = (k * 2 * Math.PI) / 5 - Math.PI / 2;
        const innerA = outerA + Math.PI / 5;
        ctx.lineTo(Math.cos(outerA) * s, Math.sin(outerA) * s);
        ctx.lineTo(Math.cos(innerA) * s * 0.45, Math.sin(innerA) * s * 0.45);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };

    const tick = () => {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.phase += 0.02;
        p.x += p.vx + Math.sin(p.phase) * 0.35;
        p.y += p.vy;
        p.rotation += p.vr;

        if (pType === 'snow') {
          // 1. Bông tuyết & 2. Người tuyết nhỏ
          if (p.variant === 0) drawMiniSnowman(p);
          else drawSnowflake(p);
        } else if (pType === 'tet_petals') {
          // 1. Cánh hoa mai/đào & 2. Đồng xu vàng may mắn
          if (p.variant === 0) drawLuckyCoin(p);
          else drawPetal(p);
        } else if (pType === 'bats_sparks') {
          // 1. Dơi bay & 2. Bí ngô nhỏ
          if (p.variant % 2 === 0) drawBat(p);
          else drawMiniPumpkin(p);
        } else if (pType === 'hearts') {
          // 1. Trái tim & 2. Cánh hoa hồng
          if (p.variant % 3 === 0) drawPetal(p);
          else drawHeart(p.x, p.y, p.r, p.color, p.alpha);
        } else if (pType === 'gold_shimmer') {
          // 1. Ngôi sao ánh kim 4 cánh & 2. Đồng xu/Thẻ vàng
          if (p.variant % 2 === 0) drawFourPointStar(p, '#FACC15');
          else drawLuckyCoin(p);
        } else if (pType === 'lantern_glow') {
          // 1. Đèn lồng nhỏ & 2. Ngôi sao trăng rằm
          if (p.variant % 3 === 0) drawMiniLantern(p);
          else drawFourPointStar(p, '#FBBF24');
        } else if (pType === 'bubbles') {
          // 1. Bong bóng biển & 2. Sao biển san hô
          if (p.variant === 0) {
            drawMiniStarfish(p);
          } else {
            ctx.save();
            ctx.globalAlpha = p.alpha * 0.65;
            ctx.strokeStyle = p.color;
            ctx.lineWidth = 1.4;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
          }
        } else {
          drawFourPointStar(p, p.color);
        }

        const outOfBounds =
          p.y > height + 30 || p.y < -30 || p.x < -30 || p.x > width + 30;
        if (outOfBounds) {
          particles[i] = spawnParticle(false);
        }
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', onResize);
    };
  }, [effectiveTheme]);

  if (!effectiveTheme || !effectiveTheme.decorations.enabled) return null;

  const { key, decorations, tokens } = effectiveTheme;
  const showCustomLeft = Boolean(decorations.cornerLeftAssetUrl);
  const showCustomRight = Boolean(decorations.cornerRightAssetUrl);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[35] overflow-hidden select-none"
    >
      {/* Subtle Ambient Glow */}
      {decorations.glowIntensity > 0 && (
        <div
          className="absolute -top-24 left-1/2 -translate-x-1/2 w-[70vw] h-48 rounded-full blur-3xl transition-opacity duration-500"
          style={{
            background: tokens.glow,
            opacity: Math.min(0.6, decorations.glowIntensity / 140),
          }}
        />
      )}

      {/* GPU Canvas Particle System */}
      {decorations.particlesEnabled && decorations.intensity !== 'off' && (
        <canvas ref={canvasRef} className="w-full h-full block" />
      )}

      {/* Corner Seasonal Decorations (Custom Uploaded Asset or Built-in Crisp SVG) */}
      {showCustomLeft && (
        <img
          src={decorations.cornerLeftAssetUrl}
          alt=""
          className={`${decorations.enableMobile ? 'block' : 'hidden md:block'} absolute bottom-3 left-2 sm:bottom-4 sm:left-4 w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 object-contain opacity-90 drop-shadow-md`}
        />
      )}

      {showCustomRight && (
        <img
          src={decorations.cornerRightAssetUrl}
          alt=""
          className={`${decorations.enableMobile ? 'block' : 'hidden md:block'} absolute bottom-16 right-2 sm:bottom-4 sm:right-16 w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 object-contain opacity-90 drop-shadow-md`}
        />
      )}

      {!showCustomLeft && key === 'christmas' && (
        <svg
          viewBox="0 0 120 140"
          className={`${decorations.enableMobile ? 'block' : 'hidden md:block'} absolute bottom-3 left-2 sm:bottom-4 sm:left-4 w-14 h-16 sm:w-20 sm:h-24 opacity-90 drop-shadow`}
          fill="none"
        >
          <polygon points="60,10 25,60 95,60" fill="#1B4332" />
          <polygon points="60,35 18,90 102,90" fill="#23533F" />
          <polygon points="60,62 12,118 108,118" fill="#1B4332" />
          <rect x="52" y="118" width="16" height="16" rx="2" fill="#6D4C41" />
          <circle cx="60" cy="10" r="5" fill="#D4AF37" />
          <circle cx="48" cy="52" r="3.5" fill="#8B1E24" />
          <circle cx="72" cy="78" r="3.5" fill="#D4AF37" />
          <circle cx="42" cy="102" r="3.5" fill="#FAF6F0" />
          <circle cx="80" cy="106" r="3.5" fill="#8B1E24" />
        </svg>
      )}

      {!showCustomRight && key === 'christmas' && (
        <svg
          viewBox="0 0 100 100"
          className={`${decorations.enableMobile ? 'block' : 'hidden md:block'} absolute bottom-16 right-2.5 sm:bottom-4 sm:right-16 w-12 h-12 sm:w-16 sm:h-16 opacity-90 drop-shadow`}
          fill="none"
        >
          <rect x="18" y="36" width="64" height="50" rx="4" fill="#8B1E24" />
          <rect x="14" y="28" width="72" height="12" rx="3" fill="#A6262E" />
          <rect x="44" y="28" width="12" height="58" fill="#D4AF37" />
          <rect x="18" y="54" width="64" height="10" fill="#D4AF37" />
          <path d="M50 28 C36 10, 24 22, 42 28 Z" fill="#D4AF37" />
          <path d="M50 28 C64 10, 76 22, 58 28 Z" fill="#D4AF37" />
        </svg>
      )}

      {/* Tết Nguyên Đán: Đầu Lân Sư Rồng (Góc trái) & Nhành Mai Vàng (Góc phải) */}
      {!showCustomLeft && key === 'tet' && (
        <svg
          viewBox="0 0 130 130"
          className={`${decorations.enableMobile ? 'block' : 'hidden md:block'} absolute bottom-3 left-2 sm:bottom-4 sm:left-4 w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 opacity-95 drop-shadow-md`}
          fill="none"
        >
          {/* Lông viền vàng */}
          <circle cx="65" cy="68" r="46" fill="#B91C1C" stroke="#FBBF24" strokeWidth="4" />
          {/* Tai Lân */}
          <ellipse cx="25" cy="42" rx="12" ry="15" fill="#DC2626" stroke="#FBBF24" strokeWidth="2.5" />
          <ellipse cx="105" cy="42" rx="12" ry="15" fill="#DC2626" stroke="#FBBF24" strokeWidth="2.5" />
          {/* Sừng Lân */}
          <path d="M65 14 L56 34 L74 34 Z" fill="#FBBF24" />
          <circle cx="65" cy="14" r="4.5" fill="#FEF08A" />
          {/* Trán & Hoa văn */}
          <ellipse cx="65" cy="54" rx="28" ry="18" fill="#FEF3C7" />
          <circle cx="65" cy="47" r="6" fill="#D97706" />
          {/* Mắt Lân to tròn */}
          <circle cx="46" cy="58" r="9.5" fill="#FFFFFF" stroke="#2B1310" strokeWidth="2" />
          <circle cx="84" cy="58" r="9.5" fill="#FFFFFF" stroke="#2B1310" strokeWidth="2" />
          <circle cx="47" cy="58" r="4.5" fill="#1F1412" />
          <circle cx="83" cy="58" r="4.5" fill="#1F1412" />
          <circle cx="48.5" cy="56.5" r="1.5" fill="#FFFFFF" />
          <circle cx="84.5" cy="56.5" r="1.5" fill="#FFFFFF" />
          {/* Mũi & Miệng Lân */}
          <ellipse cx="65" cy="70" rx="11" ry="7" fill="#15803D" stroke="#FBBF24" strokeWidth="2" />
          <path d="M36 86 Q65 104 94 86 Q86 76 65 80 Q44 76 36 86 Z" fill="#FEF3C7" stroke="#D97706" strokeWidth="2" />
          {/* Râu vàng */}
          <path d="M35 88 Q28 106 34 118" stroke="#FBBF24" strokeWidth="3" strokeLinecap="round" />
          <path d="M95 88 Q102 106 96 118" stroke="#FBBF24" strokeWidth="3" strokeLinecap="round" />
        </svg>
      )}

      {!showCustomRight && key === 'tet' && (
        <svg
          viewBox="0 0 110 110"
          className={`${decorations.enableMobile ? 'block' : 'hidden md:block'} absolute bottom-16 right-2 sm:bottom-4 sm:right-16 w-14 h-14 sm:w-20 sm:h-20 opacity-90 drop-shadow`}
          fill="none"
        >
          <path d="M95 98 Q68 72 42 58 Q25 48 16 28" stroke="#78350F" strokeWidth="4" strokeLinecap="round" />
          <path d="M58 67 Q66 44 82 32" stroke="#78350F" strokeWidth="3" strokeLinecap="round" />
          {/* Hoa mai vàng */}
          {[
            { cx: 38, cy: 52, r: 9 },
            { cx: 80, cy: 32, r: 10 },
            { cx: 20, cy: 28, r: 8 },
            { cx: 64, cy: 76, r: 8 },
          ].map((f, idx) => (
            <g key={idx}>
              <circle cx={f.cx} cy={f.cy - f.r * 0.6} r={f.r * 0.52} fill="#FACC15" />
              <circle cx={f.cx + f.r * 0.6} cy={f.cy - f.r * 0.15} r={f.r * 0.52} fill="#FACC15" />
              <circle cx={f.cx + f.r * 0.38} cy={f.cy + f.r * 0.55} r={f.r * 0.52} fill="#FACC15" />
              <circle cx={f.cx - f.r * 0.38} cy={f.cy + f.r * 0.55} r={f.r * 0.52} fill="#FACC15" />
              <circle cx={f.cx - f.r * 0.6} cy={f.cy - f.r * 0.15} r={f.r * 0.52} fill="#FACC15" />
              <circle cx={f.cx} cy={f.cy} r={f.r * 0.35} fill="#DC2626" />
            </g>
          ))}
        </svg>
      )}

      {!showCustomLeft && key === 'halloween' && (
        <svg
          viewBox="0 0 110 100"
          className={`${decorations.enableMobile ? 'block' : 'hidden md:block'} absolute bottom-3 left-2 sm:bottom-4 sm:left-4 w-14 h-14 sm:w-20 sm:h-20 opacity-90 drop-shadow`}
          fill="none"
        >
          <path d="M52 14 C54 6, 62 6, 64 14" stroke="#4D7C0F" strokeWidth="5" strokeLinecap="round" />
          <ellipse cx="55" cy="58" rx="40" ry="30" fill="#EA580C" />
          <ellipse cx="55" cy="58" rx="24" ry="30" fill="#F97316" />
          <polygon points="37,48 45,42 48,51" fill="#120C18" />
          <polygon points="73,48 65,42 62,51" fill="#120C18" />
          <path d="M36 68 Q55 82 74 68 L68 72 L60 69 L55 74 L50 69 L42 72 Z" fill="#120C18" />
        </svg>
      )}

      {!showCustomRight && key === 'halloween' && (
        <svg
          viewBox="0 0 100 100"
          className={`${decorations.enableMobile ? 'block' : 'hidden md:block'} absolute top-28 right-3 sm:top-32 sm:right-6 w-12 h-12 sm:w-16 sm:h-16 opacity-80`}
          fill="none"
        >
          <path d="M62 18 A28 28 0 1 0 84 68 A22 22 0 1 1 62 18 Z" fill="#FDE68A" />
        </svg>
      )}

      {/* Trung Thu: Đèn lồng truyền thống (Góc trái dưới, không bị khuất) & Trăng Rằm (Góc phải) */}
      {!showCustomLeft && key === 'mid_autumn' && (
        <svg
          viewBox="0 0 90 130"
          className={`${decorations.enableMobile ? 'block' : 'hidden md:block'} absolute bottom-3 left-2 sm:bottom-4 sm:left-4 w-12 h-16 sm:w-16 sm:h-24 opacity-95 drop-shadow`}
          fill="none"
        >
          <line x1="45" y1="2" x2="45" y2="20" stroke="#FBBF24" strokeWidth="2.5" />
          <rect x="34" y="20" width="22" height="6" rx="2" fill="#F59E0B" />
          <ellipse cx="45" cy="56" rx="28" ry="30" fill="#DC2626" />
          <ellipse cx="45" cy="56" rx="16" ry="30" stroke="#FBBF24" strokeWidth="1.5" />
          <rect x="34" y="85" width="22" height="6" rx="2" fill="#F59E0B" />
          <line x1="45" y1="91" x2="45" y2="122" stroke="#FBBF24" strokeWidth="2" />
          <line x1="39" y1="91" x2="36" y2="116" stroke="#EF4444" strokeWidth="1.5" />
          <line x1="51" y1="91" x2="54" y2="116" stroke="#EF4444" strokeWidth="1.5" />
        </svg>
      )}

      {!showCustomRight && key === 'mid_autumn' && (
        <svg
          viewBox="0 0 110 110"
          className={`${decorations.enableMobile ? 'block' : 'hidden md:block'} absolute top-28 right-3 sm:top-32 sm:right-6 w-14 h-14 sm:w-20 sm:h-20 opacity-85`}
          fill="none"
        >
          <circle cx="55" cy="55" r="34" fill="#FDE68A" opacity="0.2" />
          <circle cx="55" cy="55" r="24" fill="#FBBF24" />
          <circle cx="48" cy="48" r="4" fill="#F59E0B" opacity="0.4" />
          <circle cx="64" cy="60" r="6" fill="#F59E0B" opacity="0.3" />
        </svg>
      )}

      {/* Valentine: Trái tim đôi */}
      {!showCustomLeft && key === 'valentine' && (
        <svg
          viewBox="0 0 110 100"
          className={`${decorations.enableMobile ? 'block' : 'hidden md:block'} absolute bottom-3 left-2 sm:bottom-4 sm:left-4 w-14 h-14 sm:w-20 sm:h-20 opacity-90 drop-shadow`}
          fill="none"
        >
          <path
            d="M46 82 C20 62, 12 40, 26 26 C36 16, 48 22, 52 32 C56 22, 68 16, 78 26 C92 40, 84 62, 58 82 L52 87 Z"
            fill="#BE185D"
          />
          <path
            d="M74 72 C60 60, 56 48, 64 40 C70 34, 76 38, 78 44 C80 38, 86 34, 92 40 C100 48, 96 60, 82 72 L78 75 Z"
            fill="#F43F5E"
          />
        </svg>
      )}

      {/* Black Friday: Nhãn Sale Vàng Kim */}
      {!showCustomLeft && key === 'black_friday' && (
        <svg
          viewBox="0 0 110 100"
          className={`${decorations.enableMobile ? 'block' : 'hidden md:block'} absolute bottom-3 left-2 sm:bottom-4 sm:left-4 w-14 h-14 sm:w-20 sm:h-20 opacity-90 drop-shadow`}
          fill="none"
        >
          <path d="M18 46 L52 14 L92 14 L92 54 L58 88 Z" fill="#18181B" stroke="#EAB308" strokeWidth="3" />
          <circle cx="76" cy="30" r="5" fill="#EAB308" />
          <text x="34" y="56" fill="#EAB308" fontSize="16" fontWeight="bold" fontFamily="serif">
            SALE
          </text>
        </svg>
      )}

      {/* Summer: Mặt trời & Sóng biển */}
      {!showCustomRight && key === 'summer' && (
        <svg
          viewBox="0 0 100 100"
          className={`${decorations.enableMobile ? 'block' : 'hidden md:block'} absolute top-28 right-3 sm:top-32 sm:right-6 w-12 h-12 sm:w-16 sm:h-16 opacity-85`}
          fill="none"
        >
          <circle cx="50" cy="50" r="20" fill="#FACC15" />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
            <line
              key={deg}
              x1="50"
              y1="14"
              x2="50"
              y2="24"
              stroke="#F59E0B"
              strokeWidth="3"
              strokeLinecap="round"
              transform={`rotate(${deg} 50 50)`}
            />
          ))}
        </svg>
      )}

      {!showCustomLeft && key === 'summer' && (
        <svg
          viewBox="0 0 120 70"
          className={`${decorations.enableMobile ? 'block' : 'hidden md:block'} absolute bottom-3 left-2 sm:bottom-4 sm:left-4 w-16 h-10 sm:w-24 sm:h-14 opacity-85`}
          fill="none"
        >
          <path d="M6 40 Q24 22 42 40 T78 40 T114 40" stroke="#0284C7" strokeWidth="5" strokeLinecap="round" />
          <path d="M12 56 Q30 38 48 56 T84 56 T114 56" stroke="#38BDF8" strokeWidth="4" strokeLinecap="round" />
        </svg>
      )}
    </div>
  );
};
