/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { AttachmentMetadata, VisualIdentity } from '../types';
import { AttachmentStorageService } from './AttachmentStorageService';
import { Paperclip, Trash2, Eye, X, UploadCloud, AlertCircle, Loader2 } from 'lucide-react';

interface VoucherAttachmentsProps {
  attachments: AttachmentMetadata[];
  onChange: (attachments: AttachmentMetadata[]) => void;
  identity: VisualIdentity;
}

export default function VoucherAttachments({ attachments, onChange, identity }: VoucherAttachmentsProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Preview State
  const [previewAttachment, setPreviewAttachment] = useState<AttachmentMetadata | null>(null);
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 بابت';
    const k = 1024;
    const sizes = ['بايت', 'كيلوبايت', 'ميغابايت'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const validateAndAddFile = async (file: File) => {
    setErrorMsg('');
    
    // Check limit
    if (attachments.length >= 5) {
      setErrorMsg('⚠️ عذراً، الحد الأقصى للمرفقات هو 5 ملفات فقط لكل سند.');
      return;
    }

    // Check type
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.pdf'];
    const fileNameLower = file.name.toLowerCase();
    const isAllowed = allowedExtensions.some(ext => fileNameLower.endsWith(ext));
    
    if (!isAllowed) {
      setErrorMsg('⚠️ صيغة غير مدعومة. الصيغ المدعومة هي: JPG, JPEG, PNG, PDF.');
      return;
    }

    setUploading(true);
    try {
      const metadata = await AttachmentStorageService.saveAttachment(file);
      onChange([...attachments, metadata]);
    } catch (e) {
      setErrorMsg('❌ فشل تحميل الملف وحفظه في خزانة المرفقات.');
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      // Process only first file if multiple were selected, or add sequentially
      Array.from(selectedFiles).forEach(file => {
        validateAndAddFile(file as File);
      });
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      Array.from(files).forEach(file => {
        validateAndAddFile(file as File);
      });
    }
  };

  const handleRemove = async (id: string) => {
    try {
      await AttachmentStorageService.deleteAttachment(id);
      onChange(attachments.filter(att => att.id !== id));
      if (previewAttachment?.id === id) {
        setPreviewAttachment(null);
        setPreviewDataUrl(null);
      }
    } catch (e) {
      setErrorMsg('❌ فشل إزالة الملف من الذاكرة.');
    }
  };

  const handlePreview = async (att: AttachmentMetadata) => {
    setLoadingPreview(true);
    setPreviewAttachment(att);
    setPreviewDataUrl(null);
    try {
      const data = await AttachmentStorageService.getAttachmentData(att.id);
      setPreviewDataUrl(data);
    } catch (e) {
      setErrorMsg('❌ تعذر تحميل المرفق للمعاينة.');
      setPreviewAttachment(null);
    } finally {
      setLoadingPreview(false);
    }
  };

  return (
    <div className="space-y-4 text-right mt-6" id="voucher-attachments-section">
      <div className="border-t border-gray-100 dark:border-zinc-850 pt-4">
        <h4 className="text-xs font-black text-gray-900 dark:text-white flex items-center gap-1.5 flex-row-reverse mb-1">
          <Paperclip className="w-4 h-4 text-[var(--primary-color)]" />
          مرفقات السند الثبوتية (اختياري)
        </h4>
        <p className="text-[10px] text-gray-400 font-medium">
          يمكنك إرفاق حتى 5 ملفات (صور أو مستندات PDF) بحد أقصى لدعم وتوثيق مستند الصرف أو القبض مالياً.
        </p>
      </div>

      {errorMsg && (
        <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-amber-800 dark:text-amber-400 text-[10px] rounded-xl flex items-center gap-2 flex-row-reverse">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-500" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Drag & Drop Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2.5 ${
          isDragging 
            ? 'border-emerald-500 bg-emerald-500/5 dark:bg-emerald-500/10' 
            : 'border-blue-200/50 dark:border-zinc-800 hover:border-[var(--primary-color)] hover:bg-slate-50/50 dark:hover:bg-zinc-900/30'
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".jpg,.jpeg,.png,.pdf"
          multiple
          className="hidden"
        />
        
        {uploading ? (
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
        ) : (
          <UploadCloud className="w-8 h-8 text-gray-400 dark:text-zinc-500" />
        )}
        
        <div className="space-y-1 select-none">
          <p className="text-xs font-black text-gray-700 dark:text-gray-300">
            {uploading ? 'جاري رفع وحفظ الملف...' : 'اسحب وأفلت الملف هنا، أو انقر للتصفح'}
          </p>
          <p className="text-[10px] text-gray-400">
            JPG, JPEG, PNG, PDF (الحد الأقصى 5 ملفات)
          </p>
        </div>
      </div>

      {/* Attachments List */}
      {attachments.length > 0 && (
        <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
          {attachments.map((att) => {
            const isPdf = att.name.toLowerCase().endsWith('.pdf');
            return (
              <div 
                key={att.id} 
                className="p-2.5 bg-slate-100/60 dark:bg-zinc-900/40 rounded-xl border border-gray-100 dark:border-zinc-850 flex items-center justify-between gap-3 text-right flex-row-reverse"
              >
                {/* File info */}
                <div className="flex items-center gap-2.5 flex-row-reverse">
                  <div className="p-2 bg-white dark:bg-zinc-950 rounded-lg text-gray-500 border border-gray-100 dark:border-zinc-850 shrink-0">
                    <Paperclip className="w-4 h-4 text-[var(--primary-color)]" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs font-extrabold text-gray-800 dark:text-zinc-200 truncate max-w-[200px] sm:max-w-[320px]" title={att.name}>
                      {att.name}
                    </p>
                    <p className="text-[9px] text-gray-400 font-mono">
                      {formatFileSize(att.size)}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5">
                  {/* Preview Button */}
                  <button
                    type="button"
                    onClick={() => handlePreview(att)}
                    className="p-1.5 rounded-lg bg-white dark:bg-zinc-950 text-gray-500 hover:text-[var(--primary-color)] border border-gray-100 dark:border-zinc-850 shadow-sm transition-all cursor-pointer"
                    title="معاينة المرفق"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>

                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={() => handleRemove(att.id)}
                    className="p-1.5 rounded-lg bg-rose-500/10 text-rose-600 hover:bg-rose-500 hover:text-white border border-rose-500/10 transition-all cursor-pointer"
                    title="حذف المرفق"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Inline Preview Lightbox Modal */}
      {previewAttachment && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in print:hidden">
          <div className="bg-white dark:bg-zinc-950 rounded-2xl max-w-3xl w-full border border-gray-200 dark:border-zinc-850 shadow-2xl flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-4 border-b border-gray-100 dark:border-zinc-850 flex items-center justify-between flex-row-reverse text-right">
              <h3 className="text-xs font-black text-gray-900 dark:text-white truncate max-w-[80%]">
                معاينة المرفق: {previewAttachment.name}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setPreviewAttachment(null);
                  setPreviewDataUrl(null);
                }}
                className="p-1.5 rounded-xl bg-gray-100 dark:bg-zinc-900 text-gray-500 hover:text-gray-900 dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content preview */}
            <div className="p-4 flex-1 overflow-auto flex items-center justify-center min-h-[300px] bg-slate-50 dark:bg-zinc-900/20">
              {loadingPreview ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="w-8 h-8 text-[var(--primary-color)] animate-spin" />
                  <span className="text-xs text-gray-400">جاري تحميل الملف...</span>
                </div>
              ) : previewDataUrl ? (
                previewAttachment.name.toLowerCase().endsWith('.pdf') ? (
                  /* PDF previewer inside sandbox safe iframe */
                  <iframe
                    src={previewDataUrl}
                    title="PDF Preview"
                    className="w-full h-[550px] rounded-xl border-0"
                  />
                ) : (
                  /* Image previewer */
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
