/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'warning' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

interface ToastProps {
  toast: ToastMessage;
  onDismiss: (id: string) => void;
}

export default function ToastItem({ toast, onDismiss }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, toast.duration || 4000);

    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-rose-500 shrink-0" />;
      case 'info':
      default:
        return <Info className="w-5 h-5 text-blue-500 shrink-0" />;
    }
  };

  const getBorderColor = () => {
    switch (toast.type) {
      case 'success':
        return 'border-emerald-500/40 dark:border-emerald-500/30';
      case 'warning':
        return 'border-amber-500/40 dark:border-amber-500/30';
      case 'error':
        return 'border-rose-500/40 dark:border-rose-500/30';
      case 'info':
      default:
        return 'border-blue-500/40 dark:border-blue-500/30';
    }
  };

  const getProgressBg = () => {
    switch (toast.type) {
      case 'success':
        return 'bg-emerald-500';
      case 'warning':
        return 'bg-amber-500';
      case 'error':
        return 'bg-rose-500';
      case 'info':
      default:
        return 'bg-blue-500';
    }
  };

  return (
    <div
      className={`relative w-80 max-w-sm rounded-2xl p-4 shadow-xl border backdrop-blur-md bg-[var(--card-bg)] text-[var(--text-main)] transition-all duration-200 transform animate-toast-slide ${getBorderColor()} flex items-start gap-3 text-right overflow-hidden`}
      dir="rtl"
    >
      <div className="pt-0.5">{getIcon()}</div>
      
      <div className="flex-1 space-y-0.5">
        {toast.title && (
          <h4 className="text-xs font-black text-[var(--text-main)] leading-tight">
            {toast.title}
          </h4>
        )}
        <p className="text-[11px] font-medium text-[var(--text-secondary)] leading-relaxed">
          {toast.message}
        </p>
      </div>

      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="p-1 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-main)] hover:bg-[var(--app-bg)] transition-colors cursor-pointer shrink-0"
      >
        <X className="w-3.5 h-3.5" />
      </button>

      {/* Auto dismiss animated timer indicator */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black/5 dark:bg-white/5">
        <div
          className={`h-full ${getProgressBg()} animate-toast-progress`}
          style={{ animationDuration: `${toast.duration || 4000}ms` }}
        />
      </div>
    </div>
  );
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (!toasts.length) return null;

  return (
    <div className="fixed bottom-5 left-5 z-50 flex flex-col gap-2.5 max-w-md pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastItem toast={toast} onDismiss={onDismiss} />
        </div>
      ))}
    </div>
  );
}
