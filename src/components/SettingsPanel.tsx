/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { DatabaseService } from '../db';
import { VisualIdentity, YearlyArchive, Voucher, AppDatabase, EmployeePermissions, AutoBackupSnapshot } from '../types';
import { formatOMR, formatDate, restoreLatestInternalAutoBackup, deleteInternalAutoBackups } from '../utils';
import { Settings, UserPlus, CreditCard, Trash2, Edit2, ShieldAlert, Check, RefreshCw, Upload, Download, AlertTriangle, X, Sparkles, History, Calendar, FolderOpen, HelpCircle, Shield, RotateCcw, Save, ShieldCheck, Eye, Printer, FileText, FileSpreadsheet, Paperclip, Sliders, Database, RotateCw, BarChart2 } from 'lucide-react';
import { AttachmentStorageService } from './AttachmentStorageService';
import Logo from './Logo';

interface SettingsPanelProps {
  onDatabaseReseted: () => void;
  identity: VisualIdentity;
  onIdentityUpdate: (newConfig: VisualIdentity) => void;
  currentVersion: string;
  updateState: {
    updateAvailable: boolean;
    latestVersion: string;
    downloadUrl: string;
    releaseNotes?: string;
    checkedAt?: string;
    history?: { version: string; date: string; notes: string }[];
  } | null;
  isCheckingUpdates: boolean;
  updateError: string | null;
  onCheckUpdates: () => Promise<void>;
  isVersionNewer: (current: string, latest: string) => boolean;
  ignoredVersion: string;
  onIgnoreVersion: (version: string) => void;
  onResetIgnoreVersion: () => void;
  isManagerMode?: boolean;
  currentPermissions?: EmployeePermissions;
  onExportPDF?: () => void;
  onExportExcel?: () => void;
  onOpenBackupReminder?: () => void;
}

const DEFAULT_PERMISSIONS: EmployeePermissions = {
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
  showMainDashboard: true,
  checkUpdates: false,
  managePermissions: false
};

