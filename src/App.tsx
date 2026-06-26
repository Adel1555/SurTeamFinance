/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { DatabaseService } from './db';
import { Voucher, VisualIdentity } from './types';
import { formatOMR, isVersionNewer } from './utils';
import packageJson from '../package.json';
import { AttachmentStorageService } from './components/AttachmentStorageService';

// Components imports styled perfectly
import Clock from './components/Clock';
import ReceiptVoucherForm from './components/ReceiptVoucherForm';
import PaymentVoucherForm from './components/PaymentVoucherForm';
import QuarterlyReports from './components/QuarterlyReports';
import SettingsPanel from './components/SettingsPanel';
import ArchivePanel from './components/ArchivePanel';
import DashboardRecords from './components/DashboardRecords';
import VisualIdentityPanel from './components/VisualIdentityPanel';
import PrintVoucher from './components/PrintVoucher';
import VoucherDetailsModal from './components/VoucherDetailsModal';
import Logo from './components/Logo';

// Icons
import { 
  BarChart3, 
  PlusCircle, 
  MinusCircle, 
  Archive, 
  TrendingUp, 
  TrendingDown, 
  Coins, 
  Scale, 
  Sun, 
  Moon, 
  RotateCw, 
  SlidersHorizontal, 
  Compass, 
  Settings2,
  Lock,
  Sparkles,
  Trash2
} from 'lucide-react';

type TabType = 'dashboard' | 'receipt' | 'payment' | 'archive' | 'reports' | 'visual' | 'settings';

