import React from 'react';
import Link from 'next/link';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'light' | 'dark';
  showTagline?: boolean;
  clickable?: boolean;
  href?: string;
}

export const TravelBzarLogo: React.FC<LogoProps> = ({
  size = 'md',
  variant = 'light',
  showTagline = true,
  clickable = true,
  href = '/',
}) => {
  const isLight = variant === 'light';

  const textSizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-4xl',
  };

  const taglineSizes = {
    sm: 'text-[9px] tracking-wider',
    md: 'text-xs tracking-widest',
    lg: 'text-sm tracking-[0.2em]',
  };

  const content = (
    <div className="flex items-center gap-2.5 select-none">
      {/* Visual Brand Mark */}
      <div className="relative flex items-center justify-center">
        <div
          className={`relative rounded-xl overflow-hidden shadow-sm flex items-center justify-center font-bold ${
            size === 'sm' ? 'w-9 h-9' : size === 'md' ? 'w-11 h-11' : 'w-16 h-16'
          } ${isLight ? 'bg-[#061B33] text-white border border-slate-700/50' : 'bg-white text-[#061B33] border border-slate-200'}`}
        >
          {/* Stylized Red Airplane Angle */}
          <svg
            className={`absolute top-0.5 right-0.5 ${size === 'sm' ? 'w-4 h-4' : size === 'md' ? 'w-5 h-5' : 'w-8 h-8'} text-[#F0441D]`}
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
          </svg>

          {/* TB monogram */}
          <span className={`${size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : 'text-xl'} tracking-tighter text-[#42B900]`}>
            TB
          </span>

          {/* Green swoosh arc at bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#078A32] via-[#42B900] to-[#078A32]" />
        </div>
      </div>

      {/* Brand Text */}
      <div className="flex flex-col justify-center">
        <div className="flex items-center leading-none">
          <span
            className={`font-black ${textSizes[size]} tracking-tight ${
              isLight ? 'text-white' : 'text-[#061B33]'
            }`}
          >
            TRAVEL
          </span>
          <span className={`font-black ${textSizes[size]} tracking-tight ml-1.5 text-[#078A32]`}>
            BZAR
          </span>
        </div>

        {showTagline && (
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="w-2.5 h-[1.5px] bg-[#078A32]/60 inline-block" />
            <span
              className={`font-semibold uppercase ${taglineSizes[size]} ${
                isLight ? 'text-slate-300' : 'text-slate-600'
              }`}
            >
              PREMIUM CAB SERVICE
            </span>
            <span className="w-2.5 h-[1.5px] bg-[#078A32]/60 inline-block" />
          </div>
        )}
      </div>
    </div>
  );

  if (clickable) {
    return (
      <Link href={href} className="inline-block transition-opacity hover:opacity-95">
        {content}
      </Link>
    );
  }

  return content;
};
