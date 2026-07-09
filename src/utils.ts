/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Voucher, AutoBackupSnapshot } from './types';
import { DatabaseService } from './db';
import { AttachmentStorageService } from './components/AttachmentStorageService';

// Formatter for Omani Rial (OMR) with exactly 3 decimal places (Baisa decimals)
export function formatOMR(amount: number, includeSymbol = true): string {
  const num = Number(amount) || 0;
  const formatted = num.toFixed(3);
  return includeSymbol ? `${formatted} ر.ع.` : formatted;
}

// Format date to readable Arabic/Gregorian format
export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ar-OM', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (e) {
    return dateStr;
  }
}

// Convert numbers to Arabic words for writing checks/receipts (Tafqeet - تفقيط)
// This adds an elite premium professional touch to Arabic accounting apps
export function tafqeet(amount: number): string {
  const fraction = Math.round((amount - Math.floor(amount)) * 1000);
  const integer = Math.floor(amount);

  if (integer === 0 && fraction === 0) return 'صفر ريال عماني';

  const ones = ['', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة', 'عشرة'];
  const teens = ['عشرة', 'أحد عشر', 'إثنا عشر', 'ثلاثة عشر', 'أربعة عشر', 'خمسة عشر', 'ستة عشر', 'سبعة عشر', 'ثمانية عشر', 'تسعة عشر'];
  const tens = ['', '', 'عشرون', 'ثلاثون', 'أربعون', 'خمسون', 'ستون', 'سبعون', 'ثمانون', 'تسعون'];
  const hundreds = ['', 'مائة', 'مائتان', 'ثلاثمائة', 'أربعمائة', 'خمسمائة', 'ستمائة', 'سبعمائة', 'ثمانمائة', 'تسعمائة'];
  const thousands = ['', 'ألف', 'ألفان', 'ثلاثة آلاف', 'أربعة آلاف', 'خمسة آلاف', 'ستة آلاف', 'سبعة آلاف', 'ثمانية آلاف', 'تسعة آلاف', 'عشرة آلاف'];

  function readSegment(num: number): string {
    let result = '';
    const h = Math.floor(num / 100) % 10;
    const t = Math.floor(num / 10) % 10;
    const o = num % 10;

    if (h > 0) {
      result += hundreds[h];
    }

    if (t > 0 || o > 0) {
      if (result !== '') result += ' و';
      if (t === 1) {
        result += teens[o];
      } else {
        if (o > 0) {
          result += ones[o];
          if (t > 0) result += ' و' + tens[t];
        } else if (t > 0) {
          result += tens[t];
        }
      }
    }
    return result;
  }

  let text = '';
  if (integer > 0) {
    if (integer >= 1000) {
      const th = Math.floor(integer / 1000);
      const rem = integer % 1000;
      if (th === 1) text += 'ألف';
      else if (th === 2) text += 'ألفان';
      else if (th <= 10) text += thousands[th];
      else text += readSegment(th) + ' ألف';

      if (rem > 0) text += ' و' + readSegment(rem);
    } else {
      text += readSegment(integer);
    }

    if (integer === 1) text += ' ريال عماني';
    else if (integer === 2) text += ' ريالان عمانيان';
    else if (integer >= 3 && integer <= 10) text += ' ريالات عمانية';
    else text += ' ريال لوجه الله أو ريال عماني'; // Standard designation is ريال عماني
  }

  if (fraction > 0) {
    if (text !== '') text += ' و ';
    text += `${fraction} بيسة`;
  } else {
    if (text !== '') text += ' لا غير';
  }

  // Refine text
  return text
    .replace('واحد ريال عماني', 'ريال عماني واحد')
    .replace('اثنان ريال عماني', 'ريالان عمانيان')
    .replace('  ', ' ')
    .trim();
}

/**
 * Helper to compare semantic version strings (e.g., "1.0.0" and "1.1.0")
 * Returns true if the latest version is strictly newer than the current version.
 * Handles variations like prefixed "v" (e.g. "v1.1.0").
 */
export function isVersionNewer(current: string, latest: string): boolean {
  try {
    const parse = (v: string) => {
      if (!v) return [0];
      return v.trim().replace(/^v/i, '').split('.').map(num => {
        const parsed = parseInt(num, 10);
        return isNaN(parsed) ? 0 : parsed;
      });
    };
    const cParts = parse(current);
    const lParts = parse(latest);
    
    const maxLen = Math.max(cParts.length, lParts.length);
    for (let i = 0; i < maxLen; i++) {
      const c = cParts[i] ?? 0;
      const l = lParts[i] ?? 0;
      if (l > c) return true;
      if (l < c) return false;
    }
  } catch (e) {
    console.error('Error comparing versions:', e);
  }
  return false;
}

/**
 * Converts Tailwind v4's modern 'oklch' wide-gamut color format to standard 'rgb/rgba' colors.
 * This is a crucial workaround for libraries like html2canvas that crash upon encountering
 * 'oklch' color functions in stylesheets or computed styles.
 */
export function convertOklchStringToRgb(str: string): string {
  if (!str || typeof str !== 'string' || !str.toLowerCase().includes('oklch')) {
    return str;
  }

  return str.replace(/oklch\(\s*([\d\.\%]+)\s+([\d\.\%]+)\s+([\d\.\%deg\.]+)(?:\s*[\/\s,]\s*([\d\.\%]+))?\s*\)/gi, (match, p1, p2, p3, p4) => {
    try {
      let L = p1.endsWith('%') ? parseFloat(p1) / 100 : parseFloat(p1);
      let C = p2.endsWith('%') ? parseFloat(p2) / 100 : parseFloat(p2);
      let H = p3.endsWith('deg') ? parseFloat(p3) : parseFloat(p3);
      let A = p4 !== undefined ? (p4.endsWith('%') ? parseFloat(p4) / 100 : parseFloat(p4)) : 1;

      // Convert OKLCH to OKLAB
      const hRad = (H * Math.PI) / 180;
      const a = C * Math.cos(hRad);
      const b = C * Math.sin(hRad);

      // Convert OKLAB to LMS
      const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
      const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
      const s_ = L - 0.0894841775 * a - 1.2914855480 * b;

      const l = l_ * l_ * l_;
      const m = m_ * m_ * m_;
      const s = s_ * s_ * s_;

      // Convert LMS to Linear sRGB
      let r = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
      let g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
      let b_ = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s;

      // Convert Linear sRGB to sRGB (gamma correction)
      const f = (x: number) => (x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055);

      let R = Math.round(Math.max(0, Math.min(1, f(r))) * 255);
      let G = Math.round(Math.max(0, Math.min(1, f(g))) * 255);
      let B = Math.round(Math.max(0, Math.min(1, f(b_))) * 255);

      if (A === 1) {
        return `rgb(${R}, ${G}, ${B})`;
      } else {
        return `rgba(${R}, ${G}, ${B}, ${A})`;
      }
    } catch (e) {
      console.error('Error parsing oklch color in patch:', e);
      return match;
    }
  });
}

/**
 * Converts Tailwind v4's modern 'oklab' color format to standard 'rgb/rgba' colors.
 * This is a crucial workaround for libraries like html2canvas that crash upon encountering
 * 'oklab' color functions in stylesheets or computed styles.
 */
export function convertOklabStringToRgb(str: string): string {
  if (!str || typeof str !== 'string' || !str.toLowerCase().includes('oklab')) {
    return str;
  }

  return str.replace(/oklab\(\s*([\d\.\%]+)\s+([\d\.\-\%]+)\s+([\d\.\-\%]+)(?:\s*[\/\s,]\s*([\d\.\%]+))?\s*\)/gi, (match, p1, p2, p3, p4) => {
    try {
      let L = p1.endsWith('%') ? parseFloat(p1) / 100 : parseFloat(p1);
      let a = p2.endsWith('%') ? parseFloat(p2) / 100 : parseFloat(p2);
      let b = p3.endsWith('%') ? parseFloat(p3) / 100 : parseFloat(p3);
      let A = p4 !== undefined ? (p4.endsWith('%') ? parseFloat(p4) / 100 : parseFloat(p4)) : 1;

      // Convert OKLAB to LMS
      const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
      const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
      const s_ = L - 0.0894841775 * a - 1.2914855480 * b;

      const l = l_ * l_ * l_;
      const m = m_ * m_ * m_;
      const s = s_ * s_ * s_;

      // Convert LMS to Linear sRGB
      let r = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
      let g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
      let b_ = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s;

      // Convert Linear sRGB to sRGB (gamma correction)
      const f = (x: number) => (x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055);

      let R = Math.round(Math.max(0, Math.min(1, f(r))) * 255);
      let G = Math.round(Math.max(0, Math.min(1, f(g))) * 255);
      let B = Math.round(Math.max(0, Math.min(1, f(b_))) * 255);

      if (A === 1) {
        return `rgb(${R}, ${G}, ${B})`;
      } else {
        return `rgba(${R}, ${G}, ${B}, ${A})`;
      }
    } catch (e) {
      console.error('Error parsing oklab color in patch:', e);
      return match;
    }
  });
}

/**
 * Patches window.getComputedStyle temporarily to convert Tailwind v4's modern 'oklch' wide-gamut
 * color format to standard 'rgb/rgba' colors.
 * Note: We now keep this as a safe no-op because withOklchWorkaround already handles converting
 * OKLCH styles directly to inline RGB colors on the target elements before html2canvas captures them.
 */
export function patchGetComputedStyle(): () => void {
  return () => {};
}

/**
 * Temporarily converts all oklch colors in computed styles to inline RGB styles
 * on the element and all of its descendants, runs the async action, and then restores
 * all original inline styles. This completely bypasses html2canvas crashing on oklch.
 */
export async function withOklchWorkaround<T>(
  element: HTMLElement,
  action: () => Promise<T>
): Promise<T> {
  const elementsToPatch: { el: HTMLElement | SVGElement; originalStyle: string }[] = [];

  const traverseAndPatch = (el: HTMLElement | SVGElement) => {
    // Save original inline styles
    elementsToPatch.push({
      el,
      originalStyle: el.style.cssText,
    });

    // Read all computed styles
    const computed = window.getComputedStyle(el);
    const colorProps = [
      'color',
      'background',
      'backgroundImage',
      'backgroundColor',
      'borderColor',
      'borderTopColor',
      'borderBottomColor',
      'borderLeftColor',
      'borderRightColor',
      'boxShadow',
      'textShadow',
      'outlineColor',
      'fill',
      'stroke',
    ];

    colorProps.forEach((prop) => {
      try {
        let val = computed[prop as any];
        if (val && typeof val === 'string') {
          const valLower = val.toLowerCase();
          if (valLower.includes('oklch') || valLower.includes('oklab')) {
            let rgbVal = val;
            if (valLower.includes('oklch')) {
              rgbVal = convertOklchStringToRgb(rgbVal);
            }
            if (rgbVal.toLowerCase().includes('oklab')) {
              rgbVal = convertOklabStringToRgb(rgbVal);
            }
            // Set inline style directly to override any stylesheets
            el.style[prop as any] = rgbVal;
          }
        }
      } catch (e) {
        // Safe fallback
      }
    });

    // Recurse to children
    for (let i = 0; i < el.children.length; i++) {
      const child = el.children[i];
      if (child instanceof HTMLElement || child instanceof SVGElement) {
        traverseAndPatch(child as any);
      }
    }
  };

  // Convert all OKLCH colors to inline RGB styles
  traverseAndPatch(element);

  try {
    return await action();
  } finally {
    // Restore original inline styles
    elementsToPatch.forEach(({ el, originalStyle }) => {
      el.style.cssText = originalStyle;
    });
  }
}

/**
 * Hash a password using SHA-256 via Web Crypto API with a secure salt
 */
export async function hashPassword(password: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(password + "sur_volunteer_salt_2026");
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate and download an Excel-compatible CSV file with Arabic columns and values.
 * Uses a UTF-8 BOM prefix so that Microsoft Excel loads Arabic characters flawlessly.
 */
export function exportToExcelCSV(vouchers: Voucher[], receiptTerm: string, paymentTerm: string): string {
  const columns = [
    "رقم السند",
    "التاريخ",
    "نوع السند",
    "الاسم",
    "طريقة الدفع",
    "المبلغ",
    "البيان",
    "المرفقات إن وجدت"
  ];

  const escapeCsvValue = (val: any) => {
    if (val === undefined || val === null) return '""';
    const str = String(val).replace(/"/g, '""'); // Escape double quotes with double-double quotes
    return `"${str}"`;
  };

  const rows = vouchers.map(v => {
    const isReceipt = v.type === 'receipt';
    const typeLabel = isReceipt ? receiptTerm : paymentTerm;
    const attachmentsLabel = (v.attachments && v.attachments.length > 0)
      ? `نعم (${v.attachments.length})`
      : "لا";

    return [
      escapeCsvValue(v.voucherNo),
      escapeCsvValue(v.date),
      escapeCsvValue(typeLabel),
      escapeCsvValue(v.payerOrBeneficiary),
      escapeCsvValue(v.paymentMethod || 'نقداً'),
      escapeCsvValue(v.amount),
      escapeCsvValue(v.description || ''),
      escapeCsvValue(attachmentsLabel)
    ];
  });

  const csvContent = [
    columns.map(escapeCsvValue).join(','),
    ...rows.map(row => row.join(','))
  ].join('\r\n');

  // Prepend UTF-8 BOM (0xEF, 0xBB, 0xBF)
  const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
  const blob = new Blob([bom, csvContent], { type: 'text/csv;charset=utf-8;' });

  // Filename formatting (AlKhazina_Records_YYYY-MM-DD.csv)
  const pad = (num: number) => num < 10 ? `0${num}` : num;
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = pad(now.getMonth() + 1);
  const dd = pad(now.getDate());
  const filename = `AlKhazina_Records_${yyyy}-${mm}-${dd}.csv`;

  // Standard browser download trigger
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return filename;
}

/**
 * Creates an internal automatic JSON snapshot of the core database data
 * and stores it under a safe localStorage key. Retains only the latest 10 snapshots.
 */
export async function createInternalAutoBackup(): Promise<{ success: boolean; error?: string; exceeded?: boolean }> {
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    
    // Load existing snapshots
    const existingStr = localStorage.getItem('internalAutoBackupSnapshots');
    let snapshots: AutoBackupSnapshot[] = [];
    if (existingStr) {
      try {
        snapshots = JSON.parse(existingStr);
      } catch (_) {
        snapshots = [];
      }
    }
    
    // Check if one was already created for today
    const alreadyExists = snapshots.some(s => s.dateStr === todayStr);
    if (alreadyExists) {
      return { success: true }; // Already created today, no need to duplicate
    }
    
    // Get core database data
    const db = DatabaseService.getDatabase() as any;
    const media = await AttachmentStorageService.exportAll();
    db.attachments_media_folder = media;
    
    // Create new snapshot
    const newSnapshot: AutoBackupSnapshot = {
      id: `auto_bak_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      dateStr: todayStr,
      dbData: db
    };
    
    // Add to beginning of array (latest first)
    snapshots.unshift(newSnapshot);
    
    // Sort by timestamp desc to ensure correct order
    snapshots.sort((a, b) => b.timestamp - a.timestamp);
    
    // Retain only latest 10 snapshots
    if (snapshots.length > 10) {
      snapshots = snapshots.slice(0, 10);
    }
    
    // Try to save to localStorage
    try {
      localStorage.setItem('internalAutoBackupSnapshots', JSON.stringify(snapshots));
      return { success: true };
    } catch (e: any) {
      // Handle QuotaExceededError
      if (e.name === 'QuotaExceededError' || e.code === 22 || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
        // Remove oldest snapshots one by one and retry
        let retrySnapshots = [...snapshots];
        while (retrySnapshots.length > 1) {
          retrySnapshots.pop(); // remove the oldest
          try {
            localStorage.setItem('internalAutoBackupSnapshots', JSON.stringify(retrySnapshots));
            return { success: true, exceeded: true }; // succeeded after clearing space
          } catch (inner) {
            // still exceeding, keep popping
          }
        }
      }
      return { success: false, error: 'تجاوزت المساحة التخزينية المتاحة في المتصفح (Quota Exceeded)' };
    }
  } catch (e: any) {
    console.error('Error creating internal auto backup', e);
    return { success: false, error: e.message || 'حدث خطأ غير متوقع أثناء الحفظ التلقائي' };
  }
}

/**
 * Restores the latest internal automatic backup snapshot safely.
 */
export async function restoreLatestInternalAutoBackup(): Promise<{ success: boolean; error?: string }> {
  try {
    const existingStr = localStorage.getItem('internalAutoBackupSnapshots');
    if (!existingStr) {
      return { success: false, error: 'لا توجد نسخ احتياطية تلقائية داخلية متوفرة للاسترجاع.' };
    }
    const snapshots: AutoBackupSnapshot[] = JSON.parse(existingStr);
    if (snapshots.length === 0) {
      return { success: false, error: 'لا توجد نسخ احتياطية تلقائية داخلية متوفرة للاسترجاع.' };
    }
    
    // The latest snapshot is the first element
    const latest = snapshots[0];
    const dbData = latest.dbData;
    
    // Import attachments media folder if it exists
    if (dbData.attachments_media_folder) {
      await AttachmentStorageService.importAll(dbData.attachments_media_folder);
    } else {
      await AttachmentStorageService.clearAll();
    }
    
    // Import database
    const dbDataStr = JSON.stringify(dbData);
    const result = DatabaseService.importDatabase(dbDataStr, true);
    if (!result.success) {
      return { success: false, error: result.error || 'فشلت عملية استعادة قاعدة البيانات.' };
    }
    
    return { success: true };
  } catch (e: any) {
    console.error('Error restoring latest internal auto backup', e);
    return { success: false, error: e.message || 'حدث خطأ أثناء استعادة النسخة التلقائية الداخلية.' };
  }
}

/**
 * Clears/Deletes all stored internal automatic backup snapshots.
 */
export function deleteInternalAutoBackups(): void {
  localStorage.removeItem('internalAutoBackupSnapshots');
}



