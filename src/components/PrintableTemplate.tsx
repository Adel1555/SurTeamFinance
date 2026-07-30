/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Component, ErrorInfo, ReactNode, useEffect } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Download, X, FileText } from 'lucide-react';
import { VisualIdentity } from '../types';
import Logo from './Logo';
import { withOklchWorkaround } from '../utils';

export interface GeneratedPDF {
  pdf: jsPDF;
  blobUrl: string;
  filename: string;
}

/**
 * Generate PDF document in memory from a dedicated printable template container element.
 * Does NOT write to disk or trigger download automatically.
 */
export async function generatePDFInContainer(elementId: string, filename: string): Promise<GeneratedPDF> {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Export PDF Error: Element with ID '${elementId}' was not found.`);
    throw new Error(`تعذر العثور على عنصر التقرير: ${elementId}`);
  }

  // Ensure Arabic fonts are loaded
  if (!document.getElementById("arabic-pdf-fonts")) {
    const link = document.createElement("link");
    link.id = "arabic-pdf-fonts";
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&family=Tajawal:wght@400;700;900&display=swap";
    document.head.appendChild(link);
  }

  if (document.fonts) {
    await document.fonts.ready;
  }

  await new Promise((resolve) => setTimeout(resolve, 300));

  const canvas = await withOklchWorkaround(element, async () => {
    return await html2canvas(element, {
      scale: Math.max(2, window.devicePixelRatio * 1.5),
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
      onclone: (clonedDoc) => {
        // Enforce clean light color scheme on cloned document
        clonedDoc.documentElement.classList.remove('dark');
        clonedDoc.documentElement.style.setProperty('background-color', '#ffffff', 'important');
        clonedDoc.documentElement.style.setProperty('color', '#000000', 'important');
        clonedDoc.documentElement.style.setProperty('color-scheme', 'light', 'important');

        if (clonedDoc.body) {
          clonedDoc.body.style.setProperty('background-color', '#ffffff', 'important');
          clonedDoc.body.style.setProperty('color', '#000000', 'important');
          clonedDoc.body.style.setProperty('color-scheme', 'light', 'important');
        }

        const clonedTarget = clonedDoc.getElementById(elementId);
        if (clonedTarget) {
          clonedTarget.style.setProperty('position', 'relative', 'important');
          clonedTarget.style.setProperty('left', '0', 'important');
          clonedTarget.style.setProperty('top', '0', 'important');
          clonedTarget.style.setProperty('display', 'block', 'important');
          clonedTarget.style.setProperty('visibility', 'visible', 'important');
          clonedTarget.style.setProperty('background-color', '#ffffff', 'important');
          clonedTarget.style.setProperty('color', '#000000', 'important');
          clonedTarget.classList.remove('dark');

          // Strip dark classes and enforce pure high-contrast styles
          const allDescendants = clonedTarget.getElementsByTagName('*');
          for (let i = 0; i < allDescendants.length; i++) {
            const el = allDescendants[i] as HTMLElement;
            el.classList.remove('dark');
            const darkClasses: string[] = [];
            el.classList.forEach((cls) => {
              if (cls.startsWith('dark:')) darkClasses.push(cls);
            });
            darkClasses.forEach((cls) => el.classList.remove(cls));

            const style = clonedDoc.defaultView?.getComputedStyle(el);
            if (!style || style.backgroundColor === 'rgba(0, 0, 0, 0)' || style.backgroundColor === 'transparent') {
              el.style.setProperty('background-color', '#ffffff', 'important');
            }
          }
        }
      }
    });
  });

  if (!canvas || canvas.width === 0 || canvas.height === 0) {
    throw new Error("توليد الصورة فشل، حجم المساحة فارغ.");
  }

  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF("p", "mm", "a4");

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 10;
  const imgWidth = pageWidth - (margin * 2);
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  let heightLeft = imgHeight;
  let position = margin;

  pdf.addImage(imgData, "PNG", margin, position, imgWidth, imgHeight, undefined, 'FAST');
  heightLeft -= (pageHeight - margin * 2);

  while (heightLeft > 0) {
    position = heightLeft - imgHeight + margin;
    pdf.addPage();
    pdf.addImage(imgData, "PNG", margin, position, imgWidth, imgHeight, undefined, 'FAST');
    heightLeft -= pageHeight;
  }

  const blob = pdf.output('blob');
  const blobUrl = URL.createObjectURL(blob);

  return { pdf, blobUrl, filename };
}

/**
 * Backward compatible helper if direct save is ever requested.
 */
export async function exportElementToPDF(elementId: string, filename: string): Promise<void> {
  const generated = await generatePDFInContainer(elementId, filename);
  generated.pdf.save(filename);
}

interface PDFPreviewModalProps {
  pdfData: GeneratedPDF | null;
  onClose: () => void;
  onConfirmSave?: () => void;
}

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: any;
  errorInfo: any;
}

export class PDFPreviewErrorBoundary extends (React.Component as any) {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: any): ErrorBoundaryState {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error('=== [DEBUG 11] PDF PREVIEW ERROR BOUNDARY CAUGHT AN ERROR ===');
    console.error('Error Message:', error?.message);
    console.error('Error Name:', error?.name);
    console.error('Error Object:', error);
    console.error('Component Stack:', errorInfo?.componentStack);
    console.error('Stack Trace:', error?.stack);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 bg-red-950/90 text-white p-6 z-[99999] overflow-auto text-left font-mono text-xs dir-ltr">
          <h2 className="text-xl font-bold mb-2 text-red-400">[DEBUG ERROR BOUNDARY] PDF Preview Crashed</h2>
          <p className="font-bold text-red-200 mb-4">{String(this.state.error)}</p>
          <div className="bg-black/60 p-4 rounded mb-4 overflow-x-auto border border-red-800">
            <h3 className="font-semibold text-yellow-300">Stack Trace:</h3>
            <pre className="whitespace-pre-wrap">{this.state.error?.stack || 'No stack trace'}</pre>
          </div>
          <div className="bg-black/60 p-4 rounded mb-4 overflow-x-auto border border-red-800">
            <h3 className="font-semibold text-yellow-300">Component Stack:</h3>
            <pre className="whitespace-pre-wrap">{this.state.errorInfo?.componentStack || 'No component stack'}</pre>
          </div>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded cursor-pointer"
          >
            Reset Error Boundary
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * In-memory PDF preview modal.
 * The PDF is shown in an iframe preview without writing any file to disk.
 * The file is written to disk ONLY if the user explicitly clicks "Save PDF / حفظ الملف".
 */
export function PDFPreviewModal({ pdfData, onClose, onConfirmSave }: PDFPreviewModalProps) {
  useEffect(() => {
    if (!pdfData) return;

    // Lock background scroll while modal is active
    const originalStyle = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalStyle;
      // Clean up temporary blob URL memory when modal unmounts or data changes
      if (pdfData.blobUrl) {
        try {
          URL.revokeObjectURL(pdfData.blobUrl);
        } catch {
          // ignore cleanup errors
        }
      }
    };
  }, [pdfData]);

  if (!pdfData) return null;

  const handleSave = () => {
    pdfData.pdf.save(pdfData.filename);
    if (onConfirmSave) {
      onConfirmSave();
    }
    onClose();
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 z-[9999]"
      dir="rtl"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-5xl h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-gray-200 dark:border-zinc-800">
        {/* Modal Top Control Bar */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-xl">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base text-gray-900 dark:text-white">معاينة ملف PDF قبل الحفظ</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">راجع التقرير أدناه. لن يتم حفظ أي ملف على جهازك إلا إذا ضغطت على "حفظ الملف".</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSave}
              className="py-2.5 px-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all flex items-center gap-2 shadow-md hover:shadow-lg cursor-pointer active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>حفظ الملف (Save PDF)</span>
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="py-2.5 px-3.5 bg-gray-200 dark:bg-zinc-700 hover:bg-gray-300 dark:hover:bg-zinc-600 text-gray-800 dark:text-gray-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer active:scale-95"
            >
              <X className="w-4 h-4" />
              <span>إغلاق</span>
            </button>
          </div>
        </div>

        {/* PDF Document Preview Box */}
        <div
          className="flex-1 bg-gray-100 dark:bg-zinc-950 p-2 sm:p-4 overflow-hidden relative"
          onWheel={(e) => e.stopPropagation()}
        >
          <iframe
            src={pdfData.blobUrl}
            className="w-full h-full rounded-xl border border-gray-300 dark:border-zinc-800 shadow-inner bg-white block"
            title="PDF Preview"
          />
        </div>
      </div>
    </div>
  );
}

interface PrintableContainerProps {
  id: string;
  children: React.ReactNode;
}

export function PrintableContainer({ id, children }: PrintableContainerProps) {
  return (
    <div
      style={{
        position: 'fixed',
        left: '-9999px',
        top: '0',
        width: '800px',
        backgroundColor: '#ffffff',
        color: '#000000',
        fontFamily: "'Cairo', 'Tajawal', 'Noto Sans Arabic', Arial, sans-serif",
        zIndex: -9999,
        pointerEvents: 'none',
        direction: 'rtl',
        boxSizing: 'border-box',
        padding: '24px'
      }}
    >
      <div
        id={id}
        dir="rtl"
        lang="ar"
        style={{
          backgroundColor: '#ffffff',
          color: '#000000',
          border: '3px double #000000',
          padding: '24px',
          boxSizing: 'border-box',
          width: '100%'
        }}
      >
        {children}
      </div>
    </div>
  );
}

interface PrintableHeaderProps {
  identity: VisualIdentity;
  subtitle?: string;
  badgeText?: string;
  metadata?: Array<{ label: string; value: string | number }>;
}

export function PrintableHeader({ identity, subtitle = "لجنة الشؤون المالية واللوجستية", badgeText = "تقرير مالي معتمد", metadata = [] }: PrintableHeaderProps) {
  return (
    <div className="flex justify-between items-start border-b-2 border-black pb-4 mb-5" style={{ backgroundColor: '#ffffff', color: '#000000' }}>
      {/* Right Side - Team Official Heading */}
      <div className="text-right space-y-1" style={{ backgroundColor: '#ffffff', color: '#000000' }}>
        <h1 className="text-lg font-black tracking-normal" style={{ color: '#000000' }}>
          {identity.title}
        </h1>
        <p className="text-[10px] font-bold" style={{ color: '#374151' }}>
          {subtitle}
        </p>
        <p className="text-[8px]" style={{ color: '#4b5563' }}>
          سلطنة عمان - محافظة جنوب الشرقية - ولاية صور
        </p>
        <span className="inline-block text-[8px] px-2 py-0.5 rounded border border-black font-extrabold" style={{ backgroundColor: '#f3f4f6', color: '#000000' }}>
          {badgeText}
        </span>
      </div>

      {/* Center - Logo */}
      <div className="flex flex-col items-center justify-center text-center">
        <Logo size={56} showText={false} className="mx-auto" customLogo={identity.customLogo} />
        <p className="text-[7px] font-mono tracking-widest uppercase mt-1" style={{ color: '#374151' }}>SUR VOLUNTEER</p>
      </div>

      {/* Left Side - Report Metadata */}
      <div className="text-left space-y-1 text-xs font-medium" style={{ color: '#1f2937' }}>
        {metadata.map((item, idx) => (
          <div key={idx} className="flex justify-end items-center gap-1.5">
            <span className="font-bold" style={{ color: '#000000' }}>{item.value}</span>
            <span className="font-bold" style={{ color: '#374151' }}>:{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface PrintableTitleBarProps {
  title: string;
}

export function PrintableTitleBar({ title }: PrintableTitleBarProps) {
  return (
    <div className="text-center py-2.5 mb-5 rounded border border-black" style={{ backgroundColor: '#f3f4f6', color: '#000000' }}>
      <h2 className="text-sm font-black tracking-normal" style={{ color: '#000000' }}>
        {title}
      </h2>
    </div>
  );
}

interface PrintableSummaryCardProps {
  title: string;
  amount: string;
  subtext?: string;
  type?: 'positive' | 'negative' | 'neutral';
}

export function PrintableSummaryGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-3 mb-6" style={{ backgroundColor: '#ffffff' }}>
      {children}
    </div>
  );
}

export function PrintableSummaryCard({ title, amount, subtext, type = 'neutral' }: PrintableSummaryCardProps) {
  return (
    <div className="border border-black rounded p-3 flex flex-col justify-between text-right" style={{ backgroundColor: '#ffffff', color: '#000000' }}>
      <span className="text-[10px] font-bold mb-1" style={{ color: '#374151' }}>
        {title}
      </span>
      <span className="text-base font-black font-mono" style={{ color: '#000000' }}>
        {amount}
      </span>
      {subtext && (
        <span className="text-[8px] mt-1" style={{ color: '#4b5563' }}>
          {subtext}
        </span>
      )}
    </div>
  );
}

interface PrintableTableProps {
  headers: string[];
  children: React.ReactNode;
}

export function PrintableTable({ headers, children }: PrintableTableProps) {
  return (
    <div className="overflow-x-auto border border-black rounded mb-6" style={{ backgroundColor: '#ffffff' }}>
      <table className="w-full text-xs text-right border-collapse" style={{ backgroundColor: '#ffffff', color: '#000000' }}>
        <thead>
          <tr className="border-b border-black font-black" style={{ backgroundColor: '#f3f4f6', color: '#000000' }}>
            {headers.map((h, i) => (
              <th key={i} className="p-2.5 border-l border-gray-400 last:border-l-0" style={{ color: '#000000', backgroundColor: '#f3f4f6' }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-300" style={{ backgroundColor: '#ffffff', color: '#000000' }}>
          {children}
        </tbody>
      </table>
    </div>
  );
}

interface PrintableFooterProps {
  terms?: string;
  showSignature?: boolean;
}

export function PrintableFooter({ terms, showSignature = true }: PrintableFooterProps) {
  return (
    <div className="mt-6 space-y-6" style={{ backgroundColor: '#ffffff', color: '#000000' }}>
      {terms && (
        <div className="text-center p-2.5 rounded border border-dashed border-gray-400" style={{ backgroundColor: '#f9fafb', color: '#374151' }}>
          <p className="text-[8px] leading-relaxed italic" style={{ color: '#374151' }}>
            "{terms}"
          </p>
        </div>
      )}

      {showSignature && (
        <div className="grid grid-cols-3 gap-4 pt-4 border-t-2 border-black text-[9px]" style={{ color: '#1f2937' }}>
          <div className="text-center border-l border-gray-300 pb-2">
            <p className="font-extrabold mb-5" style={{ color: '#000000' }}>المسلم من قبله</p>
            <p className="text-[8px]" style={{ color: '#4b5563' }}>الاسم والتوقيع: ..........................</p>
          </div>
          <div className="text-center border-l border-gray-300 pb-2">
            <p className="font-extrabold mb-5" style={{ color: '#000000' }}>المستلم المعتمد</p>
            <p className="text-[8px]" style={{ color: '#4b5563' }}>الاسم والتوقيع: ..........................</p>
          </div>
          <div className="text-center pb-2">
            <p className="font-extrabold mb-5" style={{ color: '#000000' }}>أمين الصندوق (المالية)</p>
            <p className="text-[8px]" style={{ color: '#4b5563' }}>التوقيع والختم: ..........................</p>
          </div>
        </div>
      )}
    </div>
  );
}
