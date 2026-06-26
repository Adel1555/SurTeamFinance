/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Voucher, VisualIdentity, AttachmentMetadata, EmployeePermissions } from '../types';
import { formatOMR, formatDate, tafqeet } from '../utils';
import { AttachmentStorageService } from './AttachmentStorageService';
import { X, Printer, FileText, Calendar, DollarSign, User, Tag, HelpCircle, Paperclip, Eye, Loader2, Clock, Pencil } from 'lucide-react';

interface VoucherDetailsModalProps {
  voucher: Voucher | null;
  identity: VisualIdentity;
  onClose: () => void;
  onPrint: (voucher: Voucher) => void;
  onEdit: (voucher: Voucher) => void;
  permissions?: EmployeePermissions;
  isManagerMode?: boolean;
}

export default function VoucherDetailsModal({ voucher, identity, onClose, onPrint, onEdit, permissions, isManagerMode }: VoucherDetailsModalProps) {
  if (!voucher) return null;

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

  // Attachment preview states
  const [previewAttachment, setPreviewAttachment] = useState<AttachmentMetadata | null>(null);
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [previewError, setPreviewError] = useState('');

  const isReceipt = voucher.type === 'receipt';
  const voucherTypeLabel = isReceipt 
    ? identity.receiptTerm || 'سند قبض' 
    : identity.paymentTerm || 'سند صرف';
    
  const personRoleLabel = isReceipt 
    ? 'اسم دافع السند / الجهة' 
    : 'اسم المستفيد / الجهة الصارفة';

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (!bytes) return '0 بايت';
    const k = 1024;
    const sizes = ['بايت', 'كيلوبايت', 'ميغابايت'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Preview helper
  const handlePreviewAttachment = async (att: AttachmentMetadata) => {
    setLoadingPreview(true);
    setPreviewAttachment(att);
    setPreviewDataUrl(null);
    setPreviewError('');
    try {
      const data = await AttachmentStorageService.getAttachmentData(att.id);
      setPreviewDataUrl(data);
    } catch (e) {
      console.error('Error loading attachment data', e);
      setPreviewError('❌ تعذر تحميل المرفق للمعاينة.');
      setPreviewAttachment(null);
    } finally {
      setLoadingPreview(false);
    }
  };

  // Human-readable creation date
  const createdDateStr = voucher.createdAt 
    ? new Date(voucher.createdAt).toLocaleString('ar-OM', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    : '';

  const modalStyleClass = 
    identity.cardStyle === 'flat' ? 'border-0 bg-blue-50/20 dark:bg-[#0d2342]/65 rounded-2xl shadow-none' :
    identity.cardStyle === 'bordered' ? 'border border-blue-100 dark:border-blue-500/20 bg-white dark:bg-[#0c203b] rounded-2xl' :
    identity.cardStyle === 'shadowed' ? 'shadow-2xl bg-white dark:bg-[#0c203b] border border-blue-100/60 dark:border-blue-500/20 rounded-2xl' :
    'backdrop-blur-md bg-white/95 dark:bg-[#0b1f3a]/90 border border-blue-200/40 dark:border-blue-500/15 rounded-3xl';

  const btnRadius = 
    identity.buttonStyle === 'sharp' ? 'rounded-none' : 
    identity.buttonStyle === 'rounded' ? 'rounded-xl' : 'rounded-full';

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto print:hidden" dir="rtl">
      
      {/* Modal Container */}
      <div className={`w-full max-w-2xl ${modalStyleClass} overflow-hidden shadow-2xl flex flex-col max-h-[90vh] text-right`}>
        
        {/* Header bar */}
        <div className="flex justify-between items-center bg-gray-50 dark:bg-zinc-900/60 px-6 py-4 border-b border-gray-100 dark:border-zinc-800">
          <h3 className="text-sm font-black text-gray-900 dark:text-white flex items-center gap-2">
            <Tag className="w-4 h-4" style={{ color: identity.primaryColor }} />
            تفاصيل السند المالي المكتمل
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-gray-100 dark:bg-zinc-800 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Card: Primary summary */}
          <div className="grid grid-cols-2 gap-4">
            
            {/* Box 1: Reference info */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-900/40 border border-slate-100 dark:border-zinc-850/60 space-y-1">
              <span className="text-[10px] text-gray-400 font-bold block">رقم وتصنيف السند</span>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm text-gray-900 dark:text-white font-mono">{voucher.voucherNo}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  isReceipt 
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30' 
                    : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30'
                }`}>
                  {voucherTypeLabel}
                </span>
              </div>
            </div>

            {/* Box 2: Total amount */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-900/40 border border-slate-100 dark:border-zinc-850/60 space-y-1">
              <span className="text-[10px] text-gray-400 font-bold block">المبلغ الإجمالي المرقّم</span>
              <span className="font-black text-base text-emerald-600 dark:text-emerald-400 font-mono block">
                {formatOMR(voucher.amount)}
              </span>
            </div>

          </div>

          {/* Details list */}
          <div className="space-y-4">
            
            {/* Date field */}
            <div className="flex items-start gap-3 border-b border-gray-100 dark:border-zinc-850/50 pb-3">
              <Calendar className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
              <div className="space-y-1 flex-1">
                <span className="text-[10px] text-gray-400 font-bold block">تاريخ التحرير</span>
                <span className="text-xs font-bold text-gray-800 dark:text-zinc-200">
                  {voucher.date} <span className="text-[10px] text-gray-450 font-normal">({formatDate(voucher.date)})</span>
                </span>
              </div>
            </div>

            {/* Payer or Beneficiary field */}
            <div className="flex items-start gap-3 border-b border-gray-100 dark:border-zinc-850/50 pb-3">
              <User className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
              <div className="space-y-1 flex-1">
                <span className="text-[10px] text-gray-400 font-bold block">{personRoleLabel}</span>
                <span className="text-xs font-extrabold text-gray-900 dark:text-white">
                  {voucher.payerOrBeneficiary}
                </span>
              </div>
            </div>

            {/* Amount In Words field */}
            <div className="flex items-start gap-3 border-b border-gray-100 dark:border-zinc-850/50 pb-3">
              <DollarSign className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
              <div className="space-y-1 flex-1">
                <span className="text-[10px] text-gray-400 font-bold block">مبلغ وقدره بالأحرف (تفقيط عماني)</span>
                <span className="text-xs font-bold text-gray-800 dark:text-zinc-200 decoration-double underline">
                  {tafqeet(voucher.amount)}
                </span>
              </div>
            </div>

            {/* Payment Method field */}
            <div className="flex items-start gap-3 border-b border-gray-100 dark:border-zinc-850/50 pb-3">
              <HelpCircle className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
              <div className="space-y-1 flex-1">
                <span className="text-[10px] text-gray-400 font-bold block">طريقة الاستلام / التحصيل</span>
                <span className="text-xs font-bold text-gray-850 dark:text-zinc-150">
                  {voucher.paymentMethod || 'نقداً'}
                </span>
              </div>
            </div>

            {/* Description/Statement field */}
            <div className="flex items-start gap-3 border-b border-gray-100 dark:border-zinc-850/50 pb-3">
              <FileText className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
              <div className="space-y-1 flex-1">
                <span className="text-[10px] text-gray-400 font-bold block">بيان المعاملة المالية (وذلك عن)</span>
                <p className="text-xs text-gray-700 dark:text-gray-350 leading-relaxed font-semibold">
                  {voucher.description || 'بلا بيان أو تفاصيل إضافية'}
                </p>
              </div>
            </div>

            {/* Notes field if available */}
            {voucher.notes && (
              <div className="flex items-start gap-3 border-b border-gray-100 dark:border-zinc-850/50 pb-3">
                <FileText className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                <div className="space-y-1 flex-1">
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold block">ملاحظات سرية أو إدارية</span>
                  <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                    {voucher.notes}
                  </p>
                </div>
              </div>
            )}

            {/* Created At details */}
            {createdDateStr && (
              <div className="flex items-start gap-3 border-b border-gray-100 dark:border-zinc-850/50 pb-3">
                <Clock className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                <div className="space-y-1 flex-1">
                  <span className="text-[10px] text-gray-400 font-bold block">تاريخ ووقت تدوين السند بالنظام</span>
                  <span className="text-[11px] font-mono font-semibold text-gray-500 dark:text-gray-400">
                    {createdDateStr}
                  </span>
                </div>
              </div>
            )}

          </div>

          {/* Attachments Section */}
          <div className="pt-2">
            <h4 className="text-xs font-black text-gray-900 dark:text-white flex items-center gap-1.5 flex-row-reverse mb-3">
              <Paperclip className="w-4 h-4 text-[var(--primary-color)]" />
              المرفقات الثبوتية والمستندات المصاحبة
            </h4>

            {!voucher.attachments || voucher.attachments.length === 0 ? (
              <div className="p-4 bg-gray-50 dark:bg-zinc-900/30 rounded-xl border border-gray-150 dark:border-zinc-850/60 text-center text-xs text-gray-400">
                لا توجد مرفقات
              </div>
            ) : (
              <div className="space-y-2">
                {voucher.attachments.map((att) => (
                  <div 
                    key={att.id} 
                    className="p-3 bg-slate-50 dark:bg-zinc-900/40 rounded-xl border border-gray-100 dark:border-zinc-850/60 flex items-center justify-between gap-3 text-right flex-row-reverse"
                  >
                    {/* File metadata info */}
                    <div className="flex items-center gap-2.5 flex-row-reverse truncate">
                      <div className="p-2 bg-white dark:bg-zinc-950 rounded-lg text-gray-500 border border-gray-100 dark:border-zinc-850 shrink-0">
                        <Paperclip className="w-3.5 h-3.5" style={{ color: identity.primaryColor }} />
                      </div>
                      <div className="space-y-0.5 truncate">
                        <p className="text-xs font-extrabold text-gray-800 dark:text-zinc-200 truncate max-w-[200px] sm:max-w-[280px]" title={att.name}>
                          {att.name}
                        </p>
                        <p className="text-[9px] text-gray-400 font-mono">
                          {formatFileSize(att.size)} • {att.type || 'ملف غير معروف'}
                        </p>
                      </div>
                    </div>

                    {/* View/Open preview action button */}
                    <button
                      type="button"
                      onClick={() => handlePreviewAttachment(att)}
                      className={`p-1.5 px-3 flex items-center gap-1.5 text-xs font-bold bg-white dark:bg-zinc-950 text-gray-700 dark:text-gray-300 hover:text-[var(--primary-color)] border border-gray-200 dark:border-zinc-800 shadow-sm transition-all cursor-pointer ${btnRadius}`}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>معاينة</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Footer actions bar */}
        <div className="p-4 bg-gray-50 dark:bg-zinc-900/60 border-t border-gray-100 dark:border-zinc-800 flex justify-between items-center flex-row-reverse" dir="rtl">
          
          {/* Print & PDF Buttons */}
          <div className="flex items-center gap-2">
            
            {/* Print Button */}
            <button
              onClick={() => currentPermissions.printVoucher && onPrint(voucher)}
              disabled={!currentPermissions.printVoucher}
              title={!currentPermissions.printVoucher ? "غير مصرح لك بهذا الإجراء." : "طباعة السند"}
              className={`px-4 py-2 text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${btnRadius} ${
                !currentPermissions.printVoucher 
                  ? 'bg-emerald-600/45 text-emerald-200/60 cursor-not-allowed opacity-50' 
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
              }`}
            >
              <Printer className="w-4 h-4" />
              طباعة السند
            </button>

            {/* Export PDF Button */}
            <button
              onClick={() => currentPermissions.exportVoucherPDF && onPrint(voucher)}
              disabled={!currentPermissions.exportVoucherPDF}
              title={!currentPermissions.exportVoucherPDF ? "غير مصرح لك بهذا الإجراء." : "تصدير PDF"}
              className={`px-4 py-2 text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${btnRadius} ${
                !currentPermissions.exportVoucherPDF 
                  ? 'bg-blue-600/45 text-blue-200/60 cursor-not-allowed opacity-50' 
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
              }`}
            >
              <FileText className="w-4 h-4" />
              تصدير PDF
            </button>

            {/* Edit Button */}
            {(() => {
              const isEditPermitted = isReceipt ? !!currentPermissions.editReceipt : !!currentPermissions.editPayment;
              return (
                <button
                  onClick={() => {
                    if (isEditPermitted) {
                      onEdit(voucher);
                      onClose();
                    }
                  }}
                  disabled={!isEditPermitted}
                  title={!isEditPermitted ? "غير مصرح لك بهذا الإجراء." : "تعديل السند"}
                  className={`px-4 py-2 text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${btnRadius} ${
                    !isEditPermitted 
                      ? 'bg-amber-600/45 text-amber-200/60 cursor-not-allowed opacity-50' 
                      : 'bg-amber-600 hover:bg-amber-700 text-white shadow-sm'
                  }`}
                >
                  <Pencil className="w-4 h-4" />
                  تعديل السند
                </button>
              );
            })()}
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className={`px-4 py-2 text-xs font-bold bg-gray-200 dark:bg-zinc-800 hover:bg-gray-300 dark:hover:bg-zinc-700 text-gray-800 dark:text-gray-200 transition-all cursor-pointer ${btnRadius}`}
          >
            إغلاق
          </button>

        </div>

      </div>

      {/* Inline Preview Lightbox Modal */}
      {previewAttachment && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[60] animate-fade-in print:hidden">
          <div className="bg-white dark:bg-zinc-950 rounded-2xl max-w-3xl w-full border border-gray-250 dark:border-zinc-850/80 shadow-2xl flex flex-col max-h-[90vh]">
            
            {/* Preview Header */}
            <div className="p-4 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between flex-row-reverse text-right">
              <h3 className="text-xs font-black text-gray-900 dark:text-white truncate max-w-[80%]">
                معاينة المرفق: {previewAttachment.name}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setPreviewAttachment(null);
                  setPreviewDataUrl(null);
                  setPreviewError('');
                }}
                className="p-1.5 rounded-xl bg-gray-100 dark:bg-zinc-900 text-gray-500 hover:text-gray-900 dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content previewer body */}
            <div className="p-4 flex-1 overflow-auto flex items-center justify-center min-h-[300px] bg-slate-50 dark:bg-zinc-900/20">
              {loadingPreview ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="w-8 h-8 text-[var(--primary-color)] animate-spin" />
                  <span className="text-xs text-gray-400">جاري تحميل الملف...</span>
                </div>
              ) : previewError ? (
                <div className="text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/20 p-3 rounded-xl border border-rose-100 dark:border-rose-950/50">
                  {previewError}
                </div>
              ) : previewDataUrl ? (
                previewAttachment.name.toLowerCase().endsWith('.pdf') ? (
                  <iframe
                    src={previewDataUrl}
                    title="PDF Preview"
                    className="w-full h-[550px] rounded-xl border-0"
                  />
                ) : (
                  <img
                    src={previewDataUrl}
                    alt={previewAttachment.name}
                    className="max-w-full max-h-[550px] object-contain rounded-xl shadow-md"
                    referrerPolicy="no-referrer"
                  />
                )
              ) : (
                <span className="text-xs text-gray-400">تعذر تحميل بيانات المعاينة.</span>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
