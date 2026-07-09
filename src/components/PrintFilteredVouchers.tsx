/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Voucher, VisualIdentity, EmployeePermissions } from '../types';
import { formatOMR, formatDate, withOklchWorkaround } from '../utils';
import { Printer, Download, X, FileText, Loader2, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import Logo from './Logo';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface PrintFilteredVouchersProps {
  vouchers: Voucher[];
  selectedMethod: string;
  identity: VisualIdentity;
  onClose: () => void;
  permissions?: EmployeePermissions;
  isManagerMode?: boolean;
}

export default function PrintFilteredVouchers({ vouchers, selectedMethod, identity, onClose, permissions, isManagerMode }: PrintFilteredVouchersProps) {
  const [isExporting, setIsExporting] = useState(false);

  const currentPermissions = (() => {
    if (isManagerMode) {
      const allTrue: any = {};
      const DEFAULT_FALLBACK = {
        createReceipt: true,
        createPayment: true,
        viewRecords: true,
        viewVoucher: true,
        printVoucher: true,
        exportVoucherPDF: true,
        editReceipt: false,
        editPayment: false,
        deleteReceipt: false,
        deletePayment: false,
        viewAttachments: true,
        addAttachments: true,
        deleteAttachments: false,
        viewArchive: false,
        printFiltered: false,
        exportFilteredPDF: false,
        accessSettings: false,
        changeIdentity: false,
        exportBackup: false,
        importBackup: false,
        resetSystem: false,
        viewDashboard: false,
        checkUpdates: false,
        managePermissions: false
      };
      Object.keys(DEFAULT_FALLBACK).forEach(k => { allTrue[k] = true; });
      return allTrue as EmployeePermissions;
    }
    if (permissions) return permissions;
    const DEFAULT_FALLBACK = {
      createReceipt: true,
      createPayment: true,
      viewRecords: true,
      viewVoucher: true,
      printVoucher: true,
      exportVoucherPDF: true,
      editReceipt: false,
      editPayment: false,
      deleteReceipt: false,
      deletePayment: false,
      viewAttachments: true,
      addAttachments: true,
      deleteAttachments: false,
      viewArchive: false,
      printFiltered: false,
      exportFilteredPDF: false,
      accessSettings: false,
      changeIdentity: false,
      exportBackup: false,
      importBackup: false,
      resetSystem: false,
      viewDashboard: false,
      checkUpdates: false,
      managePermissions: false
    };
    const saved = localStorage.getItem('sur_employee_permissions');
    if (saved) {
      try {
        return { ...DEFAULT_FALLBACK, ...JSON.parse(saved) };
      } catch (e) {
        return DEFAULT_FALLBACK as EmployeePermissions;
      }
    }
    return DEFAULT_FALLBACK as EmployeePermissions;
  })();

  const isPrintPermitted = !!currentPermissions.printFiltered;
  const isPDFPermitted = !!currentPermissions.exportFilteredPDF;

  // Filter-specific statistics calculations
  const totalReceipts = vouchers
    .filter(v => v.type === 'receipt')
    .reduce((sum, v) => sum + v.amount, 0);

  const totalPayments = vouchers
    .filter(v => v.type === 'payment')
    .reduce((sum, v) => sum + v.amount, 0);

  const netBalance = totalReceipts - totalPayments;

  const handlePrint = () => {
    const isDark = document.documentElement.classList.contains("dark");
    if (isDark) {
      document.documentElement.classList.remove("dark");
    }

    window.print();

    if (isDark) {
      document.documentElement.classList.add("dark");
    }
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    const element = document.getElementById("printable-report-card");
    if (!element) {
      alert("لم يتم العثور على منطقة التقرير القابلة للطباعة.");
      setIsExporting(false);
      return;
    }

    const isDark = document.documentElement.classList.contains("dark");
    try {
      // 1. Temporarily remove dark mode class to force white background and black text
      if (isDark) {
        document.documentElement.classList.remove("dark");
      }

      // 2. Ensure fonts are loaded
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
      
      await new Promise((resolve) => setTimeout(resolve, 500));

      const canvas = await withOklchWorkaround(element, async () => {
        return await html2canvas(element, {
          scale: 1.8, // Slightly reduced scale for high efficiency and preventing crashes on huge records lists
          useCORS: true,
          backgroundColor: "#ffffff"
        });
      });

      if (!canvas || canvas.width === 0 || canvas.height === 0) {
        throw new Error("توليد الصورة فشل، حجم المساحة فارغ.");
      }

      // Use JPEG with 0.95 quality for high rendering speed and low memory impact
      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      const pdf = new jsPDF("p", "mm", "a4");

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const imgWidth = pageWidth - (margin * 2);
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = margin;

      pdf.addImage(imgData, "JPEG", margin, position, imgWidth, imgHeight);
      heightLeft -= (pageHeight - margin * 2);

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight + margin;
        pdf.addPage();
        pdf.addImage(imgData, "JPEG", margin, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const methodText = selectedMethod === 'all' ? 'الكل' : selectedMethod;
      const pdfName = `report-payment-method-${methodText}-${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(pdfName);

      // Record backup metadata for PDF export
      localStorage.setItem('lastManualBackupDate', Date.now().toString());
      localStorage.setItem('lastManualBackupType', 'PDF');
      localStorage.setItem('lastManualBackupFileName', pdfName);
      localStorage.setItem('lastBackupCompletedDate', Date.now().toString());
    } catch (e) {
      console.error(e);
      alert("حدث خطأ أثناء تصدير ملف PDF، يرجى المحاولة مرة أخرى.");
    } finally {
      // Restore dark mode if it was active
      if (isDark) {
        document.documentElement.classList.add("dark");
      }
      setIsExporting(false);
    }
  };

  const paymentMethodLabel = selectedMethod === 'all' ? 'جميع طرق الدفع والصرف' : selectedMethod;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto print-overlay-wrapper">
      
      {/* Modal Container */}
      <div className="bg-white/95 dark:bg-[#0c203b] rounded-2xl w-full max-w-5xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] print:max-h-none print:shadow-none print:rounded-none border border-gray-100 dark:border-blue-900/40">
        
        {/* Top Control Bar */}
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
            <span className="text-[10px] text-gray-500 dark:text-gray-400 bg-sky-50 dark:bg-sky-950/20 px-2 py-1 rounded hidden lg:inline-block font-sans">
              💡 تلميح: يتكيف التقرير المطبوع أو المصدر تلقائياً مع حجم صفحات A4 القياسية وبنظام اتجاه من اليمين إلى اليسار
            </span>
            
            <button
              onClick={handlePrint}
              disabled={!isPrintPermitted}
              title={!isPrintPermitted ? "غير مصرح لك بهذا الإجراء." : "طباعة التقرير"}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                !isPrintPermitted 
                  ? 'bg-emerald-650/40 text-emerald-200/60 cursor-not-allowed opacity-50' 
                  : 'bg-emerald-600 text-white shadow-sm hover:opacity-95'
              }`}
            >
              <Printer className="w-4 h-4" />
              طباعة التقرير
            </button>

            <button
              onClick={handleExportPDF}
              disabled={isExporting || !isPDFPermitted}
              title={!isPDFPermitted ? "غير مصرح لك بهذا الإجراء." : "تصدير كـ PDF"}
              className={`px-5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                !isPDFPermitted 
                  ? 'bg-blue-650/40 text-blue-200/60 cursor-not-allowed opacity-50' 
                  : 'bg-blue-600 text-white shadow-sm hover:opacity-95'
              }`}
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  جاري التصدير...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  تصدير كـ PDF
                </>
              )}
            </button>
          </div>
        </div>

        {/* The Printable Area */}
        <div className="p-8 md:p-12 overflow-y-auto print:p-0 print:overflow-visible bg-white text-zinc-900 dark:text-zinc-900 dark:bg-white flex-1" id="printable-financial-document" dir="rtl" lang="ar">
          
          <div 
            id="printable-report-card" 
            dir="rtl" 
            lang="ar" 
            className="max-w-[900px] mx-auto border-4 border-double p-6 md:p-8 relative bg-white" 
            style={{ 
              borderColor: identity.primaryColor,
              fontFamily: "'Cairo', 'Tajawal', 'Noto Sans Arabic', Arial, sans-serif",
              direction: "rtl",
              unicodeBidi: "plaintext"
            }}
          >
            
            {/* Logo & Header */}
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
                <span className="inline-block text-[8px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100 font-extrabold">
                  تقرير مالي مفصل
                </span>
              </div>

              {/* Center - Logo */}
              <div className="flex flex-col items-center justify-center select-none text-center">
                <Logo size={60} showText={false} className="mx-auto" customLogo={identity.customLogo} />
                <p className="text-[7px] text-zinc-400 mt-1 font-mono tracking-widest uppercase">SUR VOLUNTEER</p>
              </div>

              {/* Left Side - Report Metadata */}
              <div className="text-left space-y-1 text-xs text-zinc-500 font-medium">
                <div className="flex justify-end items-center gap-1.5">
                  <span className="font-sans text-zinc-900 font-bold">{new Date().toLocaleDateString('ar-OM')}</span>
                  <span className="font-bold">:تاريخ الاستخراج</span>
                </div>
                <div className="flex justify-end items-center gap-1.5">
                  <span className="font-sans text-zinc-900 font-bold">{vouchers.length}</span>
                  <span className="font-bold">:عدد السندات المفلترة</span>
                </div>
                <div className="flex justify-end items-center gap-1.5">
                  <span className="text-zinc-900 font-bold">{paymentMethodLabel}</span>
                  <span className="font-bold">:طريقة الدفع المحددة</span>
                </div>
              </div>
            </div>

            {/* Title Header */}
            <div className="text-center py-3 mb-6 rounded shadow-sm relative overflow-hidden" 
                 style={{ backgroundColor: `${identity.primaryColor}10` }}>
              <div className="absolute top-0 right-0 w-2 h-full" style={{ backgroundColor: identity.primaryColor }} />
              <h2 className="text-base font-black" style={{ color: identity.primaryColor, letterSpacing: 'normal' }}>
                تقرير السندات حسب طريقة الدفع ({paymentMethodLabel})
              </h2>
            </div>

            {/* Statistics Dashboard Block */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              
              {/* Total Receipts */}
              <div className="border rounded-xl p-4 bg-zinc-50/50 flex flex-col justify-between" style={{ borderColor: `${identity.primaryColor}20` }}>
                <span className="text-[11px] font-bold text-zinc-500 mb-1 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                  إجمالي مبالغ القبض (المقبوضات)
                </span>
                <span className="text-lg font-black font-mono text-emerald-600">
                  {formatOMR(totalReceipts)}
                </span>
                <span className="text-[9px] text-zinc-400 mt-1">
                  العدد: {vouchers.filter(v => v.type === 'receipt').length} سندات قبض
                </span>
              </div>

              {/* Total Payments */}
              <div className="border rounded-xl p-4 bg-zinc-50/50 flex flex-col justify-between" style={{ borderColor: `${identity.primaryColor}20` }}>
                <span className="text-[11px] font-bold text-zinc-500 mb-1 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block" />
                  إجمالي مبالغ الصرف (المصروفات)
                </span>
                <span className="text-lg font-black font-mono text-rose-600">
                  {formatOMR(totalPayments)}
                </span>
                <span className="text-[9px] text-zinc-400 mt-1">
                  العدد: {vouchers.filter(v => v.type === 'payment').length} سندات صرف
                </span>
              </div>

              {/* Net Balance */}
              <div className="border rounded-xl p-4 bg-zinc-50/50 flex flex-col justify-between" style={{ borderColor: `${identity.primaryColor}20` }}>
                <span className="text-[11px] font-bold text-zinc-500 mb-1 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block" />
                  صافي رصيد التصفية
                </span>
                <span className={`text-lg font-black font-mono ${netBalance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {formatOMR(netBalance)}
                </span>
                <span className="text-[9px] text-zinc-400 mt-1">
                  الفرق الإجمالي لتدفق المبالغ المذكورة
                </span>
              </div>
            </div>

            {/* Table of matching records */}
            <div className="overflow-x-auto border rounded-xl" style={{ borderColor: `${identity.primaryColor}30` }}>
              <table className="w-full text-xs text-right border-collapse">
                <thead>
                  <tr className="bg-zinc-50 text-zinc-650 border-b font-bold" style={{ borderColor: `${identity.primaryColor}30` }}>
                    <th className="p-3">رقم السند</th>
                    <th className="p-3 text-center">النوع</th>
                    <th className="p-3">التاريخ</th>
                    <th className="p-3">الدافع / المستفيد</th>
                    <th className="p-3">طريقة الدفع</th>
                    <th className="p-3 text-left">المبلغ</th>
                    <th className="p-3">البيان (وذلك عن)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {vouchers.map((v) => {
                    const isReceipt = v.type === 'receipt';
                    return (
                      <tr key={v.id} className="hover:bg-zinc-50/40 transition-colors">
                        <td className="p-3 font-bold font-mono text-zinc-900">{v.voucherNo}</td>
                        <td className="p-3 text-center">
                          <span className={`inline-flex items-center gap-0.5 text-[9px] px-2 py-0.5 rounded-full font-bold ${
                            isReceipt 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                              : 'bg-rose-50 text-rose-700 border border-rose-100'
                          }`}>
                            {isReceipt ? <ArrowUpRight className="w-2.5 h-2.5" /> : <ArrowDownRight className="w-2.5 h-2.5" />}
                            {isReceipt ? identity.receiptTerm : identity.paymentTerm}
                          </span>
                        </td>
                        <td className="p-3 text-zinc-500 font-medium">{v.date}</td>
                        <td className="p-3 font-bold text-zinc-850">{v.payerOrBeneficiary}</td>
                        <td className="p-3 text-zinc-500">{v.paymentMethod || 'نقداً'}</td>
                        <td className="p-3 font-bold font-mono text-zinc-900 text-left">{formatOMR(v.amount)}</td>
                        <td className="p-3 text-zinc-500 max-w-[200px] truncate" title={v.description}>{v.description || '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Terms subtext */}
            <div className="mt-8 text-center bg-zinc-50 p-3.5 rounded-xl border border-dashed border-zinc-200">
              <p className="text-[9px] text-zinc-500 leading-relaxed italic text-center">
                "{identity.termsAndConditions}"
              </p>
            </div>

            {/* Signature Block */}
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

            {/* Stamp location */}
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

          <div className="mt-6 text-center text-zinc-400 text-[9px] font-mono print:hidden border-t pt-4">
            SUR VOLUNTEER COOPERATIVE FINANCIAL SYSTEM &copy; {new Date().getFullYear()}
          </div>
        </div>

      </div>

      <style>{`
        @media print {
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

          #printable-report-card {
            border: 4px double !important;
            box-shadow: none !important;
            margin: 0 auto !important;
            max-width: 100% !important;
            background: white !important;
            color: black !important;
            font-family: 'Cairo', 'Tajawal', 'Noto Sans Arabic', Arial, sans-serif !important;
            direction: rtl !important;
            unicode-bidi: plaintext !important;
          }

          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          @page {
            size: A4 portrait;
            margin: 1.5cm;
          }
        }
      `}</style>
    </div>
  );
}
