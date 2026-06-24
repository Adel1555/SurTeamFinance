/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AppDatabase, Voucher, VisualIdentity, VoucherType, YearlyArchive } from './types';

const STORAGE_KEY = 'sur_volunteer_finance_db';

const DEFAULT_PAYERS = [
  'فاعل خير',
  'سالم بن علي الغيلاني',
  'منى بنت أحمد المعمرية',
  'عبدالله بن جاسم المخيني',
  'مؤسسة صور الخيرية',
  'مجموعة بهوان للخير'
];

const DEFAULT_PAYMENT_METHODS = [
  'نقداً',
  'تحويل بنكي',
  'شيك',
  'أخرى'
];

const DEFAULT_VISUAL_IDENTITY: VisualIdentity = {
  title: 'فريق صور التطوعي',
  receiptTerm: 'سند قبض مالي',
  paymentTerm: 'سند صرف مالي',
  primaryColor: '#0f766e', // Teal 700 - represents coastal green/blue of Sur
  secondaryColor: '#0369a1', // Sky 700 - oceans
  buttonStyle: 'rounded',
  cardStyle: 'bordered',
  showSignatureBlock: true,
  showStamp: true,
  showHelpTips: true,
  termsAndConditions: 'نشكركم على دعمكم المستمر لأعمال ومناشط فريق صور التطوعي في خدمة الولاية والمجتمع.',
  logoText: 'فريق صور',
  alertOnDuplicateVoucherNo: false,
  
  // Custom default theme colors (Light Blue Professional defaults):
  themeMode: 'light',
  selectedThemeName: 'Light Blue Professional',
  appBg: '#eaf6ff',
  headerBg: '#ffffff',
  headerText: '#0c203b',
  sidebarBg: '#ffffff',
  sidebarText: '#334155',
  sidebarActive: '#0f766e',
  footerBg: '#ffffff',
  footerText: '#475569',
  cardBg: '#ffffff',
  cardBorder: '#dbeafe',
  cardGlow: 'rgba(15, 118, 110, 0.12)',
  frameBorder: '#bfdbfe',
  tableHeaderBg: '#eff6ff',
  tableRowBg: '#ffffff',
  textMain: '#0f172a',
  textSecondary: '#64748b',
  buttonBg: '#0f766e',
  buttonText: '#ffffff',
  buttonHover: '#115e59',
  inputBg: '#ffffff',
  inputBorder: '#cbd5e1',
  dialogBg: '#ffffff',
  dialogBorder: '#dbeafe'
};

const INITIAL_DB: AppDatabase = {
  vouchers: [],
  payersList: DEFAULT_PAYERS,
  paymentMethods: DEFAULT_PAYMENT_METHODS,
  visualIdentity: DEFAULT_VISUAL_IDENTITY,
  yearlyArchives: [],
  backups: []
};

