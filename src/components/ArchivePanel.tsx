/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo, useEffect } from 'react';
import { Voucher, VisualIdentity, VoucherType, EmployeePermissions } from '../types';
import { formatDate, formatOMR } from '../utils';
import { Search, Filter, Trash2, Printer, FileText, ArrowUpRight, ArrowDownRight, ArrowUpDown, RefreshCw, Calendar, ListFilter, Eye, Pencil } from 'lucide-react';
import PrintFilteredVouchers from './PrintFilteredVouchers';
import { DatabaseService } from '../db';

interface ArchivePanelProps {
  vouchers: Voucher[];
  identity: VisualIdentity;
  onDeleteVoucher: (id: string) => void;
  onPrintVoucher: (voucher: Voucher) => void;
  onViewVoucher: (voucher: Voucher) => void;
  onEditVoucher: (voucher: Voucher) => void;
  permissions?: EmployeePermissions;
  isManagerMode?: boolean;
  initialDateFrom?: string;
  initialDateTo?: string;
}

export default function ArchivePanel({ vouchers, identity, onDeleteVoucher, onPrintVoucher, onViewVoucher, onEditVoucher, permissions, isManagerMode, initialDateFrom, initialDateTo }: ArchivePanelProps) {
  // Custom delete confirmation state (avoids iframe blocking dialogs)
  const [voucherToDelete, setVoucherToDelete] = useState<Voucher | null>(null);
  
  // Custom state for showing the print report
  const [showPrintReport, setShowPrintReport] = useState(false);

  const projectsList = useMemo(() => DatabaseService.getProjects(), [vouchers]);

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

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'receipt' | 'payment'>('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc'>('date-desc');
  const [dateFrom, setDateFrom] = useState(initialDateFrom || '');
  const [dateTo, setDateTo] = useState(initialDateTo || '');
  const [datePreset, setDatePreset] = useState<'all' | 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom'>(
    initialDateFrom || initialDateTo ? 'custom' : 'all'
  );

  useEffect(() => {
    if (initialDateFrom !== undefined) setDateFrom(initialDateFrom);
    if (initialDateTo !== undefined) setDateTo(initialDateTo);
    if (initialDateFrom || initialDateTo) setDatePreset('custom');
  }, [initialDateFrom, initialDateTo]);

  // Extracts preset bounds relative to the accounting container system date
  const getPresetDates = (preset: string) => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}-${mm}-${dd}`;

    switch (preset) {
      case 'today':
        return { from: todayStr, to: todayStr };
        
      case 'week': {
        const lastWeek = new Date();
        lastWeek.setDate(today.getDate() - 7);
        const lY = lastWeek.getFullYear();
        const lM = String(lastWeek.getMonth() + 1).padStart(2, '0');
        const lD = String(lastWeek.getDate()).padStart(2, '0');
        return { from: `${lY}-${lM}-${lD}`, to: todayStr };
      }
      
      case 'month': {
        return { from: `${yyyy}-${mm}-01`, to: todayStr };
      }
      
      case 'quarter': {
        const currentMonth = today.getMonth(); // 0-indexed
        let startMonth = 0;
        if (currentMonth >= 3 && currentMonth <= 5) startMonth = 3; // Apr-Jun (Q2)
        else if (currentMonth >= 6 && currentMonth <= 8) startMonth = 6; // Jul-Sep (Q3)
        else if (currentMonth >= 9 && currentMonth <= 11) startMonth = 9; // Oct-Dec (Q4)
        
        const startMonthStr = String(startMonth + 1).padStart(2, '0');
        return { from: `${yyyy}-${startMonthStr}-01`, to: todayStr };
      }

      case 'year': {
        return { from: `${yyyy}-01-01`, to: todayStr };
      }
      
      default:
        return { from: '', to: '' };
    }
  };

  const handlePresetChange = (preset: 'all' | 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom') => {
    setDatePreset(preset);
    if (preset === 'all') {
      setDateFrom('');
      setDateTo('');
    } else if (preset !== 'custom') {
      const { from, to } = getPresetDates(preset);
      setDateFrom(from);
      setDateTo(to);
    }
  };

  const handleDateFromChange = (val: string) => {
    setDateFrom(val);
    setDatePreset('custom');
  };

  const handleDateToChange = (val: string) => {
    setDateTo(val);
    setDatePreset('custom');
  };

  // Extract unique payment methods in vouchers for filtering drop
  const paymentMethodsInVouchers = useMemo(() => {
    const list = new Set<string>();
    vouchers.forEach(v => {
      if (v.paymentMethod) list.add(v.paymentMethod);
    });
    return Array.from(list);
  }, [vouchers]);

  // Compute filtered logs
  const filteredVouchers = useMemo(() => {
    let result = [...vouchers];

    // Search term keyword matcher
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      result = result.filter(v => 
        v.voucherNo.toLowerCase().includes(term) ||
        v.payerOrBeneficiary.toLowerCase().includes(term) ||
        (v.description && v.description.toLowerCase().includes(term)) ||
        (v.notes && v.notes.toLowerCase().includes(term))
      );
    }

    // Type filter
    if (typeFilter !== 'all') {
      result = result.filter(v => v.type === typeFilter);
    }

    // Method filter
    if (methodFilter !== 'all') {
      result = result.filter(v => v.paymentMethod === methodFilter);
    }

    // Date Range filters
    if (dateFrom) {
      result = result.filter(v => v.date >= dateFrom);
    }
    if (dateTo) {
      result = result.filter(v => v.date <= dateTo);
    }

    // Sorting parameters
    result.sort((a, b) => {
      if (sortBy === 'date-desc') return b.date.localeCompare(a.date) || b.createdAt - a.createdAt;
      if (sortBy === 'date-asc') return a.date.localeCompare(b.date) || a.createdAt - b.createdAt;
      if (sortBy === 'amount-desc') return b.amount - a.amount;
      if (sortBy === 'amount-asc') return a.amount - b.amount;
      return 0;
    });

    return result;
  }, [vouchers, searchTerm, typeFilter, methodFilter, sortBy, dateFrom, dateTo]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setTypeFilter('all');
    setMethodFilter('all');
    setSortBy('date-desc');
    setDateFrom('');
    setDateTo('');
    setDatePreset('all');
  };

  const handleDeleteTrigger = (v: Voucher) => {
    setVoucherToDelete(v);
  };

  const confirmDeleteVoucher = () => {
    if (!voucherToDelete) return;
    onDeleteVoucher(voucherToDelete.id);
    setVoucherToDelete(null);
  };

  const cardStyleClass = 
    identity.cardStyle === 'flat' ? 'border-0 bg-blue-50/20 dark:bg-[#0d2342]/60 rounded-2xl shadow-none finance-glow-card' :
    identity.cardStyle === 'bordered' ? 'border border-blue-100 dark:border-blue-500/20 bg-white/95 dark:bg-[#0c203b]/90 rounded-2xl finance-glow-card' :
    identity.cardStyle === 'shadowed' ? 'shadow-xl bg-white/95 dark:bg-[#0c203b]/90 border border-blue-100/60 dark:border-blue-500/20 rounded-2xl finance-glow-card' :
    'backdrop-blur-md bg-white/70 dark:bg-[#0b1f3a]/80 border border-blue-200/40 dark:border-blue-500/15 rounded-3xl finance-glow-card';

  const btnRadius = 
    identity.buttonStyle === 'sharp' ? 'rounded-none' : 
    identity.buttonStyle === 'rounded' ? 'rounded-xl' : 'rounded-full';

  return (
    <div className="space-y-6 text-right" id="archive-panel">
      
      {/* Intro */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-100 dark:border-zinc-800 pb-5">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Filter className="w-5 h-5 text-[var(--primary-color)]" />
            أرشيف السندات المالية والمراجعة الحسابية
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            ابحث وفلتر وافرز كامل السندات والأرشيف المتراكم من بداية الميزانية، مع تصفيات دقيقة حسب نوع الصيانة والتواريخ.
          </p>
        </div>

        {/* Total found results count indicator */}
        <span className="text-xs bg-slate-100 dark:bg-zinc-900 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-zinc-800 text-gray-600 dark:text-gray-300 font-semibold">
          عدد المستندات المطابقة: <strong className="font-mono text-[var(--primary-color)]">{filteredVouchers.length}</strong> من <strong className="font-mono">{vouchers.length}</strong>
        </span>
      </div>

      {/* Advanced Filters Block */}
      <div className={`p-5 ${cardStyleClass} space-y-4 border border-gray-50 dark:border-zinc-900`}>
        
        {/* Row 1: Primary search filters */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          
          {/* Keyword Search Input */}
          <div className="md:col-span-5 relative">
            <input
              type="text"
              placeholder="اكتب كلمة للبحث (رقم السند، دافع، مستفيد، بيان)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs pr-10 pl-4 py-2.5 rounded-xl border border-blue-200/60 dark:border-blue-900/40 bg-white/95 dark:bg-[#0c203b] text-gray-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-[var(--primary-color)]"
            />
            <Search className="w-4 h-4 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
          </div>

          {/* Type dropdown Filter */}
          <div className="md:col-span-3">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="w-full text-xs px-3 py-2.5 rounded-xl border border-blue-200/60 dark:border-blue-900/40 bg-white/95 dark:bg-[#0c203b] text-gray-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-[var(--primary-color)]"
            >
              <option value="all">عرض الكل (صرف وقبض)</option>
              <option value="receipt">سندات القبض فقط</option>
              <option value="payment">سندات الصرف فقط</option>
            </select>
          </div>

          {/* Sort selection drop */}
          <div className="md:col-span-4">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full text-xs px-3 py-2.5 rounded-xl border border-blue-200/60 dark:border-blue-900/40 bg-white/95 dark:bg-[#0c203b] text-gray-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-[var(--primary-color)]"
            >
              <option value="date-desc">التاريخ (الأحدث للأقدم)</option>
              <option value="date-asc">التاريخ (الأقدم للأحدث)</option>
              <option value="amount-desc">المبلغ الكلي (الأكبر للأصغر)</option>
              <option value="amount-asc">المبلغ الكلي (الأصغر للأكبر)</option>
            </select>
          </div>

        </div>

        {/* Row 2: Date Filters & Presets (Gives the requested enhancement prominent layout) */}
        <div className="pt-3.5 border-t border-gray-100 dark:border-zinc-850/40 space-y-3">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 text-right">
            
            {/* Quick Presets tabs */}
            <div className="flex flex-wrap items-center gap-1.5 flex-row-reverse">
              <span className="text-[10px] text-gray-400 dark:text-zinc-500 font-bold ml-1.5 flex items-center gap-1 flex-row-reverse">
                <Calendar className="w-3.5 h-3.5 text-[var(--primary-color)]" />
                تصفية سريعة بالتواريخ:
              </span>
              {[
                { id: 'all', label: 'كل الأوقات' },
                { id: 'today', label: 'اليوم' },
                { id: 'week', label: 'آخر ٧ أيام' },
                { id: 'month', label: 'هذا الشهر' },
                { id: 'quarter', label: 'الربع الجاري' },
                { id: 'year', label: 'العام الحالي' },
                { id: 'custom', label: 'نطاق مخصص 📅' }
              ].map(preset => {
                const isActive = datePreset === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handlePresetChange(preset.id as any)}
                    className={`text-[10px] font-bold px-2.5 py-1.5 rounded-xl transition-all ${
                      isActive
                        ? 'text-white shadow-sm'
                        : 'bg-gray-100/70 dark:bg-zinc-900/60 text-gray-650 dark:text-gray-400 hover:bg-gray-200/60 dark:hover:bg-[#0c203b]/80'
                    }`}
                    style={isActive ? { backgroundColor: 'var(--primary-color)', boxShadow: '0 0 10px var(--primary-color-alpha)' } : {}}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>

            {/* Custom Range picker inputs */}
            <div className="flex items-center gap-2 flex-wrap flex-row-reverse">
              <div className="flex items-center gap-1 flex-row-reverse">
                <span className="text-[10px] text-gray-400 font-bold">من:</span>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => handleDateFromChange(e.target.value)}
                  className="text-xs px-2 px-1.5 py-1 rounded-xl border border-blue-200/60 dark:border-blue-900/40 bg-white/95 dark:bg-[#0c203b] text-gray-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-[var(--primary-color)]"
                />
              </div>

              <span className="text-gray-300 dark:text-zinc-750 font-bold text-[11px]">←</span>

              <div className="flex items-center gap-1 flex-row-reverse">
                <span className="text-[10px] text-gray-400 font-bold">إلى:</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => handleDateToChange(e.target.value)}
                  className="text-xs px-2 px-1.5 py-1 rounded-xl border border-blue-200/60 dark:border-blue-900/40 bg-white/95 dark:bg-[#0c203b] text-gray-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-[var(--primary-color)]"
                />
              </div>
            </div>

          </div>
        </div>

        {/* Row 3: Method selection, totals, clear button */}
        <div className="pt-3.5 border-t border-gray-100 dark:border-blue-900/20 grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          
          {/* Method Selector */}
          <div className="md:col-span-4 flex items-center gap-2 flex-row-reverse text-right">
            <span className="text-[10px] text-gray-400 font-bold shrink-0">طريقة الدفع:</span>
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-xl border border-blue-200/60 dark:border-blue-900/40 bg-white/95 dark:bg-[#0c203b] text-gray-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-[var(--primary-color)]"
            >
              <option value="all">كل طرق الدفع والصرف</option>
              {paymentMethodsInVouchers.map((m, idx) => (
                <option key={idx} value={m}>{m}</option>
              ))}
            </select>
          </div>

          {/* Value Indicator (Mowassaq) */}
          <div className="md:col-span-5 flex items-center justify-end bg-blue-50/15 dark:bg-[#001733]/30 border border-blue-100/60 dark:border-blue-800/20 px-3 py-2 rounded-xl select-none">
            <span className="text-[10px] text-gray-400 ml-1.5 font-bold">مجموع قيمة المصفّى:</span>
            <span className="text-sm font-black transition-all font-mono text-emerald-650 dark:text-emerald-400">
              {formatOMR(filteredVouchers.reduce((acc, current) => acc + current.amount, 0))}
            </span>
          </div>

          {/* Reset button */}
          <button
            type="button"
            onClick={handleResetFilters}
            className="md:col-span-3 py-2 text-xs font-bold text-gray-500 hover:text-gray-850 dark:hover:text-white border border-gray-200 dark:border-zinc-800 hover:bg-gray-100/40 dark:hover:bg-zinc-900 rounded-xl transition-all flex items-center justify-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            تفريغ التصفية والفرز
          </button>

        </div>

        {/* Row 4: Filtered Export/Print Actions */}
        <div className="pt-3.5 border-t border-gray-100 dark:border-blue-900/20 flex flex-col sm:flex-row justify-between items-center gap-3">
          {filteredVouchers.length === 0 ? (
            methodFilter !== 'all' ? (
              <p className="text-xs text-rose-600 dark:text-rose-400 font-bold w-full text-right flex items-center gap-1.5 flex-row-reverse">
                <span>⚠️ لا توجد سجلات مطابقة لطريقة الدفع المحددة.</span>
              </p>
            ) : null
          ) : (
            <>
              <div className="text-right flex items-center gap-2 flex-row-reverse">
                <span className="text-[10px] text-gray-400 font-bold shrink-0">إجراءات التقرير المصفى:</span>
                <span className="text-[11px] text-zinc-550 dark:text-zinc-400">
                  {methodFilter === 'all' 
                    ? 'طباعة أو تصدير كل السجلات المعروضة حالياً بالبحث' 
                    : `طباعة أو تصدير السندات الخاصة بـ (${methodFilter}) فقط`}
                </span>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => currentPermissions.printFiltered && setShowPrintReport(true)}
                  disabled={!currentPermissions.printFiltered}
                  title={!currentPermissions.printFiltered ? "غير مصرح لك بهذا الإجراء." : (methodFilter === 'all' ? 'طباعة كل السجلات المعروضة' : `طباعة النتائج المفلترة (${methodFilter})`)}
                  className={`flex-1 sm:flex-initial px-4 py-2.5 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm ${
                    !currentPermissions.printFiltered 
                      ? 'bg-emerald-600/45 text-emerald-200/60 cursor-not-allowed opacity-50' 
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  }`}
                >
                  <Printer className="w-4 h-4" />
                  {methodFilter === 'all' ? 'طباعة كل السجلات المعروضة' : `طباعة النتائج المفلترة (${methodFilter})`}
                </button>
                <button
                  type="button"
                  onClick={() => currentPermissions.exportFilteredPDF && setShowPrintReport(true)}
                  disabled={!currentPermissions.exportFilteredPDF}
                  title={!currentPermissions.exportFilteredPDF ? "غير مصرح لك بهذا الإجراء." : (methodFilter === 'all' ? 'تصدير كل السجلات المعروضة PDF' : `تصدير النتائج المفلترة PDF (${methodFilter})`)}
                  className={`flex-1 sm:flex-initial px-4 py-2.5 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm ${
                    !currentPermissions.exportFilteredPDF 
                      ? 'bg-blue-600/45 text-blue-200/60 cursor-not-allowed opacity-50' 
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  {methodFilter === 'all' ? 'تصدير كل السجلات المعروضة PDF' : `تصدير النتائج المفلترة PDF (${methodFilter})`}
                </button>
              </div>
            </>
          )}
        </div>

      </div>

      {/* Active filters status badge block */}
      {(dateFrom || dateTo || searchTerm || typeFilter !== 'all' || methodFilter !== 'all') && (
        <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-gray-50 dark:bg-zinc-900/40 rounded-xl border border-gray-100 dark:border-zinc-800 text-[11px] text-gray-600 dark:text-gray-300 flex-row-reverse text-right animate-fade-in">
          <div className="flex flex-wrap items-center gap-1.5 flex-row-reverse">
            <span className="font-bold">مرشحات البحث النشطة:</span>
            
            {typeFilter !== 'all' && (
              <span className="bg-white dark:bg-zinc-950 px-2 py-1 rounded border border-gray-100 dark:border-zinc-800 font-mono text-[10px]">
                النوع: {typeFilter === 'receipt' ? identity.receiptTerm : identity.paymentTerm}
              </span>
            )}

            {searchTerm && (
              <span className="bg-white dark:bg-zinc-950 px-2 py-1 rounded border border-gray-100 dark:border-zinc-800 font-mono text-[10px]">
                كلمة البحث: "{searchTerm}"
              </span>
            )}

            {methodFilter !== 'all' && (
              <span className="bg-white dark:bg-zinc-950 px-2 py-1 rounded border border-gray-100 dark:border-zinc-800 font-mono text-[10px]">
                طريقة الدفع: {methodFilter}
              </span>
            )}

            {(dateFrom || dateTo) && (
              <span className="bg-emerald-500/10 text-emerald-650 dark:text-emerald-400 px-2.5 py-1 rounded font-mono font-bold flex items-center gap-1">
                <span>تصفية زمنية:</span>
                <span>{dateFrom ? formatDate(dateFrom) : 'البداية'}</span>
                <span>إلى</span>
                <span>{dateTo ? formatDate(dateTo) : 'البند الجاري'}</span>
              </span>
            )}
          </div>

          <button
            onClick={handleResetFilters}
            className="text-rose-600 dark:text-rose-400 hover:opacity-80 font-extrabold text-[10px] flex items-center gap-1 flex-row-reverse cursor-pointer px-2 py-1 bg-rose-500/10 rounded-lg"
          >
            <span>إفراغ معايير التصفية</span>
            <span>×</span>
          </button>
        </div>
      )}

      {/* Main List Archive Layout */}
      {filteredVouchers.length === 0 ? (
        <div className={`p-12 text-center border-2 border-dashed border-gray-200 dark:border-zinc-800 rounded-3xl space-y-3`}>
          <Search className="w-10 h-10 text-gray-300 mx-auto animate-pulse" />
          <h4 className="text-gray-800 dark:text-gray-200 font-extrabold text-sm">عفواً، لا توجد سجلات مطابقة</h4>
          <p className="text-xs text-gray-400 max-w-sm mx-auto leading-relaxed">
            لم تسفر محركات الفرز عن مطابقة لأي سندات سابقة في خريطة التخزين الحالية بالولاية. تأكد من تهجئة كلمة البحث أو عدم تداخل التواريخ المفلترة.
          </p>
          <button 
            type="button" 
            onClick={handleResetFilters}
            className="text-[11px] text-[var(--primary-color)] hover:underline font-bold mt-2 inline-block bg-[var(--primary-color)]/5 px-4 py-1.5 rounded-xl border border-[var(--primary-color)]/20"
          >
            تصفير معايير البحث
          </button>
        </div>
      ) : (
        <div className={`overflow-x-auto ${cardStyleClass} border border-gray-150 dark:border-zinc-800/60`}>
          <table className="w-full text-xs text-right border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-zinc-900 text-gray-500 dark:text-gray-400 border-b border-gray-150 dark:border-zinc-800 font-bold">
                <th className="p-3.5 pr-5">رقم السند</th>
                <th className="p-3.5 text-center">النوع</th>
                <th className="p-3.5">تاريخ التدوين</th>
                <th className="p-3.5">المشروع الخيرى</th>
                <th className="p-3.5">الدافع / المستفيد غائياً</th>
                <th className="p-3.5">البيان (وذلك عن)</th>
                <th className="p-3.5">طريقة التحصيل</th>
                <th className="p-3.5">المبلغ الكلي</th>
                <th className="p-3.5 text-center pl-5">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-zinc-900/65">
              {filteredVouchers.map((v) => {
                const isReceipt = v.type === 'receipt';
                
                return (
                  <tr key={v.id} className="hover:bg-gray-50/55 dark:hover:bg-zinc-900/30 transition-all">
                    
                    {/* Voucher No with style font */}
                    <td className="p-3.5 pr-5 font-bold font-mono text-gray-900 dark:text-white">
                      {v.voucherNo}
                    </td>

                    {/* Type badge */}
                    <td className="p-3.5 text-center">
                      <span className={`inline-flex items-center gap-1 text-[10px] px-2.5 py-0.5 rounded-full font-bold ${
                        isReceipt 
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50' 
                          : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-100 dark:border-rose-900/50'
                      }`}>
                        {isReceipt ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        {isReceipt ? identity.receiptTerm : identity.paymentTerm}
                      </span>
                    </td>

                    {/* Gregorian date */}
                    <td className="p-3.5 text-gray-500 dark:text-gray-400 font-medium">
                      {v.date}
                    </td>

                    {/* Project */}
                    <td className="p-3.5 text-gray-700 dark:text-zinc-300 font-bold">
                      <span className="bg-slate-150/40 dark:bg-zinc-900/80 px-2 py-0.5 rounded border border-gray-200/50 dark:border-zinc-800 text-[10px]">
                        {v.projectNameSnapshot || (projectsList.find(p => p.id === v.projectId)?.name) || "تبرع عام / غير مخصص"}
                      </span>
                    </td>

                    {/* Person */}
                    <td className="p-4 font-extrabold text-gray-800 dark:text-gray-205">
                      {v.payerOrBeneficiary}
                    </td>

                    {/* Description */}
                    <td className="p-4 text-gray-500 dark:text-gray-400 max-w-xs truncate" title={v.description}>
                      {v.description}
                    </td>

                    {/* Method */}
                    <td className="p-3.5 text-gray-405 dark:text-gray-400 text-[11px] font-semibold">
                      {v.paymentMethod || 'نقداً'}
                    </td>

                    {/* Price in OMR styling */}
                    <td className="p-3.5 font-bold font-mono text-gray-900 dark:text-white text-[13px]">
                      {formatOMR(v.amount)}
                    </td>

                    {/* Actions Group conforming to design instructions */}
                    <td className="p-3.5 text-center pl-5">
                      {(() => {
                        const isViewPermitted = !!currentPermissions.viewVoucher;
                        const isEditPermitted = isReceipt ? !!currentPermissions.editReceipt : !!currentPermissions.editPayment;
                        const isPDFPermitted = !!currentPermissions.exportVoucherPDF;
                        const isPrintPermitted = !!currentPermissions.printVoucher;
                        const isDeletePermitted = isReceipt ? !!currentPermissions.deleteReceipt : !!currentPermissions.deletePayment;

                        return (
                          <div className="flex items-center justify-center gap-2">
                            
                            {/* View Voucher */}
                            <button
                              type="button"
                              onClick={() => isViewPermitted && onViewVoucher(v)}
                              disabled={!isViewPermitted}
                              title={!isViewPermitted ? "غير مصرح لك بهذا الإجراء." : "عرض السند"}
                              className={`p-1.5 rounded-lg transition-all border ${
                                !isViewPermitted
                                  ? "text-gray-405 dark:text-gray-500 bg-gray-200/50 dark:bg-zinc-800 cursor-not-allowed opacity-50 border-transparent"
                                  : "text-gray-500 dark:text-gray-400 bg-slate-100 dark:bg-zinc-900 hover:opacity-85 border-gray-200/40 dark:border-zinc-800"
                              }`}
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            {/* Edit Voucher */}
                            <button
                              type="button"
                              onClick={() => isEditPermitted && onEditVoucher(v)}
                              disabled={!isEditPermitted}
                              title={!isEditPermitted ? "غير مصرح لك بهذا الإجراء." : "تعديل السند"}
                              className={`p-1.5 rounded-lg transition-all border ${
                                !isEditPermitted
                                  ? "text-gray-405 dark:text-gray-500 bg-gray-200/50 dark:bg-zinc-800 cursor-not-allowed opacity-50 border-transparent"
                                  : "text-blue-600 dark:text-blue-400 bg-slate-100 dark:bg-zinc-900 hover:opacity-85 border-gray-200/40 dark:border-zinc-800"
                              }`}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>

                            {/* Print preview / Edit */}
                            <button
                              type="button"
                              onClick={() => isPDFPermitted && onPrintVoucher(v)}
                              disabled={!isPDFPermitted}
                              title={!isPDFPermitted ? "غير مصرح لك بهذا الإجراء." : "عرض ومعاينة السند وتصديره"}
                              style={isPDFPermitted ? { color: identity.primaryColor } : undefined}
                              className={`p-1.5 rounded-lg transition-all ${
                                !isPDFPermitted
                                  ? "text-gray-405 dark:text-gray-500 bg-gray-200/50 dark:bg-zinc-800 cursor-not-allowed opacity-50"
                                  : "bg-slate-100 dark:bg-zinc-900 hover:opacity-80"
                              }`}
                            >
                              <FileText className="w-3.5 h-3.5" />
                            </button>

                            {/* Direct browser trigger print */}
                            <button
                              type="button"
                              onClick={() => isPrintPermitted && onPrintVoucher(v)}
                              disabled={!isPrintPermitted}
                              title={!isPrintPermitted ? "غير مصرح لك بهذا الإجراء." : "طباعة السند"}
                              className={`p-1.5 rounded-lg transition-all ${
                                !isPrintPermitted
                                  ? "text-gray-450 dark:text-gray-500 bg-gray-200/50 dark:bg-zinc-800 cursor-not-allowed opacity-50"
                                  : "text-gray-500 dark:text-gray-400 bg-slate-100 dark:bg-zinc-900 hover:opacity-85"
                              }`}
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete voucher */}
                            <button
                              type="button"
                              onClick={() => isDeletePermitted && handleDeleteTrigger(v)}
                              disabled={!isDeletePermitted}
                              title={!isDeletePermitted ? "غير مصرح لك بهذا الإجراء." : "حذف السند"}
                              className={`p-1.5 rounded-lg transition-all ${
                                !isDeletePermitted
                                  ? "text-rose-300 bg-rose-100/40 dark:bg-rose-950/10 cursor-not-allowed opacity-50"
                                  : "text-rose-600 bg-rose-50 dark:bg-rose-950/20 hover:bg-rose-100 hover:text-rose-700"
                              }`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>

                          </div>
                        );
                      })()}
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* State-driven Custom Delete Voucher Modal */}
      {voucherToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl max-w-md w-full border border-rose-100 dark:border-rose-950/50 shadow-2xl space-y-4 text-right">
            <div className="flex items-center gap-2 justify-end text-rose-600 dark:text-rose-400">
              <span className="font-bold text-sm">حذف السند المالي نهائياً</span>
              <Trash2 className="w-4 h-4 text-rose-500 animate-pulse" />
            </div>
            
            <div className="p-3 bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 rounded-xl space-y-1.5 text-xs text-right leading-relaxed">
              <div className="font-bold">⚠️ سجل تدوين تحذيري مهم:</div>
              <div>أنت على وشك حذف السند ذو الرقم المرجعي <strong className="font-mono text-gray-900 dark:text-white font-extrabold">{voucherToDelete.voucherNo}</strong> بشكل دائم من الدفاتر المالية!</div>
              <div className="mt-1 font-mono">المبلغ: <span className="font-extrabold">{formatOMR(voucherToDelete.amount)}</span></div>
              <div className="font-sans">المستفيد / الدافع: <span className="font-extrabold">{voucherToDelete.payerOrBeneficiary}</span></div>
            </div>

            <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed font-semibold">
              هل أنت متأكد تماماً من وبتر هذا السند ومسحة نهائياً؟ هذا الإجراء لا يمكن التراجع عنه.
            </p>

            <div className="flex gap-2 justify-end pt-2">
              <button
                onClick={confirmDeleteVoucher}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
              >
                تأكيد حذف وحرق السند
              </button>
              <button
                onClick={() => setVoucherToDelete(null)}
                className="px-4 py-2 bg-gray-150 dark:bg-zinc-850 text-gray-700 dark:text-gray-300 text-xs rounded-xl"
              >
                تراجع
              </button>
            </div>
          </div>
        </div>
      )}

      {showPrintReport && (
        <PrintFilteredVouchers
          vouchers={filteredVouchers}
          selectedMethod={methodFilter}
          identity={identity}
          onClose={() => setShowPrintReport(false)}
          permissions={currentPermissions}
          isManagerMode={isManagerMode}
        />
      )}

    </div>
  );
}
