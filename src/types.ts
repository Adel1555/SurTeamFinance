/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type VoucherType = 'receipt' | 'payment';

export interface AttachmentMetadata {
  id: string;      // Unique file ID / path reference, e.g. "att_123"
  name: string;    // Original file name
  size: number;    // File size in bytes
  type: string;    // MIME type (image/jpeg, image/png, application/pdf)
}

export interface Voucher {
  id: string;
  voucherNo: string; // e.g., REC-001 or PAY-001
  type: VoucherType;
  date: string; // YYYY-MM-DD
  amount: number;
  payerOrBeneficiary: string; // Name of Payer/Donor for receipt, or Beneficiary for payment
  paymentMethod: string;
  description: string;
  notes: string;
  createdAt: number;
  attachments?: AttachmentMetadata[];
  projectId?: string;
  projectNameSnapshot?: string;
}

export type ButtonStyle = 'rounded' | 'sharp' | 'pill';
export type CardStyle = 'flat' | 'bordered' | 'shadowed' | 'glass';

export interface VisualIdentity {
  title: string;
  receiptTerm: string;
  paymentTerm: string;
  primaryColor: string; // Hex value or color identifier
  secondaryColor: string; // Hex value or color identifier
  buttonStyle: ButtonStyle;
  cardStyle: CardStyle;
  showSignatureBlock: boolean;
  showStamp: boolean;
  showHelpTips: boolean;
  termsAndConditions: string;
  logoText: string;
  customLogo?: string;
  alertOnDuplicateVoucherNo?: boolean;

  // Modern Theme Central Properties
  themeMode?: 'light' | 'dark' | 'custom';
  selectedThemeName?: string;
  
  // Custom theme colors for entire application:
  appBg?: string;
  headerBg?: string;
  headerText?: string;
  sidebarBg?: string;
  sidebarText?: string;
  sidebarActive?: string;
  footerBg?: string;
  footerText?: string;
  cardBg?: string;
  cardBorder?: string;
  cardGlow?: string;
  frameBorder?: string;
  tableHeaderBg?: string;
  tableRowBg?: string;
  textMain?: string;
  textSecondary?: string;
  buttonBg?: string;
  buttonText?: string;
  buttonHover?: string;
  inputBg?: string;
  inputBorder?: string;
  dialogBg?: string;
  dialogBorder?: string;
}

export interface AutoBackup {
  id: string;
  createdAt: number;
  fiscalYear: string;
  dbSnapshot: AppDatabase;
}

export interface AutoBackupSnapshot {
  id: string;
  timestamp: number;
  dateStr: string;
  dbData: AppDatabase & { attachments_media_folder?: Record<string, string> };
}

export interface CharityProject {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface AppDatabase {
  vouchers: Voucher[];
  payersList: string[]; // Premade list of payers/donors
  paymentMethods: string[]; // Options like 'نقداً', 'تحويل بنكي', etc.
  visualIdentity: VisualIdentity;
  yearlyArchives?: YearlyArchive[];
  backups?: AutoBackup[];
  projects?: CharityProject[];
}

export interface YearlyArchive {
  id: string;
  fiscalYear: string;
  receiptVouchers: Voucher[];
  expenseVouchers: Voucher[];
  totalReceipts: number;
  totalExpenses: number;
  netBalance: number;
  receiptCount: number;
  expenseCount: number;
  createdAt: number;
}

export interface EmployeePermissions {
  createReceipt: boolean;        // إنشاء سند قبض
  createPayment: boolean;        // إنشاء سند صرف
  viewRecords: boolean;          // عرض السجلات
  viewVoucher: boolean;          // عرض السند
  printVoucher: boolean;         // طباعة السند
  exportVoucherPDF: boolean;     // تصدير السند PDF
  editReceipt: boolean;          // تعديل سند قبض
  editPayment: boolean;          // تعديل سند صرف
  deleteReceipt: boolean;        // حذف سند قبض
  deletePayment: boolean;        // حذف سند صرف
  viewAttachments: boolean;      // عرض المرفقات
  addAttachments: boolean;       // إضافة المرفقات
  deleteAttachments: boolean;    // حذف المرفقات
  viewArchive: boolean;          // عرض الأرشيف
  printFiltered: boolean;        // طباعة النتائج المفلترة
  exportFilteredPDF: boolean;    // تصدير النتائج المفلترة PDF
  accessSettings: boolean;       // الوصول إلى الإعدادات
  changeIdentity: boolean;       // تغيير الهوية البصرية
  exportBackup: boolean;         // تصدير نسخة احتياطية
  importBackup: boolean;         // استيراد نسخة احتياطية
  resetSystem: boolean;          // تصفير النظام
  viewDashboard: boolean;        // عرض لوحة التحكم
  showMainDashboard: boolean;    // إظهار الواجهة الرئيسية
  checkUpdates: boolean;         // التحقق من التحديثات
  managePermissions: boolean;    // إدارة الصلاحيات
  viewSponsorsDonations?: boolean;      // عرض قسم الرعاة والتبرعات
  viewProjectFinancialTotals?: boolean; // عرض إجماليات المشاريع وأرصدتها
  exportSponsorProjectReports?: boolean;// طباعة وتصدير تقارير الرعاة والمشاريع
  manageProjects?: boolean;             // إدارة المشاريع والمبادرات
}