export default function App() {
  // Sync DB variables
  const [vouchers, setVouchers] = useState<Voucher[]>(() => {
    try {
      return DatabaseService.getVouchers();
    } catch (e) {
      console.error('Error loading initial vouchers', e);
      return [];
    }
  });
  const [identity, setIdentity] = useState<VisualIdentity>(() => DatabaseService.getVisualIdentity());

  // Navigation state
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

  // Trigger state for refresh button
  const [refreshKey, setRefreshKey] = useState(0);

  // Print portal selector overlay
  const [printTargetVoucher, setPrintTargetVoucher] = useState<Voucher | null>(null);

  // View details modal selector overlay
  const [viewTargetVoucher, setViewTargetVoucher] = useState<Voucher | null>(null);

  // Voucher edit selector
  const [voucherToEdit, setVoucherToEdit] = useState<Voucher | null>(null);

  const handleEditVoucher = (voucher: Voucher) => {
    setVoucherToEdit(voucher);
    setActiveTab(voucher.type === 'receipt' ? 'receipt' : 'payment');
  };

  // Pending delete voucher state (with attachments check)
  const [pendingDeleteVoucher, setPendingDeleteVoucher] = useState<Voucher | null>(null);

  // Dark / Light Toggle state - Persistence included
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('sur_finance_theme');
      return saved === 'dark';
    } catch (e) {
      return false;
    }
  });

  // Load vouchers & configs from Database Service on cycle or trigger
  useEffect(() => {
    setVouchers(DatabaseService.getVouchers());
    setIdentity(DatabaseService.getVisualIdentity());
  }, [refreshKey, activeTab]);

  // Persist and apply dark mode class on HTML body level for 100% theme coverage
  useEffect(() => {
    try {
      localStorage.setItem('sur_finance_theme', isDarkMode ? 'dark' : 'light');
      if (isDarkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch (e) {
      console.error(e);
    }
  }, [isDarkMode]);

  const handleToggleDarkMode = () => {
    const nextDark = !isDarkMode;
    setIsDarkMode(nextDark);
    
    // Choose appropriate preset to align custom CSS variables automatically
    const presetName = nextDark ? 'كحلي وقار داكن' : 'أزرق كلاسيكي احترافي';
    const colors = nextDark ? {
      appBg: '#0b1f3a',
      headerBg: '#0c203b',
      headerText: '#ffffff',
      sidebarBg: '#0c203b',
      sidebarText: '#94a3b8',
      sidebarActive: '#0e5fa3',
      footerBg: '#0c203b',
      footerText: '#64748b',
      cardBg: '#0d2342',
      cardBorder: '#1e293b',
      cardGlow: 'rgba(14, 165, 233, 0.25)',
      frameBorder: '#1e3a8a',
      tableHeaderBg: '#112b4a',
      tableRowBg: '#0d2342',
      textMain: '#f8fafc',
      textSecondary: '#94a3b8',
      buttonBg: '#0284c7',
      buttonText: '#ffffff',
      buttonHover: '#0369a1',
      inputBg: '#0b1f3a',
      inputBorder: '#112b4a',
      dialogBg: '#0b1f3a',
      dialogBorder: '#1e3a8a',
      primaryColor: '#0284c7',
      secondaryColor: '#0369a1'
    } : {
      appBg: '#eaf6ff',
      headerBg: '#ffffff',
      headerText: '#0c203b',
      sidebarBg: '#ffffff',
      sidebarText: '#334155',
      sidebarActive: '#2563eb',
      footerBg: '#ffffff',
      footerText: '#475569',
      cardBg: '#ffffff',
      cardBorder: '#dbeafe',
      cardGlow: 'rgba(59, 130, 246, 0.15)',
      frameBorder: '#bfdbfe',
      tableHeaderBg: '#eff6ff',
      tableRowBg: '#ffffff',
      textMain: '#0f172a',
      textSecondary: '#64748b',
      buttonBg: '#2563eb',
      buttonText: '#ffffff',
      buttonHover: '#1d4ed8',
      inputBg: '#ffffff',
      inputBorder: '#cbd5e1',
      dialogBg: '#ffffff',
      dialogBorder: '#dbeafe',
      primaryColor: '#2563eb',
      secondaryColor: '#1d4ed8'
    };

    const updatedIdentity: VisualIdentity = {
      ...identity,
      ...colors,
      themeMode: nextDark ? 'dark' : 'light',
      selectedThemeName: presetName
    };

    setIdentity(updatedIdentity);
    DatabaseService.saveVisualIdentity(updatedIdentity);
  };

  const handleManualRefresh = () => {
    setRefreshKey(prev => prev + 1);
    // Visual indicator of reload
    const loader = document.getElementById('refresh-icon');
    if (loader) {
      loader.classList.add('animate-spin');
      setTimeout(() => loader.classList.remove('animate-spin'), 650);
    }
  };

  const handleDatabaseReseted = () => {
    handleManualRefresh();
    setActiveTab('dashboard');
  };

  const handleDeleteVoucher = (id: string) => {
    const voucher = DatabaseService.getVouchers().find(v => v.id === id);
    if (voucher && voucher.attachments && voucher.attachments.length > 0) {
      setPendingDeleteVoucher(voucher);
    } else {
      DatabaseService.deleteVoucher(id);
      handleManualRefresh();
    }
  };

  const handleConfirmDeleteWithAttachments = async () => {
    if (!pendingDeleteVoucher) return;
    
    // Delete all attachments from IndexedDB
    if (pendingDeleteVoucher.attachments) {
      for (const att of pendingDeleteVoucher.attachments) {
        try {
          await AttachmentStorageService.deleteAttachment(att.id);
        } catch (e) {
          console.error(`Failed to delete attachment: ${att.id}`, e);
        }
      }
    }

    DatabaseService.deleteVoucher(pendingDeleteVoucher.id);
    setPendingDeleteVoucher(null);
    handleManualRefresh();
  };

  const handleConfirmDeleteOnly = () => {
    if (!pendingDeleteVoucher) return;
    
    DatabaseService.deleteVoucher(pendingDeleteVoucher.id);
    setPendingDeleteVoucher(null);
    handleManualRefresh();
  };

  // Windows Desktop Electron application update states & logic
  const CURRENT_VERSION = packageJson.version || '1.0.0';
  const UPDATE_URL = "https://raw.githubusercontent.com/Adel1555/SurTeamFinance-Updates/main/update.json";

  const [updateState, setUpdateState] = useState<{
    updateAvailable: boolean;
    latestVersion: string;
    downloadUrl: string;
    releaseNotes?: string;
    checkedAt?: string;
    history?: { version: string; date: string; notes: string }[];
  } | null>(null);
  const [isCheckingUpdates, setIsCheckingUpdates] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [ignoredVersion, setIgnoredVersion] = useState<string>(() => {
    return localStorage.getItem('sur_finance_ignored_version') || '';
  });

  const handleIgnoreVersion = (version: string) => {
    localStorage.setItem('sur_finance_ignored_version', version);
    setIgnoredVersion(version);
  };

  const handleResetIgnoreVersion = () => {
    localStorage.removeItem('sur_finance_ignored_version');
    setIgnoredVersion('');
  };

  const fetchUpdateInfo = async (isStartup = false) => {
    setIsCheckingUpdates(true);
    setUpdateError(null);
    try {
      // Perform a real HTTP fetch request to the production update file
      const response = await fetch(UPDATE_URL, { cache: 'no-store' });
      if (!response.ok) {
        throw new Error(`HTTP status ${response.status}`);
      }

      const data = await response.json();
      
      const updateAvailable = data.updateAvailable === true;
      const latestVersion = data.latestVersion || '1.0.0';
      const downloadUrl = data.downloadUrl || '';
      const releaseNotes = data.releaseNotes || '';
      const history = Array.isArray(data.history) ? data.history : undefined;

      const hasNewer = isVersionNewer(CURRENT_VERSION, latestVersion);

      setUpdateState({
        updateAvailable: updateAvailable && hasNewer,
        latestVersion,
        downloadUrl,
        releaseNotes,
        checkedAt: new Date().toLocaleTimeString('ar-OM', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        history,
      });
    } catch (err: any) {
      if (!isStartup) {
        console.warn('Update check failed (expected if offline or URL unavailable):', err.message || err);
      }
      setUpdateError('تعذر التحقق من التحديثات');
    } finally {
      setIsCheckingUpdates(false);
    }
  };

  // Perform self-update check on application startup
  useEffect(() => {
    fetchUpdateInfo(true);
  }, []);

  // Math readings totals calculated dynamically based on input records
  const statistics = useMemo(() => {
    let totalReceipts = 0;
    let totalPayments = 0;
    let receiptsCount = 0;
    let paymentsCount = 0;

    vouchers.forEach(v => {
      if (v.type === 'receipt') {
        totalReceipts += v.amount;
        receiptsCount += 1;
      } else {
        totalPayments += v.amount;
        paymentsCount += 1;
      }
    });

    return {
      totalReceipts,
      totalPayments,
      totalVouchersCount: vouchers.length,
      netBalance: totalReceipts - totalPayments,
      receiptsCount,
      paymentsCount
    };
  }, [vouchers]);

  // Style class getters based on Visual Identity settings
  const containerRadius = 
    identity.buttonStyle === 'sharp' ? 'rounded-none' : 
    identity.buttonStyle === 'rounded' ? 'rounded-2xl' : 'rounded-3xl';

  const buttonRadius = 
    identity.buttonStyle === 'sharp' ? 'rounded-none' : 
    identity.buttonStyle === 'rounded' ? 'rounded-xl' : 'rounded-full';

  // Computed alpha color for glowing shadows
  const primaryAlphaColor = useMemo(() => {
    const hex = identity.primaryColor || '#0ea5e9';
    if (hex.startsWith('#')) {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, 0.12)`;
    }
    return 'rgba(14, 165, 233, 0.12)';
  }, [identity.primaryColor]);

  const cardStyleClass = 
    identity.cardStyle === 'flat' ? 'border border-transparent bg-blue-50/20 dark:bg-[#0d2342]/60 shadow-none finance-glow-card' :
    identity.cardStyle === 'bordered' ? 'border border-blue-100 dark:border-blue-500/20 bg-white/95 dark:bg-[#0c203b]/90 shadow-sm finance-glow-card' :
    identity.cardStyle === 'shadowed' ? 'shadow-xl bg-white/95 dark:bg-[#0c203b]/90 border border-blue-100/60 dark:border-blue-500/20 finance-glow-card' :
    'backdrop-blur-md bg-white/90 dark:bg-[#0b1f3a]/80 border border-blue-200/60 dark:border-blue-500/20 shadow-lg finance-glow-card';

  // Dynamic CSS variables setup based on identity config and fallback theme states
  const themeStyles = useMemo(() => {
    // Current Active Colors with Fallbacks
    const appBg = identity.appBg || (isDarkMode ? '#0b1f3a' : '#eaf6ff');
    const headerBg = identity.headerBg || (isDarkMode ? '#0c203b' : '#ffffff');
    const headerText = identity.headerText || (isDarkMode ? '#ffffff' : '#0c203b');
    const sidebarBg = identity.sidebarBg || (isDarkMode ? '#0c203b' : '#ffffff');
    const sidebarText = identity.sidebarText || (isDarkMode ? '#94a3b8' : '#334155');
    const sidebarActive = identity.sidebarActive || identity.primaryColor || '#0f766e';
    const footerBg = identity.footerBg || (isDarkMode ? '#0c203b' : '#ffffff');
    const footerText = identity.footerText || (isDarkMode ? '#64748b' : '#475569');
    
    const cardBg = identity.cardBg || (isDarkMode ? '#0d2342' : '#ffffff');
    const cardBorder = identity.cardBorder || (isDarkMode ? '#1e293b' : '#dbeafe');
    const cardGlow = identity.cardGlow || (isDarkMode ? 'rgba(14, 165, 233, 0.15)' : 'rgba(15, 118, 110, 0.12)');
    const frameBorder = identity.frameBorder || (isDarkMode ? '#1e3a8a' : '#bfdbfe');
    
    const tableHeaderBg = identity.tableHeaderBg || (isDarkMode ? '#112b4a' : '#eff6ff');
    const tableRowBg = identity.tableRowBg || (isDarkMode ? '#0d2342' : '#ffffff');
    
    const textMain = identity.textMain || (isDarkMode ? '#f8fafc' : '#0f172a');
    const textSecondary = identity.textSecondary || (isDarkMode ? '#94a3b8' : '#64748b');
    
    const buttonBg = identity.buttonBg || identity.primaryColor || '#0f766e';
    const buttonText = identity.buttonText || '#ffffff';
    const buttonHover = identity.buttonHover || identity.secondaryColor || '#115e59';
    
    const inputBg = identity.inputBg || (isDarkMode ? '#0b1f3a' : '#ffffff');
    const inputBorder = identity.inputBorder || (isDarkMode ? '#112b4a' : '#cbd5e1');
    
    const dialogBg = identity.dialogBg || (isDarkMode ? '#0b1f3a' : '#ffffff');
    const dialogBorder = identity.dialogBorder || (isDarkMode ? '#1e3a8a' : '#dbeafe');

    return `
      :root, .dark, .light, body {
        --app-bg: ${appBg} !important;
        --header-bg: ${headerBg} !important;
        --header-text: ${headerText} !important;
        --sidebar-bg: ${sidebarBg} !important;
        --sidebar-text: ${sidebarText} !important;
        --sidebar-active: ${sidebarActive} !important;
        --footer-bg: ${footerBg} !important;
        --footer-text: ${footerText} !important;
        --card-bg: ${cardBg} !important;
        --card-border: ${cardBorder} !important;
        --card-glow: ${cardGlow} !important;
        --frame-border: ${frameBorder} !important;
        --table-header-bg: ${tableHeaderBg} !important;
        --table-row-bg: ${tableRowBg} !important;
        --text-main: ${textMain} !important;
        --text-secondary: ${textSecondary} !important;
        --button-bg: ${buttonBg} !important;
        --button-text: ${buttonText} !important;
        --button-hover: ${buttonHover} !important;
        --input-bg: ${inputBg} !important;
        --input-border: ${inputBorder} !important;
        --dialog-bg: ${dialogBg} !important;
        --dialog-border: ${dialogBorder} !important;
        --primary-color: ${buttonBg} !important;
        --secondary-color: ${buttonHover} !important;
      }
      
      body, .min-h-screen, .bg-light-finance, .bg-dark-finance {
        background-color: var(--app-bg) !important;
        background-image: none !important;
        color: var(--text-main) !important;
      }
      
      header {
        background-color: var(--header-bg) !important;
        color: var(--header-text) !important;
        border-color: var(--card-border) !important;
      }
      
      header * {
        color: var(--header-text) !important;
      }
      
      nav .finance-glow-card {
        background-color: var(--sidebar-bg) !important;
        border-color: var(--card-border) !important;
        color: var(--sidebar-text) !important;
      }
      
      .finance-glow-card {
        background-color: var(--card-bg) !important;
        border-color: var(--card-border) !important;
        box-shadow: 0 4px 18px var(--card-glow) !important;
      }
      
      th {
        background-color: var(--table-header-bg) !important;
        color: var(--text-main) !important;
      }
      
      tr, td {
        background-color: var(--table-row-bg) !important;
        color: var(--text-main) !important;
      }
      
      input, select, textarea {
        background-color: var(--input-bg) !important;
        border-color: var(--input-border) !important;
        color: var(--text-main) !important;
      }
      
      /* Active state highlight button variables */
      .active-sidebar-nav-item {
        background-color: var(--sidebar-active) !important;
        color: var(--button-text) !important;
      }
      
      /* Primary dynamic button bindings */
      .theme-primary-btn {
        background-color: var(--button-bg) !important;
        color: var(--button-text) !important;
      }
      
      .theme-primary-btn:hover {
        background-color: var(--button-hover) !important;
      }

      /* Circular dynamic cards dim-lighting glow styles */
      .glow-card-emerald {
        background-color: var(--card-bg) !important;
        border-color: ${isDarkMode ? 'rgba(16, 185, 129, 0.22)' : 'rgba(16, 185, 129, 0.28)'} !important;
        box-shadow: ${isDarkMode ? '0 0 25px rgba(16, 185, 129, 0.15), inset 0 0 20px rgba(16, 185, 129, 0.05)' : '0 0 18px rgba(16, 185, 129, 0.10), inset 0 0 15px rgba(16, 185, 129, 0.03)'} !important;
        transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.6s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.6s cubic-bezier(0.16, 1, 0.3, 1) !important;
      }
      .glow-card-emerald:hover {
        border-color: rgba(16, 185, 129, 0.65) !important;
        box-shadow: ${isDarkMode ? '0 0 45px rgba(16, 185, 129, 0.40), 0 0 20px rgba(16, 185, 129, 0.22), inset 0 0 25px rgba(16, 185, 129, 0.10)' : '0 0 35px rgba(16, 185, 129, 0.26), 0 0 15px rgba(16, 185, 129, 0.14), inset 0 0 20px rgba(16, 185, 129, 0.06)'} !important;
        transform: translateY(-5px) scale(1.04) !important;
      }
      
      .glow-card-rose {
        background-color: var(--card-bg) !important;
        border-color: ${isDarkMode ? 'rgba(244, 63, 94, 0.22)' : 'rgba(244, 63, 94, 0.28)'} !important;
        box-shadow: ${isDarkMode ? '0 0 25px rgba(244, 63, 94, 0.15), inset 0 0 20px rgba(244, 63, 94, 0.05)' : '0 0 18px rgba(244, 63, 94, 0.10), inset 0 0 15px rgba(244, 63, 94, 0.03)'} !important;
        transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.6s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.6s cubic-bezier(0.16, 1, 0.3, 1) !important;
      }
      .glow-card-rose:hover {
        border-color: rgba(244, 63, 94, 0.65) !important;
        box-shadow: ${isDarkMode ? '0 0 45px rgba(244, 63, 94, 0.40), 0 0 20px rgba(244, 63, 94, 0.22), inset 0 0 25px rgba(244, 63, 94, 0.10)' : '0 0 35px rgba(244, 63, 94, 0.26), 0 0 15px rgba(244, 63, 94, 0.14), inset 0 0 20px rgba(244, 63, 94, 0.06)'} !important;
        transform: translateY(-5px) scale(1.04) !important;
      }
      
      .glow-card-indigo {
        background-color: var(--card-bg) !important;
        border-color: ${isDarkMode ? 'rgba(99, 102, 241, 0.22)' : 'rgba(99, 102, 241, 0.28)'} !important;
        box-shadow: ${isDarkMode ? '0 0 25px rgba(99, 102, 241, 0.15), inset 0 0 20px rgba(99, 102, 241, 0.05)' : '0 0 18px rgba(99, 102, 241, 0.10), inset 0 0 15px rgba(99, 102, 241, 0.03)'} !important;
        transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.6s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.6s cubic-bezier(0.16, 1, 0.3, 1) !important;
      }
      .glow-card-indigo:hover {
        border-color: rgba(99, 102, 241, 0.65) !important;
        box-shadow: ${isDarkMode ? '0 0 45px rgba(99, 102, 241, 0.40), 0 0 20px rgba(99, 102, 241, 0.22), inset 0 0 25px rgba(99, 102, 241, 0.10)' : '0 0 35px rgba(99, 102, 241, 0.26), 0 0 15px rgba(99, 102, 241, 0.14), inset 0 0 20px rgba(99, 102, 241, 0.06)'} !important;
        transform: translateY(-5px) scale(1.04) !important;
      }
      
      .glow-card-primary {
        background-color: var(--card-bg) !important;
        border-color: ${identity.primaryColor || '#0284c7'}40 !important;
        box-shadow: ${isDarkMode ? `0 0 25px ${identity.primaryColor || '#0284c7'}18, inset 0 0 20px ${identity.primaryColor || '#0284c7'}07` : `0 0 18px ${identity.primaryColor || '#0284c7'}12, inset 0 0 15px ${identity.primaryColor || '#0284c7'}04`} !important;
        transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.6s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.6s cubic-bezier(0.16, 1, 0.3, 1) !important;
      }
      .glow-card-primary:hover {
        border-color: ${identity.primaryColor || '#0284c7'} !important;
        box-shadow: ${isDarkMode ? `0 0 45px ${identity.primaryColor || '#0284c7'}44, 0 0 20px ${identity.primaryColor || '#0284c7'}25, inset 0 0 25px ${identity.primaryColor || '#0284c7'}12` : `0 0 35px ${identity.primaryColor || '#0284c7'}30, 0 0 15px ${identity.primaryColor || '#0284c7'}18, inset 0 0 20px ${identity.primaryColor || '#0284c7'}08`} !important;
        transform: translateY(-5px) scale(1.04) !important;
      }
    `;
  }, [identity, isDarkMode]);

  return (
    <div 
      className={`min-h-screen transition-all duration-300 select-none pb-12 flex flex-col bg-[var(--app-bg)] text-[var(--text-main)]`}
      style={{
        '--primary-color': identity.primaryColor,
        '--secondary-color': identity.secondaryColor,
        '--primary-color-alpha': primaryAlphaColor,
      } as React.CSSProperties}
    >
      <style>{themeStyles}</style>
      
      {/* Absolute Header Ribbon (Hidden on standard Print) */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#0b1f3a]/90 backdrop-blur-md border-b border-blue-100/80 dark:border-blue-500/15 print:hidden transition-colors shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3.5 flex items-center justify-between">
          
          {/* Left Area: Controls & Digital Clock */}
          <div className="flex items-center gap-3">
            {/* Clock panel with dynamically tracked current times */}
            <Clock isDarkMode={isDarkMode} />
            
            <div className="h-6 w-px bg-gray-200 dark:bg-zinc-800 mx-1" />

            {/* Refresh action */}
            <button
              onClick={handleManualRefresh}
              title="تحديث البيانات"
              className="p-2.5 rounded-xl text-gray-500 hover:text-gray-800 dark:hover:text-white bg-gray-100/70 dark:bg-zinc-900/60 hover:bg-gray-200/80 dark:hover:bg-zinc-805 transition-all active:scale-95 cursor-pointer"
            >
              <RotateCw className="w-4 h-4" id="refresh-icon" />
            </button>

            {/* Night-day mode switch toggler */}
            <button
              onClick={handleToggleDarkMode}
              title={isDarkMode ? "الوضع النهاري" : "الوضع الليلي"}
              className="p-2.5 rounded-xl text-gray-500 hover:text-gray-950 dark:hover:text-white bg-gray-100/70 dark:bg-zinc-900/60 hover:bg-gray-200/80 dark:hover:bg-zinc-805 transition-all active:scale-95 flex items-center gap-2 text-xs font-bold cursor-pointer"
            >
              {isDarkMode ? (
                <>
                  <Sun className="w-4 h-4 text-amber-500 animate-pulse" />
                  <span className="text-[10px] hidden sm:inline">الوضع المشرق</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-sky-600" />
                  <span className="text-[10px] hidden sm:inline">الوضع الليلي</span>
                </>
              )}
            </button>
          </div>

          {/* Right Area: Branding */}
          <div className="flex items-center gap-3.5 text-right select-none">
            <div>
              <h1 
                className="text-base font-black tracking-tight transition-all duration-300 drop-shadow-sm font-display"
                style={{ color: identity.primaryColor }}
              >
                {identity.title}
              </h1>
              <p className="text-[10px] text-gray-400 font-semibold font-sans">البرنامج المالي لتدوير سندات الصرف والقبض</p>
            </div>

            {/* The brand new official Omani Team logo */}
            <Logo size={42} showText={false} className="hover:scale-110 transition-transform duration-300" customLogo={identity.customLogo} />
          </div>

        </div>
      </header>

      {/* Primary Container Wrap */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 mt-6 flex-1 w-full grid grid-cols-1 lg:grid-cols-12 gap-6 print:p-0 print:m-0 print:max-w-none">
        
        {/* Navigation Sidebar Drawer (Hidden on standard Print) */}
        <nav className="lg:col-span-3 space-y-3 print:hidden">
          
          <div className={`p-5 ${cardStyleClass} ${containerRadius} border border-gray-200/60 dark:border-zinc-800/65 shadow-md space-y-4 premium-border-glow duration-500`}>
            
            {/* Elegant Official Logo Header at the top of the Sidebar */}
            <div className="flex flex-col items-center justify-center p-3.5 bg-gray-50/50 dark:bg-zinc-900/40 rounded-2xl border border-gray-100/70 dark:border-zinc-800/30 mb-2">
              <Logo size={68} showText={true} customLogo={identity.customLogo} />
            </div>

            {/* Nav Header Title */}
            <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 dark:text-zinc-500 block text-right border-b border-gray-100/80 dark:border-zinc-800/50 pb-2 flex items-center justify-between">
              <Compass className="w-3.5 h-3.5" />
              أقسام ووظائف البرنامج
            </span>

            {/* Sidebar Tab buttons */}
            <div className="flex flex-col gap-1.5 text-right">
              
              {/* Tab 1: Dashboard */}
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`w-full py-2.5 px-4 text-xs font-bold transition-all duration-300 flex items-center justify-between flex-row-reverse cursor-pointer ${buttonRadius} ${
                  activeTab === 'dashboard' 
                    ? 'shadow-md font-extrabold' 
                    : 'hover:bg-[var(--input-bg)] hover:translate-x-[-4px]'
                }`}
                style={activeTab === 'dashboard' ? { 
                  backgroundColor: 'var(--sidebar-active)',
                  color: 'var(--button-text)',
                  boxShadow: '0 4.5px 14px var(--card-glow)'
                } : {
                  color: 'var(--sidebar-text)'
                }}
              >
                <div className="flex items-center gap-2 flex-row-reverse">
                  <BarChart3 className="w-4 h-4" />
                  <span>الواجهة الرئيسية</span>
                </div>
                <span className="text-[10px] font-mono opacity-80" style={{ color: activeTab === 'dashboard' ? 'var(--button-text)' : 'var(--text-secondary)' }}>{vouchers.length}</span>
              </button>

              {/* Tab 2: New Receipt */}
              <button
                onClick={() => {
                  setVoucherToEdit(null);
                  setActiveTab('receipt');
                }}
                className={`w-full py-2.5 px-4 text-xs font-bold transition-all duration-300 flex items-center justify-between flex-row-reverse cursor-pointer ${buttonRadius} ${
                  activeTab === 'receipt' 
                    ? 'shadow-md font-extrabold' 
                    : 'hover:bg-[var(--input-bg)] hover:translate-x-[-4px]'
                }`}
                style={activeTab === 'receipt' ? { 
                  backgroundColor: 'var(--sidebar-active)',
                  color: 'var(--button-text)',
                  boxShadow: '0 4.5px 14px var(--card-glow)'
                } : {
                  color: 'var(--sidebar-text)'
                }}
              >
                <div className="flex items-center gap-2 flex-row-reverse">
                  <PlusCircle className="w-4 h-4 text-emerald-500" />
                  <span>{identity.receiptTerm}</span>
                </div>
                <span className="text-[9px] bg-emerald-500/15 text-emerald-600 px-1.5 py-0.5 rounded font-black">جديد</span>
              </button>

              {/* Tab 3: New Payment */}
              <button
                onClick={() => {
                  setVoucherToEdit(null);
                  setActiveTab('payment');
                }}
                className={`w-full py-2.5 px-4 text-xs font-bold transition-all duration-300 flex items-center justify-between flex-row-reverse cursor-pointer ${buttonRadius} ${
                  activeTab === 'payment' 
                    ? 'shadow-md font-extrabold' 
                    : 'hover:bg-[var(--input-bg)] hover:translate-x-[-4px]'
                }`}
                style={activeTab === 'payment' ? { 
                  backgroundColor: 'var(--sidebar-active)',
                  color: 'var(--button-text)',
                  boxShadow: '0 4.5px 14px var(--card-glow)'
                } : {
                  color: 'var(--sidebar-text)'
                }}
              >
                <div className="flex items-center gap-2 flex-row-reverse">
                  <MinusCircle className="w-4 h-4 text-rose-500" />
                  <span>{identity.paymentTerm}</span>
                </div>
                <span className="text-[9px] bg-rose-500/15 text-rose-600 px-1.5 py-0.5 rounded font-black">صرف</span>
              </button>

              {/* Tab 4: Archive */}
              <button
                onClick={() => setActiveTab('archive')}
                className={`w-full py-2.5 px-4 text-xs font-bold transition-all duration-300 flex items-center justify-between flex-row-reverse cursor-pointer ${buttonRadius} ${
                  activeTab === 'archive' 
                    ? 'shadow-md font-extrabold' 
                    : 'hover:bg-[var(--input-bg)] hover:translate-x-[-4px]'
                }`}
                style={activeTab === 'archive' ? { 
                  backgroundColor: 'var(--sidebar-active)',
                  color: 'var(--button-text)',
                  boxShadow: '0 4.5px 14px var(--card-glow)'
                } : {
                  color: 'var(--sidebar-text)'
                }}
              >
                <div className="flex items-center gap-2 flex-row-reverse">
                  <Archive className="w-4 h-4" />
                  <span>الأرشيف والسجلات</span>
                </div>
                <span className="text-[10px] font-mono opacity-65" style={{ color: activeTab === 'archive' ? 'var(--button-text)' : 'var(--text-secondary)' }}>بحث</span>
              </button>

              {/* Tab 5: Reports */}
              <button
                onClick={() => setActiveTab('reports')}
                className={`w-full py-2.5 px-4 text-xs font-bold transition-all duration-300 flex items-center justify-between flex-row-reverse cursor-pointer ${buttonRadius} ${
                  activeTab === 'reports' 
                    ? 'shadow-md font-extrabold' 
                    : 'hover:bg-[var(--input-bg)] hover:translate-x-[-4px]'
                }`}
                style={activeTab === 'reports' ? { 
                  backgroundColor: 'var(--sidebar-active)',
                  color: 'var(--button-text)',
                  boxShadow: '0 4.5px 14px var(--card-glow)'
                } : {
                  color: 'var(--sidebar-text)'
                }}
              >
                <div className="flex items-center gap-2 flex-row-reverse">
                  <BarChart3 className="w-4 h-4" />
                  <span>التقارير الربعية</span>
                </div>
                <span className="text-[10px] opacity-65" style={{ color: activeTab === 'reports' ? 'var(--button-text)' : 'var(--text-secondary)' }}>مفصل</span>
              </button>

              {/* Tab 6: Flexible Visual Identity */}
              <button
                onClick={() => setActiveTab('visual')}
                className={`w-full py-2.5 px-4 text-xs font-bold transition-all duration-300 flex items-center justify-between flex-row-reverse cursor-pointer ${buttonRadius} ${
                  activeTab === 'visual' 
                    ? 'shadow-md font-extrabold' 
                    : 'hover:bg-[var(--input-bg)] hover:translate-x-[-4px]'
                }`}
                style={activeTab === 'visual' ? { 
                  backgroundColor: 'var(--sidebar-active)',
                  color: 'var(--button-text)',
                  boxShadow: '0 4.5px 14px var(--card-glow)'
                } : {
                  color: 'var(--sidebar-text)'
                }}
              >
                <div className="flex items-center gap-2 flex-row-reverse">
                  <SlidersHorizontal className="w-4 h-4 text-amber-500 animate-pulse" />
                  <span>الهوية البصرية المرنة</span>
                </div>
                <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              </button>

              <div className="border-t border-gray-100 dark:border-zinc-800/80 pt-1.5 mt-1.5" style={{ borderColor: 'var(--frame-border)' }} />

              {/* Tab 7: Settings */}
              <button
                onClick={() => setActiveTab('settings')}
                className={`w-full py-2.5 px-4 text-xs font-bold transition-all duration-300 flex items-center justify-between flex-row-reverse cursor-pointer ${buttonRadius} ${
                  activeTab === 'settings' 
                    ? 'shadow-md font-extrabold' 
                    : 'hover:bg-[var(--input-bg)] hover:translate-x-[-4px]'
                }`}
                style={activeTab === 'settings' ? { 
                  backgroundColor: 'var(--sidebar-active)',
                  color: 'var(--button-text)',
                  boxShadow: '0 4.5px 14px var(--card-glow)'
                } : {
                  color: 'var(--sidebar-text)'
                }}
              >
                <div className="flex items-center gap-2 flex-row-reverse">
                  <Settings2 className="w-4 h-4" />
                  <span>قسم الإعدادات</span>
                </div>
              </button>

            </div>

          </div>

          {/* Quick legal secure disclaimer */}
          <div className="p-4 bg-zinc-50 dark:bg-zinc-900/30 rounded-2xl border border-gray-150 dark:border-zinc-900/50 text-[10px] text-gray-400 space-y-1.5 text-center leading-relaxed">
            <Lock className="w-4 h-4 text-gray-300 mx-auto" />
            <p className="font-semibold text-gray-600 dark:text-gray-400">نظام حماية مالي معزول</p>
            <p>كشور المستندات والبيانات تحفظ في الحيز القانوني الآمن لمتصفحك ولا يتم رفعها لخوادم خارجية لضمان السرية التامة لفريق صور.</p>
            
            <div className="border-t border-gray-200/50 dark:border-zinc-800/40 my-2 pt-2 flex items-center justify-between font-sans text-[9px]">
              <span className="text-gray-400">إصدار نظام التشغيل (Windows):</span>
              <span className="font-mono font-bold text-[var(--primary-color)]" style={{ color: identity.primaryColor }}>v{CURRENT_VERSION}</span>
            </div>

            {updateState?.updateAvailable && updateState.latestVersion !== ignoredVersion && (
              <button 
                onClick={() => setActiveTab('settings')}
                className="w-full mt-1.5 py-1 px-2 text-amber-600 dark:text-amber-405 bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/20 dark:border-amber-500/10 hover:bg-amber-500/20 rounded-xl text-[9px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer animate-pulse"
              >
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>تحديث جديد متاح: v{updateState.latestVersion}</span>
              </button>
            )}
          </div>

        </nav>

        {/* Dynamic Display Area */}
        <section className="lg:col-span-9 space-y-6 print:col-span-12">
          
          {activeTab === 'dashboard' && (
            <div className="space-y-6 animate-fade-in print:hidden">
              
              {/* Four Readings Financial Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 py-4 justify-items-center">
                
                {/* 1. Receipts total */}
                <div 
                  className="w-48 h-48 sm:w-52 sm:h-52 rounded-full relative overflow-hidden group flex flex-col justify-center items-center text-center p-6 border select-none glow-card-emerald"
                  style={{ backgroundColor: '#074907' }}
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 to-transparent pointer-events-none" />
                  <div className="p-2 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 mb-2">
                    <TrendingUp className="w-5 h-5 text-emerald-500 animate-pulse" />
                  </div>
                  <span className="text-[10px] font-bold text-gray-500 dark:text-gray-300 transition-colors uppercase tracking-widest font-sans" style={{ color: '#035bf4' }}>
                    إجمالي مبالغ القبض
                  </span>
                  <p className="text-lg sm:text-xl font-black text-gray-900 dark:text-white mt-1.5 font-mono tracking-tight leading-none" style={{ borderColor: '#26c831', color: '#070ff1' }}>
                    {formatOMR(statistics.totalReceipts)}
                  </p>
                  <span className="text-[9px] text-gray-400 dark:text-gray-500 block mt-2" style={{ color: '#38ec08' }}>
                    العدد: <strong className="text-emerald-500 font-mono" style={{ color: 'inherit' }}>{statistics.receiptsCount}</strong> سندات
                  </span>
                </div>

                {/* 2. Payments total */}
                <div 
                  className="w-48 h-48 sm:w-52 sm:h-52 rounded-full relative overflow-hidden group flex flex-col justify-center items-center text-center p-6 border select-none glow-card-rose"
                  style={{ backgroundColor: '#6a3034' }}
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-rose-500/5 to-transparent pointer-events-none" />
                  <div className="p-2 rounded-full bg-rose-500/10 dark:bg-rose-500/20 mb-2">
                    <TrendingDown className="w-5 h-5 text-rose-500 animate-pulse" />
                  </div>
                  <span className="text-[10px] font-bold text-gray-500 dark:text-gray-300 transition-colors uppercase tracking-widest font-sans" style={{ color: '#b74040' }}>
                    إجمالي مبالغ الصرف
                  </span>
                  <p className="text-lg sm:text-xl font-black text-gray-900 dark:text-white mt-1.5 font-mono tracking-tight leading-none" style={{ color: '#f50c0c' }}>
                    {formatOMR(statistics.totalPayments)}
                  </p>
                  <span className="text-[9px] text-gray-400 dark:text-gray-500 block mt-2" style={{ color: '#2aef0a' }}>
                    العدد: <strong className="text-rose-500 font-mono" style={{ color: 'inherit' }}>{statistics.paymentsCount}</strong> سندات
                  </span>
                </div>

                {/* 3. Combined total count Vouchers */}
                <div 
                  className="w-48 h-48 sm:w-52 sm:h-52 rounded-full relative overflow-hidden group flex flex-col justify-center items-center text-center p-6 border select-none glow-card-indigo"
                  style={{ backgroundColor: '#948d69' }}
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent pointer-events-none" />
                  <div className="p-2 rounded-full bg-indigo-500/10 dark:bg-indigo-500/20 mb-2">
                    <Coins className="w-5 h-5 text-indigo-500 animate-bounce" />
                  </div>
                  <span className="text-[10px] font-bold text-gray-500 dark:text-gray-300 transition-colors uppercase tracking-widest font-sans" style={{ color: '#01173e' }}>
                    إجمالي السندات
                  </span>
                  <p className="text-lg sm:text-xl font-black text-gray-900 dark:text-white mt-1.5 font-mono tracking-tight leading-none" style={{ color: '#deee0d' }}>
                    {statistics.totalVouchersCount} <span className="text-xs font-sans text-gray-400 dark:text-gray-500 font-bold" style={{ color: '#e3eb17' }}>سند</span>
                  </p>
                  <span className="text-[9px] text-gray-400 dark:text-gray-500 block mt-2">
                    سندات القبض والصرف
                  </span>
                </div>

                {/* 4. Net remaining Balance */}
                <div 
                  className="w-48 h-48 sm:w-52 sm:h-52 rounded-full relative overflow-hidden group flex flex-col justify-center items-center text-center p-6 border select-none glow-card-primary"
                  style={{ backgroundColor: '#7f747f' }}
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-[var(--sidebar-active)]/5 to-transparent pointer-events-none" />
                  <div className="p-2 rounded-full bg-sky-500/10 dark:bg-sky-500/20 mb-2">
                    <Scale className="w-5 h-5" style={{ color: identity.primaryColor || '#0284c7' }} />
                  </div>
                  <span className="text-[10px] font-bold text-gray-500 dark:text-gray-300 transition-colors uppercase tracking-widest font-sans">
                    صافي الرصيد المالي
                  </span>
                  <p className={`text-lg sm:text-xl font-black mt-1.5 font-mono tracking-tight leading-none ${statistics.netBalance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-450'}`}>
                    {formatOMR(statistics.netBalance)}
                  </p>
                  <span className="text-[9px] text-gray-400 dark:text-gray-500 block mt-2">
                    فائض السيولة المتاحة
                  </span>
                </div>

              </div>

              {/* Records Segment in Dashboard */}
              <DashboardRecords
                vouchers={vouchers}
                identity={identity}
                onDeleteVoucher={handleDeleteVoucher}
                onPrintVoucher={(v) => setPrintTargetVoucher(v)}
                onViewVoucher={(v) => setViewTargetVoucher(v)}
                onEditVoucher={handleEditVoucher}
              />

              {/* Help tip helper */}
              {identity.showHelpTips && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className={`p-4 ${cardStyleClass} ${containerRadius} space-y-1.5 text-right`}>
                    <h4 className="text-xs font-black text-[var(--primary-color)]">✏️ الدليل السريع لإدخال قبض مالي جديد</h4>
                    <p className="text-[10px] text-gray-400 leading-relaxed">
                      انتقل لقسم "سند قبض" باليمين، وسيتولى النظام توليد رقم فريد تلقائي، اكتب تفاصيل المتبرع وقيد القيمة بالريال، ثم اضغط حفظ لتظهر القراءات والرسومات المالية فوراً.
                    </p>
                  </div>
                  
                  <div className={`p-4 ${cardStyleClass} ${containerRadius} space-y-1.5 text-right`}>
                    <h4 className="text-xs font-black text-rose-600">💸 الدليل السريع لتصدير سندات الصرف</h4>
                    <p className="text-[10px] text-gray-400 leading-relaxed">
                      أي سند تحفظه يظهر في سجل الواجهة أو الأرشيف، وبجواره أيقونات "طباعة" أو "تحويل PDF". انقر عليها لتشاهد السند بتنسيق رسمي راقٍ مهيأ لطباعة الطابعة أو الحفظ كملف PDF.
                    </p>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* Tab Views content controller */}
          {activeTab === 'receipt' && (
            <div className="animate-fade-in print:hidden">
              <ReceiptVoucherForm
                identity={identity}
                voucherToEdit={voucherToEdit || undefined}
                onSaved={() => {
                  handleManualRefresh();
                  setVoucherToEdit(null);
                  setActiveTab('dashboard');
                }}
                onCancel={() => {
                  setVoucherToEdit(null);
                  setActiveTab('dashboard');
                }}
                onPreviewVoucher={(v) => setPrintTargetVoucher(v)}
              />
            </div>
          )}

          {activeTab === 'payment' && (
            <div className="animate-fade-in print:hidden">
              <PaymentVoucherForm
                identity={identity}
                voucherToEdit={voucherToEdit || undefined}
                onSaved={() => {
                  handleManualRefresh();
                  setVoucherToEdit(null);
                  setActiveTab('dashboard');
                }}
                onCancel={() => {
                  setVoucherToEdit(null);
                  setActiveTab('dashboard');
                }}
                onPreviewVoucher={(v) => setPrintTargetVoucher(v)}
              />
            </div>
          )}

          {activeTab === 'archive' && (
            <div className="animate-fade-in print:hidden">
              <ArchivePanel
                vouchers={vouchers}
                identity={identity}
                onDeleteVoucher={handleDeleteVoucher}
                onPrintVoucher={(v) => setPrintTargetVoucher(v)}
                onViewVoucher={(v) => setViewTargetVoucher(v)}
                onEditVoucher={handleEditVoucher}
              />
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="animate-fade-in">
              <QuarterlyReports
                vouchers={vouchers}
                identity={identity}
              />
            </div>
          )}

          {activeTab === 'visual' && (
            <div className="animate-fade-in print:hidden">
              <VisualIdentityPanel
                config={identity}
                onUpdate={(newConfig) => setIdentity(newConfig)}
              />
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="animate-fade-in print:hidden">
              <SettingsPanel
                identity={identity}
                onIdentityUpdate={(newConfig) => setIdentity(newConfig)}
                onDatabaseReseted={handleDatabaseReseted}
                currentVersion={CURRENT_VERSION}
                updateState={updateState}
                isCheckingUpdates={isCheckingUpdates}
                updateError={updateError}
                onCheckUpdates={fetchUpdateInfo}
                isVersionNewer={isVersionNewer}
                ignoredVersion={ignoredVersion}
                onIgnoreVersion={handleIgnoreVersion}
                onResetIgnoreVersion={handleResetIgnoreVersion}
              />
            </div>
          )}

        </section>

      </main>

      {/* Floating Printing Overlay modal portal */}
      {printTargetVoucher && (
        <PrintVoucher
          voucher={printTargetVoucher}
          identity={identity}
          onClose={() => setPrintTargetVoucher(null)}
        />
      )}

      {/* Floating View Details Modal portal */}
      {viewTargetVoucher && (
        <VoucherDetailsModal
          voucher={viewTargetVoucher}
          identity={identity}
          onClose={() => setViewTargetVoucher(null)}
          onPrint={(v) => setPrintTargetVoucher(v)}
          onEdit={handleEditVoucher}
        />
      )}

      {/* Attachments Deletion Confirmation Dialog */}
      {pendingDeleteVoucher && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in print:hidden" dir="rtl">
          <div className="bg-white dark:bg-[#0c203b] border border-blue-100 dark:border-blue-900/40 rounded-2xl max-w-md w-full p-6 text-right shadow-2xl space-y-5">
            <div className="flex items-start gap-3 flex-row-reverse">
              <div className="p-3 bg-rose-500/10 text-rose-600 rounded-xl">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-black text-gray-900 dark:text-white">
                  حذف السند والمرفقات المصاحبة
                </h3>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-relaxed">
                  يحتوي السند <span className="font-bold">({pendingDeleteVoucher.voucherNo})</span> على عدد <span className="font-bold">({pendingDeleteVoucher.attachments?.length})</span> من المرفقات والملفات الثبوتية المخزنة. كيف ترغب في إتمام عملية الحذف؟
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={handleConfirmDeleteWithAttachments}
                className="w-full py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black shadow-sm transition-all cursor-pointer text-center"
              >
                🗑️ حذف السند والملفات المرفقة معاً (نهائياً)
              </button>

              <button
                type="button"
                onClick={handleConfirmDeleteOnly}
                className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black shadow-sm transition-all cursor-pointer text-center"
              >
                📄 حذف السند المالي فقط (والاحتفاظ بالملفات في الخزانة)
              </button>

              <button
                type="button"
                onClick={() => setPendingDeleteVoucher(null)}
                className="w-full py-2.5 px-4 bg-gray-100 dark:bg-zinc-850 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-bold transition-all cursor-pointer text-center"
              >
                إلغاء العملية والتراجع
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
