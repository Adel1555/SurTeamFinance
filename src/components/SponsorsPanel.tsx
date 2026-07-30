/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Voucher, CharityProject, VisualIdentity, EmployeePermissions } from '../types';
import { DatabaseService } from '../db';
import { formatOMR, formatDate } from '../utils';
import { 
  Heart, 
  Search, 
  Calendar, 
  Printer, 
  FileText, 
  FileSpreadsheet, 
  Users, 
  Layers, 
  TrendingUp, 
  TrendingDown, 
  Scale, 
  SlidersHorizontal, 
  Filter, 
  X, 
  Check, 
  AlertCircle,
  Eye,
  DollarSign
} from 'lucide-react';
import { generatePDFInContainer, PDFPreviewModal, GeneratedPDF, PrintableContainer, PrintableHeader, PrintableTitleBar, PrintableSummaryGrid, PrintableSummaryCard, PrintableTable, PrintableFooter } from './PrintableTemplate';

interface SponsorsPanelProps {
  vouchers: Voucher[];
  identity: VisualIdentity;
  currentPermissions: EmployeePermissions;
  isManagerMode: boolean;
  onViewVoucher?: (voucher: Voucher) => void;
}

export default function SponsorsPanel({ 
  vouchers, 
  identity, 
  currentPermissions, 
  isManagerMode,
  onViewVoucher 
}: SponsorsPanelProps) {
  // View states: 'donor' (search by donor) or 'project' (search by project)
  const [activeView, setActiveView] = useState<'donor' | 'project'>('donor');

  // Filter States
  const [selectedDonor, setSelectedDonor] = useState<string>('all');
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<'all' | 'receipt' | 'payment'>('all');
  const [selectedMethod, setSelectedMethod] = useState<string>('all');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');

  // Search/Autocomplete states
  const [donorSearchText, setDonorSearchText] = useState<string>('');

  // Fetch projects and methods from DB
  const projectsList = useMemo(() => DatabaseService.getProjects(), [vouchers]);
  const paymentMethods = useMemo(() => DatabaseService.getPaymentMethods(), [vouchers]);

  // List of all unique donors/payers in the database for suggestions
  const donorsList = useMemo(() => {
    const donors = new Set<string>();
    
    // Add existing payers from database preset list
    DatabaseService.getPayers().forEach(p => donors.add(p.trim()));
    
    // Add any unique names appearing on historical receipt vouchers
    vouchers.forEach(v => {
      if (v.type === 'receipt' && v.payerOrBeneficiary) {
        donors.add(v.payerOrBeneficiary.trim());
      }
    });
    
    return Array.from(donors).filter(Boolean).sort((a, b) => a.localeCompare(b));
  }, [vouchers]);

  // Handle switching views and resetting target values for clean analysis
  const handleViewChange = (view: 'donor' | 'project') => {
    setActiveView(view);
    // Reset specific search parameters to avoid weird filtering overlaps
    if (view === 'donor') {
      setSelectedProject('all');
    } else {
      setSelectedDonor('all');
      setDonorSearchText('');
    }
  };

  // Filtered Vouchers list
  const filteredVouchers = useMemo(() => {
    return vouchers.filter(v => {
      // 1. Donor Filter
      if (activeView === 'donor') {
        if (selectedDonor !== 'all') {
          const donorMatch = v.payerOrBeneficiary?.trim().toLowerCase() === selectedDonor.trim().toLowerCase();
          // For sponsors view, only receipts represent donations/sponsorships.
          // However, let's keep it matching v.payerOrBeneficiary if they want to view records.
          if (!donorMatch) return false;
        } else if (donorSearchText.trim()) {
          const searchLower = donorSearchText.trim().toLowerCase();
          const match = v.payerOrBeneficiary?.toLowerCase().includes(searchLower);
          if (!match) return false;
        }
      }

      // 2. Project Filter
      if (activeView === 'project') {
        if (selectedProject !== 'all') {
          // If project selected is proj_general, vouchers with no projectId are also classified as general/unassigned
          if (selectedProject === 'proj_general') {
            if (v.projectId && v.projectId !== 'proj_general') return false;
          } else {
            if (v.projectId !== selectedProject) return false;
          }
        }
      } else {
        // Even in donor view, allow secondary filtering by project!
        if (selectedProject !== 'all') {
          if (selectedProject === 'proj_general') {
            if (v.projectId && v.projectId !== 'proj_general') return false;
          } else {
            if (v.projectId !== selectedProject) return false;
          }
        }
      }

      // 3. Secondary Donor Filter in Project view
      if (activeView === 'project' && selectedDonor !== 'all') {
        const donorMatch = v.payerOrBeneficiary?.trim().toLowerCase() === selectedDonor.trim().toLowerCase();
        if (!donorMatch) return false;
      }

      // 4. Voucher Type Filter
      if (selectedType !== 'all' && v.type !== selectedType) return false;

      // 5. Payment Method Filter
      if (selectedMethod !== 'all' && v.paymentMethod !== selectedMethod) return false;

      // 6. Date Range Filters
      if (fromDate && v.date < fromDate) return false;
      if (toDate && v.date > toDate) return false;

      return true;
    });
  }, [vouchers, activeView, selectedDonor, donorSearchText, selectedProject, selectedType, selectedMethod, fromDate, toDate]);

  // Financial Calculations (Task 13 - dynamically from vouchers)
  const financialTotals = useMemo(() => {
    let receiptsSum = 0;
    let paymentsSum = 0;

    filteredVouchers.forEach(v => {
      if (v.type === 'receipt') {
        receiptsSum += v.amount;
      } else {
        paymentsSum += v.amount;
      }
    });

    return {
      receipts: receiptsSum,
      payments: paymentsSum,
      net: receiptsSum - paymentsSum
    };
  }, [filteredVouchers]);

  // Security Guards
  const canViewFinancials = isManagerMode || !!currentPermissions.viewProjectFinancialTotals;
  const canExportReports = isManagerMode || !!currentPermissions.exportSponsorProjectReports;

  // Custom visual values from identity
  const cardStyleClass = 
    identity.cardStyle === 'flat' ? 'border-0 bg-slate-50/25 dark:bg-[#0d2342]/40 rounded-2xl shadow-none' :
    identity.cardStyle === 'bordered' ? 'border border-blue-100 dark:border-blue-500/10 bg-white/95 dark:bg-[#0c203b]/90 rounded-2xl' :
    identity.cardStyle === 'shadowed' ? 'shadow-lg bg-white/95 dark:bg-[#0c203b]/90 border border-blue-100/50 dark:border-blue-500/10 rounded-2xl' :
    'backdrop-blur-md bg-white/70 dark:bg-[#0b1f3a]/80 border border-blue-200/40 dark:border-blue-500/15 rounded-3xl';

  const btnRadius = 
    identity.buttonStyle === 'sharp' ? 'rounded-none' : 
    identity.buttonStyle === 'rounded' ? 'rounded-xl' : 'rounded-full';

  // Export & Printing Logic (Task 8)
  const [isExporting, setIsExporting] = useState(false);

  const handlePrintReport = async () => {
    if (!canExportReports) return;
    const reportElem = document.getElementById('printable-sponsors-report-section');
    if (!reportElem) return;

    const isDark = document.documentElement.classList.contains("dark");
    try {
      if (isDark) {
        document.documentElement.classList.remove("dark");
      }
      window.focus();
      await new Promise((resolve) => setTimeout(resolve, 300));
      window.print();
    } catch (err) {
      console.error('Error opening print dialog:', err);
      alert('حدث خطأ أثناء فتح واجهة الطباعة، يرجى المحاولة مرة أخرى.');
    } finally {
      if (isDark) {
        document.documentElement.classList.add("dark");
      }
    }
  };

  const [pdfPreviewData, setPdfPreviewData] = useState<GeneratedPDF | null>(null);

  const handleExportPDF = async () => {
    if (!canExportReports) return;

    setIsExporting(true);
    try {
      const reportTitle = activeView === 'donor' ? `Donor_Report_${selectedDonor}` : `Project_Report_${selectedProject}`;
      const generated = await generatePDFInContainer('pdf-dedicated-sponsors-report', `SurVolunteer_${reportTitle}.pdf`);
      setPdfPreviewData(generated);
    } catch (err) {
      console.error('Error exporting PDF:', err);
      alert('حدث خطأ أثناء تصدير التقرير، يرجى المحاولة مرة أخرى.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportExcel = () => {
    if (!canExportReports) return;
    
    // Generate simple custom Excel CSV
    let csvContent = "\uFEFF"; // UTF-8 BOM
    
    // Headers
    csvContent += "التاريخ,رقم السند,نوع السند,المشروع,الراعي / المستفيد,طريقة الدفع,المبلغ (ر.ع.),البيان\n";
    
    // Data rows
    filteredVouchers.forEach(v => {
      const projName = v.projectNameSnapshot || (projectsList.find(p => p.id === v.projectId)?.name) || "تبرع عام / غير مخصص";
      const typeLabel = v.type === 'receipt' ? identity.receiptTerm : identity.paymentTerm;
      const desc = v.description ? v.description.replace(/,/g, ' ') : '';
      csvContent += `"${v.date}","${v.voucherNo}","${typeLabel}","${projName}","${v.payerOrBeneficiary}","${v.paymentMethod}","${v.amount.toFixed(3)}","${desc}"\n`;
    });

    // Summary row
    if (canViewFinancials) {
      csvContent += `\n,إجمالي المقبوضات,,,,,,"${financialTotals.receipts.toFixed(3)}"\n`;
      csvContent += `,إجمالي المصاريف,,,,,,"${financialTotals.payments.toFixed(3)}"\n`;
      csvContent += `,صافي الرصيد المتبقي,,,,,,"${financialTotals.net.toFixed(3)}"\n`;
    }

    // Trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const reportTitle = activeView === 'donor' ? `Donor_Report_${selectedDonor}` : `Project_Report_${selectedProject}`;
    link.download = `SurVolunteer_${reportTitle}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const activeProjectDetails = useMemo(() => {
    if (selectedProject === 'all') return null;
    return projectsList.find(p => p.id === selectedProject) || null;
  }, [selectedProject, projectsList]);

  return (
    <div className="space-y-6 text-right animate-fade-in" dir="rtl" id="sponsors-donations-panel">
      
      {/* Tab Header Title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-100 dark:border-zinc-800 pb-5">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Heart className="w-5 h-5 text-rose-500 animate-pulse" />
            منصة الرعاة والداعمين والمشاريع الخيرية
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            البحث والتحليل المتقدم وإصدار الكشوفات التفصيلية للرعاة الداعمين والمشاريع الخيرية المعتمدة.
          </p>
        </div>

        {/* View Switcher Controls */}
        <div className="inline-flex rounded-xl p-1 bg-slate-100 dark:bg-zinc-900 border border-gray-200/50 dark:border-zinc-800 self-end md:self-auto">
          <button
            type="button"
            onClick={() => handleViewChange('donor')}
            className={`px-4 py-2 text-xs font-black transition-all cursor-pointer rounded-lg flex items-center gap-1.5 ${
              activeView === 'donor'
                ? 'bg-white dark:bg-zinc-800 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-400 hover:text-gray-650 dark:hover:text-zinc-200'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-rose-500" />
            البحث والتحليل بحسب الداعمين
          </button>
          <button
            type="button"
            onClick={() => handleViewChange('project')}
            className={`px-4 py-2 text-xs font-black transition-all cursor-pointer rounded-lg flex items-center gap-1.5 ${
              activeView === 'project'
                ? 'bg-white dark:bg-zinc-800 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-400 hover:text-gray-650 dark:hover:text-zinc-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-rose-500" />
            كشوفات الحساب بحسب المشاريع
          </button>
        </div>
      </div>

      {/* Main Grid Layout: Filter Sidebar & Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* RIGHT SIDE: ADVANCED SEARCH FILTERS (col-span-4) */}
        <div className={`lg:col-span-4 p-5 space-y-5 ${cardStyleClass} border border-gray-200/40 dark:border-zinc-800/50`}>
          <h3 className="text-xs font-black text-gray-800 dark:text-gray-200 border-b border-gray-100 dark:border-zinc-850 pb-2 flex items-center gap-2 flex-row-reverse">
            <Filter className="w-4 h-4 text-rose-500" />
            تصفية البحث المتقدم
          </h3>

          <div className="space-y-4">
            {/* View Specific Filter fields */}
            {activeView === 'donor' ? (
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400">اسم الراعي / الداعم المالي</label>
                <div className="relative">
                  <select
                    value={selectedDonor}
                    onChange={(e) => {
                      setSelectedDonor(e.target.value);
                      setDonorSearchText(''); // Clear typing search
                    }}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 focus:outline-none"
                  >
                    <option value="all">جميع الرعاة والمتبرعين (كشف مدمج)</option>
                    {donorsList.map((donor, idx) => (
                      <option key={idx} value={donor}>{donor}</option>
                    ))}
                  </select>
                </div>

                <div className="pt-2 text-center text-[10px] text-gray-400 font-sans">— أو ابحث بالاسم والكنية —</div>

                <div className="relative mt-1">
                  <input
                    type="text"
                    placeholder="اكتب اسماً للبحث الجزئي..."
                    value={donorSearchText}
                    onChange={(e) => {
                      setDonorSearchText(e.target.value);
                      setSelectedDonor('all'); // Clear dropdown selection
                    }}
                    className="w-full text-xs px-9 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 focus:outline-none"
                  />
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                </div>
              </div>
            ) : (
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400">المشروع أو المبادرة المحددة</label>
                <select
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 focus:outline-none font-bold"
                >
                  <option value="all">جميع المشاريع والمبادرات معاً</option>
                  {projectsList.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.isActive ? '' : '(معطّل)'}
                    </option>
                  ))}
                </select>

                {activeProjectDetails && (
                  <div className="mt-2 p-2.5 rounded-lg bg-gray-50/50 dark:bg-zinc-900/40 border border-gray-100 dark:border-zinc-800 text-[10px] text-gray-500 leading-normal">
                    <p className="font-bold text-gray-700 dark:text-gray-300">وصف المشروع:</p>
                    <p>{activeProjectDetails.description || "لا يوجد وصف مسجل."}</p>
                    <p className="mt-1 text-[9px] text-gray-400">تاريخ الإنشاء: {formatDate(activeProjectDetails.createdAt)}</p>
                  </div>
                )}
              </div>
            )}

            {/* Cross filter: Project select inside Donor view, or vice-versa */}
            {activeView === 'donor' && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400">تخصيص التبرع لمشروع معين</label>
                <select
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 focus:outline-none"
                >
                  <option value="all">أي مشروع (تبرع عام أو مخصص)</option>
                  {projectsList.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            )}

            {activeView === 'project' && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400">تصفية ثانوية بحسب الداعم</label>
                <select
                  value={selectedDonor}
                  onChange={(e) => setSelectedDonor(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 focus:outline-none"
                >
                  <option value="all">جميع الداعمين والمستفيدين</option>
                  {donorsList.map((d, idx) => (
                    <option key={idx} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Voucher Type Filter */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400">نوع التدفق المالي</label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as any)}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 focus:outline-none"
              >
                <option value="all">المقبوضات والمصاريف معاً (كشف ميزان)</option>
                <option value="receipt">المقبوضات فقط (التبرعات الداعمة)</option>
                <option value="payment">المدفوعات فقط (مصاريف التنفيذ)</option>
              </select>
            </div>

            {/* Payment Method Filter */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400">طريقة الدفع والقيد</label>
              <select
                value={selectedMethod}
                onChange={(e) => setSelectedMethod(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 focus:outline-none"
              >
                <option value="all">جميع طرق الدفع الصالحة</option>
                {paymentMethods.map((m, idx) => (
                  <option key={idx} value={m}>{m}</option>
                ))}
              </select>
            </div>

            {/* Date Range Fields */}
            <div className="space-y-1.5 pt-1 border-t border-gray-50 dark:border-zinc-850/30">
              <span className="text-[10px] font-bold text-gray-400 block mb-1">النطاق الزمني للبحث</span>
              
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <span className="text-[9px] text-gray-400">من تاريخ</span>
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="w-full text-[10px] px-2 py-2 rounded-lg border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] text-gray-400">إلى تاريخ</span>
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="w-full text-[10px] px-2 py-2 rounded-lg border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950"
                  />
                </div>
              </div>

              {(fromDate || toDate) && (
                <button
                  type="button"
                  onClick={() => {
                    setFromDate('');
                    setToDate('');
                  }}
                  className="w-full mt-2 text-[9px] font-bold text-rose-600 dark:text-rose-400 hover:underline flex items-center justify-center gap-1 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                  مسح نطاق التاريخ
                </button>
              )}
            </div>
          </div>
        </div>

        {/* LEFT SIDE: FINANCIAL SUMMARIES & RECORDS LIST (col-span-8) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* THREE FINANCIAL READINGS DYNAMIC CARDS (Task 13) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Card 1: Receipts Total */}
            <div className="p-4 rounded-2xl bg-white dark:bg-[#0c203b]/90 border border-emerald-100 dark:border-emerald-500/10 shadow-sm flex items-center justify-between flex-row-reverse">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-gray-450 dark:text-gray-400 block">إجمالي المقبوضات والتبرعات</span>
                <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 block mt-0.5 font-mono">
                  {canViewFinancials ? formatOMR(financialTotals.receipts) : '***.*** ر.ع.'}
                </span>
              </div>
            </div>

            {/* Card 2: Payments/Expenses Total */}
            <div className="p-4 rounded-2xl bg-white dark:bg-[#0c203b]/90 border border-rose-100 dark:border-rose-500/10 shadow-sm flex items-center justify-between flex-row-reverse">
              <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 shrink-0">
                <TrendingDown className="w-5 h-5" />
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-gray-450 dark:text-gray-400 block">مصاريف التنفيذ والمخرجات</span>
                <span className="text-sm font-black text-rose-600 dark:text-rose-400 block mt-0.5 font-mono">
                  {canViewFinancials ? formatOMR(financialTotals.payments) : '***.*** ر.ع.'}
                </span>
              </div>
            </div>

            {/* Card 3: Net Balance */}
            <div className={`p-4 rounded-2xl bg-white dark:bg-[#0c203b]/90 border shadow-sm flex items-center justify-between flex-row-reverse ${
              financialTotals.net >= 0 
                ? 'border-sky-100 dark:border-sky-500/10' 
                : 'border-amber-100 dark:border-amber-500/10'
            }`}>
              <div className={`p-2.5 rounded-xl shrink-0 ${
                financialTotals.net >= 0 
                  ? 'bg-sky-500/10 text-sky-600 dark:text-sky-450' 
                  : 'bg-amber-500/10 text-amber-600 dark:text-amber-450'
              }`}>
                <Scale className="w-5 h-5" />
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-gray-450 dark:text-gray-400 block">الرصيد المتبقي (الملاءة المالية)</span>
                <span className={`text-sm font-black block mt-0.5 font-mono ${
                  financialTotals.net >= 0 
                    ? 'text-sky-600 dark:text-sky-400' 
                    : 'text-amber-600 dark:text-amber-400'
                }`}>
                  {canViewFinancials ? formatOMR(financialTotals.net) : '***.*** ر.ع.'}
                </span>
              </div>
            </div>

          </div>

          {/* Secure Warnings for View/Totals restrictions (Task 11) */}
          {!canViewFinancials && (
            <div className="p-3.5 rounded-xl bg-amber-500/5 border border-dashed border-amber-500/15 text-[10px] text-amber-700 dark:text-amber-400 flex items-center gap-2 flex-row-reverse">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-500 animate-pulse" />
              <span>
                <strong>تنبيه أمني مالي:</strong> تم إخفاء الإجماليات المالية وأرصدة الميزان لعدم توفر صلاحية "عرض إجماليات المشاريع وأرصدتها" لحسابك. يرجى مراجعة مدير النظام للتخويل.
              </span>
            </div>
          )}

          {/* PRINT & EXPORT PANEL (Task 8 & 11) */}
          <div className="flex flex-col sm:flex-row justify-between items-center p-4 bg-slate-50/40 dark:bg-zinc-900/10 border border-gray-150/40 dark:border-zinc-800/30 rounded-xl gap-3">
            <span className="text-[10px] text-gray-500 dark:text-gray-400 font-bold">
              تصفية الكشف تحتوي على <strong className="font-sans text-gray-800 dark:text-white">{filteredVouchers.length}</strong> سجل مالي معتمد.
            </span>
            
            <div className="flex gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handlePrintReport}
                disabled={!canExportReports || filteredVouchers.length === 0}
                className="flex-1 sm:flex-initial text-[11px] font-black px-3.5 py-2 rounded-lg bg-gray-100 dark:bg-zinc-900 border border-gray-250 dark:border-zinc-800 hover:bg-gray-200 text-gray-700 dark:text-gray-300 transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Printer className="w-3.5 h-3.5" />
                طباعة الكشف
              </button>

              <button
                type="button"
                onClick={handleExportPDF}
                disabled={!canExportReports || filteredVouchers.length === 0 || isExporting}
                className="flex-1 sm:flex-initial text-[11px] font-black px-3.5 py-2 rounded-lg bg-gray-100 dark:bg-zinc-900 border border-gray-250 dark:border-zinc-800 hover:bg-gray-200 text-gray-700 dark:text-gray-300 transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <FileText className="w-3.5 h-3.5 text-rose-500" />
                تصدير PDF
              </button>

              <button
                type="button"
                onClick={handleExportExcel}
                disabled={!canExportReports || filteredVouchers.length === 0}
                className="flex-1 sm:flex-initial text-[11px] font-black px-3.5 py-2 rounded-lg bg-gray-100 dark:bg-zinc-900 border border-gray-250 dark:border-zinc-800 hover:bg-gray-200 text-gray-700 dark:text-gray-300 transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
                تصدير Excel
              </button>
            </div>
          </div>

          {!canExportReports && (
            <div className="p-3 py-2.5 rounded-lg bg-rose-500/5 border border-dashed border-rose-500/15 text-[10px] text-rose-700 dark:text-rose-400 text-center font-bold">
              🚫 خيارات طباعة وتصدير التقارير معطلة لعدم توفر صلاحية "طباعة وتصدير تقارير الرعاة والمشاريع" لحسابك.
            </div>
          )}

          {/* DYNAMIC VOUCHERS TABLE (Task 9) */}
          <div className="overflow-hidden border border-gray-150 dark:border-zinc-805/50 rounded-xl bg-white dark:bg-zinc-950 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-right border-collapse" dir="rtl">
                <thead>
                  <tr className="bg-slate-50 dark:bg-zinc-900 border-b border-gray-150 dark:border-zinc-800 text-gray-400 select-none text-[10px]">
                    <th className="p-3 font-black text-right">رقم السند</th>
                    <th className="p-3 font-black text-right">التاريخ</th>
                    <th className="p-3 font-black text-right">نوع الحركة</th>
                    <th className="p-3 font-black text-right">المشروع الخيرى</th>
                    <th className="p-3 font-black text-right">المتبرع / المستفيد</th>
                    <th className="p-3 font-black text-right">طريقة الدفع</th>
                    <th className="p-3 font-black text-left">المبلغ (ر.ع.)</th>
                    <th className="p-3 font-black text-right">البيان</th>
                    <th className="p-3 font-black text-center">التفاصيل</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-zinc-900/40">
                  {vouchers.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-12 text-center text-gray-400 dark:text-zinc-500">
                        <Search className="w-8 h-8 text-gray-300 dark:text-zinc-800 mx-auto mb-2" />
                        <p className="font-bold text-gray-600 dark:text-zinc-300">لا توجد سجلات تبرعات أو مصروفات مرتبطة بالمشاريع حتى الآن.</p>
                      </td>
                    </tr>
                  ) : filteredVouchers.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-12 text-center text-gray-400 dark:text-zinc-500">
                        <Search className="w-8 h-8 text-gray-300 dark:text-zinc-800 mx-auto mb-2" />
                        <p className="font-bold text-gray-600 dark:text-zinc-300">لم يتم العثور على أي سندات مطابقة لمعايير التصفية الحالية.</p>
                        <p className="text-[10px] mt-1 font-sans text-gray-450 dark:text-zinc-400">تأكد من تعديل النطاق الزمني أو اسم الراعي / المشروع الخيرى.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredVouchers.map((v) => {
                      // Task 9: Display project names using projectNameSnapshot
                      const projName = v.projectNameSnapshot || (projectsList.find(p => p.id === v.projectId)?.name) || "تبرع عام / غير مخصص";
                      const isReceipt = v.type === 'receipt';
                      
                      // Precise full-row background tint with custom hover states that preserve the differentiation
                      const rowBgClass = isReceipt 
                        ? 'bg-[#ecfdf5] hover:bg-[#d1fae5] dark:bg-emerald-500/10 dark:hover:bg-emerald-500/15 text-emerald-950 dark:text-emerald-100' 
                        : 'bg-[#fffbeb] hover:bg-[#fef3c7] dark:bg-amber-500/10 dark:hover:bg-amber-500/15 text-amber-950 dark:text-amber-100';
                      
                      return (
                        <tr key={v.id} className={`${rowBgClass} border-b border-gray-150 dark:border-zinc-800/50 transition-all text-[11px]`}>
                           {/* Voucher No */}
                          <td className="p-3 font-black text-current bg-transparent">{v.voucherNo}</td>
                          
                          {/* Date */}
                          <td className="p-3 text-current/80 font-sans bg-transparent">{v.date}</td>

                          {/* Transaction Type Badge */}
                          <td className="p-3 bg-transparent">
                            {isReceipt ? (
                              <div className="flex flex-col items-start gap-0.5 select-none" dir="rtl">
                                <span className="inline-flex items-center text-[10px] font-black text-emerald-800 dark:text-emerald-300">
                                  تبرع وارد
                                </span>
                                <span className="text-[9px] text-emerald-700/60 dark:text-emerald-400/60 font-medium">سند قبض</span>
                              </div>
                            ) : (
                              <div className="flex flex-col items-start gap-0.5 select-none" dir="rtl">
                                <span className="inline-flex items-center text-[10px] font-black text-amber-800 dark:text-amber-300">
                                  مصروف على المشروع
                                </span>
                                <span className="text-[9px] text-amber-700/60 dark:text-amber-400/60 font-medium">سند صرف</span>
                              </div>
                            )}
                          </td>
                          
                          {/* Project */}
                          <td className="p-3 text-current font-bold bg-transparent">
                            <span className="bg-transparent px-2 py-0.5 font-bold">
                              {projName}
                            </span>
                          </td>
                          
                          {/* Payer or Beneficiary */}
                          <td className="p-3 text-current font-bold bg-transparent">
                            {v.payerOrBeneficiary?.trim() || "غير محدد"}
                          </td>
                          
                          {/* Payment Method */}
                          <td className="p-3 text-current/80 bg-transparent">{v.paymentMethod}</td>
                          
                          {/* Amount */}
                          <td className="p-3 text-left font-black text-current font-mono text-xs bg-transparent">
                            {formatOMR(v.amount, false)}
                          </td>

                          {/* Description (البيان) */}
                          <td className="p-3 text-current/80 max-w-[150px] truncate bg-transparent" title={v.description || ''}>
                            {v.description || '—'}
                          </td>
                          
                          {/* Actions / View */}
                          <td className="p-3 text-center bg-transparent">
                            {onViewVoucher && (
                              <button
                                type="button"
                                onClick={() => onViewVoucher(v)}
                                className="text-sky-600 hover:text-sky-700 dark:text-sky-400 p-1 rounded-md hover:bg-sky-50 dark:hover:bg-sky-950/20 transition-all cursor-pointer"
                                title="عرض تفاصيل السند المحاسبي كاملة"
                              >
                                <Eye className="w-4 h-4 mx-auto" />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

      </div>

      {/* ========================================================================= */}
      {/* EXQUISITE PRINT-READY REPORT VIEW (HIDDEN ON SCREEN, VISIBLE ON PRINT)  */}
      {/* ========================================================================= */}
      <div 
        id="printable-sponsors-report-section" 
        className="hidden print:block bg-white text-black p-12 w-[190mm] mx-auto text-right text-xs leading-relaxed" 
        dir="rtl"
        style={{ fontFamily: '"Noto Sans Arabic", "Tajawal", "Cairo", "Segoe UI", Tahoma, Arial, sans-serif' }}
      >
        <style dangerouslySetInnerHTML={{ __html: `
          #printable-sponsors-report-section {
            font-family: "Noto Sans Arabic", "Tajawal", "Cairo", "Segoe UI", Tahoma, Arial, sans-serif !important;
            background-color: #ffffff !important;
            color: #111827 !important;
          }
          #printable-sponsors-report-section * {
            font-family: "Noto Sans Arabic", "Tajawal", "Cairo", "Segoe UI", Tahoma, Arial, sans-serif !important;
          }
          #printable-sponsors-report-section h1, 
          #printable-sponsors-report-section h2, 
          #printable-sponsors-report-section h3 {
            font-weight: 700 !important;
            color: #111827 !important;
          }
          #printable-sponsors-report-section p,
          #printable-sponsors-report-section span,
          #printable-sponsors-report-section td {
            font-weight: 500 !important;
            color: #111827 !important;
          }
          #printable-sponsors-report-section th {
            font-weight: 700 !important;
            background-color: #f3f4f6 !important;
            color: #111827 !important;
            border-bottom: 2px solid #111827 !important;
          }
          #printable-sponsors-report-section tr[data-type="receipt"] {
            background-color: #ecfdf5 !important;
          }
          #printable-sponsors-report-section tr[data-type="receipt"] td {
            background-color: #ecfdf5 !important;
            color: #065f46 !important;
          }
          #printable-sponsors-report-section tr[data-type="payment"] {
            background-color: #fffbeb !important;
          }
          #printable-sponsors-report-section tr[data-type="payment"] td {
            background-color: #fffbeb !important;
            color: #92400e !important;
          }
          @media print {
            html, body {
              background-color: #ffffff !important;
              color: #111827 !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            #printable-sponsors-report-section {
              display: block !important;
              background-color: #ffffff !important;
              color: #111827 !important;
            }
          }
        `}} />
        {/* Print Header */}
        <div className="flex items-center justify-between border-b-2 border-black pb-5 mb-6">
          <div className="text-right">
            <h1 className="text-base font-black tracking-tight">{identity.title}</h1>
            <p className="text-[9px] text-gray-500 mt-1">كشف حركة وسجل الحسابات المعتمد للفريق</p>
            <p className="text-[9px] text-gray-500">تم تصديره في: {new Date().toLocaleDateString('ar-OM')}</p>
          </div>
          {/* Logo replacement text/canvas placeholder */}
          <div className="border border-black p-2 rounded text-center">
            <div className="font-serif font-bold text-sm tracking-widest">{identity.logoText || "S.V."}</div>
            <div className="text-[8px] uppercase tracking-wider font-bold">Finance</div>
          </div>
        </div>

        {/* Report Meta Details */}
        <div className="bg-gray-100 p-4 rounded-xl mb-6 grid grid-cols-2 gap-4">
          <div>
            <p className="font-bold text-[10px] text-gray-500">نوع التحليل المالي:</p>
            <p className="text-xs font-black">{activeView === 'donor' ? 'كشف حركة الداعم المالي (الراعي)' : 'كشف حساب المشروع والمبادرة الخيرية'}</p>
          </div>
          <div>
            <p className="font-bold text-[10px] text-gray-500">الداعم / المشروع المحدد:</p>
            <p className="text-xs font-black">
              {activeView === 'donor' 
                ? (selectedDonor === 'all' ? (donorSearchText.trim() ? `بحث نصي: "${donorSearchText}"` : 'جميع الرعاة والممولين') : selectedDonor)
                : (selectedProject === 'all' ? 'جميع المشاريع والمبادرات معاً' : projectsList.find(p => p.id === selectedProject)?.name || 'غير معروف')
              }
            </p>
          </div>
          <div>
            <p className="font-bold text-[10px] text-gray-500">طريقة الدفع والقيد:</p>
            <p className="text-xs font-black">{selectedMethod === 'all' ? 'جميع طرق الدفع المقيدة' : selectedMethod}</p>
          </div>
          <div>
            <p className="font-bold text-[10px] text-gray-500">الفترة الزمنية للفحص:</p>
            <p className="text-xs font-black">
              {fromDate || toDate ? `من: ${fromDate || 'البداية'}  إلى: ${toDate || 'اليوم'}` : 'جميع السجلات المقيدة تاريخياً'}
            </p>
          </div>
        </div>

        {/* Printable Stats Table */}
        <div className="border border-black rounded-lg p-3 mb-6 grid grid-cols-3 gap-2 text-center">
          <div className="border-l border-gray-300">
            <span className="text-[9px] text-gray-500 block">إجمالي المقبوضات (التبرعات)</span>
            <span className="text-xs font-black font-mono block mt-0.5">{formatOMR(financialTotals.receipts)}</span>
          </div>
          <div className="border-l border-gray-300">
            <span className="text-[9px] text-gray-500 block">إجمالي المصاريف والمخرجات</span>
            <span className="text-xs font-black font-mono block mt-0.5">{formatOMR(financialTotals.payments)}</span>
          </div>
          <div>
            <span className="text-[9px] text-gray-500 block">صافي الرصيد المتبقي</span>
            <span className="text-xs font-black font-mono block mt-0.5">{formatOMR(financialTotals.net)}</span>
          </div>
        </div>

        {/* Printable Records Table */}
        <h3 className="font-black text-[10px] mb-2 border-b border-black pb-1 uppercase tracking-wider text-black">جدول البيانات المفصل للأقسام المالية</h3>
        <table className="w-full text-[9px] border-collapse mb-12 text-black bg-white" style={{ fontFamily: '"Cairo", "Tajawal", "Noto Sans Arabic", "Segoe UI", Arial, sans-serif' }}>
          <thead>
            <tr className="border-b-2 border-black font-black text-right bg-gray-100 text-black">
              <th className="p-2">رقم السند</th>
              <th className="p-2">التاريخ</th>
              <th className="p-2 text-center">نوع الحركة</th>
              <th className="p-2">المشروع الخيري</th>
              <th className="p-2">المتبرع / المستفيد</th>
              <th className="p-2">طريقة الدفع</th>
              <th className="p-2 text-left">المبلغ (ر.ع.)</th>
              <th className="p-2">البيان</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {filteredVouchers.map((v) => {
              const projName = v.projectNameSnapshot || (projectsList.find(p => p.id === v.projectId)?.name) || "تبرع عام / غير مخصص";
              const isReceipt = v.type === 'receipt';
              
              // Print-safe subtle colored highlight for rows using explicit colors
              const rowStyle = {
                backgroundColor: isReceipt ? '#ecfdf5' : '#fffbeb',
                color: isReceipt ? '#065f46' : '#92400e'
              };
              
              return (
                <tr 
                  key={v.id} 
                  data-type={isReceipt ? 'receipt' : 'payment'}
                  className="align-middle text-black border-b border-gray-200"
                  style={rowStyle}
                >
                  <td className="p-2 font-bold">{v.voucherNo}</td>
                  <td className="p-2 font-mono">{v.date}</td>
                  <td className="p-2 text-center font-bold">
                    {isReceipt ? (
                      <span className="inline-block px-2 py-0.5 rounded text-[8px] font-bold bg-emerald-100 text-emerald-850 border border-emerald-300">
                        تبرع وارد
                      </span>
                    ) : (
                      <span className="inline-block px-2 py-0.5 rounded text-[8px] font-bold bg-amber-100 text-amber-850 border border-amber-300">
                        مصروف على المشروع
                      </span>
                    )}
                  </td>
                  <td className="p-2 font-bold">{projName}</td>
                  <td className="p-2 font-bold">{v.payerOrBeneficiary?.trim() || "غير محدد"}</td>
                  <td className="p-2">{v.paymentMethod}</td>
                  <td className="p-2 text-left font-bold font-mono">{v.amount.toFixed(3)}</td>
                  <td className="p-2 text-gray-700">{v.description || '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Printable Legal Stamp block */}
        <div className="mt-16 grid grid-cols-2 gap-12 text-center text-[10px]">
          <div>
            <p className="font-bold border-b border-gray-300 pb-2 mb-12">المدير المالي والاعتمادات</p>
            <p className="text-[8px] text-gray-400">توقيع وختم الإعتماد الرسمي للفريق</p>
          </div>
          <div>
            <p className="font-bold border-b border-gray-300 pb-2 mb-12">المدقق والمشرف العام للمشاريع</p>
            <p className="text-[8px] text-gray-400">توقيع وختم الإعتماد الرسمي للفريق</p>
          </div>
        </div>
      </div>

      {/* Dedicated Printable Template for PDF Export (Isolated from UI) */}
      <PrintableContainer id="pdf-dedicated-sponsors-report">
        <PrintableHeader
          identity={identity}
          subtitle="سجل تقارير الداعمين والمشاريع"
          badgeText={activeView === 'donor' ? "تقرير الداعمين" : "تقرير المشاريع والمبادرات"}
          metadata={[
            { label: "تاريخ الاستخراج", value: new Date().toLocaleDateString('ar-OM') },
            { label: "إجمالي السندات", value: filteredVouchers.length },
            { label: "نوع التقرير", value: activeView === 'donor' ? `الدافع: ${selectedDonor === 'all' ? 'جميع الداعمين' : selectedDonor}` : `المشروع: ${selectedProject === 'all' ? 'جميع المشاريع' : selectedProject}` }
          ]}
        />

        <PrintableTitleBar
          title={activeView === 'donor' 
            ? `كشف الحساب المالي للداعم (${selectedDonor === 'all' ? 'جميع الداعمين' : selectedDonor})`
            : `تقرير التدفق المالي للمشروع (${selectedProject === 'all' ? 'جميع المشاريع' : selectedProject})`
          }
        />

        <PrintableSummaryGrid>
          <PrintableSummaryCard
            title="إجمالي الدعم / المقبوضات"
            amount={formatOMR(financialTotals.receipts)}
            subtext={`العدد: ${filteredVouchers.filter(v => v.type === 'receipt').length} سندات`}
            type="positive"
          />
          <PrintableSummaryCard
            title="إجمالي المصروفات"
            amount={formatOMR(financialTotals.payments)}
            subtext={`العدد: ${filteredVouchers.filter(v => v.type === 'payment').length} سندات`}
            type="negative"
          />
          <PrintableSummaryCard
            title="صافي الرصيد المتبقي"
            amount={formatOMR(financialTotals.net)}
            subtext="الفائض المالي المتاح للمشروع / الداعم"
            type="neutral"
          />
        </PrintableSummaryGrid>

        <PrintableTable headers={["رقم السند", "النوع", "التاريخ", "الدافع / المستفيد", "طريقة الدفع", "المبلغ (ر.ع.)", "البيان"]}>
          {filteredVouchers.map((v) => {
            const isReceipt = v.type === 'receipt';
            return (
              <tr key={v.id} className="text-black">
                <td className="p-2 font-bold font-mono">{v.voucherNo}</td>
                <td className="p-2 text-center font-bold">
                  {isReceipt ? identity.receiptTerm : identity.paymentTerm}
                </td>
                <td className="p-2">{v.date}</td>
                <td className="p-2 font-bold">{v.payerOrBeneficiary}</td>
                <td className="p-2">{v.paymentMethod || 'نقداً'}</td>
                <td className="p-2 font-bold font-mono text-left">{formatOMR(v.amount)}</td>
                <td className="p-2 max-w-[200px] truncate">{v.description || '-'}</td>
              </tr>
            );
          })}
        </PrintableTable>

        <PrintableFooter terms={identity.termsAndConditions} showSignature={identity.showSignatureBlock} />
      </PrintableContainer>

      {/* PDF Preview Modal */}
      <PDFPreviewModal pdfData={pdfPreviewData} onClose={() => setPdfPreviewData(null)} />

    </div>
  );
}
