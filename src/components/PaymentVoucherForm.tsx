/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Voucher, VisualIdentity } from '../types';
import { DatabaseService } from '../db';
import { formatOMR, tafqeet } from '../utils';
import { Calendar, UserCheck, DollarSign, CreditCard, AlignRight, FileText, CheckCircle, Info } from 'lucide-react';

interface PaymentVoucherFormProps {
  identity: VisualIdentity;
  onSaved: () => void;
  onCancel: () => void;
  onPreviewVoucher: (voucher: Voucher) => void;
}

export default function PaymentVoucherForm({ identity, onSaved, onCancel, onPreviewVoucher }: PaymentVoucherFormProps) {
  // Dropdowns state
  const [methods, setMethods] = useState<string[]>([]);
  
  // Voucher number
  const [voucherNo, setVoucherNo] = useState('');
  
  // Fields state
  const [date, setDate] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [beneficiary, setBeneficiary] = useState('');
  const [method, setMethod] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');

  // Quick State
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Check for duplicate voucher numbers
  const isDuplicate = React.useMemo(() => {
    if (!voucherNo.trim()) return false;
    return DatabaseService.getVouchers().some(
      v => v.voucherNo.trim().toUpperCase() === voucherNo.trim().toUpperCase()
    );
  }, [voucherNo]);

  useEffect(() => {
    // Dynamic lists
    setMethods(DatabaseService.getPaymentMethods());
    
    // Auto sequence
    const nextNo = DatabaseService.getNextVoucherNo('payment');
    setVoucherNo(nextNo);

    // Date
    const today = new Date().toISOString().split('T')[0];
    setDate(today);

    // Default method
    const dbMethods = DatabaseService.getPaymentMethods();
    if (dbMethods.length > 0) {
      setMethod(dbMethods[0]);
    }
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (identity.alertOnDuplicateVoucherNo && isDuplicate) {
      setErrorMsg(`⚠️ رقم السند هذا (${voucherNo}) مكرر ومسجل مسبقاً! يرجى إدخال رقم منفرد فريد لتجنب أخطاء الأرشيف الإدارية.`);
      return;
    }

    if (!amount || Number(amount) <= 0) {
      setErrorMsg('الرجاء إدخال مبلغ صرف صحيح أكبر من الصفر');
      return;
    }

    if (!beneficiary.trim()) {
      setErrorMsg('الرجاء كتابة اسم الجهة المستفيدة أو الشخص الصادر له السند');
      return;
    }

    if (!method) {
      setErrorMsg('الرجاء اختيار طريقة الدفع للتحويل المالي');
      return;
    }

    if (!description.trim()) {
      setErrorMsg('الرجاء كتابة بيان توضيحي للصرف (مثال: مستلزمات مكتبية / صيانة سفينة الهوية)');
      return;
    }

    try {
      DatabaseService.addVoucher({
        voucherNo,
        type: 'payment',
        date,
        amount: Number(amount),
        payerOrBeneficiary: beneficiary.trim(),
        paymentMethod: method,
        description,
        notes
      });

      setSuccessMsg('تم حفظ سند الصرف المالي بنجاح في السجلات!');
      setTimeout(() => {
        setSuccessMsg('');
        onSaved();
      }, 1500);
    } catch (e) {
      setErrorMsg('حدث خطأ أثناء حفظ سند الصرف في التخزين المحلي');
    }
  };

  const handleExportPDFPreview = () => {
    if (!amount || Number(amount) <= 0 || !beneficiary.trim() || !method || !description.trim()) {
      setErrorMsg('الرجاء ملء كافة بيانات السند الأساسية لتتمكن من معاينته أو طباعته');
      return;
    }

    const mockVoucher: Voucher = {
      id: 'preview_id_payment',
      voucherNo,
      type: 'payment',
      date,
      amount: Number(amount),
      payerOrBeneficiary: beneficiary.trim(),
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
    <div className={`p-6 text-right space-y-6 ${cardStyleClass}`} id="payment-voucher-form">
      {/* Header */}
      <div className="border-b border-gray-100 dark:border-zinc-800 pb-4 flex justify-between items-center flex-row-reverse">
        <div className="flex items-center gap-2 flex-row-reverse text-right">
          <span className="w-3.5 h-3.5 rounded-full inline-block bg-sky-600" />
          <h2 className="text-lg font-black text-gray-900 dark:text-white">إصدار {identity.paymentTerm} جديدة</h2>
        </div>
        <div className="flex items-center gap-2 flex-row-reverse text-xs text-gray-500">
          <span className="opacity-60 shrink-0">:رقم السند المرجعي</span>
          <input
            type="text"
            required
            placeholder="مثال: PV-1001"
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
        <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-400 text-xs rounded-xl text-right">
          {errorMsg}
        </div>
      )}

      {successMsg && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-400 text-xs rounded-xl text-right">
          {successMsg}
        </div>
      )}

      {/* Primary Forms */}
      <form onSubmit={handleSave} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Amount Box */}
          <div className="space-y-1.5 text-right">
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5 flex-row-reverse">
              <DollarSign className="w-3.5 h-3.5 text-gray-400" />
              المبلغ المصروف بالريال العماني (OMR)
            </label>
            <div className="relative font-mono">
              <input
                type="number"
                step="0.001"
                min="0.001"
                required
                placeholder="0.000"
                value={amount}
                onChange={(e) => setAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
                className="w-full text-xs text-left px-4 py-2.5 rounded-xl border border-blue-200/60 dark:border-blue-900/40 bg-white/95 dark:bg-[#0c203b] text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-rose-500/50 focus:border-rose-500 focus:shadow-[0_0_15px_rgba(244,63,94,0.15)] transition-all duration-300"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded">
                ريال عماني
              </span>
            </div>

            {/* Tafqeet words render */}
            {amount !== '' ? (
              <div className="text-[10px] text-sky-600 dark:text-sky-455 font-medium mt-1 bg-sky-50/20 p-2 rounded-lg">
                <strong>كتابة السند:</strong> {tafqeet(Number(amount))}
              </div>
            ) : null}
          </div>

          {/* Date Picker */}
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

          {/* Beneficiary الجهة أو الشخص المستفيد */}
          <div className="space-y-1.5 text-right">
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5 flex-row-reverse">
              <UserCheck className="w-3.5 h-3.5 text-gray-400" />
              الجهة أو الشخص المستفيد (صُرف لـ)
            </label>
            <input
              type="text"
              required
              placeholder="اكتب اسم المستلم أو المحل التجاري..."
              value={beneficiary}
              onChange={(e) => setBeneficiary(e.target.value)}
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-blue-200/60 dark:border-blue-900/40 bg-white/95 dark:bg-[#0c203b] text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-[var(--primary-color)]/50 focus:border-[var(--primary-color)] focus:shadow-[0_0_15px_var(--primary-color-alpha)] transition-all duration-300"
            />
          </div>

          {/* Payment Method dropdown (synced from default list) */}
          <div className="space-y-1.5 text-right">
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5 flex-row-reverse">
              <CreditCard className="w-3.5 h-3.5 text-gray-400" />
              طريقة دفع المبلغ المالي
            </label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              required
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-blue-200/60 dark:border-blue-900/40 bg-white/95 dark:bg-[#0c203b] text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-[var(--primary-color)]/50 focus:border-[var(--primary-color)] focus:shadow-[0_0_15px_var(--primary-color-alpha)] transition-all duration-300"
            >
              <option value="">-- اختر طريقة الصرف --</option>
              {methods.map((m, idx) => (
                <option key={idx} value={m}>{m}</option>
              ))}
            </select>
          </div>

        </div>

        {/* Description / البيان وسبب الصرف */}
        <div className="space-y-1.5 text-right">
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5 flex-row-reverse">
            <AlignRight className="w-3.5 h-3.5 text-gray-400" />
            بيان ووصف الصرف غرضاً وتفصيلاً (وذلك عن)
          </label>
          <input
            type="text"
            required
            placeholder="مثال: تموين الطرود الرمضانية / صيانة مرافق المخيم الكشفي"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-blue-200/60 dark:border-blue-900/40 bg-white/95 dark:bg-[#0c203b] text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-[var(--primary-color)]/50 focus:border-[var(--primary-color)] focus:shadow-[0_0_15px_var(--primary-color-alpha)] transition-all duration-300"
          />
        </div>

        {/* Audit Notes */}
        <div className="space-y-1.5 text-right">
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5 flex-row-reverse">
            <FileText className="w-3.5 h-3.5 text-gray-400" />
            ملاحظات التدقيق والمراجعة الرقمية
          </label>
          <textarea
            rows={2}
            placeholder="ملاحظات سرية أو أرقام الفواتير المصاحبة للتوثيق..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full text-xs px-3.5 py-2 rounded-xl border border-blue-200/60 dark:border-blue-900/40 bg-white/95 dark:bg-[#0c203b] text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-[var(--primary-color)]/50 focus:border-[var(--primary-color)] focus:shadow-[0_0_15px_var(--primary-color-alpha)] transition-all duration-300 resize-none"
          />
        </div>

        {/* Identity tip */}
        {identity.showHelpTips && (
          <div className="p-3 bg-amber-50/20 border border-amber-100/40 rounded-xl text-[10px] text-amber-700 dark:text-amber-400 leading-relaxed text-right flex items-start gap-2 flex-row-reverse">
            <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <strong className="block mb-0.5">💡 نصيحة إصدار سند صرف مالي:</strong>
              تلتزم كشور الشؤون المالية بالتحقق من وجود فواتير ثبوتية معتمدة قبل تدوين "سند الصرف" لضمان سلاسة التدقيق السنوي للفريق والملفات الأرشيفية.
            </div>
          </div>
        )}

        {/* Buttons Group */}
        <div className="flex border-t border-gray-100 dark:border-zinc-850 pt-5 gap-3 justify-end items-center flex-row-reverse">
          {/* Submit Save */}
          <button
            type="submit"
            style={{ backgroundColor: identity.primaryColor }}
            className={`px-6 py-2.5 text-xs font-bold text-white shadow-sm hover:opacity-90 transition-all flex items-center gap-2 ${btnRadius}`}
          >
            <CheckCircle className="w-4 h-4" />
            حفظ سند الصرف
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
            className={`px-4 py-2.5 text-xs font-semibold text-gray-500 hover:text-gray-800 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-zinc-805 transition-all ${btnRadius}`}
          >
            إلغاء
          </button>
        </div>
      </form>
    </div>
  );
}
