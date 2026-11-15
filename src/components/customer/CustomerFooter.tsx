import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Lock } from 'lucide-react';
import { useSiteData } from '../../contexts/SiteDataContext';
import { useSeasonalTheme } from '../../contexts/SeasonalThemeContext';
import { sanitizeUrl } from '../../lib/utils';
import { BrandLogo } from '../common/BrandLogo';

export const CustomerFooter: React.FC = () => {
  const { settings } = useSiteData();
  const { effectiveTheme } = useSeasonalTheme();

  const navItems =
    Array.isArray(settings.nav_items) && settings.nav_items.length > 0
      ? settings.nav_items
      : [
          { label: 'Trang chủ', href: '#hero' },
          { label: 'Câu chuyện', href: '#about' },
          { label: 'Thực đơn', href: '#menu' },
          { label: 'Không gian', href: '#gallery' },
          { label: 'Liên hệ', href: '#contact' },
        ];

  return (
    <footer
      style={
        effectiveTheme
          ? {
              backgroundColor: effectiveTheme.tokens.footerBg,
              borderColor: effectiveTheme.tokens.border,
            }
          : undefined
      }
      className="bg-[#241914] text-[#F7F5EF] pt-16 pb-12 border-t border-[#4B2E24] transition-colors duration-300"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-[#4B2E24]/80">
          {/* Brand Column */}
          <div className="md:col-span-5 space-y-4">
            <BrandLogo
              size="lg"
              subtitle="COFFEE HOUSE"
              textClassName="text-[#F7F5EF]"
            />
            <p className="text-sm text-[#D5C6AD]/80 max-w-sm leading-relaxed pt-1">
              {settings.footer_description}
            </p>
            <p className="font-serif italic text-base text-[#D5C6AD]">
              “{settings.slogan}”
            </p>
          </div>

          {/* Navigation Column */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="text-xs uppercase tracking-[0.22em] text-[#D5C6AD] font-semibold">
              Khám phá
            </h4>
            <ul className="space-y-2.5 text-sm">
              {navItems.map((item, idx) => (
                <li key={idx}>
                  <a
                    href={item.href}
                    className="link-underline inline-block text-[#E9E6D8]/80 hover:text-white transition-colors"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Hours & Socials */}
          <div className="md:col-span-4 space-y-3">
            <h4 className="text-xs uppercase tracking-[0.22em] text-[#D5C6AD] font-semibold">
              Thời gian & Kết nối
            </h4>
            <p className="text-sm text-[#E9E6D8]/85">
              Giờ mở cửa: {settings.opening_hours || '07:30 — 22:30'}
            </p>
            {settings.address && (
              <p className="text-sm text-[#E9E6D8]/80">{settings.address}</p>
            )}
            {settings.hotline && (
              <p className="text-sm text-[#E9E6D8]/80">Hotline: {settings.hotline}</p>
            )}

            <div className="pt-3 flex flex-wrap gap-4 text-xs uppercase tracking-widest">
              {settings.facebook_url && (
                <a
                  href={sanitizeUrl(settings.facebook_url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[#D5C6AD] hover:text-white"
                >
                  <span>Facebook</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </a>
              )}
              {settings.instagram_url && (
                <a
                  href={sanitizeUrl(settings.instagram_url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[#D5C6AD] hover:text-white"
                >
                  <span>Instagram</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </a>
              )}
              {settings.tiktok_url && (
                <a
                  href={sanitizeUrl(settings.tiktok_url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[#D5C6AD] hover:text-white"
                >
                  <span>TikTok</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Copyright & Utilities */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#D5C6AD]/70">
          <p>{settings.copyright_text}</p>
          <div className="flex items-center gap-5">
            <a
              href="#hero"
              className="text-[#D5C6AD]/80 hover:text-white transition-colors"
            >
              Lên đầu trang ↑
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
