/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo } from 'react';
import { Voucher, VisualIdentity, EmployeePermissions } from '../types';
import { formatOMR, exportToExcelCSV } from '../utils';
import { FileDown, Calendar, ArrowUpRight, ArrowDownRight, Scale, Printer, NotebookTabs, Loader2, Download, Eye, FileText, FileSpreadsheet } from 'lucide-react';
import PrintFilteredVouchers from './PrintFilteredVouchers';
import { generatePDFInContainer, PDFPreviewModal, PDFPreviewErrorBoundary, GeneratedPDF, PrintableContainer, PrintableHeader, PrintableTitleBar, PrintableSummaryGrid, PrintableSummaryCard, PrintableTable, PrintableFooter } from './PrintableTemplate';

interface QuarterlyReportsProps {
  vouchers: Voucher[];
  identity: VisualIdentity;
  onNavigateToArchive?: (dateFrom: string, dateTo: string) => void;
  permissions?: EmployeePermissions;
  isManagerMode?: boolean;
}

export default function QuarterlyReports({ vouchers, identity, onNavigateToArchive, permissions, isManagerMode }: QuarterlyReportsProps) {
  const [detailModalConfig, setDetailModalConfig] = useState<{
    isOpen: boolean;
    vouchers: Voucher[];
    title: string;
    autoPDF: boolean;
  } | null>(null);
  // Allow filtering reports by Year (default to current year or maximum year in vouchers)
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    vouchers.forEach(v => {
      if (v.date) {
        const year = v.date.split('-')[0];
        if (year && year.length === 4) {
          years.add(year);
        }
      }
    });
    // Add current year as absolute default if none exists
    const currentYear = new Date().getFullYear().toString();
    years.add(currentYear);
    return Array.from(years).sort((a, b) => b.localeCompare(a)); // Sort descending
  }, [vouchers]);

  const [selectedYear, setSelectedYear] = useState<string>(() => {
    const currentYear = new Date().getFullYear().toString();
    return availableYears.includes(currentYear) ? currentYear : (availableYears[0] || currentYear);
  });

  // Calculate quarterly stats
  const quarterlyData = useMemo(() => {
    const quarters = [
      { name: 'الربع الأول', months: [1, 2, 3], monthsLabel: 'يناير، فبراير، مارس', receipts: 0, payments: 0, receiptsCount: 0, paymentsCount: 0 },
      { name: 'الربع الثاني', months: [4, 5, 6], monthsLabel: 'أبريل، مايو، يونيو', receipts: 0, payments: 0, receiptsCount: 0, paymentsCount: 0 },
      { name: 'الربع الثالث', months: [7, 8, 9], monthsLabel: 'يوليو، أغسطس، سبتمبر', receipts: 0, payments: 0, receiptsCount: 0, paymentsCount: 0 },
      { name: 'الربع الرابع', months: [10, 11, 12], monthsLabel: 'أكتوبر، نوفمبر، ديسمبر', receipts: 0, payments: 0, receiptsCount: 0, paymentsCount: 0 },
    ];

    vouchers.forEach(v => {
      if (!v.date) return;
      const parts = v.date.split('-');
      const year = parts[0];
      const month = parseInt(parts[1], 10);

      if (year === selectedYear && !isNaN(month)) {
        quarters.forEach(q => {
          if (q.months.includes(month)) {
            if (v.type === 'receipt') {
              q.receipts += v.amount;
              q.receiptsCount += 1;
            } else {
              q.payments += v.amount;
              q.paymentsCount += 1;
            }
          }
        });
      }
    });

    return quarters.map(q => ({
      ...q,
      net: q.receipts - q.payments,
      totalVouchers: q.receiptsCount + q.paymentsCount
    }));
  }, [vouchers, selectedYear]);

  // Overall Year Totals
  const yearlyTotals = useMemo(() => {
    let receipts = 0;
    let payments = 0;
    let recCount = 0;
    let payCount = 0;

    quarterlyData.forEach(q => {
      receipts += q.receipts;
      payments += q.payments;
      recCount += q.receiptsCount;
      payCount += q.paymentsCount;
    });

    return {
      receipts,
      payments,
      net: receipts - payments,
      vouchersCount: recCount + payCount,
      recCount,
      payCount
    };
  }, [quarterlyData]);

  const [isExporting, setIsExporting] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  // Helper to dynamically derive quarter date range according to selected fiscal year
  const getQuarterRange = (qIndex: number, year: string) => {
    const ranges = [
      { from: `${year}-01-01`, to: `${year}-03-31`, label: 'الربع الأول' },
      { from: `${year}-04-01`, to: `${year}-06-30`, label: 'الربع الثاني' },
      { from: `${year}-07-01`, to: `${year}-09-30`, label: 'الربع الثالث' },
      { from: `${year}-10-01`, to: `${year}-12-31`, label: 'الربع الرابع' },
    ];
    return ranges[qIndex] || ranges[0];
  };

  const handleViewQuarterDetails = (qIndex: number) => {
    const range = getQuarterRange(qIndex, selectedYear);
    const qVouchers = vouchers.filter(v => v.date && v.date >= range.from && v.date <= range.to);

    setDetailModalConfig({
      isOpen: true,
      vouchers: qVouchers,
      title: `كشف تفصيلي - ${range.label} (${selectedYear})`,
      autoPDF: false,
    });

    if (onNavigateToArchive) {
      onNavigateToArchive(range.from, range.to);
    }
  };

  const handleExportQuarterPDF = (qIndex: number) => {
    const range = getQuarterRange(qIndex, selectedYear);
    const qVouchers = vouchers.filter(v => v.date && v.date >= range.from && v.date <= range.to);

    setDetailModalConfig({
      isOpen: true,
      vouchers: qVouchers,
      title: `كشف تفصيلي - ${range.label} (${selectedYear})`,
      autoPDF: true,
    });
  };

  const handleExportQuarterExcel = (qIndex: number) => {
    const range = getQuarterRange(qIndex, selectedYear);
    const qVouchers = vouchers.filter(v => v.date && v.date >= range.from && v.date <= range.to);

    exportToExcelCSV(qVouchers, identity.receiptTerm, identity.paymentTerm);
  };

  const handlePrintReport = async () => {
    setIsPrinting(true);
    const isDark = document.documentElement.classList.contains("dark");
    try {
      if (isDark) {
        document.documentElement.classList.remove("dark");
      }
      window.focus();
      // Brief delay to ensure render focus
      await new Promise((resolve) => setTimeout(resolve, 300));
      window.print();
    } catch (err) {
      console.error('Error opening print dialog:', err);
      alert('حدث خطأ أثناء فتح واجهة الطباعة، يرجى المحاولة مرة أخرى.');
    } finally {
      if (isDark) {
        document.documentElement.classList.add("dark");
      }
      setIsPrinting(false);
    }
  };

  const [pdfPreviewData, setPdfPreviewData] = useState<GeneratedPDF | null>(null);

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const generated = await generatePDFInContainer('pdf-dedicated-quarterly-report', `SurVolunteer_Financial_Report_${selectedYear}.pdf`);
      setPdfPreviewData(generated);
    } catch (err) {
      console.error('Error exporting financial report PDF:', err);
      alert('حدث خطأ أثناء تصدير التقرير المالي، يرجى المحاولة مرة أخرى.');
    } finally {
      setIsExporting(false);
    }
  };

  const cardStyleClass = 
    identity.cardStyle === 'flat' ? 'border-0 bg-blue-50/20 dark:bg-[#0d2342]/60 rounded-2xl shadow-none finance-glow-card' :
    identity.cardStyle === 'bordered' ? 'border border-blue-100 dark:border-blue-500/20 bg-white/95 dark:bg-[#0c203b]/90 rounded-2xl finance-glow-card' :
    identity.cardStyle === 'shadowed' ? 'shadow-xl bg-white/95 dark:bg-[#0c203b]/90 border border-blue-100/60 dark:border-blue-500/20 rounded-2xl finance-glow-card' :
    'backdrop-blur-md bg-white/70 dark:bg-[#0b1f3a]/80 border border-blue-200/40 dark:border-blue-500/15 rounded-3xl finance-glow-card';

  return (
    <div className="space-y-6 text-right relative" id="quarterly-reports-panel">
      
      {/* Printable page layout inside the PDF print flow */}
      <div className="hidden print:block text-right p-6 text-zinc-900 bg-white" id="printable-report-section">
        <div className="border-4 border-double border-zinc-800 p-8">
          <div className="flex justify-between items-center border-b-2 border-zinc-805 pb-4 mb-6">
            <div>
              <h1 className="text-xl font-bold">{identity.title}</h1>
              <p className="text-xs text-zinc-500">اللجنة المالية والتدقيق</p>
            </div>
            <div className="text-center font-serif">
              <h2 className="text-base font-extrabold text-zinc-800">التقرير المالي الربعي الموحد</h2>
              <p className="text-xs text-zinc-500">للعام الميلادي: {selectedYear}</p>
            </div>
            <div className="text-left text-[10px] text-zinc-400">
              <p>تاريخ الاستخراج: {new Date().toLocaleDateString('ar-OM')}</p>
            </div>
          </div>

          {/* Core Table printable */}
          <table className="w-full text-xs text-right border-collapse border border-zinc-300">
            <thead>
              <tr className="bg-zinc-100 border border-zinc-300">
                <th className="p-3 border border-zinc-300">الفترة المالية (الربع)</th>
                <th className="p-3 border border-zinc-300">الأشهر المدرجة</th>
                <th className="p-3 border border-zinc-300">إجمالي المقبوضات</th>
                <th className="p-3 border border-zinc-300">إجمالي المصروفات</th>
                <th className="p-3 border border-zinc-300">صـافي الرصيد</th>
                <th className="p-3 border border-zinc-300">مجموع السندات</th>
              </tr>
            </thead>
            <tbody>
              {quarterlyData.map((q, idx) => (
                <tr key={idx} className="border border-zinc-300">
                  <td className="p-3 font-bold border border-zinc-300">{q.name}</td>
                  <td className="p-3 border border-zinc-300">{q.monthsLabel}</td>
                  <td className="p-3 font-mono border border-zinc-300">{formatOMR(q.receipts)} ({q.receiptsCount} سند)</td>
                  <td className="p-3 font-mono border border-zinc-300">{formatOMR(q.payments)} ({q.paymentsCount} سند)</td>
                  <td className={`p-3 font-mono font-bold border border-zinc-300 ${q.net >= 0 ? '' : 'text-red-600'}`}>{formatOMR(q.net)}</td>
                  <td className="p-3 border border-zinc-300">{q.totalVouchers}</td>
                </tr>
              ))}
              {/* Grand totals row */}
              <tr className="bg-zinc-150 font-bold border border-zinc-300">
                <td className="p-3 border border-zinc-300" colSpan={2}>إجمالي الحساب الختامي السنوي</td>
                <td className="p-3 font-mono border border-zinc-300">{formatOMR(yearlyTotals.receipts)} ({yearlyTotals.recCount} سند)</td>
                <td className="p-3 font-mono border border-zinc-300">{formatOMR(yearlyTotals.payments)} ({yearlyTotals.payCount} سند)</td>
                <td className={`p-3 font-mono border border-zinc-300 ${yearlyTotals.net >= 0 ? '' : 'text-red-600'}`}>{formatOMR(yearlyTotals.net)}</td>
                <td className="p-3 border border-zinc-300">{yearlyTotals.vouchersCount}</td>
              </tr>
            </tbody>
          </table>

          <div className="grid grid-cols-2 gap-8 mt-16 text-xs pt-8 border-t border-dashed border-zinc-200">
            <div className="text-center">
              <p className="font-extrabold text-zinc-700">توقيع واعتماد أمين الصندوق</p>
              <div className="h-10" />
              <p>............................................</p>
            </div>
            <div className="text-center">
              <p className="font-extrabold text-zinc-700">اعتماد رئيس فريق صور التطوعي</p>
              <div className="h-10" />
              <p>............................................</p>
            </div>
          </div>
        </div>
      </div>

      {/* Screen Interactive UI Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-100 dark:border-zinc-800 pb-5 print:hidden">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <NotebookTabs className="w-5 h-5 text-[var(--primary-color)]" />
            التقارير المالية الربعية
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            كشوفات ربع سنوية تلقائية ملخصة بناءً على تاريخ السندات المدخلة لتقييم السيولة والميزانية السنوية.
          </p>
        </div>

        <div className="flex gap-2.5 items-center">
          {/* Year filtering select */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-400">السنة المالية:</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="text-xs font-semibold font-mono bg-gray-50 dark:bg-zinc-900 border border-gray-250 dark:border-zinc-800 px-3.5 py-1.5 rounded-xl text-gray-800 dark:text-gray-200 focus:outline-none"
            >
              {availableYears.map(yr => (
                <option key={yr} value={yr}>{yr}</option>
              ))}
            </select>
          </div>

          <button
            onClick={handlePrintReport}
            disabled={isPrinting}
            style={{ backgroundColor: `${identity.primaryColor}20`, color: identity.primaryColor, borderColor: `${identity.primaryColor}30` }}
            className="px-4 py-2 rounded-xl text-xs font-black border transition-all flex items-center gap-1.5 hover:opacity-90 cursor-pointer disabled:opacity-75 disabled:cursor-wait"
          >
            {isPrinting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                جاري فتح الطباعة...
              </>
            ) : (
              <>
                <Printer className="w-4 h-4" />
                طباعة التقرير
              </>
            )}
          </button>

          <button
            onClick={handleExportPDF}
            disabled={isExporting}
            style={{ backgroundColor: identity.primaryColor }}
            className="px-4 py-2 rounded-xl text-xs font-black text-white shadow-sm hover:opacity-95 transition-all flex items-center gap-1.5 disabled:opacity-75 disabled:cursor-wait cursor-pointer"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                جاري تحضير PDF...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                تصدير كـ PDF رقمي
              </>
            )}
          </button>
        </div>
      </div>

      {/* Quick year summary banner */}
      <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 print:hidden`}>
        <div className={`p-4 ${cardStyleClass} border-r-4 border-emerald-500`}>
          <span className="text-[10px] uppercase font-bold text-gray-400">مجموع المقبوضات ({selectedYear})</span>
          <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-1">{formatOMR(yearlyTotals.receipts)}</p>
          <span className="text-[9px] text-gray-400 block mt-1">عدد سندات القبض: {yearlyTotals.recCount} سند</span>
        </div>

        <div className={`p-4 ${cardStyleClass} border-r-4 border-rose-500`}>
          <span className="text-[10px] uppercase font-bold text-gray-400">مجموع المصروفات ({selectedYear})</span>
          <p className="text-lg font-black text-rose-600 dark:text-rose-400 mt-1">{formatOMR(yearlyTotals.payments)}</p>
          <span className="text-[9px] text-gray-400 block mt-1">عدد سندات الصرف: {yearlyTotals.payCount} سند</span>
        </div>

        <div className={`p-4 ${cardStyleClass} border-r-4`} style={{ borderRightColor: identity.primaryColor }}>
          <span className="text-[10px] uppercase font-bold text-gray-400">صافي الميزانية الحالية ({selectedYear})</span>
          <p className={`text-lg font-black mt-1 ${yearlyTotals.net >= 0 ? 'text-gray-900 dark:text-white' : 'text-rose-600'}`}>
            {formatOMR(yearlyTotals.net)}
          </p>
          <span className="text-[9px] text-gray-400 block mt-1">الرصيد الكلي المتوفر للمشاريع</span>
        </div>
      </div>

      {/* Main interactive Quarters grid cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:hidden">
        {quarterlyData.map((q, idx) => (
          <div key={idx} className={`p-5 space-y-4 ${cardStyleClass} border border-gray-100 dark:border-zinc-800`}>
            
            {/* Quarter Card Header */}
            <div className="flex justify-between items-start flex-row-reverse border-b border-gray-100 dark:border-zinc-850 pb-3">
              <div>
                <h3 className="font-extrabold text-sm text-gray-800 dark:text-gray-100">{q.name}</h3>
                <p className="text-[10px] text-gray-400 mt-0.5">{q.monthsLabel}</p>
              </div>
              <span className="text-[9px] font-semibold bg-gray-50 dark:bg-zinc-900/60 text-gray-500 dark:text-gray-400 px-2 py-1 rounded">
                الربع المالي {idx + 1}
              </span>
            </div>

            {/* Income and Outcome comparative rows */}
            <div className="space-y-2.5 text-xs text-gray-600 dark:text-gray-300">
              
              {/* Receipt */}
              <div className="flex justify-between items-center text-right flex-row-reverse">
                <span className="flex items-center gap-1.5 flex-row-reverse min-w-[120px]">
                  <ArrowUpRight className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>إجمالي المقبوضات:</span>
                </span>
                <span className="font-bold text-gray-900 dark:text-white font-mono">{formatOMR(q.receipts)}</span>
                <span className="text-[10px] text-gray-400">({q.receiptsCount} سند)</span>
              </div>

              {/* Payment */}
              <div className="flex justify-between items-center text-right flex-row-reverse border-b border-gray-50 dark:border-zinc-900 pb-2">
                <span className="flex items-center gap-1.5 flex-row-reverse min-w-[120px]">
                  <ArrowDownRight className="w-4 h-4 text-rose-505 shrink-0" />
                  <span>إجمالي المصروفات:</span>
                </span>
                <span className="font-bold text-gray-900 dark:text-white font-mono">{formatOMR(q.payments)}</span>
                <span className="text-[10px] text-gray-400">({q.paymentsCount} سند)</span>
              </div>

              {/* Net Balance */}
              <div className="flex justify-between items-center text-right flex-row-reverse pt-1">
                <span className="flex items-center gap-1.5 flex-row-reverse min-w-[120px] font-semibold">
                  <Scale className="w-4 h-4 text-[var(--primary-color)] shrink-0" />
                  <span>صافي الفائض/العجز:</span>
                </span>
                <span className={`font-black font-mono ${q.net >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'}`}>
                  {formatOMR(q.net)}
                </span>
              </div>

            </div>

            {/* Q status warning */}
            <div className="text-[9px] text-gray-400 border-t border-gray-50 dark:border-zinc-900/60 pt-2 flex justify-between">
              <span>نسبة الصرف للنقد المقبوض: <strong className="font-bold font-mono text-gray-800 dark:text-gray-200">{q.receipts > 0 ? `${Math.round((q.payments / q.receipts) * 100)}%` : '0%'}</strong></span>
              <span>مجموع الحركات: {q.totalVouchers}</span>
            </div>

            {/* Quarter Card Action Buttons */}
            <div className="pt-3 border-t border-gray-100 dark:border-zinc-800/80 flex items-center justify-between gap-2 flex-row-reverse">
              {/* 1. عرض التفاصيل */}
              <button
                type="button"
                onClick={() => handleViewQuarterDetails(idx)}
                style={{ backgroundColor: `${identity.primaryColor}15`, color: identity.primaryColor }}
                className="flex-1 py-2 px-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1 hover:opacity-90 hover:shadow-sm cursor-pointer border border-blue-200/40 dark:border-blue-900/40"
                title="عرض التقرير المالي التفصيلي وتصفية الأرشيف"
              >
                <Eye className="w-3.5 h-3.5 shrink-0" />
                <span>عرض التفاصيل</span>
              </button>

              {/* 2. PDF */}
              <button
                type="button"
                onClick={() => handleExportQuarterPDF(idx)}
                className="flex-1 py-2 px-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1 shadow-sm hover:shadow cursor-pointer"
                title="تصدير التقرير التفصيلي كملف PDF"
              >
                <FileText className="w-3.5 h-3.5 shrink-0" />
                <span>PDF</span>
              </button>

              {/* 3. Excel */}
              <button
                type="button"
                onClick={() => handleExportQuarterExcel(idx)}
                className="flex-1 py-2 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1 shadow-sm hover:shadow cursor-pointer"
                title="تصدير كشف السندات كملف Excel CSV"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 shrink-0" />
                <span>Excel</span>
              </button>
            </div>

          </div>
        ))}
      </div>

      {detailModalConfig && detailModalConfig.isOpen && (
        <PrintFilteredVouchers
          vouchers={detailModalConfig.vouchers}
          selectedMethod={detailModalConfig.title}
          identity={identity}
          onClose={() => setDetailModalConfig(null)}
          permissions={permissions}
          isManagerMode={isManagerMode}
          autoExportPDF={detailModalConfig.autoPDF}
        />
      )}

      {/* Dedicated Printable Template for PDF Export (Isolated from UI) */}
      <PrintableContainer id="pdf-dedicated-quarterly-report">
        <PrintableHeader
          identity={identity}
          subtitle="لجنة الشؤون المالية واللوجستية"
          badgeText={`التقرير المالي لعام ${selectedYear}`}
          metadata={[
            { label: "السنة المالية", value: selectedYear },
            { label: "تاريخ الاستخراج", value: new Date().toLocaleDateString('ar-OM') },
            { label: "إجمالي السندات", value: yearlyTotals.vouchersCount }
          ]}
        />

        <PrintableTitleBar title={`التقرير المالي السنوي - ملخص الأرباع لعام ${selectedYear}`} />

        <PrintableSummaryGrid>
          <PrintableSummaryCard
            title="إجمالي المقبوضات السنوية"
            amount={formatOMR(yearlyTotals.receipts)}
            subtext={`عدد السندات: ${yearlyTotals.recCount}`}
            type="positive"
          />
          <PrintableSummaryCard
            title="إجمالي المصروفات السنوية"
            amount={formatOMR(yearlyTotals.payments)}
            subtext={`عدد السندات: ${yearlyTotals.payCount}`}
            type="negative"
          />
          <PrintableSummaryCard
            title="صافي رصيد السنة"
            amount={formatOMR(yearlyTotals.net)}
            subtext="الفائض / العجز المالي التراكمي"
            type="neutral"
          />
        </PrintableSummaryGrid>

        <PrintableTable headers={["الربع السنوي", "الأشهر", "المقبوضات (ر.ع.)", "المصروفات (ر.ع.)", "صافي الرصيد (ر.ع.)", "إجمالي الحركات"]}>
          {quarterlyData.map((q, idx) => (
            <tr key={idx} style={{ backgroundColor: '#ffffff', color: '#000000' }}>
              <td className="p-2 font-bold" style={{ color: '#000000', backgroundColor: '#ffffff' }}>{q.name}</td>
              <td className="p-2 font-bold" style={{ color: '#374151', backgroundColor: '#ffffff' }}>{q.monthsLabel}</td>
              <td className="p-2 font-bold font-mono text-left" style={{ color: '#000000', backgroundColor: '#ffffff' }}>{formatOMR(q.receipts)}</td>
              <td className="p-2 font-bold font-mono text-left" style={{ color: '#000000', backgroundColor: '#ffffff' }}>{formatOMR(q.payments)}</td>
              <td className="p-2 font-bold font-mono text-left" style={{ color: '#000000', backgroundColor: '#ffffff' }}>{formatOMR(q.net)}</td>
              <td className="p-2 text-center font-bold" style={{ color: '#000000', backgroundColor: '#ffffff' }}>{q.totalVouchers}</td>
            </tr>
          ))}
        </PrintableTable>

        <PrintableFooter terms={identity.termsAndConditions} showSignature={identity.showSignatureBlock} />
      </PrintableContainer>

      {/* Embedded stylings strictly for reports table print scaling */}
      <style>{`
        @media print {
          /* Hide non-printable UI entirely */
          header, nav, aside, footer, button, select, .print\\:hidden {
            display: none !important;
          }

          #quarterly-reports-panel > *:not(#printable-report-section) {
            display: none !important;
          }

          #printable-report-section {
            display: block !important;
            visibility: visible !important;
            position: absolute !important;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            color: black !important;
          }

          #printable-report-section * {
            visibility: visible !important;
          }

          /* Ensure colors adjust nicely */
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

      {/* PDF Preview Modal with Local Error Boundary */}
      <PDFPreviewErrorBoundary>
        <PDFPreviewModal
          pdfData={pdfPreviewData}
          onClose={() => setPdfPreviewData(null)}
        />
      </PDFPreviewErrorBoundary>
    </div>
  );
}
