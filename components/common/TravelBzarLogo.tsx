import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export type LogoLayout = 'ultrawide' | 'wide' | 'icon' | 'vertical' | 'full';

export interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'light' | 'dark'; // 'light' means parent container is dark (e.g. #061B33), 'dark' means parent is light
  layout?: LogoLayout;
  showTagline?: boolean;
  clickable?: boolean;
  href?: string;
  className?: string;
}

const LOGO_FILES: Record<LogoLayout, { src: string; aspect: number; defaultW: number; defaultH: number }> = {
  ultrawide: {
    src: '/logo-ultrawide.png',
    aspect: 4.25, // 425 x 100
    defaultW: 425,
    defaultH: 100,
  },
  wide: {
    src: '/logo-wide.png',
    aspect: 2.41, // 313 x 130
    defaultW: 313,
    defaultH: 130,
  },
  icon: {
    src: '/logo-icon.png',
    aspect: 1.03, // 233 x 225
    defaultW: 233,
    defaultH: 225,
  },
  vertical: {
    src: '/logo-vertical.png',
    aspect: 0.63, // 186 x 294
    defaultW: 186,
    defaultH: 294,
  },
  full: {
    src: '/logo-full.png',
    aspect: 1.67, // 305 x 183
    defaultW: 305,
    defaultH: 183,
  },
};

const DIMENSIONS: Record<LogoLayout, Record<'sm' | 'md' | 'lg' | 'xl', { width: number; height: number }>> = {
  ultrawide: {
    sm: { width: 110, height: 26 },
    md: { width: 145, height: 34 },
    lg: { width: 196, height: 46 },
    xl: { width: 246, height: 58 },
  },
  wide: {
    sm: { width: 72, height: 30 },
    md: { width: 96, height: 40 },
    lg: { width: 135, height: 56 },
    xl: { width: 173, height: 72 },
  },
  icon: {
    sm: { width: 28, height: 27 },
    md: { width: 38, height: 37 },
    lg: { width: 56, height: 54 },
    xl: { width: 74, height: 72 },
  },
  vertical: {
    sm: { width: 30, height: 48 },
    md: { width: 40, height: 64 },
    lg: { width: 60, height: 96 },
    xl: { width: 76, height: 120 },
  },
  full: {
    sm: { width: 50, height: 30 },
    md: { width: 70, height: 42 },
    lg: { width: 95, height: 57 },
    xl: { width: 120, height: 72 },
  },
};

export const TravelBzarLogo: React.FC<LogoProps> = ({
  size = 'md',
  variant = 'light',
  layout = 'ultrawide',
  showTagline = false,
  clickable = true,
  href = '/',
  className = '',
}) => {
  const isLight = variant === 'light'; // Parent is dark background
  const config = LOGO_FILES[layout] || LOGO_FILES.ultrawide;
  const dims = DIMENSIONS[layout]?.[size] || DIMENSIONS.ultrawide[size];

  // Brand guideline rule: "Logo is to be placed on white surface only."
  // When placed on dark backgrounds (isLight=true), wrap in a dedicated white badge.
  // When placed on already white surfaces (isLight=false), render directly and cleanly.
  const surfaceClasses = isLight
    ? 'bg-white rounded-xl px-2.5 py-1 sm:px-3 sm:py-1.5 shadow-sm border border-white/90 inline-flex items-center justify-center transition-all'
    : 'inline-flex items-center justify-center transition-all';

  const content = (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      {/* Strict White Surface Container */}
      <div className={surfaceClasses}>
        <Image
          src={config.src}
          alt="Travel BZAR"
          width={dims.width}
          height={dims.height}
          priority
          className="object-contain h-auto max-w-full"
          style={{ width: dims.width, height: 'auto' }}
        />
      </div>

      {/* Optional luxury tagline */}
      {showTagline && (
        <div
          className={`flex flex-col justify-center border-l pl-3 ${
            isLight ? 'border-slate-700/80 text-slate-300' : 'border-slate-300 text-slate-600'
          }`}
        >
          <span
            className={`font-black uppercase tracking-wider ${
              size === 'sm' ? 'text-[9px]' : size === 'md' ? 'text-[10px]' : 'text-xs'
            } ${isLight ? 'text-white' : 'text-[#061B33]'}`}
          >
            Private Chauffeur Service
          </span>
          <span
            className={`font-bold tracking-widest uppercase text-[#078A32] ${
              size === 'sm' ? 'text-[8px]' : size === 'md' ? 'text-[9px]' : 'text-[10px]'
            }`}
          >
            Dhanbad • Airport Corridors
          </span>
        </div>
      )}
    </div>
  );

  if (clickable) {
    return (
      <Link
        href={href}
        className="inline-block transition-transform hover:scale-[1.02] active:scale-[0.98]"
        title="Travel BZAR - Private Chauffeur Service"
      >
        {content}
      </Link>
    );
  }

  return content;
};