// Isolated Storage Service to abstract DB operations
export class DatabaseService {
  private static loadDB(): AppDatabase {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        // Ensure standard structure is backfilled
        return {
          vouchers: parsed.vouchers || [],
          payersList: parsed.payersList || DEFAULT_PAYERS,
          paymentMethods: parsed.paymentMethods || DEFAULT_PAYMENT_METHODS,
          visualIdentity: { ...DEFAULT_VISUAL_IDENTITY, ...(parsed.visualIdentity || {}) },
          yearlyArchives: parsed.yearlyArchives || [],
          backups: parsed.backups || []
        };
      }
    } catch (e) {
      console.error('Error loading database', e);
    }
    return INITIAL_DB;
  }

  private static saveDB(db: AppDatabase): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
    } catch (e) {
      console.error('Error saving database', e);
    }
  }

  public static getDatabase(): AppDatabase {
    return this.loadDB();
  }

  public static getVouchers(): Voucher[] {
    return this.loadDB().vouchers;
  }

  public static getPayers(): string[] {
    return this.loadDB().payersList;
  }

  public static getPaymentMethods(): string[] {
    return this.loadDB().paymentMethods;
  }

  public static getVisualIdentity(): VisualIdentity {
    return this.loadDB().visualIdentity;
  }

  // Generate unique next voucher number
  public static getNextVoucherNo(type: VoucherType): string {
    const db = this.loadDB();
    const typeVouchers = db.vouchers.filter(v => v.type === type);
    const prefix = type === 'receipt' ? 'RV' : 'PV';
    
    if (typeVouchers.length === 0) {
      return `${prefix}-1001`;
    }

    // Parse the numbers and find the maximum
    const numbers = typeVouchers.map(v => {
      const match = v.voucherNo.match(/\d+$/);
      return match ? parseInt(match[0], 10) : 1000;
    });

    const maxNum = Math.max(...numbers);
    return `${prefix}-${maxNum + 1}`;
  }

  public static addVoucher(voucherData: Omit<Voucher, 'id' | 'createdAt'>): Voucher {
    const db = this.loadDB();
    const newVoucher: Voucher = {
      ...voucherData,
      id: `vch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now()
    };
    db.vouchers.unshift(newVoucher); // Add to the top of list
    this.saveDB(db);
    return newVoucher;
  }

  public static updateVoucher(id: string, updatedData: Partial<Voucher>): void {
    const db = this.loadDB();
    db.vouchers = db.vouchers.map(v => v.id === id ? { ...v, ...updatedData } : v);
    this.saveDB(db);
  }

  public static deleteVoucher(id: string): void {
    const db = this.loadDB();
    db.vouchers = db.vouchers.filter(v => v.id !== id);
    this.saveDB(db);
  }

  public static addPayer(name: string): void {
    const db = this.loadDB();
    const cleanName = name.trim();
    if (cleanName && !db.payersList.includes(cleanName)) {
      db.payersList.push(cleanName);
      this.saveDB(db);
    }
  }

  public static deletePayer(name: string): void {
    const db = this.loadDB();
    db.payersList = db.payersList.filter(p => p !== name);
    this.saveDB(db);
  }

  public static updatePayer(oldName: string, newName: string): void {
    const db = this.loadDB();
    const cleanNewName = newName.trim();
    if (cleanNewName) {
      db.payersList = db.payersList.map(p => p === oldName ? cleanNewName : p);
      // Also update matching historical vounchers if desired (good fallback)
      db.vouchers = db.vouchers.map(v => {
        if (v.type === 'receipt' && v.payerOrBeneficiary === oldName) {
          return { ...v, payerOrBeneficiary: cleanNewName };
        }
        return v;
      });
      this.saveDB(db);
    }
  }

  public static addPaymentMethod(method: string): void {
    const db = this.loadDB();
    const cleanMethod = method.trim();
    if (cleanMethod && !db.paymentMethods.includes(cleanMethod)) {
      db.paymentMethods.push(cleanMethod);
      this.saveDB(db);
    }
  }

  public static deletePaymentMethod(method: string): void {
    const db = this.loadDB();
    db.paymentMethods = db.paymentMethods.filter(m => m !== method);
    this.saveDB(db);
  }

  public static updatePaymentMethod(oldMethod: string, newMethod: string): void {
    const db = this.loadDB();
    const cleanNewMethod = newMethod.trim();
    if (cleanNewMethod) {
      db.paymentMethods = db.paymentMethods.map(m => m === oldMethod ? cleanNewMethod : m);
      db.vouchers = db.vouchers.map(v => {
        if (v.paymentMethod === oldMethod) {
          return { ...v, paymentMethod: cleanNewMethod };
        }
        return v;
      });
      this.saveDB(db);
    }
  }

  public static saveVisualIdentity(config: VisualIdentity): void {
    const db = this.loadDB();
    db.visualIdentity = config;
    this.saveDB(db);
  }

  public static resetDatabase(): void {
    // Keeps configurations but wipes entries, or completely triggers clean state.
    // The requirement says: "زر لتصفير قاعدة البيانات كاملة وإرجاع البرنامج إلى الصفر."
    // Let's reset everything to the pristine default INITIAL_DB state so it is 100% back to square zero.
    this.saveDB(INITIAL_DB);
  }

  // Helper to import full JSON database state
  public static importDatabase(jsonData: string, preserveBackups: boolean = true): { success: boolean; error?: string } {
    try {
      const parsed = JSON.parse(jsonData);
      
      // Detailed validation of the required structure
      if (!parsed || typeof parsed !== 'object') {
        return { success: false, error: 'تنسيق الملف غير صالح. يرجى التأكد من اختيار ملف JSON صحيح.' };
      }
      if (!('vouchers' in parsed) || !Array.isArray(parsed.vouchers)) {
        return { success: false, error: 'الملف يفتقد إلى قائمة السندات النشطة (vouchers) أو أنها بتنسيق غير صالح.' };
      }
      if (!('yearlyArchives' in parsed) || !Array.isArray(parsed.yearlyArchives)) {
        return { success: false, error: 'الملف يفتقد إلى قائمة الأرشيف السنوي (yearlyArchives) أو أنها بتنسيق غير صالح.' };
      }
      if (!('payersList' in parsed) || !Array.isArray(parsed.payersList)) {
        return { success: false, error: 'الملف يفتقد إلى قائمة الدافعين المعتمدة (payersList) أو أنها بتنسيق غير صالح.' };
      }
      if (!('paymentMethods' in parsed) || !Array.isArray(parsed.paymentMethods)) {
        return { success: false, error: 'الملف يفتقد إلى قائمة طرق الصرف (paymentMethods) أو أنها بتنسيق غير صالح.' };
      }
      if (!('visualIdentity' in parsed) || typeof parsed.visualIdentity !== 'object' || parsed.visualIdentity === null) {
        return { success: false, error: 'الملف يفتقد إلى إعدادات الهوية البصرية (visualIdentity) أو أنها بتنسيق غير صالح.' };
      }

      const currentDb = this.loadDB();

      // Create an automatic backup of the current state before importing the external file.
      try {
        const snapshot: AppDatabase = JSON.parse(JSON.stringify(currentDb));
        const newBackup = {
          id: `bak_pre_import_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          createdAt: Date.now(),
          fiscalYear: 'قبل الاستيراد الخارجي',
          dbSnapshot: snapshot
        };
        const backupsList = currentDb.backups || [];
        backupsList.push(newBackup);
        currentDb.backups = backupsList;
        this.saveDB(currentDb);
      } catch (backupErr) {
        console.error('Error creating auto-backup before import', backupErr);
      }

      const updatedBackups = currentDb.backups || [];

      this.saveDB({
        vouchers: parsed.vouchers,
        payersList: parsed.payersList,
        paymentMethods: parsed.paymentMethods,
        visualIdentity: { ...DEFAULT_VISUAL_IDENTITY, ...parsed.visualIdentity },
        yearlyArchives: parsed.yearlyArchives,
        backups: preserveBackups ? (updatedBackups.length > 0 ? updatedBackups : (parsed.backups || [])) : (parsed.backups || [])
      });

      return { success: true };
    } catch (e: any) {
      console.error('Error importing JSON data', e);
      return { success: false, error: e.message || 'خطأ فني أثناء تحليل وقراءة ملف النسخة الاحتياطية.' };
    }
  }

  // --- Fiscal Year Archives ---
  public static getYearlyArchives(): YearlyArchive[] {
    const db = this.loadDB();
    return db.yearlyArchives || [];
  }

  public static archiveFiscalYear(fiscalYear: string): { success: boolean; error?: string } {
    try {
      const db = this.loadDB();
      const archives = db.yearlyArchives || [];

      // Clean check
      if (!fiscalYear || !fiscalYear.trim()) {
        return { success: false, error: 'يجب إدخال مسمى صحيح للسنة المالية المُراد إغلاقها' };
      }

      const cleanYear = fiscalYear.trim();

      // Check if already exists
      if (archives.some(a => a.fiscalYear === cleanYear)) {
        return { success: false, error: `السنة المالية (${cleanYear}) مؤرشفة مسبقاً بالنظام` };
      }

      const activeVouchers = db.vouchers || [];
      const receiptVouchers = activeVouchers.filter(v => v.type === 'receipt');
      const expenseVouchers = activeVouchers.filter(v => v.type === 'payment');

      const totalReceipts = receiptVouchers.reduce((sum, v) => sum + (v.amount || 0), 0);
      const totalExpenses = expenseVouchers.reduce((sum, v) => sum + (v.amount || 0), 0);
      const netBalance = totalReceipts - totalExpenses;

      // Create new archive entry
      const newArchive: YearlyArchive = {
        id: `arc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        fiscalYear: cleanYear,
        receiptVouchers,
        expenseVouchers,
        totalReceipts,
        totalExpenses,
        netBalance,
        receiptCount: receiptVouchers.length,
        expenseCount: expenseVouchers.length,
        createdAt: Date.now()
      };

      // Push and clear ONLY active transaction rows
      archives.push(newArchive);
      db.yearlyArchives = archives;
      db.vouchers = []; // ONLY active transaction records are cleared, settings/donors/visual identity/archives are strictly untouched!

      this.saveDB(db);
      return { success: true };
    } catch (e: any) {
      console.error('Error archiving fiscal year', e);
      return { success: false, error: e.message || 'خطأ فني أثناء الإغلاق السنوي' };
    }
  }

  public static getBackups(): any[] {
    const db = this.loadDB();
    return db.backups || [];
  }

  public static createBackup(fiscalYear: string): { success: boolean; error?: string } {
    try {
      const db = this.loadDB();
      // Clone DB state completely to capture a clean snapshot of everything before reset/archive.
      const snapshot: AppDatabase = JSON.parse(JSON.stringify(db));
      
      const newBackup = {
        id: `bak_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: Date.now(),
        fiscalYear: fiscalYear.trim(),
        dbSnapshot: snapshot
      };

      const backups = db.backups || [];
      backups.push(newBackup);
      db.backups = backups;

      this.saveDB(db);
      return { success: true };
    } catch (e: any) {
      console.error('Error creating auto-backup', e);
      return { success: false, error: e.message || 'خطأ أثناء إنشاء النسخة الاحتياطية التلقائية' };
    }
  }

  public static restoreFromBackup(backupId: string): { success: boolean; error?: string } {
    try {
      const db = this.loadDB();
      const backupsList = db.backups || [];
      const backup = backupsList.find((b: any) => b.id === backupId);
      if (!backup) {
        return { success: false, error: 'النسخة الاحتياطية المطلوبة غير موجودة.' };
      }
      
      const snapshot = backup.dbSnapshot;
      if (!snapshot) {
        return { success: false, error: 'بيانات النسخة الاحتياطية تالفة أو فارغة.' };
      }

      // Restore all tables/collections
      db.vouchers = snapshot.vouchers || [];
      db.payersList = snapshot.payersList || [];
      db.paymentMethods = snapshot.paymentMethods || [];
      db.visualIdentity = snapshot.visualIdentity || db.visualIdentity;
      db.yearlyArchives = snapshot.yearlyArchives || [];
      
      // Save updated state, keeping current list of backups intact so the user can still access other backups.
      this.saveDB(db);
      return { success: true };
    } catch (e: any) {
      console.error('Error restoring from backup', e);
      return { success: false, error: e.message || 'خطأ أثناء استعادة النسخة الاحتياطية' };
    }
  }

  public static deleteBackup(backupId: string): { success: boolean; error?: string } {
    try {
      const db = this.loadDB();
      const backupsList = db.backups || [];
      db.backups = backupsList.filter((b: any) => b.id !== backupId);
      this.saveDB(db);
      return { success: true };
    } catch (e: any) {
      console.error('Error deleting backup', e);
      return { success: false, error: e.message || 'خطأ أثناء حذف النسخة الاحتياطية' };
    }
  }
}
