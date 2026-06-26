import React, { useState, useEffect } from 'react';
import { DatabaseService } from '../db';

const defaultLogoUrl = '/assets/logo.png';

interface LogoProps {
  className?: string;
  size?: number | string;
  showText?: boolean;
  customLogo?: string;
}

export default function Logo({ className = '', size = 40, showText = false, customLogo }: LogoProps) {
  const [hasError, setHasError] = useState(false);
  const [logoSource, setLogoSource] = useState(defaultLogoUrl);

  // Synchronize logo source with dynamic props or local DB configs
  useEffect(() => {
    setHasError(false);
    if (customLogo) {
      setLogoSource(customLogo);
    } else {
      try {
        const visualIdentity = DatabaseService.getVisualIdentity();
        if (visualIdentity && visualIdentity.customLogo) {
          setLogoSource(visualIdentity.customLogo);
        } else {
          setLogoSource(defaultLogoUrl);
        }
      } catch (e) {
        setLogoSource(defaultLogoUrl);
      }
    }
  }, [customLogo]);

  // Parse size safely for inline styles
  const finalSize = typeof size === 'number' ? `${size}px` : size;

  return (
    <div className={`flex items-center gap-2.5 flex-row-reverse select-none ${className}`}>
      {hasError ? (
        <span
          className="shrink-0 text-[10px] font-black tracking-wider text-emerald-600 dark:text-emerald-400 font-mono border border-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-lg px-2 flex items-center justify-center text-center"
          style={{ height: finalSize, minWidth: finalSize }}
        >
          AlKhazina
        </span>
      ) : (
        <img
          src={logoSource}
          alt="Sur Volunteer Team Logo"
          style={{ width: finalSize, height: finalSize, objectFit: 'contain' }}
          className="shrink-0 drop-shadow-sm transition-transform duration-300 hover:scale-105"
          onError={() => setHasError(true)}
        />
      )}

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

