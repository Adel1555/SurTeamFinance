/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Voucher, VisualIdentity } from '../types';
import { formatOMR, formatDate, tafqeet, patchGetComputedStyle, withOklchWorkaround } from '../utils';
import { Printer, Download, X, Stamp, ShieldCheck, FileSpreadsheet, Loader2 } from 'lucide-react';
import Logo from './Logo';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface PrintVoucherProps {
  voucher: Voucher | null;
  identity: VisualIdentity;
  onClose: () => void;
}

export default function PrintVoucher({ voucher, identity, onClose }: PrintVoucherProps) {
  if (!voucher) return null;

  const handlePrint = () => {
    console.log("PRINT BUTTON CLICKED");
    window.print();
  };

  const handleExportPDF = async () => {
    console.log("PDF BUTTON CLICKED");

    const element = document.getElementById("printable-voucher");
    console.log("PRINTABLE ELEMENT EXISTS:", !!element);
    console.log("PRINTABLE ELEMENT ID:", element?.id);

    if (!element) {
      alert("Printable voucher not found");
      return;
    }

    try {
      // 1. Load the fonts dynamically if they are not already loaded
      if (!document.getElementById("arabic-pdf-fonts")) {
        const link = document.createElement("link");
        link.id = "arabic-pdf-fonts";
        link.rel = "stylesheet";
        link.href = "https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&family=Tajawal:wght@400;700;900&display=swap";
        document.head.appendChild(link);
      }

      // 2. Wait for fonts to load
      if (document.fonts) {
        await document.fonts.ready;
      }
      
      // Delay to ensure full rendering of fonts is complete
      await new Promise((resolve) => setTimeout(resolve, 500));

      const canvas = await withOklchWorkaround(element, async () => {
        return await html2canvas(element, {
          scale: 2,
          useCORS: true,
          backgroundColor: "#ffffff"
        });
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");

      const pageWidth = pdf.internal.pageSize.getWidth();
      const imgWidth = pageWidth - 20;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 10, 10, imgWidth, imgHeight);
      pdf.save(`voucher-${voucher.voucherNo || voucher.id}.pdf`);
    } catch (e) {
      console.error(e);
      alert("حدث خطأ أثناء تصدير ملف PDF، يرجى المحاولة مرة أخرى.");
    }
  };

  // Determine terms based on identity settings
  const isReceipt = voucher.type === 'receipt';
  const voucherTerm = isReceipt ? identity.receiptTerm : identity.paymentTerm;
  const personRoleLabel = isReceipt ? 'واستلمنا من الفاضل / الجهة' : 'وصرفنا إلى الفاضل / الجهة';
  
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto print-overlay-wrapper">
      
      {/* Modal Container */}
      <div className="bg-white/95 dark:bg-[#0c203b] rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] print:max-h-none print:shadow-none print:rounded-none border border-gray-100 dark:border-blue-900/40">
        
        {/* Top Control Bar (Hidden in standard Print) */}
        <div className="flex justify-between items-center bg-blue-50/10 dark:bg-[#0b1f3a]/80 px-6 py-4 border-b border-gray-100 dark:border-blue-900/30 print:hidden text-right flex-row-reverse" dir="rtl">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-1 px-3 py-2 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-gray-800 dark:hover:text-white transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <X className="w-4 h-4" />
              إغلاق المعاينة
            </button>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-gray-500 dark:text-gray-400 bg-sky-50 dark:bg-sky-950/20 px-2 py-1 rounded hidden sm:inline-block font-sans">
              💡 تلميح: تتيح لك الأزرار أدناه الاختيار بين الطباعة المباشرة أو التنزيل الفوري كـ PDF
            </span>
            
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl text-xs font-black bg-emerald-600 text-white shadow-sm hover:opacity-95 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              طباعة
            </button>

            <button
              onClick={handleExportPDF}
              className="px-5 py-2 rounded-xl text-xs font-black bg-blue-600 text-white shadow-sm hover:opacity-95 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              تصدير كـ PDF
            </button>
          </div>
        </div>

        {/* The Printable Area (Styled to look like a classical high-end formal ledger) */}
        <div className="p-8 md:p-12 overflow-y-auto print:p-0 print:overflow-visible bg-white text-zinc-900 dark:text-zinc-900 dark:bg-white flex-1" id="printable-financial-document" dir="rtl" lang="ar">
          <div 
            id="printable-voucher" 
            dir="rtl" 
            lang="ar" 
            className="max-w-[800px] mx-auto border-4 border-double p-6 md:p-8 relative bg-white" 
            style={{ 
              borderColor: identity.primaryColor,
              fontFamily: "'Cairo', 'Tajawal', 'Noto Sans Arabic', Arial, sans-serif",
              direction: "rtl",
              unicodeBidi: "plaintext",
              letterSpacing: "normal",
              wordSpacing: "normal"
            }}
          >
            
            {/* Top Logo and National Emblem details */}
            <div className="flex justify-between items-start border-b-2 pb-5 mb-6" style={{ borderColor: identity.primaryColor }}>
              
              {/* Right Side - Team Official Heading */}
              <div className="text-right space-y-1.5">
                <h1 className="text-lg font-black" style={{ color: identity.primaryColor, letterSpacing: 'normal' }}>
                  {identity.title}
                </h1>
                <p className="text-[10px] font-bold text-zinc-500">
                  لجنة الشؤون المالية واللوجستية
                </p>
                <p className="text-[8px] text-zinc-400">
                  سلطنة عمان - محافظة جنوب الشرقية - ولاية صور
                </p>
                <span className="inline-block text-[8px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 font-extrabold">
                  سند معتمد رسمياً
                </span>
              </div>

              {/* Center - Visual Accent Emblem */}
              <div className="flex flex-col items-center justify-center select-none text-center">
                <Logo size={60} showText={false} className="mx-auto" />
                <p className="text-[7px] text-zinc-400 mt-1 font-mono tracking-widest uppercase">SUR VOLUNTEER</p>
              </div>

              {/* Left Side - Voucher Metadata */}
              <div className="text-left space-y-1">
                <div className="flex justify-end items-center gap-1.5 text-xs text-zinc-500">
                  <span className="font-bold font-sans text-zinc-900">{voucher.voucherNo}</span>
                  <span className="font-bold">:رقم السند</span>
                </div>
                <div className="flex justify-end items-center gap-1.5 text-xs text-zinc-500">
                  <span className="font-sans text-zinc-900">{voucher.date}</span>
                  <span className="font-bold">:التاريخ الميلادي</span>
                </div>
                <div className="flex justify-end items-center gap-1.5 text-xs text-zinc-500">
                  <span className="font-mono text-zinc-900">{isReceipt ? 'Receipt' : 'Payment'}</span>
                  <span className="font-bold">:النوع</span>
                </div>
              </div>
            </div>

            {/* Document Title Header Block */}
            <div className="text-center py-2.5 mb-8 rounded shadow-sm relative overflow-hidden" 
                 style={{ backgroundColor: `${identity.primaryColor}10` }}>
              <div className="absolute top-0 right-0 w-2 h-full" style={{ backgroundColor: identity.primaryColor }} />
              <h2 className="text-base font-extrabold" style={{ color: identity.primaryColor, letterSpacing: 'normal' }}>
                {voucherTerm}
              </h2>
            </div>

            {/* Ledger Table Structure */}
            <div className="space-y-6 text-sm">
              
              {/* Row 1: Amount & currency boxes alongside in bold format */}
              <div className="flex flex-col md:flex-row justify-between items-stretch gap-4">
                
                {/* Left Side - Beautiful currency box for clarity */}
                <div className="flex items-center border rounded-xl overflow-hidden min-w-[200px]" style={{ borderColor: identity.primaryColor }}>
                  <div className="px-3 py-2 text-white font-extrabold text-xs text-center" style={{ backgroundColor: identity.primaryColor }}>
                    المبلغ ر.ع.
                  </div>
                  <div className="px-4 py-2 font-black text-sm text-zinc-900 text-center flex-1 bg-zinc-50 font-mono tracking-wider">
                    {formatOMR(voucher.amount, false)}
                  </div>
                </div>

                {/* Right Side - Payment Method Box */}
                <div className="flex items-center border rounded-xl overflow-hidden flex-1" style={{ borderColor: identity.primaryColor }}>
                  <div className="px-3 py-2 text-white font-extrabold text-xs text-center" style={{ backgroundColor: identity.primaryColor }}>
                    طريقة الدفع
                  </div>
                  <div className="px-4 py-2 text-xs font-bold text-zinc-900 text-right flex-1 bg-zinc-50">
                    {voucher.paymentMethod}
                  </div>
                </div>
              </div>

              {/* Row 2: Recipient / Payer Name */}
              <div className="border-b pb-3 flex items-start gap-3">
                <span className="font-black text-xs min-w-[150px] text-zinc-500 text-right">
                  {personRoleLabel}:
                </span>
                <span className="font-black text-sm text-zinc-900 flex-1 text-right">
                  {voucher.payerOrBeneficiary}
                </span>
              </div>

              {/* Row 3: المبلغ بالأحرف تفقيطاً */}
              <div className="border-b pb-3 flex items-start gap-3">
                <span className="font-extrabold text-xs min-w-[150px] text-zinc-500 text-right">
                  قيمة وقدره (بالأحرف):
                </span>
                <span className="font-bold text-xs text-zinc-800 flex-1 text-right leading-relaxed decoration-double underline">
                  {tafqeet(voucher.amount)}
                </span>
              </div>

              {/* Row 4: Description / وذلك عن */}
              <div className="border-b pb-3 flex items-start gap-3">
                <span className="font-extrabold text-xs min-w-[150px] text-zinc-500 text-right">
                  وذلك لغرض / بيان:
                </span>
                <span className="text-xs text-zinc-800 flex-1 text-right leading-relaxed">
                  {voucher.description || 'بلا بيان توضيحي'}
                </span>
              </div>

              {/* Row 5: Notes / ملاحظات إضافية */}
              {voucher.notes && (
                <div className="border-b pb-3 flex items-start gap-3">
                  <span className="font-extrabold text-xs min-w-[150px] text-zinc-500 text-right">
                    ملاحظات إضافية:
                  </span>
                  <span className="text-xs text-zinc-500 italic flex-1 text-right">
                    {voucher.notes}
                  </span>
                </div>
              )}
            </div>

            {/* Terms and conditions subtext */}
            <div className="mt-8 text-center bg-zinc-50 p-3.5 rounded-xl border border-dashed border-zinc-200">
              <p className="text-[9px] text-zinc-500 leading-relaxed italic text-center">
                "{identity.termsAndConditions}"
              </p>
            </div>

            {/* Signature Block (Standard professional accounting) */}
            {identity.showSignatureBlock && (
              <div className="grid grid-cols-3 gap-4 mt-12 pt-6 border-t-2 border-zinc-100 text-[10px] text-zinc-500">
                <div className="text-center border-l pb-3">
                  <p className="font-extrabold text-zinc-700 mb-6">المسلم من قبله</p>
                  <p className="text-[8px]">الاسم والتوقيع: ..........................</p>
                </div>
                <div className="text-center border-l pb-3">
                  <p className="font-extrabold text-zinc-700 mb-6">المستلم المعتمد</p>
                  <p className="text-[8px]">الاسم والتوقيع: ..........................</p>
                </div>
                <div className="text-center pb-3">
                  <p className="font-extrabold text-zinc-700 mb-6">أمين الصندوق (المالية)</p>
                  <p className="text-[8px]">التوقيع والختم: ..........................</p>
                </div>
              </div>
            )}

            {/* Stamp location (Absolute position if requested) */}
            {identity.showStamp && (
              <div className="absolute bottom-16 left-12 w-20 h-20 rounded-full border-4 border-double flex items-center justify-center rotate-12 bg-white/50 border-cyan-800 text-cyan-800 p-1 opacity-75">
                <div className="w-full h-full rounded-full border border-dashed flex flex-col items-center justify-center p-1 text-center">
                  <span className="text-[8px] font-black leading-tight">معتمد رسمياً</span>
                  <span className="text-[7px] font-bold">فريق صور الخيرية</span>
                  <span className="text-[5px] text-zinc-400 uppercase font-mono">FINANCE DEPT</span>
                </div>
              </div>
            )}

          </div>

          {/* Decorative instructions for safe printing */}
          <div className="mt-6 text-center text-zinc-400 text-[9px] font-mono print:hidden border-t pt-4">
            SUR VOLUNTEER COOPERATIVE FINANCIAL SYSTEM &copy; {new Date().getFullYear()}
          </div>
        </div>

      </div>

      {/* Embedded print-only CSS injection to force proper printing page sizes, color backgrounds, and margin resets */}
      <style>{`
        @media print {
          /* Hide non-printable UI and page layouts */
          header, nav, aside, footer, button, select, .print\\:hidden {
            display: none !important;
          }
          
          body > *:not(.print-overlay-wrapper) {
            display: none !important;
          }
          
          #root {
            display: block !important;
            background: white !important;
          }
          
          #root > *:not(.print-overlay-wrapper) {
            display: none !important;
          }

          .print-overlay-wrapper {
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            height: auto !important;
            min-height: 100% !important;
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
            overflow: visible !important;
            display: block !important;
            z-index: 99999 !important;
            box-shadow: none !important;
            border: none !important;
          }

          .print-overlay-wrapper > div {
            max-height: none !important;
            overflow: visible !important;
            box-shadow: none !important;
            border: none !important;
            background: white !important;
            width: 100% !important;
            max-width: none !important;
            padding: 0 !important;
            margin: 0 !important;
            display: block !important;
          }

          #printable-financial-document {
            display: block !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            max-width: none !important;
            background: white !important;
            color: black !important;
            overflow: visible !important;
          }

          #printable-voucher {
            border: 4px double !important;
            box-shadow: none !important;
            margin: 0 auto !important;
            max-width: 100% !important;
            background: white !important;
            color: black !important;
            font-family: 'Cairo', 'Tajawal', 'Noto Sans Arabic', Arial, sans-serif !important;
            direction: rtl !important;
            unicode-bidi: plaintext !important;
            letter-spacing: normal !important;
            word-spacing: normal !important;
          }

          /* Ensure colors adjust nicely */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* Page break parameters */
          @page {
            size: A4 portrait;
            margin: 1.5cm;
          }
        }
      `}</style>
    </div>
  );
}
