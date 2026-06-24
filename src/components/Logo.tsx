import React from 'react';
import logoUrl from '../../public/assets/logo.png';

interface LogoProps {
  className?: string;
  size?: number | string;
  showText?: boolean;
}

export default function Logo({ className = '', size = 40, showText = false }: LogoProps) {
  return (
    <div className={`flex items-center gap-2.5 flex-row-reverse select-none ${className}`}>
      <img
        src={logoUrl}
        alt="Sur Volunteer Team Logo"
        style={{ width: size, height: size, objectFit: 'contain' }}
        className="shrink-0 drop-shadow-sm transition-transform duration-300 hover:scale-105"
      />

      {/* Optional text part for team branding */}
      {showText && (
        <div className="text-right flex flex-col justify-center">
          <span className="text-sm font-black text-gray-900 dark:text-white leading-none font-display">
            فريق صور التطوعي
          </span>
          <span className="text-[9px] font-mono tracking-wide text-emerald-600 dark:text-emerald-400 font-bold leading-none mt-1">
            SUR VOLUNTEER TEAM
          </span>
        </div>
      )}
    </div>
  );
}

