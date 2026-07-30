/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'card' | 'table-row';
  count?: number;
}

export default function SkeletonLoader({ className = '', variant = 'rectangular', count = 1 }: SkeletonProps) {
  const items = Array.from({ length: count });

  const getVariantStyles = () => {
    switch (variant) {
      case 'text':
        return 'h-4 w-full rounded-md';
      case 'circular':
        return 'h-10 w-10 rounded-full';
      case 'card':
        return 'h-32 w-full rounded-2xl';
      case 'table-row':
        return 'h-12 w-full rounded-xl';
      case 'rectangular':
      default:
        return 'h-20 w-full rounded-xl';
    }
  };

  return (
    <>
      {items.map((_, idx) => (
        <div
          key={idx}
          className={`skeleton-loader animate-shimmer relative overflow-hidden bg-[var(--table-header-bg)] border border-[var(--card-border)] opacity-70 ${getVariantStyles()} ${className}`}
          style={{
            backgroundImage: 'linear-gradient(90deg, rgba(255,255,255,0) 0, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0) 100%)',
            backgroundSize: '200% 100%',
          }}
        />
      ))}
    </>
  );
}

export function SkeletonTableRow({ columns = 5 }: { columns?: number }) {
  return (
    <tr className="animate-pulse border-b border-[var(--card-border)]">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-4 py-3.5">
          <div className="h-4 bg-[var(--table-header-bg)] rounded-md w-3/4 animate-shimmer" />
        </td>
      ))}
    </tr>
  );
}

export function SkeletonCardGrid({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-5 border border-[var(--card-border)] bg-[var(--card-bg)] rounded-2xl space-y-3">
          <div className="flex justify-between items-center">
            <div className="h-4 w-24 bg-[var(--table-header-bg)] rounded-md" />
            <div className="h-8 w-8 rounded-full bg-[var(--table-header-bg)]" />
          </div>
          <div className="h-8 w-32 bg-[var(--table-header-bg)] rounded-md" />
          <div className="h-3 w-20 bg-[var(--table-header-bg)] rounded-md" />
        </div>
      ))}
    </div>
  );
}
