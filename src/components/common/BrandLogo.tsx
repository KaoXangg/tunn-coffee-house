import React from 'react';
import { useSiteData } from '../../contexts/SiteDataContext';
import { cn } from '../../lib/utils';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  showText?: boolean;
  subtitle?: string;
  className?: string;
  textClassName?: string;
  logoUrlOverride?: string;
  brandNameOverride?: string;
}

const SIZE_MAP = {
  sm: 'w-9 h-9',
  md: 'w-11 h-11',
  lg: 'w-14 h-14',
  xl: 'w-20 h-20',
  '2xl': 'w-28 h-28',
};

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  showText = true,
  subtitle,
  className,
  textClassName,
  logoUrlOverride,
  brandNameOverride,
}) => {
  const { settings } = useSiteData();
  const logoSrc = logoUrlOverride || settings.logo_url || '/logo.jpg';
  const brandName = brandNameOverride || settings.brand_name || 'TUNN Coffee House';

  return (
    <div className={cn('inline-flex items-center gap-3 select-none', className)}>
      <div
        className={cn(
          'relative rounded-full overflow-hidden shrink-0 bg-[#E9E6D8] border border-[#D5C6AD]/60 flex items-center justify-center',
          SIZE_MAP[size]
        )}
      >
        <img
          src={logoSrc}
          alt={brandName}
          className="w-full h-full object-contain"
          loading="eager"
          onError={(e) => {
            const target = e.currentTarget;
            if (target.src !== `${window.location.origin}/logo.jpg`) {
              target.src = '/logo.jpg';
            }
          }}
        />
      </div>
      {showText && (
        <div className="flex flex-col">
          <span
            className={cn(
              'font-serif font-semibold tracking-wide leading-tight text-coffee-dark',
              size === 'sm' && 'text-base',
              size === 'md' && 'text-lg sm:text-xl',
              size === 'lg' && 'text-xl sm:text-2xl',
              size === 'xl' && 'text-2xl sm:text-3xl',
              textClassName
            )}
          >
            {brandName}
          </span>
          {subtitle && (
            <span className="text-[10px] uppercase tracking-[0.22em] text-coffee-muted mt-0.5">
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