export default function SettingsPanel({ 
  onDatabaseReseted, 
  identity, 
  onIdentityUpdate,
  currentVersion,
  updateState,
  isCheckingUpdates,
  updateError,
  onCheckUpdates,
  isVersionNewer,
  ignoredVersion,
  onIgnoreVersion,
  onResetIgnoreVersion,
  isManagerMode = false,
  currentPermissions,
  onExportPDF,
  onExportExcel,
  onOpenBackupReminder
}: SettingsPanelProps) {
  // Database States
  const [payers, setPayers] = useState<string[]>(() => DatabaseService.getPayers());
  const [methods, setMethods] = useState<string[]>(() => DatabaseService.getPaymentMethods());

  // Determine if active user has manual backup section access
  const hasBackupAccess = isManagerMode || !!currentPermissions?.exportBackup || !!currentPermissions?.exportFilteredPDF;

  // Local backup status state so we can re-render immediately on manual JSON backup export
  const [backupStatus, setBackupStatus] = useState(() => {
    const lastDate = localStorage.getItem('lastManualBackupDate');
    const lastType = localStorage.getItem('lastManualBackupType');
    const lastFile = localStorage.getItem('lastManualBackupFileName');
    return { lastDate, lastType, lastFile };
  });

  // Helper to trigger instant status refresh when we perform backup actions
  const refreshLocalBackupStatus = () => {
    setBackupStatus({
      lastDate: localStorage.getItem('lastManualBackupDate'),
      lastType: localStorage.getItem('lastManualBackupType'),
      lastFile: localStorage.getItem('lastManualBackupFileName')
    });
  };

  const [internalAutoBackups, setInternalAutoBackups] = useState<AutoBackupSnapshot[]>(() => {
    try {
      const saved = localStorage.getItem('internalAutoBackupSnapshots');
      return saved ? JSON.parse(saved) : [];
    } catch (_) {
      return [];
    }
  });

  const refreshInternalAutoBackups = () => {
    try {
      const saved = localStorage.getItem('internalAutoBackupSnapshots');
      setInternalAutoBackups(saved ? JSON.parse(saved) : []);
    } catch (_) {
      setInternalAutoBackups([]);
    }
  };

  const handleRestoreLatestInternal = async () => {
    if (internalAutoBackups.length === 0) {
      showToast('⚠️ لا توجد نسخ احتياطية تلقائية داخلية متوفرة للاسترجاع.');
      return;
    }
    
    const confirmMessage = 'هل أنت متأكد من رغبتك في استعادة آخر نسخة تلقائية داخلية؟ سيتم استبدال البيانات الحالية بالكامل بالبيانات المحفوظة في تلك النسخة.';
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      const res = await restoreLatestInternalAutoBackup();
      if (res.success) {
        setPayers(DatabaseService.getPayers());
        setMethods(DatabaseService.getPaymentMethods());
        setArchives(DatabaseService.getYearlyArchives());
        setBackups(DatabaseService.getBackups());
        onDatabaseReseted(); // Trigger parent refresh of variables
        showToast('♻️ تم استيراد واستعادة قاعدة البيانات بنجاح من النسخة التلقائية الداخلية.');
      } else {
        showToast(`❌ ${res.error || 'فشلت عملية استعادة النسخة التلقائية الداخلية.'}`);
      }
    } catch (err: any) {
      showToast(`❌ فشل استعادة النسخة التلقائية الداخلية: ${err.message || 'خطأ غير معروف'}`);
    }
  };

  const handleDeleteInternalSnapshots = () => {
    const confirmMessage = 'هل أنت متأكد من رغبتك في حذف جميع النسخ التلقائية الداخلية؟ هذا الإجراء لا يمكن التراجع عنه.';
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      deleteInternalAutoBackups();
      refreshInternalAutoBackups();
      showToast('🗑️ تم حذف جميع النسخ التلقائية الداخلية بنجاح.');
    } catch (err: any) {
      showToast(`❌ فشل حذف النسخ التلقائية الداخلية: ${err.message || 'خطأ غير معروف'}`);
    }
  };

  const handleExportPDFClick = () => {
    if (onExportPDF) {
      onExportPDF();
      // Periodically refresh the status card in case the PDF was generated/downloaded
      setTimeout(refreshLocalBackupStatus, 1000);
      setTimeout(refreshLocalBackupStatus, 3000);
      setTimeout(refreshLocalBackupStatus, 7000);
    }
  };

  const handleExportExcelClick = () => {
    if (onExportExcel) {
      onExportExcel();
      // Excel is generated instantly in the browser, so we refresh status immediately
      setTimeout(refreshLocalBackupStatus, 500);
      setTimeout(refreshLocalBackupStatus, 1500);
    }
  };

  // Permissions settings state & handlers
  const [permissions, setPermissions] = useState<EmployeePermissions>(() => {
    const saved = localStorage.getItem('sur_employee_permissions');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return { ...DEFAULT_PERMISSIONS, ...parsed };
      } catch (e) {
        return DEFAULT_PERMISSIONS;
      }
    }
    return DEFAULT_PERMISSIONS;
  });

  const handleTogglePermission = (key: keyof EmployeePermissions) => {
    setPermissions(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSavePermissions = () => {
    localStorage.setItem('sur_employee_permissions', JSON.stringify(permissions));
    showToast('🔒 تم حفظ صلاحيات الموظفين بنجاح وتفعيلها في وضع الموظف.');
  };

  const handleRestoreDefaultPermissions = () => {
    setPermissions(DEFAULT_PERMISSIONS);
    localStorage.setItem('sur_employee_permissions', JSON.stringify(DEFAULT_PERMISSIONS));
    showToast('♻️ تم استعادة صلاحيات الموظفين الافتراضية.');
  };

  // Input states
  const [newPayer, setNewPayer] = useState('');
  const [editingPayer, setEditingPayer] = useState<string | null>(null);
  const [editPayerVal, setEditPayerVal] = useState('');

  const [newMethod, setNewMethod] = useState('');
  const [editingMethod, setEditingMethod] = useState<string | null>(null);
  const [editMethodVal, setEditMethodVal] = useState('');

  // Custom confirmation modal states (avoiding window.confirm iframe blocks)
  const [payerToDelete, setPayerToDelete] = useState<string | null>(null);
  const [methodToDelete, setMethodToDelete] = useState<string | null>(null);
  const [pendingBackupJson, setPendingBackupJson] = useState<string | null>(null);

  // Download Progress and History Modal states
  const [isPreparingDownload, setIsPreparingDownload] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [hasManuallyChecked, setHasManuallyChecked] = useState(false);
  const [justDownloadedVersion, setJustDownloadedVersion] = useState<string | null>(null);

  // Backup reminder states
  const [backupReminderEnabled, setBackupReminderEnabled] = useState<boolean>(() => {
    try {
      const val = localStorage.getItem('backupReminderEnabled');
      return val !== null ? val === 'true' : true;
    } catch (e) {
      return true;
    }
  });

  const [backupReminderDays, setBackupReminderDays] = useState<number[]>(() => {
    try {
      const val = localStorage.getItem('backupReminderDays');
      return val ? JSON.parse(val) : [0, 4];
    } catch (e) {
      return [0, 4];
    }
  });

  // Warnings / Confirms
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showResetDoubleConfirm, setShowResetDoubleConfirm] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  // Fiscal Year Archive state variables
  const [archives, setArchives] = useState<YearlyArchive[]>(() => DatabaseService.getYearlyArchives());
  const [selectedArchive, setSelectedArchive] = useState<YearlyArchive | null>(null);
  const [fiscalYearInput, setFiscalYearInput] = useState(() => new Date().getFullYear().toString());
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [showArchiveDoubleConfirm, setShowArchiveDoubleConfirm] = useState(false);
  const [archiveErrorMsg, setArchiveErrorMsg] = useState('');
  const [archiveSearchTerm, setArchiveSearchTerm] = useState('');
  const [archiveVoucherTypeFilter, setArchiveVoucherTypeFilter] = useState<'all' | 'receipt' | 'payment'>('all');

  // Auto-backup state variables
  const [backups, setBackups] = useState<any[]>(() => DatabaseService.getBackups());
  const [selectedBackupToRestore, setSelectedBackupToRestore] = useState<any | null>(null);
  const [typedConfirmRestore, setTypedConfirmRestore] = useState('');
  const [restoreErrorMsg, setRestoreErrorMsg] = useState('');
  const [typedConfirmImport, setTypedConfirmImport] = useState('');

  const showDownloadButton = 
    hasManuallyChecked && 
    !isCheckingUpdates && 
    !updateError && 
    updateState !== null && 
    updateState.updateAvailable && 
    isVersionNewer(currentVersion, updateState.latestVersion) && 
    !!updateState.downloadUrl &&
    localStorage.getItem('sur_finance_downloaded_update_version') !== updateState.latestVersion &&
    justDownloadedVersion !== updateState.latestVersion;

  const showDownloadedMessage = 
    updateState !== null && 
    updateState.updateAvailable && 
    isVersionNewer(currentVersion, updateState.latestVersion) && 
    (localStorage.getItem('sur_finance_downloaded_update_version') === updateState.latestVersion || justDownloadedVersion === updateState.latestVersion);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 2500);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      showToast('⚠️ يرجى اختيار ملف صورة صالح بصيغة PNG أو JPG أو JPEG.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 250; // a logo is tiny, 250px is plenty and highly efficient
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          try {
            const resizedBase64 = canvas.toDataURL('image/png');
            const updated = { ...identity, customLogo: resizedBase64 };
            DatabaseService.saveVisualIdentity(updated);
            onIdentityUpdate(updated);
            showToast('🎨 تم رفع الشعار المخصص وحفظه بنجاح!');
          } catch (err) {
            console.error('Error processing logo image', err);
            showToast('⚠️ خطأ أثناء معالجة وحفظ الصورة.');
          }
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleLogoRemove = () => {
    const updated = { ...identity };
    delete updated.customLogo; // remove the property completely
    DatabaseService.saveVisualIdentity(updated);
    onIdentityUpdate(updated);
    showToast('✨ تم إزالة الشعار المخصص والعودة للشعار الافتراضي.');
  };

  const handleArchiveFiscalYear = () => {
    if (!fiscalYearInput.trim()) {
      setArchiveErrorMsg('الرجاء إدخال اسم أو سنة مالية صالحة لإغلاقها');
      return;
    }
    
    // Check if there are active receipts/expenses to archive
    const dbVouchers = DatabaseService.getVouchers();
    if (dbVouchers.length === 0) {
      setArchiveErrorMsg('عذراً، قاعدة البيانات الحالية لا تحتوي على أي سندات نشطة لأرشفتها.');
      return;
    }

    // 1. Create auto-backup BEFORE archiving
    const backupResult = DatabaseService.createBackup(fiscalYearInput);
    if (!backupResult.success) {
      setArchiveErrorMsg(backupResult.error || 'فشل إنشاء النسخة الاحتياطية التلقائية لحماية البيانات. تم إيقاف عملية الأرشفة.');
      return;
    }

    // 2. Perform archiving and resetting of active transactions
    const result = DatabaseService.archiveFiscalYear(fiscalYearInput);
    if (result.success) {
      showToast('💾 تم إنشاء نسخة احتياطية بنجاح قبل الترحيل. | Backup created successfully.');
      setTimeout(() => {
        showToast(`🎉 تم إغلاق السنة المالية ${fiscalYearInput} وأرشفتها بنجاح.`);
      }, 1000);
      
      const updatedArchives = DatabaseService.getYearlyArchives();
      setArchives(updatedArchives);
      setBackups(DatabaseService.getBackups());
      
      setShowArchiveConfirm(false);
      setShowArchiveDoubleConfirm(false);
      setArchiveErrorMsg('');
      
      // Increment year
      const nextYear = parseInt(fiscalYearInput, 10);
      if (!isNaN(nextYear)) {
        setFiscalYearInput((nextYear + 1).toString());
      }

      onDatabaseReseted();
    } else {
      setArchiveErrorMsg(result.error || 'فشلت عملية الأرشفة وتصفير العام المالي');
    }
  };

  const handleToggleAlertOnDuplicate = () => {
    const updated: VisualIdentity = {
      ...identity,
      alertOnDuplicateVoucherNo: !identity.alertOnDuplicateVoucherNo
    };
    DatabaseService.saveVisualIdentity(updated);
    onIdentityUpdate(updated);
    showToast(updated.alertOnDuplicateVoucherNo ? '🔔 تم تفعيل خيار فحص السندات المكررة' : '🔕 تم إلغاء تفعيل خيار الحماية');
  };

  // Payers Actions
  const handleAddPayer = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newPayer.trim();
    if (!name) return;
    if (payers.includes(name)) {
      showToast('⚠️ هذا الاسم موجود بالفعل في سجلات الدافعين');
      return;
    }
    DatabaseService.addPayer(name);
    setPayers(DatabaseService.getPayers());
    setNewPayer('');
    showToast('✅ تم إضافة اسم الدافع بنجاح');
  };

  const handleStartEditPayer = (p: string) => {
    setEditingPayer(p);
    setEditPayerVal(p);
  };

  const handleSavePayerEdit = () => {
    if (!editingPayer) return;
    const cleanProposed = editPayerVal.trim();
    if (!cleanProposed) return;
    if (cleanProposed !== editingPayer && payers.includes(cleanProposed)) {
      showToast('⚠️ هذا الاسم مسجل بالفعل لشخص آخر');
      return;
    }
    DatabaseService.updatePayer(editingPayer, cleanProposed);
    setPayers(DatabaseService.getPayers());
    setEditingPayer(null);
    showToast('✅ تم تحديث اسم الفاضل/الدافع بنجاح');
  };

  const handleDeletePayer = (p: string) => {
    setPayerToDelete(p);
  };

  const confirmDeletePayer = () => {
    if (!payerToDelete) return;
    DatabaseService.deletePayer(payerToDelete);
    setPayers(DatabaseService.getPayers());
    setPayerToDelete(null);
    showToast('🗑️ تم إزالة اسم الدافع من القائمة المتاحة');
  };

  // Payment Methods Actions
  const handleAddMethod = (e: React.FormEvent) => {
    e.preventDefault();
    const m = newMethod.trim();
    if (!m) return;
    if (methods.includes(m)) {
      showToast('⚠️ طريقة الدفع هذه موجودة بالفعل مسبقاً');
      return;
    }
    DatabaseService.addPaymentMethod(m);
    setMethods(DatabaseService.getPaymentMethods());
    setNewMethod('');
    showToast('✅ تم إضافة طريقة الدفع بنجاح');
  };

  const handleStartEditMethod = (m: string) => {
    setEditingMethod(m);
    setEditMethodVal(m);
  };

  const handleSaveMethodEdit = () => {
    if (!editingMethod) return;
    const cleanProposed = editMethodVal.trim();
    if (!cleanProposed) return;
    if (cleanProposed !== editingMethod && methods.includes(cleanProposed)) {
      showToast('⚠️ طريقة الدفع هذه مكررة');
      return;
    }
    DatabaseService.updatePaymentMethod(editingMethod, cleanProposed);
    setMethods(DatabaseService.getPaymentMethods());
    setEditingMethod(null);
    showToast('✅ تم تعديل طريقة الدفع المقيدة');
  };

  const handleDeleteMethod = (m: string) => {
    if (methods.length <= 1) {
      showToast('⚠️ يجب الإبقاء على طريقة دفع واحدة على الأقل في النظام المالي');
      return;
    }
    setMethodToDelete(m);
  };

  const confirmDeleteMethod = () => {
    if (!methodToDelete) return;
    DatabaseService.deletePaymentMethod(methodToDelete);
    setMethods(DatabaseService.getPaymentMethods());
    setMethodToDelete(null);
    showToast('🗑️ تم إزالة طريقة الصرف والقيمة المرجعية');
  };

  const formatDateForFilename = (date: Date) => {
    const pad = (n: number) => String(n).padStart(2, '0');
    const yyyy = date.getFullYear();
    const mm = pad(date.getMonth() + 1);
    const dd = pad(date.getDate());
    const hh = pad(date.getHours());
    const min = pad(date.getMinutes());
    return `${yyyy}-${mm}-${dd}_${hh}-${min}`;
  };

  // Export any given AppDatabase as a file
  const downloadBackupFile = (data: any, filename: string) => {
    const stringified = JSON.stringify(data, null, 2);
    const blob = new Blob([stringified], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Export Full JSON database to Client's computer file
  const handleBackupExport = async () => {
    try {
      const db = DatabaseService.getDatabase() as any;
      const media = await AttachmentStorageService.exportAll();
      db.attachments_media_folder = media;
      
      const filename = `SurVolunteer_Backup_${formatDateForFilename(new Date())}.json`;
      downloadBackupFile(db, filename);
      showToast('💾 تم تصدير نسخة احتياطية خارجية بنجاح!');

      localStorage.setItem('lastManualBackupDate', Date.now().toString());
      localStorage.setItem('lastManualBackupType', 'JSON');
      localStorage.setItem('lastManualBackupFileName', filename);
      localStorage.setItem('lastBackupCompletedDate', Date.now().toString());

      refreshLocalBackupStatus();
    } catch (e) {
      showToast('❌ تعذر إعداد ملف النسخة الإحتياطية');
    }
  };

  // Export specific automatic backup as file
  const handleExportAutoBackup = (bak: any) => {
    try {
      if (!bak.dbSnapshot) {
        showToast('⚠️ البيانات المرجعية للنسخة الاحتياطية غير متوفرة');
        return;
      }
      const filename = `SurVolunteer_Backup_${formatDateForFilename(new Date(bak.createdAt))}.json`;
      downloadBackupFile(bak.dbSnapshot, filename);
      showToast('💾 تم تصدير النسخة الاحتياطية المحددة كملف خارجي بنجاح!');
    } catch (e) {
      showToast('❌ تعذر تصدير النسخة الاحتياطية المحددة');
    }
  };

  // Restore JSON database uploaded by Client
  const handleBackupRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        
        // Quick structural check
        const missingFields: string[] = [];
        if (!parsed || typeof parsed !== 'object') {
          showToast('❌ الملف ليس كائناً برمجياً صالحاً (Invalid JSON object).');
          return;
        }
        if (!('vouchers' in parsed) || !Array.isArray(parsed.vouchers)) missingFields.push('vouchers');
        if (!('yearlyArchives' in parsed) || !Array.isArray(parsed.yearlyArchives)) missingFields.push('yearlyArchives');
        if (!('payersList' in parsed) || !Array.isArray(parsed.payersList)) missingFields.push('payersList');
        if (!('paymentMethods' in parsed) || !Array.isArray(parsed.paymentMethods)) missingFields.push('paymentMethods');
        if (!('visualIdentity' in parsed) || typeof parsed.visualIdentity !== 'object') missingFields.push('visualIdentity');

        if (missingFields.length > 0) {
          showToast(`❌ الملف المرفوع غير صالح. الحقول المفقودة: ${missingFields.join(', ')}`);
          return;
        }

        setPendingBackupJson(text);
        setTypedConfirmImport('');
      } catch (err) {
        showToast('❌ تعذر قراءة الملف المرفوع - قد يكون معطوباً أو بتنسيق خاطئ');
      }
    };
    reader.readAsText(file);
    // Clear input so the change handler can fire if selecting same file again
    e.target.value = '';
  };

  const confirmBackupRestore = async () => {
    if (!pendingBackupJson) return;
    if (typedConfirmImport.trim() !== 'IMPORT') {
      showToast('⚠️ يرجى كتابة كلمة IMPORT بدقة للتأكيد');
      return;
    }
    try {
      const parsed = JSON.parse(pendingBackupJson);
      
      // Import attachments first if they exist in the file!
      if (parsed.attachments_media_folder) {
        await AttachmentStorageService.importAll(parsed.attachments_media_folder);
      }

      const result = DatabaseService.importDatabase(pendingBackupJson, true);
      if (result.success) {
        setPayers(DatabaseService.getPayers());
        setMethods(DatabaseService.getPaymentMethods());
        setArchives(DatabaseService.getYearlyArchives());
        setBackups(DatabaseService.getBackups());
        onDatabaseReseted(); // Trigger parent refresh of variables
        setPendingBackupJson(null);
        setTypedConfirmImport('');
        showToast('♻️ تم استيراد واستعادة قاعدة البيانات بنجاح من الملف الخارجي.');
      } else {
        showToast(`❌ ${result.error || 'فشل فك وقراءة ملف النسخة المالية الاحتياطية'}`);
      }
    } catch (err: any) {
      showToast(`❌ فشل استيراد قاعدة البيانات: ${err.message || 'خطأ غير معروف'}`);
    }
  };

  // Reset core database to default (Hard reset)
  const handleHardReset = async () => {
    await AttachmentStorageService.clearAll();
    DatabaseService.resetDatabase();
    setPayers(DatabaseService.getPayers());
    setMethods(DatabaseService.getPaymentMethods());
    setShowResetConfirm(false);
    setShowResetDoubleConfirm(false);
    onDatabaseReseted();
    showToast('🔄 تم تصفير قاعدة البيانات وإعادتها لحالة الصفر الرسمية');
  };

  const handleRestoreBackup = (backupId: string) => {
    const backup = backups.find(b => b.id === backupId);
    if (!backup) return;
    setSelectedBackupToRestore(backup);
    setTypedConfirmRestore('');
    setRestoreErrorMsg('');
  };

  const confirmRestoreBackup = () => {
    if (!selectedBackupToRestore) return;
    if (typedConfirmRestore.trim().toUpperCase() !== 'RESTORE') {
      setRestoreErrorMsg('يرجى كتابة كلمة RESTORE بدقة للتأكيد.');
      return;
    }

    const res = DatabaseService.restoreFromBackup(selectedBackupToRestore.id);
    if (res.success) {
      showToast('🎉 تم استعادة قاعدة البيانات بنجاح من النسخة الاحتياطية.');
      setSelectedBackupToRestore(null);
      setTypedConfirmRestore('');
      setRestoreErrorMsg('');
      
      // Refresh component local state
      setArchives(DatabaseService.getYearlyArchives());
      setBackups(DatabaseService.getBackups());
      setPayers(DatabaseService.getPayers());
      setMethods(DatabaseService.getPaymentMethods());
      
      // Trigger parent app reload
      onDatabaseReseted();
    } else {
      setRestoreErrorMsg(res.error || 'فشلت عملية الاستعادة.');
    }
  };

  const handleDeleteBackup = (backupId: string) => {
    const res = DatabaseService.deleteBackup(backupId);
    if (res.success) {
      showToast('🗑️ تم حذف النسخة الاحتياطية بنجاح.');
      setBackups(DatabaseService.getBackups());
    }
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
    <div className="space-y-6 text-right" id="settings-panel">
      
      {/* Intro */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-100 dark:border-zinc-800 pb-5">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-[var(--primary-color)] animate-spin-slow" />
            قسم الإعدادات والتحشيد المالي
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            إدارة البيانات الثابتة للنظام، ضبط الدافعين المعتمدين وطرق الدفع، مع تصفير كامل وعمليات حفظ واستعادة البيانات.
          </p>
        </div>
        
        {toastMsg && (
          <span className="text-xs bg-slate-50 dark:bg-zinc-900 text-gray-800 dark:text-gray-200 px-3.5 py-2 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm transition-all animate-fade-in font-semibold">
            {toastMsg}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Windows Update Check Segment */}
        <div className={`lg:col-span-12 p-6 ${cardStyleClass} space-y-4`} id="updates-section">
          <div className="flex items-center gap-2 border-b border-gray-100 dark:border-zinc-800/60 pb-3 flex-row-reverse text-right">
            <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
            <div>
              <h3 className="text-sm font-black text-gray-800 dark:text-gray-150">تحديثات النظام وتطوير الخزينة المطور</h3>
              <p className="text-[10px] text-gray-400 mt-0.5">التحقق المباشر من وجود إصلاحات أمان وميزات محاسبية جديدة من الخادم المعتمد.</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-right" dir="rtl">
            
            {/* Version Information details */}
            <div className="p-4 rounded-xl bg-slate-50/50 dark:bg-zinc-900/40 border border-gray-100 dark:border-zinc-800 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-gray-500">الإصدار الحالي المثبت:</span>
                  <span className="font-mono text-xs font-extrabold bg-[var(--primary-color)]/10 text-[var(--primary-color)] px-2.5 py-1 rounded-lg" style={{ color: identity.primaryColor, backgroundColor: `${identity.primaryColor}15` }}>
                    v{currentVersion}
                  </span>
                </div>

                <div className="text-xs space-y-2 border-t border-gray-100 dark:border-zinc-800/80 pt-2.5">
                  <div className="flex justify-between text-gray-600 dark:text-gray-300">
                    <span className="text-gray-400">بنية التطبيق المكتبي:</span>
                    <span className="font-semibold text-gray-800 dark:text-gray-100">Windows (Electron Client)</span>
                  </div>
                  <div className="flex justify-between text-gray-600 dark:text-gray-300">
                    <span className="text-gray-400">تاريخ آخر فحص مالي:</span>
                    <span className="font-mono text-gray-700 dark:text-zinc-300">{updateState?.checkedAt || 'لم يتم الفحص بعد'}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <button
                  type="button"
                  disabled={isCheckingUpdates}
                  onClick={async () => {
                    setJustDownloadedVersion(null);
                    await onCheckUpdates();
                    setHasManuallyChecked(true);
                  }}
                  className={`w-full py-2 px-4 text-xs font-black text-white hover:opacity-95 transition-all flex items-center justify-center gap-2 cursor-pointer ${btnRadius}`}
                  style={{ backgroundColor: identity.primaryColor }}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isCheckingUpdates ? 'animate-spin' : ''}`} />
                  {isCheckingUpdates ? 'جاري التحقق من المخدم...' : 'التحقق يدويًا من وجود تحديثات'}
                </button>

                <button
                  type="button"
                  onClick={() => setShowHistoryModal(true)}
                  className="w-full py-1.5 px-3 text-[11px] font-bold text-gray-700 dark:text-gray-200 bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-750 border border-gray-200 dark:border-zinc-700/50 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <History className="w-3.5 h-3.5 text-blue-500" />
                  عرض سجل التحديثات والترقيات السابقة
                </button>
              </div>
            </div>

            {/* Dynamic Card for showing update Status strictly without developer inputs */}
            <div className="flex flex-col justify-between p-4 rounded-xl bg-slate-50/50 dark:bg-zinc-900/40 border border-gray-100 dark:border-zinc-800 space-y-4">
              <div>
                <span className="text-xs font-bold text-gray-500 block mb-2">حالة التحديث (Update Status):</span>
                {isCheckingUpdates ? (
                  <div className="p-3 bg-blue-500/5 border border-blue-500/10 rounded-xl flex items-center gap-3">
                    <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
                    <span className="text-xs font-bold text-gray-700 dark:text-gray-250">جاري فحص الإصدار من السيرفر...</span>
                  </div>
                ) : !hasManuallyChecked ? (
                  <div className="p-3 bg-blue-500/5 border border-blue-500/10 rounded-xl flex items-center gap-2 text-blue-600">
                    <HelpCircle className="w-4 h-4 text-blue-500" />
                    <span className="text-xs font-bold text-blue-700 dark:text-blue-400">اضغط على زر التحقق أعلاه لفحص التحديثات المتاحة.</span>
                  </div>
                ) : updateError && !updateState ? (
                  <div className="p-3 bg-red-500/5 border border-red-500/10 rounded-xl flex items-center gap-2 text-red-500">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span className="text-xs font-bold">تعذر التحقق من التحديثات حالياً</span>
                  </div>
                ) : updateState && updateState.updateAvailable && isVersionNewer(currentVersion, updateState.latestVersion) && updateState.downloadUrl ? (
                  <div className="p-3 bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-2 text-amber-600 dark:text-amber-400">
                    <AlertTriangle className="w-4 h-4 shrink-0 animate-bounce" />
                    <span className="text-xs font-black">يتوفر ميزات جديدة (إصدار v{updateState.latestVersion})</span>
                  </div>
                ) : (
                  <div className="p-3 bg-emerald-500/5 border border-emerald-500/15 rounded-xl flex items-center gap-2 text-emerald-600">
                    <Check className="w-4 h-4" />
                    <span className="text-xs font-extrabold text-emerald-800 dark:text-emerald-400">التطبيق يعمل بأحدث إصدار محاسبي</span>
                  </div>
                )}
              </div>

              {/* Release Notes Segment */}
              {hasManuallyChecked && !isCheckingUpdates && !updateError && updateState && updateState.updateAvailable && isVersionNewer(currentVersion, updateState.latestVersion) && updateState.releaseNotes && (
                <div className="space-y-1">
                  <span className="text-xs font-bold text-gray-500 block">ملاحظات الإصدار (Release Notes):</span>
                  <p className="text-[10.5px] leading-relaxed text-gray-600 dark:text-gray-300 font-sans max-h-24 overflow-y-auto bg-white/45 dark:bg-zinc-950/45 p-2.5 rounded-lg border border-gray-150/40 dark:border-zinc-800/40 scrollbar-thin">
                    {updateState.releaseNotes}
                  </p>
                </div>
              )}

              {/* Download Update button */}
              {showDownloadButton ? (
                <div className="pt-2">
                  <button
                    type="button"
                    disabled={isPreparingDownload}
                    onClick={(e) => {
                      e.preventDefault();
                      if (isPreparingDownload) return;
                      setIsPreparingDownload(true);
                      setTimeout(() => {
                        window.open(updateState!.downloadUrl, '_blank', 'noopener,noreferrer');
                        setIsPreparingDownload(false);
                        localStorage.setItem('sur_finance_downloaded_update_version', updateState!.latestVersion);
                        setJustDownloadedVersion(updateState!.latestVersion);
                      }, 1500);
                    }}
                    className="w-full py-2 bg-gradient-to-l from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 font-black text-white text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 text-center cursor-pointer disabled:opacity-75 disabled:cursor-wait"
                  >
                    <Download className={`w-3.5 h-3.5 ${isPreparingDownload ? 'animate-spin' : 'animate-bounce'}`} />
                    {isPreparingDownload ? 'جاري توجيهك لصفحة تنزيل التحديث...' : 'تنزيل ملف التثبيت المحدث (Download Update)'}
                  </button>
                </div>
              ) : showDownloadedMessage ? (
                <div className="pt-2">
                  <div className="p-3 bg-emerald-500/5 border border-emerald-500/15 rounded-xl flex items-center gap-2 text-emerald-600" dir="rtl">
                    <Check className="w-4 h-4 shrink-0" />
                    <span className="text-xs font-bold text-emerald-800 dark:text-emerald-400">
                      تم فتح رابط التحديث. لن يظهر زر التنزيل مرة أخرى لهذا الإصدار.
                    </span>
                  </div>
                </div>
              ) : null}
            </div>

          </div>
        </div>

        {/* Employee Permissions Section (Only visible in Manager Mode) */}
        {isManagerMode && (
          <div className={`lg:col-span-12 p-6 ${cardStyleClass} space-y-6`} id="permissions-settings-section" dir="rtl">
            <div className="flex items-center gap-2.5 border-b border-gray-100 dark:border-zinc-800/60 pb-3 flex-row-reverse text-right justify-between">
              <div className="flex items-center gap-2.5 flex-row-reverse">
                <ShieldCheck className="w-5 h-5 text-amber-500 animate-pulse" />
                <div>
                  <h3 className="text-sm font-black text-gray-800 dark:text-gray-150">إعدادات صلاحيات الموظفين</h3>
                  <p className="text-[10px] text-gray-400 mt-0.5">حدد الصلاحيات المتاحة للموظفين عند تشغيل البرنامج في وضع الموظف الافتراضي.</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleRestoreDefaultPermissions}
                  className="px-3 py-1.5 text-[10px] font-bold text-gray-650 dark:text-zinc-300 bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-750 rounded-xl border border-gray-200 dark:border-zinc-700/50 transition-all flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>استعادة الإعدادات الافتراضية للصلاحيات</span>
                </button>
                <button
                  type="button"
                  onClick={handleSavePermissions}
                  className="px-3 py-1.5 text-[10px] font-black text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all flex items-center gap-1 cursor-pointer shadow-sm"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>حفظ الصلاحيات</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              
              {/* Group 1: الأساسية */}
              <div className="p-4 rounded-xl bg-slate-50/50 dark:bg-zinc-900/30 border border-gray-100 dark:border-zinc-800/50 space-y-3">
                <h4 className="text-[11px] font-black text-amber-600 dark:text-amber-400 border-b border-gray-100 dark:border-zinc-800 pb-1.5 flex items-center gap-1.5 flex-row-reverse">
                  <Database className="w-4 h-4 shrink-0" />
                  <span>سندات القبض والصرف</span>
                </h4>
                <div className="space-y-2.5">
                  {[
                    { key: 'createReceipt', label: 'إنشاء سند قبض' },
                    { key: 'createPayment', label: 'إنشاء سند صرف' },
                    { key: 'editReceipt', label: 'تعديل سند قبض' },
                    { key: 'editPayment', label: 'تعديل سند صرف' },
                    { key: 'deleteReceipt', label: 'حذف سند قبض' },
                    { key: 'deletePayment', label: 'حذف سند صرف' },
                  ].map((perm) => (
                    <label key={perm.key} className="flex items-center gap-2.5 cursor-pointer text-xs select-none hover:text-gray-900 dark:hover:text-white transition-colors">
                      <input
                        type="checkbox"
                        checked={permissions[perm.key as keyof EmployeePermissions]}
                        onChange={() => handleTogglePermission(perm.key as keyof EmployeePermissions)}
                        className="w-4 h-4 rounded text-[var(--primary-color)] focus:ring-[var(--primary-color)] dark:border-zinc-800 bg-gray-100 dark:bg-zinc-950/60 cursor-pointer accent-amber-500"
                      />
                      <span className="font-bold text-gray-700 dark:text-gray-300">{perm.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Group 2: عرض السجلات والأرشيف */}
              <div className="p-4 rounded-xl bg-slate-50/50 dark:bg-zinc-900/30 border border-gray-100 dark:border-zinc-800/50 space-y-3">
                <h4 className="text-[11px] font-black text-blue-500 dark:text-blue-400 border-b border-gray-100 dark:border-zinc-800 pb-1.5 flex items-center gap-1.5 flex-row-reverse">
                  <Eye className="w-4 h-4 shrink-0" />
                  <span>السجلات وعرض البيانات</span>
                </h4>
                <div className="space-y-2.5">
                  {[
                    { key: 'viewRecords', label: 'عرض السجلات' },
                    { key: 'viewVoucher', label: 'عرض السند' },
                    { key: 'viewArchive', label: 'عرض الأرشيف' },
                    { key: 'viewDashboard', label: 'عرض لوحة التحكم' },
                    { key: 'showMainDashboard', label: 'إظهار الواجهة الرئيسية' },
                  ].map((perm) => (
                    <label key={perm.key} className="flex items-center gap-2.5 cursor-pointer text-xs select-none hover:text-gray-900 dark:hover:text-white transition-colors">
                      <input
                        type="checkbox"
                        checked={permissions[perm.key as keyof EmployeePermissions]}
                        onChange={() => handleTogglePermission(perm.key as keyof EmployeePermissions)}
                        className="w-4 h-4 rounded text-[var(--primary-color)] focus:ring-[var(--primary-color)] dark:border-zinc-800 bg-gray-100 dark:bg-zinc-950/60 cursor-pointer accent-blue-500"
                      />
                      <span className="font-bold text-gray-700 dark:text-gray-300">{perm.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Group 3: المرفقات والملفات */}
              <div className="p-4 rounded-xl bg-slate-50/50 dark:bg-zinc-900/30 border border-gray-100 dark:border-zinc-800/50 space-y-3">
                <h4 className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 border-b border-gray-100 dark:border-zinc-800 pb-1.5 flex items-center gap-1.5 flex-row-reverse">
                  <Paperclip className="w-4 h-4 shrink-0" />
                  <span>المرفقات والملفات الثبوتية</span>
                </h4>
                <div className="space-y-2.5">
                  {[
                    { key: 'viewAttachments', label: 'عرض المرفقات' },
                    { key: 'addAttachments', label: 'إضافة المرفقات' },
                    { key: 'deleteAttachments', label: 'حذف المرفقات' },
                  ].map((perm) => (
                    <label key={perm.key} className="flex items-center gap-2.5 cursor-pointer text-xs select-none hover:text-gray-900 dark:hover:text-white transition-colors">
                      <input
                        type="checkbox"
                        checked={permissions[perm.key as keyof EmployeePermissions]}
                        onChange={() => handleTogglePermission(perm.key as keyof EmployeePermissions)}
                        className="w-4 h-4 rounded text-[var(--primary-color)] focus:ring-[var(--primary-color)] dark:border-zinc-800 bg-gray-100 dark:bg-zinc-950/60 cursor-pointer accent-emerald-500"
                      />
                      <span className="font-bold text-gray-700 dark:text-gray-300">{perm.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Group 4: الطباعة والتصدير */}
              <div className="p-4 rounded-xl bg-slate-50/50 dark:bg-zinc-900/30 border border-gray-100 dark:border-zinc-800/50 space-y-3">
                <h4 className="text-[11px] font-black text-teal-600 dark:text-teal-400 border-b border-gray-100 dark:border-zinc-800 pb-1.5 flex items-center gap-1.5 flex-row-reverse">
                  <Printer className="w-4 h-4 shrink-0" />
                  <span>الطباعة والتصدير</span>
                </h4>
                <div className="space-y-2.5">
                  {[
                    { key: 'printVoucher', label: 'طباعة السند' },
                    { key: 'exportVoucherPDF', label: 'تصدير السند PDF' },
                    { key: 'printFiltered', label: 'طباعة النتائج المفلترة' },
                    { key: 'exportFilteredPDF', label: 'تصدير النتائج المفلترة PDF' },
                  ].map((perm) => (
                    <label key={perm.key} className="flex items-center gap-2.5 cursor-pointer text-xs select-none hover:text-gray-900 dark:hover:text-white transition-colors">
                      <input
                        type="checkbox"
                        checked={permissions[perm.key as keyof EmployeePermissions]}
                        onChange={() => handleTogglePermission(perm.key as keyof EmployeePermissions)}
                        className="w-4 h-4 rounded text-[var(--primary-color)] focus:ring-[var(--primary-color)] dark:border-zinc-800 bg-gray-100 dark:bg-zinc-950/60 cursor-pointer accent-teal-500"
                      />
                      <span className="font-bold text-gray-700 dark:text-gray-300">{perm.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Group 5: الإعدادات والأمن المالي */}
              <div className="p-4 rounded-xl bg-slate-50/50 dark:bg-zinc-900/30 border border-gray-100 dark:border-zinc-800/50 col-span-1 md:col-span-2 xl:col-span-2 space-y-3">
                <h4 className="text-[11px] font-black text-indigo-600 dark:text-indigo-400 border-b border-gray-100 dark:border-zinc-800 pb-1.5 flex items-center gap-1.5 flex-row-reverse">
                  <Sliders className="w-4 h-4 shrink-0" />
                  <span>الإعدادات والتحشيد الإداري الفني</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5">
                  {[
                    { key: 'accessSettings', label: 'الوصول إلى الإعدادات' },
                    { key: 'changeIdentity', label: 'تغيير الهوية البصرية' },
                    { key: 'exportBackup', label: 'تصدير نسخة احتياطية' },
                    { key: 'importBackup', label: 'استيراد نسخة احتياطية' },
                    { key: 'resetSystem', label: 'تصفير النظام' },
                    { key: 'checkUpdates', label: 'التحقق من التحديثات' },
                    { key: 'managePermissions', label: 'إدارة الصلاحيات' },
                  ].map((perm) => (
                    <label key={perm.key} className="flex items-center gap-2.5 cursor-pointer text-xs select-none hover:text-gray-900 dark:hover:text-white transition-colors">
                      <input
                        type="checkbox"
                        checked={permissions[perm.key as keyof EmployeePermissions]}
                        onChange={() => handleTogglePermission(perm.key as keyof EmployeePermissions)}
                        className="w-4 h-4 rounded text-[var(--primary-color)] focus:ring-[var(--primary-color)] dark:border-zinc-800 bg-gray-100 dark:bg-zinc-950/60 cursor-pointer accent-indigo-500"
                      />
                      <span className="font-bold text-gray-700 dark:text-gray-300">{perm.label}</span>
                    </label>
                  ))}
                </div>
              </div>

            </div>

            {/* Hint / Warning banner */}
            <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/15 text-[10px] text-amber-700 dark:text-amber-400 leading-relaxed text-right flex-row-reverse">
              <Shield className="w-4 h-4 shrink-0 text-amber-500 animate-pulse" />
              <span>
                <strong>تنويه أمني:</strong> تقتصر هذه الإعدادات وصلاحيات الوصول على "وضع الموظف" فقط. أما "وضع المدير المالي" فيتمتع بصلاحيات وصول كاملة وغير مقيدة لتعديل أو ضبط أي قسم محاسبي في النظام.
              </span>
            </div>
          </div>
        )}

        {/* Toggle for Duplicate Voucher alert */}
        <div className={`lg:col-span-12 p-5 ${cardStyleClass} space-y-3`}>
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-1.5 border-b border-blue-50/10 dark:border-blue-900/15 pb-2 flex-row-reverse">
            <ShieldAlert className="w-4 h-4 text-amber-500" />
            السلامة المالية والتدقيق الإداري للأرشفة
          </h3>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-3.5 rounded-xl bg-blue-50/10 dark:bg-[#001733]/20 border border-blue-100/30 dark:border-blue-900/10 hover:border-blue-200/50 dark:hover:border-blue-800/20 transition-all duration-300">
            <div className="text-right space-y-1">
              <h4 className="text-xs font-bold text-gray-850 dark:text-gray-150">تفعيل فحص أرقام السندات المكررة</h4>
              <p className="text-[10px] text-gray-400 dark:text-gray-400 leading-relaxed">
                عند تفعيل هذا الخيار، سيقوم النظام بالتدقيق التلقائي الفوري والتنبيه التفاعلي عند إدخال رقم سند مكرر (صرف أو قبض) مسجل مسبقاً لمنع تداخل الحسابات والوقوع في أخطاء إدارية أثناء ملفات الأرشفة والطباعة.
              </p>
            </div>
            <button
              type="button"
              onClick={handleToggleAlertOnDuplicate}
              className={`w-12 h-6 rounded-full p-0.5 transition-all duration-300 pointer-events-auto flex items-center ${
                identity.alertOnDuplicateVoucherNo ? 'bg-emerald-600 justify-start flex-row-reverse' : 'bg-gray-300 dark:bg-zinc-700 justify-start'
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-white shadow-md transform transition-all duration-300 block" />
            </button>
          </div>
        </div>

        {/* Manage Logo (Visual Identity) segment */}
        <div className={`lg:col-span-12 p-5 ${cardStyleClass} space-y-4`} id="logo-branding-section">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-1.5 border-b border-blue-50/10 dark:border-blue-900/15 pb-2 flex-row-reverse">
            <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
            الهوية البصرية وشعار المؤسسة
          </h3>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 p-4 rounded-xl bg-blue-50/10 dark:bg-[#001733]/10 border border-blue-100/30 dark:border-blue-900/10 hover:border-blue-200/40 dark:hover:border-blue-800/15 transition-all duration-300">
            <div className="text-right space-y-1.5 flex-1">
              <h4 className="text-xs font-black text-gray-850 dark:text-gray-150">شعار البرنامج المالي المخصص</h4>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-relaxed font-sans">
                يمكنك رفع شعار مخصص بصيغة (PNG أو JPG أو JPEG). سيتم تلقائياً تكييف أبعاد الشعار وضغطه ليلائم جميع أجزاء واجهة البرنامج والتقارير المطبوعة وسندات القبض والصرف، وسيحفظ تلقائياً في النسخ الاحتياطية.
              </p>
              
              <div className="flex gap-2.5 pt-2 flex-wrap">
                <label
                  htmlFor="logo-file-input"
                  className={`py-2 px-4 text-xs font-extrabold text-white hover:opacity-90 transition-all flex items-center justify-center gap-1.5 cursor-pointer select-none ${btnRadius}`}
                  style={{ backgroundColor: identity.primaryColor }}
                >
                  <Upload className="w-3.5 h-3.5" />
                  اختيار شعار...
                </label>
                <input
                  id="logo-file-input"
                  type="file"
                  accept="image/png, image/jpeg, image/jpg"
                  onChange={handleLogoUpload}
                  className="hidden"
                />

                {identity.customLogo && (
                  <button
                    type="button"
                    onClick={handleLogoRemove}
                    className={`py-2 px-4 text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/20 dark:hover:bg-rose-950/45 dark:text-rose-450 border border-rose-150/25 dark:border-rose-900/20 flex items-center justify-center gap-1.5 cursor-pointer transition-all ${btnRadius}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    حذف الشعار
                  </button>
                )}
              </div>
            </div>

            {/* Logo Preview box */}
            <div className="flex flex-col items-center justify-center p-4 bg-white dark:bg-zinc-950 rounded-2xl border border-gray-150 dark:border-zinc-800/80 w-32 h-32 shrink-0 shadow-inner">
              <Logo size={80} showText={false} customLogo={identity.customLogo} />
              <span className="text-[9px] text-gray-400 mt-2 font-mono tracking-wider font-semibold">معاينة الشعار</span>
            </div>
          </div>
        </div>

        {/* Manage Payers / Donors segment */}
        <div className={`lg:col-span-6 p-5 space-y-4 ${cardStyleClass}`}>
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-1.5 border-b border-gray-50 dark:border-zinc-900 pb-2 flex-row-reverse">
            <UserPlus className="w-4 h-4 text-emerald-500" />
            قائمة الدافعين أو المتبرعين المعتمدين
          </h3>

          {/* Form to append payer */}
          <form onSubmit={handleAddPayer} className="flex gap-2">
            <button
              type="submit"
              style={{ backgroundColor: identity.primaryColor }}
              className={`px-4 text-xs font-bold text-white hover:opacity-90 transition-all shrink-0 ${btnRadius}`}
            >
              إضافة
            </button>
            <input
              type="text"
              required
              placeholder="اكتب اسم متبرع أو دافع جديد رسمي..."
              value={newPayer}
              onChange={(e) => setNewPayer(e.target.value)}
              className="w-full text-xs px-3.5 py-2 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-gray-800 dark:text-gray-200 focus:outline-none"
            />
          </form>

          {/* Interactive Lists */}
          <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1 divide-y divide-gray-50 dark:divide-zinc-900/40">
            {payers.map((p, idx) => (
              <div key={idx} className="flex items-center justify-between py-2 text-xs flex-row-reverse text-right">
                
                {editingPayer === p ? (
                  <div className="flex gap-1 flex-1">
                    <button
                      onClick={handleSavePayerEdit}
                      className="bg-emerald-600 text-white text-[10px] px-2 py-1 rounded hover:bg-emerald-700"
                    >
                      تسجيل
                    </button>
                    <button
                      onClick={() => setEditingPayer(null)}
                      className="bg-gray-150 dark:bg-zinc-800 text-[10px] px-2 py-1 text-gray-500 rounded"
                    >
                      تراجع
                    </button>
                    <input
                      type="text"
                      value={editPayerVal}
                      onChange={(e) => setEditPayerVal(e.target.value)}
                      className="w-full text-[11px] px-2 py-1 border rounded bg-white dark:bg-zinc-950 text-gray-850 dark:text-gray-250 focus:outline-none"
                    />
                  </div>
                ) : (
                  <>
                    <span className="font-semibold text-gray-800 dark:text-gray-200">{p}</span>
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleStartEditPayer(p)}
                        className="text-gray-400 hover:text-sky-505 p-1 rounded-md hover:bg-sky-50/50 dark:hover:bg-sky-950/20 transition-all"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeletePayer(p)}
                        className="text-gray-400 hover:text-rose-600 p-1 rounded-md hover:bg-rose-50/50 dark:hover:bg-rose-950/25 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </>
                )}
                
              </div>
            ))}
          </div>
        </div>

        {/* Manage Payment Methods segment */}
        <div className={`lg:col-span-6 p-5 space-y-4 ${cardStyleClass}`}>
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-1.5 border-b border-gray-50 dark:border-zinc-900 pb-2 flex-row-reverse">
            <CreditCard className="w-4 h-4 text-sky-505" />
            طرق الدفع والصرف المالي
          </h3>

          <form onSubmit={handleAddMethod} className="flex gap-2">
            <button
              type="submit"
              style={{ backgroundColor: identity.primaryColor }}
              className={`px-4 text-xs font-bold text-white hover:opacity-90 transition-all shrink-0 ${btnRadius}`}
            >
              إضافة
            </button>
            <input
              type="text"
              required
              placeholder="مثال: منصة شاشات / شيك مصرفي / تحويل هاتف..."
              value={newMethod}
              onChange={(e) => setNewMethod(e.target.value)}
              className="w-full text-xs px-3.5 py-2 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-gray-800 dark:text-gray-200 focus:outline-none"
            />
          </form>

          <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1 divide-y divide-gray-50 dark:divide-zinc-900/40">
            {methods.map((m, idx) => (
              <div key={idx} className="flex items-center justify-between py-2 text-xs flex-row-reverse text-right">
                
                {editingMethod === m ? (
                  <div className="flex gap-1 flex-1">
                    <button
                      onClick={handleSaveMethodEdit}
                      className="bg-emerald-600 text-white text-[10px] px-2 py-1 rounded"
                    >
                      حفظ
                    </button>
                    <button
                      onClick={() => setEditingMethod(null)}
                      className="bg-gray-150 dark:bg-zinc-800 text-[10px] px-2 py-1 text-gray-500 rounded"
                    >
                      تراجع
                    </button>
                    <input
                      type="text"
                      value={editMethodVal}
                      onChange={(e) => setEditMethodVal(e.target.value)}
                      className="w-full text-[11px] px-2 py-1 border rounded bg-white dark:bg-zinc-950 text-gray-850 dark:text-gray-250 focus:outline-none"
                    />
                  </div>
                ) : (
                  <>
                    <span className="font-semibold text-gray-800 dark:text-gray-200">{m}</span>
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleStartEditMethod(m)}
                        className="text-gray-400 hover:text-sky-505 p-1 rounded-md hover:bg-sky-50/50 dark:hover:bg-sky-950/20 transition-all"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteMethod(m)}
                        className="text-gray-400 hover:text-rose-600 p-1 rounded-md hover:bg-rose-50/50 dark:hover:bg-rose-950/25 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </>
                )}

              </div>
            ))}
          </div>
        </div>

      </div>

      {/* 2026 Fiscal Year Archive System */}
      <div className={`p-6 mt-4 ${cardStyleClass} space-y-6 text-right`} dir="rtl">
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-zinc-800 pb-4 flex-row-reverse pb-3">
          <div className="flex items-center gap-2 flex-row-reverse text-right">
            <FolderOpen className="w-5 h-5 text-sky-600 dark:text-sky-400" />
            <h3 className="text-sm font-black text-gray-900 dark:text-white">أرشيف السنوات المالية وإغلاق الدورة المحاسبية</h3>
          </div>
          <span className="text-[10px] bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-350 px-2.5 py-1 rounded-lg border border-sky-100/40 dark:border-sky-950/20 font-bold">
            معالج الأنظمة لعام {new Date().getFullYear()}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Form and info */}
          <div className="lg:col-span-4 space-y-4 lg:border-l lg:border-gray-150 lg:dark:border-zinc-800/40 lg:pl-6">
            <h4 className="text-xs font-bold text-gray-800 dark:text-gray-100">إغلاق وتدوير الدورة المحاسبية</h4>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed font-sans">
              يساعدك هذا المعالج على حزم السنة والعهد الحالية في أرشيف دائم آمن ومستقل، مع تصفير الجداول الجارية لتبدء العام برصيد مالي وفترات ترقيم جديدة.
            </p>
            <div className="p-3 bg-amber-50/20 dark:bg-amber-955/10 border border-amber-500/10 rounded-xl space-y-1">
              <p className="text-[10px] text-amber-700 dark:text-amber-400 font-extrabold flex items-center gap-1 flex-row-reverse justify-end">
                <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                <span>حماية الثوابت والمعايير</span>
              </p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 font-sans leading-relaxed">
                قائمة الدافعين، طرق الصرف، إعدادات الأمان والهوية البصرية لن تتأثر أو تمسح لتضمن سرعة واستمرارية التشغيل.
              </p>
            </div>

            <div className="pt-2 space-y-3">
              <div>
                <label className="block text-[10px] text-gray-400 mb-1 font-bold">مسمى السنة المالية المستهدفة</label>
                <input
                  type="text"
                  value={fiscalYearInput}
                  onChange={(e) => setFiscalYearInput(e.target.value)}
                  placeholder="مثال: 2026"
                  className="w-full text-xs px-3 py-2 border rounded-xl bg-white dark:bg-zinc-950 border-gray-200 dark:border-zinc-805 text-gray-800 dark:text-gray-250 focus:outline-none focus:border-sky-500 font-bold text-center"
                />
              </div>

              {archiveErrorMsg && (
                <p className="text-[10px] text-rose-600 dark:text-rose-400 font-bold bg-rose-50/25 dark:bg-rose-950/10 p-2 border border-rose-150/10 rounded-lg">{archiveErrorMsg}</p>
              )}

              <button
                type="button"
                onClick={() => {
                  setArchiveErrorMsg('');
                  setShowArchiveConfirm(true);
                }}
                className={`w-full py-2.5 bg-gradient-to-l from-sky-600 to-teal-700 hover:from-sky-700 hover:to-teal-800 text-white text-xs font-black transition-all ${btnRadius} flex items-center justify-center gap-1.5 shadow-sm shadow-teal-500/15 cursor-pointer`}
              >
                <FolderOpen className="w-4 h-4" />
                إغلاق وأرشفة السنة المالية {fiscalYearInput}
              </button>
            </div>
          </div>

          {/* List of archives */}
          <div className="lg:col-span-8 space-y-4">
            <h4 className="text-xs font-bold text-gray-800 dark:text-gray-100 flex items-center gap-1.5 flex-row-reverse justify-end">
              <span>السجلات والمستودعات المالية المؤرشفة ({archives.length})</span>
            </h4>

            {archives.length === 0 ? (
              <div className="p-8 border border-dashed border-gray-200 dark:border-zinc-800 rounded-2xl flex flex-col items-center justify-center text-center space-y-2">
                <History className="w-8 h-8 text-gray-300 dark:text-zinc-700" />
                <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold">المستودع الأرشيفي فارغ حالياً</p>
                <p className="text-[10px] text-gray-400 font-sans leading-relaxed">عند استكمال إغلاق الدورة المحاسبية السنوية، ستظهر ملفات الأرشيف وميزانيات السنوات السابقة هنا.</p>
              </div>
            ) : (
              <div className="overflow-hidden border border-gray-150 dark:border-zinc-805 rounded-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-right border-collapse" dir="rtl">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-zinc-900 border-b border-gray-100 dark:border-zinc-800 text-gray-400 select-none text-[10px]">
                        <th className="p-3 text-right font-black">السنة المالية</th>
                        <th className="p-3 text-right font-black">عدد السندات</th>
                        <th className="p-3 text-right font-black">إجمالي المقبوضات</th>
                        <th className="p-3 text-right font-black">إجمالي المصروفات</th>
                        <th className="p-3 text-right font-black">الرصيد الصافي</th>
                        <th className="p-3 text-center font-black">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-zinc-900/40">
                      {archives.map((arc) => {
                        const netIsPositive = arc.netBalance >= 0;
                        return (
                          <tr key={arc.id} className="hover:bg-slate-50/20 dark:hover:bg-zinc-900/10 transition-colors">
                            <td className="p-3 font-extrabold text-gray-900 dark:text-white font-mono">{arc.fiscalYear}</td>
                            <td className="p-3 font-sans text-[10px] text-gray-600 dark:text-gray-300">
                              <span className="bg-slate-100 dark:bg-zinc-900 px-1.5 py-0.5 rounded font-bold font-mono">{arc.receiptCount} قبض</span>
                              <span className="mx-1">/</span>
                              <span className="bg-slate-100 dark:bg-zinc-900 px-1.5 py-0.5 rounded font-bold font-mono">{arc.expenseCount} صرف</span>
                            </td>
                            <td className="p-3 font-mono font-bold text-emerald-600 dark:text-emerald-450">{formatOMR(arc.totalReceipts)}</td>
                            <td className="p-3 font-mono font-bold text-rose-600 dark:text-rose-450">{formatOMR(arc.totalExpenses)}</td>
                            <td className={`p-3 font-mono font-black ${netIsPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                              {formatOMR(arc.netBalance)}
                            </td>
                            <td className="p-3 text-center">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedArchive(arc);
                                  setArchiveSearchTerm('');
                                  setArchiveVoucherTypeFilter('all');
                                }}
                                className="px-3 py-1 bg-sky-50 hover:bg-sky-100 text-sky-700 dark:bg-sky-950/20 dark:hover:bg-sky-950/40 dark:text-sky-350 rounded-lg text-[10px] font-black transition-all cursor-pointer border border-sky-100/30"
                              >
                                استعراض القيود
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Backup and Restore & Factory reset widgets */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-2">
        
        {/* Backup and Import File Utilities - النسخ الاحتياطي اليدوي */}
        {hasBackupAccess ? (
          <div className={`md:col-span-7 p-6 ${cardStyleClass} space-y-4 text-right`} dir="rtl">
            <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-1.5 flex-row-reverse">
              <Database className="w-4 h-4 text-emerald-500" />
              النسخ الاحتياطي اليدوي
            </h4>
            <p className="text-xs text-gray-400 dark:text-gray-400 leading-relaxed">
              يمكنك تصدير وحفظ كامل البيانات المالية والنسخ الاحتياطية بصيغة ملفات خارجية لحمايتها من الفقدان والقدرة على استعادتها بأي وقت.
            </p>

            {/* Backup Status Display Card */}
            <div className="bg-gray-50 dark:bg-zinc-900/40 rounded-xl p-4 border border-gray-150 dark:border-zinc-800 space-y-2">
              <div className="flex items-center justify-between border-b border-gray-200 dark:border-zinc-850 pb-2 mb-2 flex-row-reverse">
                <span className="text-xs font-bold text-gray-500 dark:text-gray-400">حالة النسخ الاحتياطي</span>
                <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 flex-row-reverse">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  مؤمن
                </span>
              </div>

              {!backupStatus.lastDate ? (
                <div className="text-center py-2 text-xs text-gray-500 dark:text-gray-400 font-sans">
                  لم يتم إنشاء نسخة احتياطية بعد.
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 text-xs leading-relaxed text-right font-sans">
                  <div className="space-y-1">
                    <p className="text-[11px] text-gray-400">آخر نسخة احتياطية:</p>
                    <p className="font-bold text-gray-800 dark:text-gray-200">{backupStatus.lastType}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[11px] text-gray-400">التاريخ:</p>
                    <p className="font-bold text-gray-800 dark:text-gray-200 font-mono">
                      {new Date(parseInt(backupStatus.lastDate, 10)).toLocaleDateString('ar-OM')}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[11px] text-gray-400">الوقت:</p>
                    <p className="font-bold text-gray-800 dark:text-gray-200 font-mono">
                      {new Date(parseInt(backupStatus.lastDate, 10)).toLocaleTimeString('ar-OM', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div className="space-y-1 col-span-2 border-t border-gray-150 dark:border-zinc-850 pt-1.5 mt-1">
                    <p className="text-[11px] text-gray-400">اسم الملف:</p>
                    <p className="font-mono text-[10px] text-gray-600 dark:text-gray-300 break-all truncate" title={backupStatus.lastFile || '-'}>
                      {backupStatus.lastFile || '-'}
                    </p>
                  </div>
                </div>
              )}

              {/* Warning Messages if > 7 or > 30 days old */}
              {(() => {
                if (!backupStatus.lastDate) return null;
                const diffMs = Date.now() - parseInt(backupStatus.lastDate, 10);
                const diffDays = diffMs / (1000 * 60 * 60 * 24);

                if (diffDays > 30) {
                  return (
                    <div className="mt-3 p-3 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 rounded-xl text-[11px] font-bold border border-red-200/55 dark:border-red-950/40 flex items-center gap-2 flex-row-reverse text-right">
                      <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                      <span>تحذير: مضى أكثر من 30 يوماً على آخر نسخة احتياطية.</span>
                    </div>
                  );
                } else if (diffDays > 7) {
                  return (
                    <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 rounded-xl text-[11px] font-bold border border-amber-200/55 dark:border-amber-950/40 flex items-center gap-2 flex-row-reverse text-right">
                      <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                      <span>تنبيه: مضى أكثر من 7 أيام على آخر نسخة احتياطية.</span>
                    </div>
                  );
                }
                return null;
              })()}
            </div>

            {/* Internal Auto Backup Status Card */}
            <div className="bg-gray-50 dark:bg-zinc-900/40 rounded-xl p-4 border border-gray-150 dark:border-zinc-800 space-y-2 mt-4">
              <div className="flex items-center justify-between border-b border-gray-200 dark:border-zinc-850 pb-2 mb-2 flex-row-reverse">
                <span className="text-xs font-bold text-gray-500 dark:text-gray-400 font-sans">آخر نسخة تلقائية داخلية</span>
                <span className="text-xs font-black text-blue-600 dark:text-blue-400 flex items-center gap-1.5 flex-row-reverse font-sans">
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                  حفظ تلقائي داخلي
                </span>
              </div>

              {internalAutoBackups.length === 0 ? (
                <div className="text-center py-2 text-xs text-gray-500 dark:text-gray-400 font-sans">
                  لا توجد نسخ تلقائية داخلية محفوظة حالياً.
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 text-xs leading-relaxed text-right font-sans">
                  <div className="space-y-1 col-span-2 flex items-center justify-between border-b border-gray-100 dark:border-zinc-850 pb-1.5 mb-1.5">
                    <span className="text-[11px] text-gray-400 font-sans">عدد النسخ المحفوظة:</span>
                    <span className="font-bold text-gray-800 dark:text-gray-200 font-sans">
                      {internalAutoBackups.length} / 10 نسخ
                    </span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[11px] text-gray-400 font-sans">التاريخ:</p>
                    <p className="font-bold text-gray-800 dark:text-gray-200 font-mono">
                      {new Date(internalAutoBackups[0].timestamp).toLocaleDateString('ar-OM')}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[11px] text-gray-400 font-sans">الوقت:</p>
                    <p className="font-bold text-gray-800 dark:text-gray-200 font-mono">
                      {new Date(internalAutoBackups[0].timestamp).toLocaleTimeString('ar-OM', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              )}

              {/* Arabic warning note */}
              <div className="mt-2 text-[11px] text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/10 p-2.5 rounded-lg border border-amber-200/40 dark:border-amber-900/20 text-right leading-normal font-sans">
                ⚠️ النسخة التلقائية الداخلية لا تغني عن تصدير نسخة احتياطية خارجية وحفظها خارج الجهاز.
              </div>

              {/* Manager only buttons */}
              {isManagerMode && (
                <div className="flex flex-wrap gap-2 pt-2.5 border-t border-gray-200 dark:border-zinc-850 justify-start flex-row-reverse">
                  <button
                    type="button"
                    onClick={handleRestoreLatestInternal}
                    disabled={internalAutoBackups.length === 0}
                    className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/20 dark:hover:bg-emerald-950/40 dark:text-emerald-350 rounded-lg text-xs font-black transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>استرجاع آخر نسخة تلقائية داخلية</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteInternalSnapshots}
                    disabled={internalAutoBackups.length === 0}
                    className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 dark:text-rose-350 rounded-lg text-xs font-black transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>حذف النسخ التلقائية الداخلية</span>
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
              {/* Download JSON Backup */}
              <button
                type="button"
                disabled={!isManagerMode && !currentPermissions?.exportBackup}
                onClick={handleBackupExport}
                className={`p-3 border border-gray-200 dark:border-zinc-850 hover:border-gray-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-950 text-gray-800 dark:text-gray-200 transition-all text-xs font-bold text-center flex flex-col items-center justify-center gap-1 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${btnRadius}`}
              >
                <div className="flex items-center gap-1.5 justify-center">
                  <Download className="w-4 h-4 text-emerald-500" />
                  <span className="font-bold">تصدير JSON</span>
                </div>
                <span className="text-[10px] text-gray-400 font-sans">Export JSON</span>
              </button>

              {/* Download PDF Backup */}
              <button
                type="button"
                disabled={!isManagerMode && !currentPermissions?.exportFilteredPDF}
                onClick={handleExportPDFClick}
                className={`p-3 border border-gray-200 dark:border-zinc-850 hover:border-gray-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-950 text-gray-800 dark:text-gray-200 transition-all text-xs font-bold text-center flex flex-col items-center justify-center gap-1 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${btnRadius}`}
              >
                <div className="flex items-center gap-1.5 justify-center">
                  <FileText className="w-4 h-4 text-sky-500" />
                  <span className="font-bold">تصدير PDF</span>
                </div>
                <span className="text-[10px] text-gray-400 font-sans">Export PDF</span>
              </button>

              {/* Download Excel Backup */}
              <button
                type="button"
                disabled={!isManagerMode && !currentPermissions?.exportFilteredPDF}
                onClick={handleExportExcelClick}
                className={`p-3 border border-gray-200 dark:border-zinc-850 hover:border-gray-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-950 text-gray-800 dark:text-gray-200 transition-all text-xs font-bold text-center flex flex-col items-center justify-center gap-1 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${btnRadius}`}
              >
                <div className="flex items-center gap-1.5 justify-center">
                  <FileSpreadsheet className="w-4 h-4 text-amber-500" />
                  <span className="font-bold">تصدير Excel</span>
                </div>
                <span className="text-[10px] text-gray-400 font-sans">Export Excel</span>
              </button>

              {/* Upload Restore */}
              <label 
                className={`p-3 border border-dashed border-gray-300 dark:border-zinc-700 hover:border-gray-400 dark:hover:border-zinc-650 bg-white dark:bg-zinc-950 text-gray-700 dark:text-gray-300 transition-all text-xs font-bold text-center flex flex-col items-center justify-center gap-1 cursor-pointer ${btnRadius}`}
              >
                <div className="flex items-center gap-1.5 justify-center">
                  <Upload className="w-4 h-4 text-amber-500" />
                  <span className="font-bold">استيراد نسخة</span>
                </div>
                <span className="text-[10px] text-gray-400 font-sans">Import JSON</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleBackupRestore}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        ) : (
          <div className={`md:col-span-7 p-6 ${cardStyleClass} flex flex-col items-center justify-center text-center space-y-2 text-gray-400 dark:text-gray-500`}>
            <Database className="w-8 h-8 opacity-40" />
            <p className="text-xs font-bold">لا تملك صلاحية تصدير نسخة احتياطية.</p>
          </div>
        )}

        {/* Hazard Zone - Factory Hard Reset */}
        <div className={`md:col-span-5 p-6 border-2 border-dashed border-rose-200 dark:border-rose-955 bg-rose-50/10 dark:bg-rose-950/2 rounded-2xl space-y-3`}>
          <h4 className="text-sm font-semibold text-rose-700 dark:text-rose-400 flex items-center gap-1.5 flex-row-reverse text-right">
            <ShieldAlert className="w-4 h-4 animate-bounce" />
            منطقة الخطر الإداري
          </h4>
          
          <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
            الضغط على تصفير قاعدة البيانات سيمسح بالكامل كافة سندات الصرف والقبض والحسابات من النظام المالي بشكل فوري وغير قابل للاسترداد وتصفير العدادات المالية للبرنامج المالي.
          </p>

          {/* Reset Process button triggering double warning modal/prompt */}
          {!showResetConfirm ? (
            <button
              type="button"
              onClick={() => {
                setShowResetConfirm(true);
                setShowResetDoubleConfirm(false);
              }}
              className={`w-full py-2 bg-rose-100 hover:bg-rose-200 dark:bg-rose-950/40 dark:hover:bg-rose-950/60 text-rose-700 dark:text-rose-300 text-xs font-black transition-all ${btnRadius}`}
            >
              تصفير قاعدة البيانات بالكامل وإرجاعها لحالة المصنع
            </button>
          ) : (
            <p className="text-xs text-rose-600 dark:text-rose-450 font-bold text-center">جاري تصفير قاعدة البيانات...</p>
          )}
        </div>

      </div>

      {/* Backup Reminder Settings Block */}
      <div className={`p-6 ${cardStyleClass} space-y-4 mt-6`}>
        <div className="flex justify-between items-center flex-row-reverse text-right gap-4">
          <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-1.5 flex-row-reverse">
            <Sliders className="w-4 h-4 text-emerald-500" />
            إعدادات التذكير بالنسخ الاحتياطي الدوري
          </h4>
          {isManagerMode && onOpenBackupReminder && (
            <button
              type="button"
              onClick={onOpenBackupReminder}
              className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm shadow-amber-500/10 cursor-pointer"
            >
              <Database className="w-3.5 h-3.5 animate-pulse" />
              إظهار تذكير النسخ الاحتياطي الآن
            </button>
          )}
        </div>
        
        <p className="text-xs text-gray-450 leading-relaxed text-right" dir="rtl">
          يمكنك تفعيل أو تعديل أيام وجدول التذكير التلقائي لتنبيه الموظفين والمسؤولين بتصدير نسخة احتياطية من البيانات بشكل دوري لتجنب أي فقدان غير متوقع للسجلات.
        </p>

        <div className="flex flex-col md:flex-row-reverse gap-4 justify-between items-start md:items-center text-right border-t border-gray-100 dark:border-zinc-800/40 pt-4" dir="rtl">
          <label className="flex items-center gap-2.5 cursor-pointer text-xs select-none hover:text-gray-900 dark:hover:text-white transition-colors">
            <input
              type="checkbox"
              checked={backupReminderEnabled}
              onChange={(e) => {
                const checked = e.target.checked;
                setBackupReminderEnabled(checked);
                localStorage.setItem('backupReminderEnabled', checked.toString());
                showToast(checked ? '🔔 تم تفعيل التذكير بالنسخ الاحتياطي الدوري' : '🔕 تم إيقاف التذكير بالنسخ الاحتياطي الدوري');
              }}
              className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
            />
            <span className="font-bold text-gray-700 dark:text-gray-200">تفعيل التذكير بالنسخ الاحتياطي الدوري</span>
          </label>
        </div>

        {backupReminderEnabled && (
          <div className="bg-slate-50/50 dark:bg-zinc-900/40 p-4 rounded-xl border border-gray-100 dark:border-zinc-800/30 text-right space-y-2.5" dir="rtl">
            <span className="text-xs font-bold text-gray-600 dark:text-gray-300 block">أيام التنبيه الأسبوعية:</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
              {[
                { dayNum: 0, label: 'الأحد' },
                { dayNum: 1, label: 'الإثنين' },
                { dayNum: 2, label: 'الثلاثاء' },
                { dayNum: 3, label: 'الأربعاء' },
                { dayNum: 4, label: 'الخميس' },
                { dayNum: 5, label: 'الجمعة' },
                { dayNum: 6, label: 'السبت' },
              ].map((day) => {
                const isSelected = backupReminderDays.includes(day.dayNum);
                return (
                  <button
                    key={day.dayNum}
                    type="button"
                    onClick={() => {
                      let updated: number[];
                      if (isSelected) {
                        updated = backupReminderDays.filter((d) => d !== day.dayNum);
                      } else {
                        updated = [...backupReminderDays, day.dayNum].sort();
                      }
                      setBackupReminderDays(updated);
                      localStorage.setItem('backupReminderDays', JSON.stringify(updated));
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all text-center ${
                      isSelected
                        ? 'bg-emerald-600 text-white shadow-sm hover:bg-emerald-700'
                        : 'bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-zinc-750'
                    }`}
                  >
                    {day.label}
                  </button>
                );
              })}
            </div>
            <p className="text-[10px] text-gray-400">
              * سيقوم النظام تلقائياً بإظهار تنبيه دوري لطيف عند الدخول للبرنامج في الأيام المحددة.
            </p>
          </div>
        )}
      </div>

      {/* Auto-Backups List Section */}
      <div className={`p-6 ${cardStyleClass} space-y-4 mt-6`}>
        <div className="flex justify-between items-center flex-row-reverse text-right">
          <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-1.5 flex-row-reverse">
            <History className="w-4 h-4 text-sky-500" />
            النسخ الاحتياطية التلقائية لحماية البيانات (Auto-Backups)
          </h4>
          <span className="text-[10px] text-gray-400 bg-slate-50 dark:bg-zinc-900 px-2 py-0.5 rounded-full font-sans">
            العدد: {backups.length}
          </span>
        </div>
        
        <p className="text-xs text-gray-450 leading-relaxed text-right" dir="rtl">
          يقوم النظام تلقائياً بإنشاء نسخة احتياطية كاملة ومستقلة لكل البيانات والإعدادات قبل البدء في عمليات ترحيل وإغلاق السنة المالية السنوية. تتيح لك هذه القائمة مراجعة واستعادة البيانات لأي نقطة زمنية سابقة في حال رغبت في تصحيح خطأ أو مراجعة سجلات قديمة.
        </p>

        {backups.length === 0 ? (
          <div className="p-8 border border-dashed border-gray-150 dark:border-zinc-800 rounded-2xl flex flex-col items-center justify-center text-center space-y-2">
            <History className="w-8 h-8 text-gray-300 dark:text-zinc-700" />
            <p className="text-xs text-gray-450 font-semibold font-sans">لا توجد نسخ احتياطية تلقائية متوفرة حتى الآن</p>
            <p className="text-[10px] text-gray-400 leading-relaxed font-sans">سيتم تعبئة هذه القائمة تلقائياً قبل قيامك بتصفير وترحيل الدورة المالية السنوية.</p>
          </div>
        ) : (
          <div className="overflow-hidden border border-gray-150 dark:border-zinc-805 rounded-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-right border-collapse" dir="rtl">
                <thead>
                  <tr className="bg-slate-50 dark:bg-zinc-900 border-b border-gray-100 dark:border-zinc-800 text-gray-400 select-none text-[10px]">
                    <th className="p-3 text-right font-black">تاريخ النسخة</th>
                    <th className="p-3 text-right font-black font-sans">السنة المالية للنسخة</th>
                    <th className="p-3 text-right font-black">عدد السندات المحفوظة</th>
                    <th className="p-3 text-center font-black">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-zinc-900/40">
                  {backups.slice().reverse().map((bak) => {
                    const dateStr = formatDate(new Date(bak.createdAt).toISOString().split('T')[0]);
                    const timeStr = new Date(bak.createdAt).toLocaleTimeString('ar-OM', { hour: '2-digit', minute: '2-digit' });
                    const vouchersCount = bak.dbSnapshot?.vouchers?.length || 0;
                    return (
                      <tr key={bak.id} className="hover:bg-slate-50/20 dark:hover:bg-zinc-900/10 transition-colors">
                        <td className="p-3 font-sans font-bold text-gray-900 dark:text-white">
                          <span>{dateStr}</span>
                          <span className="text-[10px] text-gray-400 font-mono mr-2">({timeStr})</span>
                        </td>
                        <td className="p-3 font-mono font-extrabold text-sky-600 dark:text-sky-400">{bak.fiscalYear}</td>
                        <td className="p-3 font-mono font-bold text-gray-600 dark:text-gray-300">
                          {vouchersCount} سند نشط
                        </td>
                        <td className="p-3 text-center flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleRestoreBackup(bak.id)}
                            className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[10px] font-black transition-all cursor-pointer shadow-sm"
                          >
                            استعادة النسخة (Restore)
                          </button>
                          <button
                            type="button"
                            onClick={() => handleExportAutoBackup(bak)}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-black transition-all cursor-pointer shadow-sm"
                          >
                            تصدير كملف خارجي
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteBackup(bak.id)}
                            className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition-all cursor-pointer"
                            title="حذف النسخة الاحتياطية"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Custom Confirmation Modals (Ensures perfect operation within iframes in AI Studio) */}

      {/* 4. Restore from Auto-Backup Confirmation Modal */}
      {selectedBackupToRestore && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in text-right" dir="rtl">
          <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl max-w-md w-full border border-amber-500/50 dark:border-amber-600/30 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-5 h-5 animate-pulse text-amber-500" />
              <h3 className="text-sm font-black text-amber-600 font-sans">تأكيد استعادة النسخة الاحتياطية السنوية</h3>
            </div>
            
            <p className="text-xs text-rose-600 dark:text-rose-450 font-bold leading-relaxed font-sans">
              ⚠️ تحذير: استعادة هذه النسخة الاحتياطية ستستبدل البيانات المالية الحالية والدافعين وهوية التصميم بالكامل ببيانات تلك النسخة!
            </p>

            <div className="p-3 bg-amber-50/20 dark:bg-zinc-900/40 rounded-xl space-y-1 text-xs text-gray-600 dark:text-gray-300 font-sans">
              <p><strong>تاريخ النسخة:</strong> {formatDate(new Date(selectedBackupToRestore.createdAt).toISOString().split('T')[0])} ({new Date(selectedBackupToRestore.createdAt).toLocaleTimeString('ar-OM', { hour: '2-digit', minute: '2-digit' })})</p>
              <p><strong>السنة المالية للنسخة:</strong> {selectedBackupToRestore.fiscalYear}</p>
              <p><strong>عدد السندات المحفوظة:</strong> {selectedBackupToRestore.dbSnapshot?.vouchers?.length || 0} سند مالي</p>
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400">
                لتأكيد العملية، يرجى كتابة كلمة <strong className="text-amber-600 select-all font-mono font-black">RESTORE</strong> باللغة الإنجليزية في الحقل أدناه:
              </label>
              <input
                type="text"
                value={typedConfirmRestore}
                onChange={(e) => {
                  setTypedConfirmRestore(e.target.value);
                  setRestoreErrorMsg('');
                }}
                className="w-full px-3 py-2 border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-xl text-center font-mono text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"
                placeholder="RESTORE"
                autoComplete="off"
              />
            </div>

            {restoreErrorMsg && (
              <p className="text-[10px] text-rose-500 dark:text-rose-450 font-semibold">{restoreErrorMsg}</p>
            )}

            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={confirmRestoreBackup}
                disabled={typedConfirmRestore.trim().toUpperCase() !== 'RESTORE'}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:bg-gray-300 dark:disabled:bg-zinc-800 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition-all cursor-pointer font-sans"
              >
                تأكيد واستعادة البيانات
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedBackupToRestore(null);
                  setTypedConfirmRestore('');
                  setRestoreErrorMsg('');
                }}
                className="px-4 py-2 bg-gray-150 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 text-xs font-bold rounded-xl cursor-pointer font-sans"
              >
                تراجع
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1. Delete Payer Confirm Modal */}
      {payerToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl max-w-md w-full border border-rose-100 dark:border-rose-950/50 shadow-2xl space-y-4 text-right">
            <div className="flex items-center gap-2 justify-end text-rose-600 dark:text-rose-450">
              <span className="font-bold text-sm">تأكيد حذف الدافع</span>
              <AlertTriangle className="w-5 h-5 shrink-0 animate-pulse" />
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
              هل أنت متأكد من حذف الدافع <strong className="text-gray-900 dark:text-white font-black">"{payerToDelete}"</strong>؟ 
              لن يؤثر هذا على السندات المقيدة مسبقاً باسمه، ولكنه سيزيله من خيارات التعبئة السريعة المستقبلية لراحتك.
            </p>
            <div className="flex gap-2 justify-end pt-2">
              <button
                onClick={confirmDeletePayer}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                تأكيد وبتر الاسم
              </button>
              <button
                onClick={() => setPayerToDelete(null)}
                className="px-4 py-2 bg-gray-150 dark:bg-zinc-800 border-0 text-gray-700 dark:text-gray-300 text-xs rounded-xl cursor-pointer"
              >
                تراجع
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Delete Payment Method Confirm Modal */}
      {methodToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl max-w-md w-full border border-rose-100 dark:border-rose-955 shadow-2xl space-y-4 text-right">
            <div className="flex items-center gap-2 justify-end text-rose-600 dark:text-rose-450">
               <span className="font-bold text-sm">تأكيد حذف طريقة الصرف</span>
               <AlertTriangle className="w-5 h-5 shrink-0 animate-pulse" />
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
              هل أنت متأكد من حذف طريقة الدفع والتبويب المالي <strong className="text-gray-900 dark:text-white font-black">"{methodToDelete}"</strong> من خيارات النظام؟
            </p>
            <div className="flex gap-2 justify-end pt-2">
              <button
                onClick={confirmDeleteMethod}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                نعم، إزالة طريقة الدفع
              </button>
              <button
                onClick={() => setMethodToDelete(null)}
                className="px-4 py-2 bg-gray-150 dark:bg-zinc-800 border-0 text-gray-700 dark:text-gray-300 text-xs rounded-xl cursor-pointer"
              >
                تراجع
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Restore Backup Confirm Modal */}
      {pendingBackupJson && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in" dir="rtl">
          <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl max-w-lg w-full border border-sky-500/50 dark:border-sky-650/30 shadow-2xl space-y-4 text-right">
            <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400">
              <ShieldAlert className="w-5 h-5 text-sky-500 animate-pulse" />
              <h3 className="text-sm font-black text-sky-600 font-sans">تأكيد استيراد النسخة الاحتياطية الخارجية</h3>
            </div>
            
            <p className="text-xs text-rose-600 dark:text-rose-450 font-bold leading-relaxed font-sans">
              ⚠️ تحذير: استيراد ملف النسخة الاحتياطية سيستبدل البيانات المالية الحالية والدافعين وهوية التصميم بالكامل ببيانات هذا الملف!
            </p>

            <div className="space-y-2">
              <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 leading-relaxed">
                لتأكيد عملية الاستيراد واستبدال البيانات الحالية، يرجى كتابة كلمة <strong className="text-sky-600 select-all font-mono font-black">IMPORT</strong> باللغة الإنجليزية في الحقل أدناه:
              </label>
              <input
                type="text"
                value={typedConfirmImport}
                onChange={(e) => setTypedConfirmImport(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-xl text-center font-mono text-xs focus:ring-1 focus:ring-sky-500 focus:outline-none"
                placeholder="IMPORT"
                autoComplete="off"
              />
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={confirmBackupRestore}
                disabled={typedConfirmImport.trim() !== 'IMPORT'}
                className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 disabled:bg-gray-300 dark:disabled:bg-zinc-800 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer font-sans"
              >
                تأكيد واستيراد البيانات
              </button>
              <button
                type="button"
                onClick={() => {
                  setPendingBackupJson(null);
                  setTypedConfirmImport('');
                }}
                className="px-4 py-2.5 bg-gray-150 dark:bg-zinc-800 border-0 text-gray-700 dark:text-gray-300 text-xs rounded-xl cursor-pointer font-sans"
              >
                تراجع وإلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Update History Dialog/Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in text-right" dir="rtl">
          <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl max-w-lg w-full border border-gray-100 dark:border-zinc-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-zinc-850 pb-3">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-blue-500 animate-spin-slow" />
                <h3 className="text-sm font-black text-gray-900 dark:text-white">سجل الإصدارات وتطويرات النظام</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="p-1 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1 scrollbar-thin">
              {/* Active Installed Version Indicator */}
              <div className="p-3 bg-blue-50/20 dark:bg-blue-950/10 border border-blue-500/10 dark:border-blue-500/5 rounded-xl flex items-center justify-between flex-row-reverse">
                <span className="text-[11px] font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 px-2.5 py-1 rounded-lg font-sans">
                  مُثَبّت حالياً
                </span>
                <div className="text-right">
                  <p className="text-xs font-bold text-gray-800 dark:text-gray-100 font-sans">الإصدار النشط على جهازك</p>
                  <p className="text-[10px] text-gray-450 font-mono mt-0.5">Version v{currentVersion}</p>
                </div>
              </div>

              {/* Timeline of releases */}
              <div className="relative border-r border-gray-100 dark:border-zinc-805 mr-2.5 space-y-5">
                {(updateState?.history || [
                  { version: "1.1.0", date: "2026-06-20", notes: "إضافة التحقق الحصري الفوري من السندات المكررة قبل الحفظ، وتحوير جودة ومسافات الطباعة وتطوير الهوية البصرية." },
                  { version: "1.0.2", date: "2026-05-12", notes: "تعديل تباين وألوان العرض الداكن بالكامل للوحة المحاسب، وتطوير أوتوماتيكي لقوالب الأرشفة الربعية." },
                  { version: "1.0.1", date: "2026-03-10", notes: "تحسينات جذرية في استقرار خادم المتجر الهجين ومعالجة الذاكرة المؤقتة لقراء الكشوفات العمانية." },
                  { version: "1.0.0", date: "2026-01-15", notes: "الإصدار المكتبى الأساسى المستقر للنظام المالى المتكامل لعميل هجين ويندوز." }
                ]).map((item, index) => {
                  const isActive = item.version === currentVersion;
                  return (
                    <div key={index} className="relative pr-6">
                      {/* Circle indicator */}
                      <span className={`absolute right-[-4.5px] top-1.5 w-2 h-2 rounded-full ${
                        isActive 
                          ? 'bg-emerald-500 ring-4 ring-emerald-500/20' 
                          : 'bg-gray-300 dark:bg-zinc-700'
                      }`} />
                      
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-black text-gray-900 dark:text-white bg-slate-100 dark:bg-zinc-900 px-2 py-0.5 rounded-lg border border-gray-100 dark:border-zinc-800">
                            v{item.version}
                          </span>
                          <span className="text-[10px] text-gray-400 flex items-center gap-1 font-sans">
                            <Calendar className="w-3 h-3 text-orange-400" />
                            {item.date}
                          </span>
                          {isActive && (
                            <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-450 bg-emerald-500/10 px-1.5 py-0.2 rounded font-sans">
                              النسخة الحالية
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-gray-600 dark:text-gray-300 leading-relaxed font-sans mt-1 bg-slate-50/40 dark:bg-zinc-900/10 p-2 rounded-xl border border-gray-100/30 dark:border-zinc-800/20">
                          {item.notes}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-gray-100 dark:border-zinc-850">
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="px-5 py-2 hover:bg-gray-50 dark:hover:bg-zinc-900 text-gray-700 dark:text-gray-200 text-xs font-bold rounded-xl transition-all cursor-pointer border border-gray-100 dark:border-zinc-800 font-sans"
              >
                إغلاق النافذة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* A. Reset Database Confirm Modal Level 1 */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in text-right" dir="rtl">
          <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl max-w-md w-full border border-rose-100 dark:border-rose-955 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
              <ShieldAlert className="w-5 h-5 animate-pulse" />
              <h3 className="text-sm font-black">تحذير أمان: تصفير قاعدة البيانات المحاسبية</h3>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed font-sans">
              إن تصفير النظام سيقوم بمسح كافة سندات القبض والصرف، سجلات الدافعين، وطرق الصرف المالي بالكامل وإعادة المتجر לחالة الصفر المطلق.
            </p>
            <p className="text-xs text-rose-600 dark:text-rose-400 font-bold leading-relaxed select-none font-sans">
              هل أنت متأكد بنسبة 100% وتحيّد رغبتك بالمسح التام؟
            </p>
            <div className="flex gap-2 justify-end pt-2">
              <button
                onClick={() => {
                  setShowResetConfirm(false);
                  setShowResetDoubleConfirm(true);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer font-sans"
              >
                نعم، أنا متأكد
              </button>
              <button
                onClick={() => {
                  setShowResetConfirm(false);
                  setShowResetDoubleConfirm(false);
                }}
                className="px-4 py-2 bg-gray-150 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 text-xs font-bold rounded-xl cursor-pointer font-sans"
              >
                تراجع وإلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* B. Reset Database Confirm Modal Level 2 (Double Confirm) */}
      {showResetDoubleConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in text-right" dir="rtl">
          <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl max-w-md w-full border-2 border-red-500 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-6 h-6 animate-bounce" />
              <h3 className="text-sm font-black text-red-500">تأكيد نهائي وقطعي (تنبيه هام)</h3>
            </div>
            <p className="text-[11px] text-gray-600 dark:text-gray-300 leading-relaxed font-sans">
              هذه الخطوة لا يمكن الرجوع عنها أبدًا وسيتم شطب الملفات وسجلات الأرشفة وسندات التدقيق نهائيًا من متصفحك.
            </p>
            <div className="flex gap-2 justify-end pt-2">
              <button
                onClick={handleHardReset}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-extrabold rounded-xl transition-all cursor-pointer shadow-md font-sans"
              >
                تأكيد البتر والمسح كلياً
              </button>
              <button
                onClick={() => {
                  setShowResetConfirm(false);
                  setShowResetDoubleConfirm(false);
                }}
                className="px-4 py-2 bg-gray-150 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 text-xs font-bold rounded-xl cursor-pointer font-sans"
              >
                إلغاء لحماية البيانات
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2026 C. Yearly Archive First Confirmation Modal */}
      {showArchiveConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in text-right" dir="rtl">
          <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl max-w-md w-full border border-sky-100 dark:border-sky-955 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400">
              <FolderOpen className="w-5 h-5 animate-pulse text-sky-500" />
              <h3 className="text-sm font-black text-sky-600 font-sans">خطوة محاسبية: إغلاق وتدوير الدورة السنوية</h3>
            </div>
            
            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed font-sans">
              أنت على وشك إغلاق الدورة المحاسبية لعام <strong className="text-sky-600 dark:text-sky-400 font-bold">"{fiscalYearInput}"</strong>. سيقوم النظام بحزم كافة السندات النشطة الجارية وحفظها بالأرشيف الدائم، ثم تصفيرها للبدء من جديد برصيد مالي فارغ وترقيم مستقل.
            </p>

            <div className="p-3 bg-blue-50/30 dark:bg-zinc-900/40 rounded-xl space-y-1.5 text-[11.5px] text-gray-500 dark:text-gray-450 font-sans">
              <div className="flex items-center gap-1.5 flex-row-reverse justify-end">
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span>حفظ سندات القبض الحالية بالأرشيف الدائم</span>
              </div>
              <div className="flex items-center gap-1.5 flex-row-reverse justify-end">
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span>حفظ سندات الصرف الحالية بالأرشيف الدائم</span>
              </div>
              <div className="flex items-center gap-1.5 flex-row-reverse justify-end">
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span>تصفير جداول العمل النشطة بالكامل للعام المالي الجديد</span>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowArchiveConfirm(false);
                  setShowArchiveDoubleConfirm(true);
                }}
                className="px-4 py-2 bg-gradient-to-l from-sky-600 to-sky-700 hover:from-sky-700 hover:to-sky-800 text-white text-xs font-bold rounded-xl transition-all cursor-pointer font-sans"
              >
                تحديث وتأكيد المرحلة الأولى
              </button>
              <button
                type="button"
                onClick={() => setShowArchiveConfirm(false)}
                className="px-4 py-2 bg-gray-150 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 text-xs font-bold rounded-xl cursor-pointer font-sans"
              >
                تراجع
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2026 D. Yearly Archive Double Confirmation Modal */}
      {showArchiveDoubleConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in text-right" dir="rtl">
          <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl max-w-md w-full border-2 border-amber-500 dark:border-amber-600/40 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-6 h-6 animate-bounce text-amber-500" />
              <h3 className="text-sm font-black text-amber-600 font-sans">تحذير أمان: فحص الإعتمادات النهائية</h3>
            </div>
            
            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed font-sans">
              يرجى العلم بأنه فور ترحيل وتصفير القيود، سيتم تفريغ واجهة السندات الكلية بالكامل للعام المحاسبي الجديد. ولن يكون بمقدورك تعديل أو حذف القيود المغلقة، وستتحدد لغرض القراءة والطباعة فقط عبر مستودع أرشيف السنوات بمصلحتك.
            </p>

            <p className="text-xs text-amber-700 dark:text-amber-400 font-extrabold font-sans">
              هل تم التحقق من تقفيل الحسابات السنوية والمطابقة مع الأمين المالي؟
            </p>

            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={handleArchiveFiscalYear}
                className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-extrabold rounded-xl transition-all cursor-pointer shadow-md font-sans"
              >
                نعم، ترحيل وإغلاق السنة المالية نهائياً
              </button>
              <button
                type="button"
                onClick={() => setShowArchiveDoubleConfirm(false)}
                className="px-4 py-2 bg-gray-150 dark:bg-zinc-800 text-gray-700 dark:text-gray-350 text-xs font-bold rounded-xl cursor-pointer font-sans"
              >
                تراجع للمراجعة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2026 E. Full Immersive Selected Year Archive Detail Modal */}
      {selectedArchive && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in text-right" dir="rtl">
          <div className="bg-white dark:bg-zinc-950 rounded-2xl max-w-5xl w-full border border-gray-200 dark:border-zinc-850 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-5 border-b border-gray-150 dark:border-zinc-850 bg-slate-50 dark:bg-zinc-900/60 flex justify-between items-center flex-row-reverse pb-3">
              <button
                type="button"
                onClick={() => setSelectedArchive(null)}
                className="p-1.5 hover:bg-gray-150 dark:hover:bg-zinc-800 text-gray-500 dark:text-gray-400 rounded-lg transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="flex items-center gap-2 flex-row-reverse text-right">
                <FolderOpen className="w-5 h-5 text-sky-500" />
                <h3 className="text-sm font-black text-gray-900 dark:text-white">
                  استعراض السجلات والقيود المؤرشفة لعام {selectedArchive.fiscalYear}
                </h3>
              </div>
            </div>

            {/* Metrics cards */}
            <div className="p-6 bg-slate-50/20 dark:bg-zinc-900/10 grid grid-cols-1 sm:grid-cols-4 gap-4 border-b border-gray-100 dark:border-zinc-850 select-none text-xs text-right">
              <div className="p-4 bg-white dark:bg-zinc-950 border border-gray-150/50 dark:border-zinc-900 rounded-xl">
                <p className="text-gray-400 font-bold mb-1">تاريخ تقفيل الأرشيف</p>
                <p className="font-mono font-black text-gray-800 dark:text-gray-200">
                  {formatDate(new Date(selectedArchive.createdAt).toISOString().split('T')[0])}
                </p>
              </div>

              <div className="p-4 bg-white dark:bg-zinc-950 border border-gray-150/50 dark:border-zinc-900 rounded-xl">
                <p className="text-emerald-500 font-bold mb-1">إجمالي المقبوضات (سندات القبض)</p>
                <p className="font-mono text-base font-black text-emerald-600 dark:text-emerald-450">
                  {formatOMR(selectedArchive.totalReceipts)}
                </p>
                <p className="text-[10px] text-gray-400 font-mono mt-0.5">{selectedArchive.receiptCount} سند كفالة/قبض</p>
              </div>

              <div className="p-4 bg-white dark:bg-zinc-950 border border-gray-150/50 dark:border-zinc-900 rounded-xl">
                <p className="text-rose-500 font-bold mb-1">إجمالي المصروفات (سندات الصرف)</p>
                <p className="font-mono text-base font-black text-rose-600 dark:text-rose-450">
                  {formatOMR(selectedArchive.totalExpenses)}
                </p>
                <p className="text-[10px] text-gray-400 font-mono mt-0.5">{selectedArchive.expenseCount} سند صرف</p>
              </div>

              <div className={`p-4 bg-white dark:bg-zinc-950 border border-gray-150/50 dark:border-zinc-900 rounded-xl border-r-4 ${
                selectedArchive.netBalance >= 0 ? 'border-r-emerald-500' : 'border-r-rose-500'
              }`}>
                <p className="text-gray-400 font-bold mb-1">الرصيد الصافي للعام</p>
                <p className={`font-mono text-base font-black ${
                  selectedArchive.netBalance >= 0 ? 'text-emerald-600 dark:text-emerald-450' : 'text-rose-600 dark:text-rose-450'
                }`}>
                  {formatOMR(selectedArchive.netBalance)}
                </p>
                <p className="text-[10px] text-gray-400 font-sans mt-0.5">
                  {selectedArchive.netBalance >= 0 ? '💚 فائض نقدي مرحل' : '❤️ عجز مالي'}
                </p>
              </div>
            </div>

            {/* Filter and search panel */}
            <div className="p-4 bg-white dark:bg-zinc-950 border-b border-gray-100 dark:border-zinc-850 flex flex-col md:flex-row gap-4 justify-between items-center text-xs">
              <div className="flex gap-2 w-full md:w-auto">
                <button
                  type="button"
                  onClick={() => setArchiveVoucherTypeFilter('all')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    archiveVoucherTypeFilter === 'all' 
                      ? 'bg-sky-500 text-white' 
                      : 'bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900 dark:text-gray-300'
                  }`}
                >
                  كافة الحركات السنوية ({selectedArchive.receiptCount + selectedArchive.expenseCount})
                </button>
                <button
                  type="button"
                  onClick={() => setArchiveVoucherTypeFilter('receipt')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    archiveVoucherTypeFilter === 'receipt' 
                      ? 'bg-emerald-600 text-white' 
                      : 'bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900 dark:text-gray-300'
                  }`}
                >
                  سندات القبض ({selectedArchive.receiptCount})
                </button>
                <button
                  type="button"
                  onClick={() => setArchiveVoucherTypeFilter('payment')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    archiveVoucherTypeFilter === 'payment' 
                      ? 'bg-rose-600 text-white' 
                      : 'bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900 dark:text-gray-300'
                  }`}
                >
                  سندات الصرف ({selectedArchive.expenseCount})
                </button>
              </div>

              <div className="w-full md:w-72">
                <input
                  type="text"
                  value={archiveSearchTerm}
                  onChange={(e) => setArchiveSearchTerm(e.target.value)}
                  placeholder="ابحث برقم السند، البيان، أو الطرف الآخر..."
                  className="w-full px-3 py-1.5 border rounded-xl bg-white dark:bg-zinc-950 border-gray-200 dark:border-zinc-800 text-gray-800 dark:text-gray-250 text-xs focus:outline-none text-right"
                  dir="rtl"
                />
              </div>
            </div>

            {/* List of Vouchers */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {(() => {
                const combinedVouchers: (Voucher & { isArchive?: boolean })[] = [];
                if (archiveVoucherTypeFilter === 'all' || archiveVoucherTypeFilter === 'receipt') {
                  combinedVouchers.push(...selectedArchive.receiptVouchers);
                }
                if (archiveVoucherTypeFilter === 'all' || archiveVoucherTypeFilter === 'payment') {
                  combinedVouchers.push(...selectedArchive.expenseVouchers);
                }

                // Sort by date or voucher sequence
                combinedVouchers.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime() || b.voucherNo.localeCompare(a.voucherNo));

                const filtered = combinedVouchers.filter(v => {
                  if (!archiveSearchTerm.trim()) return true;
                  const term = archiveSearchTerm.toLowerCase();
                  return (
                    v.voucherNo.toLowerCase().includes(term) ||
                    (v.payerOrBeneficiary && v.payerOrBeneficiary.toLowerCase().includes(term)) ||
                    (v.notes && v.notes.toLowerCase().includes(term)) ||
                    (v.description && v.description.toLowerCase().includes(term))
                  );
                });

                if (filtered.length === 0) {
                  return (
                    <div className="p-12 text-center text-gray-400 space-y-1">
                      <p className="text-xs font-bold font-sans">لا يوجد نتائج تطابق معايير لوحة البحث المفلترة</p>
                      <p className="text-[10px] text-gray-300">جرب تعديل كلمات البحث أو تصفية نوع السندات.</p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-2.5">
                    {filtered.map((v) => {
                      const isReceipt = v.type === 'receipt';
                      return (
                        <div 
                          key={v.id} 
                          className="p-4 bg-white dark:bg-zinc-950 border border-gray-150/80 dark:border-zinc-900 rounded-xl hover:border-gray-350 dark:hover:border-zinc-800 transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-right"
                        >
                          <div className="flex items-center gap-3 flex-row-reverse justify-end w-full sm:w-auto">
                            <span className={`w-2.5 h-10 rounded-full shrink-0 ${isReceipt ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                            
                            <div className="space-y-0.5 text-right w-full">
                              <div className="flex items-center gap-2 flex-row-reverse justify-end">
                                <span className="font-mono font-black text-gray-900 dark:text-white text-xs select-all">
                                  {v.voucherNo}
                                </span>
                                <span className={`text-[9px] font-black px-1.5 py-0.2 rounded font-sans ${
                                  isReceipt 
                                    ? 'bg-emerald-550/10 text-emerald-600' 
                                    : 'bg-rose-550/10 text-rose-600'
                                }`}>
                                  {isReceipt ? 'سند قبض' : 'سند صرف'}
                                </span>
                                <span className="text-[10px] text-gray-400 font-mono">
                                  {v.date}
                                </span>
                              </div>
                              
                              <p className="text-xs text-gray-700 dark:text-gray-300">
                                <span className="text-gray-400">الطرف الآخر: </span>
                                <strong className="font-semibold text-gray-800 dark:text-gray-100">{v.payerOrBeneficiary}</strong>
                              </p>
                              
                              <p className="text-[10px] text-gray-400 font-sans leading-relaxed">
                                <span className="text-gray-400/90">البيان: </span>
                                {v.notes || 'بدون تفاصيل إضافية'}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 justify-between sm:justify-end w-full sm:w-auto border-t sm:border-t-0 border-gray-50 dark:border-zinc-900 pt-2 sm:pt-0">
                            <div className="text-right sm:text-left min-w-[120px]">
                              <p className={`font-mono font-black text-xs ${isReceipt ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {isReceipt ? '+' : '-'}{formatOMR(v.amount)}
                              </p>
                              <span className="text-[9px] text-gray-400 bg-slate-50 dark:bg-zinc-900 px-1.5 py-0.2 rounded-md font-sans">
                                {v.description} • {v.paymentMethod}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-150 dark:border-zinc-850 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedArchive(null)}
                className="px-5 py-2 hover:bg-gray-50 dark:hover:bg-zinc-900 text-gray-700 dark:text-gray-200 text-xs font-bold rounded-xl transition-all border border-gray-150 dark:border-zinc-800 cursor-pointer font-sans"
              >
                إغلاق المستودع السنوي
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
