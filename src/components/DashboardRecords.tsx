/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Voucher, VisualIdentity } from '../types';
import { formatOMR, formatDate } from '../utils';
import { Printer, Trash2, FileText, ArrowUpRight, ArrowDownRight, Layers, HelpCircle, Check, X } from 'lucide-react';

interface DashboardRecordsProps {
  vouchers: Voucher[];
  identity: VisualIdentity;
  onDeleteVoucher: (id: string) => void;
  onPrintVoucher: (voucher: Voucher) => void;
}

export default function DashboardRecords({ vouchers, identity, onDeleteVoucher, onPrintVoucher }: DashboardRecordsProps) {
  const [filterType, setFilterType] = useState<'all' | 'receipt' | 'payment'>('all');
  
  // Track id being deleted to show beautiful inline prompt "هل أنت متأكد من حذف هذا السند؟ نعم/لا"
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filteredList = vouchers.filter(v => {
    if (filterType === 'all') return true;
    return v.type === filterType;
  });

  const cardStyleClass = 
    identity.cardStyle === 'flat' ? 'border-0 bg-blue-50/20 dark:bg-[#0d2342]/60 rounded-2xl shadow-none finance-glow-card' :
    identity.cardStyle === 'bordered' ? 'border border-blue-100 dark:border-blue-500/20 bg-white/95 dark:bg-[#0c203b]/90 rounded-2xl finance-glow-card' :
    identity.cardStyle === 'shadowed' ? 'shadow-xl bg-white/95 dark:bg-[#0c203b]/90 border border-blue-100/60 dark:border-blue-500/20 rounded-2xl finance-glow-card' :
    'backdrop-blur-md bg-white/70 dark:bg-[#0b1f3a]/80 border border-blue-200/40 dark:border-blue-500/15 rounded-3xl finance-glow-card';

  const btnRadius = 
    identity.buttonStyle === 'sharp' ? 'rounded-none' : 
    identity.buttonStyle === 'rounded' ? 'rounded-xl' : 'rounded-full';

  return (
    <div className={`p-5 ${cardStyleClass} space-y-4`} id="dashboard-records">
      
      {/* Header and filters control */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-gray-100 dark:border-zinc-850 pb-3 flex-row-reverse text-right">
        
        <h3 className="font-extrabold text-sm text-gray-900 dark:text-white flex items-center gap-1.5 flex-row-reverse">
          <Layers className="w-4 h-4 text-[var(--primary-color)]" />
          سجل السندات المعاصرة
        </h3>

        {/* Filters control conforming exactly to requirement */}
        <div className="flex bg-gray-100 dark:bg-zinc-900 p-1 rounded-xl gap-1">
          <button
            onClick={() => setFilterType('all')}
            className={`text-[11px] font-bold px-3 py-1.5 rounded-lg transition-all ${
              filterType === 'all' 
                ? 'bg-white dark:bg-zinc-950 text-[var(--primary-color)] shadow-sm' 
                : 'text-gray-500 hover:text-gray-800 dark:hover:text-zinc-300'
            }`}
          >
            جميع السجلات
          </button>
          
          <button
            onClick={() => setFilterType('payment')}
            className={`text-[11px] font-bold px-3 py-1.5 rounded-lg transition-all ${
              filterType === 'payment' 
                ? 'bg-white dark:bg-zinc-950 text-rose-600 shadow-sm' 
                : 'text-gray-500 hover:text-gray-800 dark:hover:text-zinc-300'
            }`}
          >
            سجلات الصرف
          </button>

          <button
            onClick={() => setFilterType('receipt')}
            className={`text-[11px] font-bold px-3 py-1.5 rounded-lg transition-all ${
              filterType === 'receipt' 
                ? 'bg-white dark:bg-zinc-950 text-emerald-600 shadow-sm' 
                : 'text-gray-500 hover:text-gray-800 dark:hover:text-zinc-300'
            }`}
          >
            سجلات القبض
          </button>
        </div>
      </div>

      {/* Vouchers lists */}
      {filteredList.length === 0 ? (
        <div className="p-8 text-center text-gray-400 text-xs">
          لا توجد سندات مالية مضافة حالياً في هذا القسم. ارفع سنداً جديداً ليظهر هنا تلقائياً.
        </div>
      ) : (
        <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
          {filteredList.map((v, idx) => {
            const isReceipt = v.type === 'receipt';
            const isDeletingThis = deletingId === v.id;
            
            return (
              <div 
                key={v.id} 
                className={`p-3 border dark:border-zinc-800/60 rounded-xl transition-all duration-300 flex flex-col sm:flex-row justify-between items-center gap-3 relative overflow-hidden backdrop-blur-sm ${
                  idx % 2 === 0 
                    ? 'bg-white/80 dark:bg-zinc-900/40' 
                    : 'bg-gray-50/50 dark:bg-zinc-950/20'
                } hover:bg-white dark:hover:bg-zinc-900/80 hover:shadow-[0_0_15px_rgba(var(--primary-color),0.05)] shadow-sm hover:translate-x-[-2px]`}
                style={{
                  boxShadow: isDeletingThis ? '0 0 20px rgba(244, 63, 94, 0.4)' : ''
                }}
              >
                {/* Inline Double Confirmation overlay for strict compliance with deletes */}
                {isDeletingThis && (
                  <div className="absolute inset-x-0 inset-y-0 bg-rose-600 text-white z-10 flex items-center justify-between px-6 animate-fade-in text-xs font-semibold">
                    <span className="flex items-center gap-2">
                      <HelpCircle className="w-4 h-4 animate-bounce shrink-0" />
                      هل أنت متأكد من حذف هذا السند؟
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          onDeleteVoucher(v.id);
                          setDeletingId(null);
                        }}
                        className="bg-white text-rose-600 px-3.5 py-1.5 rounded-lg font-extrabold hover:bg-gray-100 shadow cursor-pointer transition-transform active:scale-95"
                      >
                        نعم، حذف
                      </button>
                      <button
                        onClick={() => setDeletingId(null)}
                        className="bg-rose-800 text-white px-3.5 py-1.5 rounded-lg font-semibold hover:bg-rose-900 cursor-pointer transition-transform active:scale-95"
                      >
                        تراجع
                      </button>
                    </div>
                  </div>
                )}

                {/* Left Side: Three action icons (Exact requirement: Print, Delete, Convert PDF) */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {/* Icon 3: Convert/Export to PDF */}
                  <button
                    onClick={() => onPrintVoucher(v)}
                    title="تحويل إلى PDF وتصديره"
                    className="p-2 rounded-lg bg-gray-150/70 dark:bg-zinc-900 text-gray-500 hover:text-[var(--primary-color)] hover:bg-[var(--primary-color-alpha)] transition-all hover:scale-105 cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                  </button>

                  {/* Icon 1: Print */}
                  <button
                    onClick={() => onPrintVoucher(v)}
                    title="طباعة السند"
                    className="p-2 rounded-lg bg-gray-150/70 dark:bg-zinc-900 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-all hover:scale-105 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                  </button>

                  {/* Icon 2: Delete */}
                  <button
                    onClick={() => setDeletingId(v.id)}
                    title="حذف السند"
                    className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/20 text-rose-600 hover:text-rose-750 dark:hover:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/50 transition-all hover:scale-105 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Right Side: Brief details */}
                <div className="flex items-center gap-3 flex-1 flex-row-reverse text-right">
                  {/* Color identifier indicator */}
                  <div className={`p-2 rounded-xl shrink-0 ${
                    isReceipt ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600' : 'bg-rose-50 dark:bg-rose-950/30 text-rose-500'
                  }`}>
                    {isReceipt ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                  </div>

                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 flex-row-reverse">
                      <span className="font-extrabold text-xs text-gray-800 dark:text-gray-100">{v.payerOrBeneficiary}</span>
                      <span className="text-[10px] text-gray-400 font-mono font-semibold">({v.voucherNo})</span>
                    </div>
                    <div className="flex items-center gap-2 flex-row-reverse text-[10px] text-gray-400">
                      <span>{v.date}</span>
                      <span className="opacity-45">•</span>
                      <span className="max-w-[200px] truncate" title={v.description}>{v.description}</span>
                    </div>
                  </div>
                </div>

                {/* Central Price Display */}
                <div className="text-left font-mono font-extrabold text-xs text-gray-900 dark:text-white sm:pl-3 shrink-0">
                  {formatOMR(v.amount)}
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
