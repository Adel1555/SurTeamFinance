/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Voucher, VisualIdentity, VoucherType } from '../types';
import { DatabaseService } from '../db';
import { formatOMR, tafqeet } from '../utils';
import { Calendar, User, DollarSign, CreditCard, AlignRight, FileText, CheckCircle, ChevronDown, Plus, Info } from 'lucide-react';

interface ReceiptVoucherFormProps {
  identity: VisualIdentity;
  onSaved: () => void;
  onCancel: () => void;
  onPreviewVoucher: (voucher: Voucher) => void;
}

export default function ReceiptVoucherForm({ identity, onSaved, onCancel, onPreviewVoucher }: ReceiptVoucherFormProps) {
  // Pull drop options
  const [payers, setPayers] = useState<string[]>([]);
  const [methods, setMethods] = useState<string[]>([]);
  
  // Voucher number
  const [voucherNo, setVoucherNo] = useState('');
  
  // Fields state
  const [date, setDate] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [payer, setPayer] = useState('');
  const [method, setMethod] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');

  // Quick state
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [tempNewPayer, setTempNewPayer] = useState('');
  const [showQuickAddPayer, setShowQuickAddPayer] = useState(false);

  // Check for duplicate voucher numbers
  const isDuplicate = React.useMemo(() => {
    if (!voucherNo.trim()) return false;
    return DatabaseService.getVouchers().some(
      v => v.voucherNo.trim().toUpperCase() === voucherNo.trim().toUpperCase()
    );
  }, [voucherNo]);

  useEffect(() => {
    // Initial fetch from db
    setPayers(DatabaseService.getPayers());
    setMethods(DatabaseService.getPaymentMethods());
    
    // Auto-generate voucher number
    const nextNo = DatabaseService.getNextVoucherNo('receipt');
    setVoucherNo(nextNo);

    // Default today date
    const today = new Date().toISOString().split('T')[0];
    setDate(today);

    // Default first payment method
    const dbMethods = DatabaseService.getPaymentMethods();
    if (dbMethods.length > 0) {
      setMethod(dbMethods[0]);
    }
    
    // Default payer
    const dbPayers = DatabaseService.getPayers();
    if (dbPayers.length > 0) {
      setPayer(dbPayers[0]);
    }
  }, []);

  const handleQuickAddPayer = (e: React.FormEvent) => {
    e.preventDefault();
    const name = tempNewPayer.trim();
    if (name) {
      DatabaseService.addPayer(name);
      const updated = DatabaseService.getPayers();
      setPayers(updated);
      setPayer(name);
      setTempNewPayer('');
      setShowQuickAddPayer(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (identity.alertOnDuplicateVoucherNo && isDuplicate) {
      setErrorMsg(`⚠️ رقم السند هذا (${voucherNo}) مكرر ومسجل مسبقاً! يرجى إدخال رقم منفرد فريد لتجنب أخطاء الأرشيف الإدارية.`);
      return;
    }

    if (!amount || Number(amount) <= 0) {
      setErrorMsg('الرجاء إدخال مبلغ صحيح أكبر من الصفر');
      return;
    }

    if (!payer) {
      setErrorMsg('الرجاء اختيار اسم الدافع أو المتبرع');
      return;
    }

    if (!method) {
      setErrorMsg('الرجاء اختيار طريقة الدفع مسبقاً');
      return;
    }

    if (!description.trim()) {
      setErrorMsg('الرجاء كتابة وصف بسيط للقبض (مثال: كفالة يتيم / تبرع عام)');
      return;
    }

    try {
      const saved = DatabaseService.addVoucher({
        voucherNo,
        type: 'receipt',
        date,
        amount: Number(amount),
        payerOrBeneficiary: payer,
        paymentMethod: method,
        description,
        notes
      });

      setSuccessMsg('تم حفظ سند القبض بنجاح في قاعدة البيانات!');
      setTimeout(() => {
        setSuccessMsg('');
        onSaved();
      }, 1500);
    } catch (e) {
      setErrorMsg('حدث خطأ أثناء محاولة حفظ السند مالي');
    }
  };

  const handleExportPDFPreview = () => {
    if (!amount || Number(amount) <= 0 || !payer || !method || !description.trim()) {
      setErrorMsg('الرجاء إدخال جميع الحقول الأساسية أولاً لتتمكن من معاينة السند وتصديره');
      return;
    }

    // Build temporary voucher mock to preview inside print layout
    const mockVoucher: Voucher = {
      id: 'preview_id',
      voucherNo,
      type: 'receipt',
      date,
      amount: Number(amount),
      payerOrBeneficiary: payer,
      paymentMethod: method,
      description,
      notes,
      createdAt: Date.now()
    };

    onPreviewVoucher(mockVoucher);
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
    <div className={`p-6 text-right space-y-6 ${cardStyleClass}`} id="receipt-voucher-form">
      {/* Title & Banner */}
      <div className="border-b border-gray-100 dark:border-zinc-800 pb-4 flex justify-between items-center flex-row-reverse">
        <div className="flex items-center gap-2 flex-row-reverse text-right">
          <span className="w-3.5 h-3.5 rounded-full inline-block bg-emerald-500" />
          <h2 className="text-lg font-black text-gray-900 dark:text-white">إصدار {identity.receiptTerm} جديدة</h2>
        </div>
        <div className="flex items-center gap-2 flex-row-reverse text-xs text-gray-500">
          <span className="opacity-60 shrink-0">:رقم السند المرجعي</span>
          <input
            type="text"
            required
            placeholder="مثال: RV-1001"
            value={voucherNo}
            onChange={(e) => setVoucherNo(e.target.value)}
            className={`font-mono text-xs text-center font-bold px-2.5 py-1 rounded-xl bg-gray-50 dark:bg-zinc-950 border ${
              identity.alertOnDuplicateVoucherNo && isDuplicate 
                ? 'border-rose-400 text-rose-600 focus:ring-rose-500/30' 
                : 'border-blue-200/50 dark:border-blue-800/20 text-gray-800 dark:text-gray-200 focus:ring-emerald-500/30'
            } focus:outline-none focus:ring-2`}
          />
        </div>
      </div>

      {identity.alertOnDuplicateVoucherNo && isDuplicate && (
        <div className="p-3.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-amber-800 dark:text-amber-400 text-xs rounded-xl flex items-center gap-2 flex-row-reverse text-right">
          <Info className="w-4 h-4 shrink-0 text-amber-500 animate-pulse" />
          <span>
            <strong>تنبيه الأرشفة:</strong> رقم السند المرقّم بـ <strong className="font-mono">({voucherNo})</strong> مستخدم بالفعل في النظام المالي! يرجى تعديله أو مطابقته يدوياً منعاً لأية أخطاء محاسبية.
          </span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-400 text-xs rounded-xl flex items-center justify-between gap-2">
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-400 text-xs rounded-xl flex items-center justify-between gap-2">
          <span>{successMsg}</span>
        </div>
      )}

      {/* Main Entry Forms Grid */}
      <form onSubmit={handleSave} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Amount input */}
          <div className="space-y-1.5 text-right">
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5 flex-row-reverse">
              <DollarSign className="w-3.5 h-3.5 text-gray-400" />
              المبلغ بعملة الريال العماني (OMR)
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.001"
                min="0.001"
                required
                placeholder="0.000"
                value={amount}
                onChange={(e) => setAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
                className="w-full text-xs font-mono text-left px-4 py-2.5 rounded-xl border border-blue-200/60 dark:border-blue-900/40 bg-white/95 dark:bg-[#0c203b] text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500 focus:shadow-[0_0_15px_rgba(16,185,129,0.15)] transition-all duration-300"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded">
                ريال عماني
              </span>
            </div>
            
            {/* Realtime tafqeet translation helper */}
            {amount !== '' ? (
              <div className="text-[10px] text-amber-600 dark:text-amber-400 font-medium mt-1 bg-amber-50/20 p-2 rounded-lg">
                <strong>كتابة السند:</strong> {tafqeet(Number(amount))}
              </div>
            ) : null}
          </div>

          {/* Date input */}
          <div className="space-y-1.5 text-right">
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5 flex-row-reverse">
              <Calendar className="w-3.5 h-3.5 text-gray-400" />
              التاريخ الميلادي للسند
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-blue-200/60 dark:border-blue-900/40 bg-white/95 dark:bg-[#0c203b] text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-[var(--primary-color)]/50 focus:border-[var(--primary-color)] focus:shadow-[0_0_15px_var(--primary-color-alpha)] transition-all duration-300"
            />
          </div>

          {/* Payer name selection with settings integration and quick shortcut */}
          <div className="space-y-1.5 text-right">
            <div className="flex justify-between items-center flex-row-reverse">
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5 flex-row-reverse">
                <User className="w-3.5 h-3.5 text-gray-400" />
                مقبوض من الفاضل / المتبرع
              </label>
              <button
                type="button"
                onClick={() => setShowQuickAddPayer(!showQuickAddPayer)}
                className="text-[10px] text-[var(--primary-color)] hover:underline flex items-center gap-0.5 font-bold"
              >
                <Plus className="w-3 h-3" /> إضافة اسم جديد سريعاً
              </button>
            </div>

            {showQuickAddPayer ? (
              <div className="flex gap-2 mb-2 animate-fade-in">
                <input
                  type="text"
                  placeholder="اكتب الاسم الجديد..."
                  value={tempNewPayer}
                  onChange={(e) => setTempNewPayer(e.target.value)}
                  className="w-full text-xs px-3 py-1.5 rounded-lg border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-gray-800 dark:text-gray-200 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleQuickAddPayer}
                  className="bg-emerald-600 text-white text-[10px] px-3 py-1 rounded-lg font-bold hover:bg-emerald-700"
                >
                  إضافة
                </button>
                <button
                  type="button"
                  onClick={() => setShowQuickAddPayer(false)}
                  className="bg-gray-100 dark:bg-zinc-800 text-[10px] px-3 py-1 rounded-lg text-gray-500 hover:bg-gray-200"
                >
                  إلغاء
                </button>
              </div>
            ) : null}

            <select
              value={payer}
              onChange={(e) => setPayer(e.target.value)}
              required
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-blue-200/60 dark:border-blue-900/40 bg-white/95 dark:bg-[#0c203b] text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-[var(--primary-color)]/50 focus:border-[var(--primary-color)] focus:shadow-[0_0_15px_var(--primary-color-alpha)] transition-all duration-300"
            >
              <option value="">-- اختر من قائمة الدافعين المسجلة --</option>
              {payers.map((p, idx) => (
                <option key={idx} value={p}>{p}</option>
              ))}
            </select>
          </div>

          {/* Payment Method integration */}
          <div className="space-y-1.5 text-right">
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5 flex-row-reverse">
              <CreditCard className="w-3.5 h-3.5 text-gray-400" />
              طريقة تحصيل المبلغ
            </label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              required
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-blue-200/60 dark:border-blue-900/40 bg-white/95 dark:bg-[#0c203b] text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-[var(--primary-color)]/50 focus:border-[var(--primary-color)] focus:shadow-[0_0_15px_var(--primary-color-alpha)] transition-all duration-300"
            >
              <option value="">-- اختر طريقة الدفع --</option>
              {methods.map((m, idx) => (
                <option key={idx} value={m}>{m}</option>
              ))}
            </select>
          </div>

        </div>

        {/* Voucher description / وذلك لغرض */}
        <div className="space-y-1.5 text-right">
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5 flex-row-reverse">
            <AlignRight className="w-3.5 h-3.5 text-gray-400" />
            بيان ووصف القبض (وذلك عن)
          </label>
          <input
            type="text"
            required
            placeholder="مثال: تبرع لبناء مسجد الغنجة / دعم كفالة الأيتام"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-blue-200/60 dark:border-blue-900/40 bg-white/95 dark:bg-[#0c203b] text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-[var(--primary-color)]/50 focus:border-[var(--primary-color)] focus:shadow-[0_0_15px_var(--primary-color-alpha)] transition-all duration-300"
          />
        </div>

        {/* Notes */}
        <div className="space-y-1.5 text-right">
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5 flex-row-reverse">
            <FileText className="w-3.5 h-3.5 text-gray-400" />
            ملاحظات وتدقيق إضافي
          </label>
          <textarea
            rows={2}
            placeholder="ملاحظات غير مخصصة للتثبيت على التقرير إن وجدت..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full text-xs px-3.5 py-2 rounded-xl border border-blue-200/60 dark:border-blue-900/40 bg-white/95 dark:bg-[#0c203b] text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-[var(--primary-color)]/50 focus:border-[var(--primary-color)] focus:shadow-[0_0_15px_var(--primary-color-alpha)] transition-all duration-300 resize-none"
          />
        </div>

        {/* Custom Visual Help tips */}
        {identity.showHelpTips && (
          <div className="p-3 bg-amber-50/20 border border-amber-100/40 rounded-xl text-[10px] text-amber-700 dark:text-amber-400 leading-relaxed text-right flex items-start gap-2 flex-row-reverse">
            <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <strong className="block mb-0.5">💡 تلميح تدقيقي مهم:</strong>
              سيتم حفظ هذا السند كقراءة رقمية في الخزانة المالية فوراً. تأكد من تحديد الاسم الصحيح وتطبيق "تصدير PDF" لمشاهدة التوقيعات والأختام والشروط الرسمية المحددة في الهوية البصرية.
            </div>
          </div>
        )}

        {/* Buttons Action Group */}
        <div className="flex border-t border-gray-100 dark:border-zinc-850 pt-5 gap-3 justify-end items-center flex-row-reverse">
          {/* Submit Save */}
          <button
            type="submit"
            style={{ backgroundColor: identity.primaryColor }}
            className={`px-6 py-2.5 text-xs font-bold text-white shadow-sm hover:opacity-90 transition-all flex items-center gap-2 ${btnRadius}`}
          >
            <CheckCircle className="w-4 h-4" />
            حفظ السند المالي
          </button>

          {/* Export PDF Preview shortcut */}
          <button
            type="button"
            onClick={handleExportPDFPreview}
            className={`px-4 py-2.5 text-xs font-bold border border-gray-200 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-900 transition-all text-gray-700 dark:text-gray-300 bg-white dark:bg-zinc-950 flex items-center gap-2 ${btnRadius}`}
          >
            <FileText className="w-3.5 h-3.5 text-gray-400" />
            تصدير PDF (معاينة)
          </button>

          {/* Cancel */}
          <button
            type="button"
            onClick={onCancel}
            className={`px-4 py-2.5 text-xs font-semibold text-gray-500 hover:text-gray-800 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-zinc-800/60 transition-all ${btnRadius}`}
          >
            إلغاء
          </button>
        </div>
      </form>
    </div>
  );
}
