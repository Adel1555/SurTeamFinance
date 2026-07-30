/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { VisualIdentity } from './types';

export interface ThemeColors {
  appBg: string;
  headerBg: string;
  headerText: string;
  sidebarBg: string;
  sidebarText: string;
  sidebarActive: string;
  footerBg: string;
  footerText: string;
  cardBg: string;
  cardBorder: string;
  cardGlow: string;
  frameBorder: string;
  tableHeaderBg: string;
  tableRowBg: string;
  tableRowHoverBg: string;
  tableRowActiveBg: string;
  textMain: string;
  textSecondary: string;
  buttonBg: string;
  buttonText: string;
  buttonHover: string;
  buttonSecondaryBg: string;
  buttonSecondaryText: string;
  buttonSecondaryHover: string;
  buttonDangerBg: string;
  buttonDangerText: string;
  buttonDangerHover: string;
  buttonSuccessBg: string;
  buttonSuccessText: string;
  buttonSuccessHover: string;
  buttonWarningBg: string;
  inputBg: string;
  inputBorder: string;
  inputFocus: string;
  dialogBg: string;
  dialogBorder: string;
  menuBg: string;
  menuBorder: string;
  tabBg: string;
  tabActiveBg: string;
  linkColor: string;
  iconColor: string;
  chartPrimary: string;
  chartSecondary: string;
  progressBarBg: string;
  progressFill: string;
  scrollbarThumb: string;
  scrollbarTrack: string;
  primaryColor: string;
  secondaryColor: string;
}

export interface PresetTheme {
  id: string;
  name: string;
  desc: string;
  mode: 'light' | 'dark';
  colors: ThemeColors;
}

export const PRESET_THEMES: PresetTheme[] = [
  {
    id: 'light-classic',
    name: 'أزرق كلاسيكي ناصع (Light Classic)',
    desc: 'واجهة رسمية ناصعة ومريحة للأعين تعتمد الأزرق الكلاسيكي المتوازن',
    mode: 'light',
    colors: {
      appBg: '#f1f5f9',
      headerBg: '#ffffff',
      headerText: '#0f172a',
      sidebarBg: '#ffffff',
      sidebarText: '#334155',
      sidebarActive: '#2563eb',
      footerBg: '#ffffff',
      footerText: '#475569',
      cardBg: '#ffffff',
      cardBorder: '#cbd5e1',
      cardGlow: 'rgba(37, 99, 235, 0.12)',
      frameBorder: '#cbd5e1',
      tableHeaderBg: '#f8fafc',
      tableRowBg: '#ffffff',
      tableRowHoverBg: '#f1f5f9',
      tableRowActiveBg: '#eff6ff',
      textMain: '#0f172a',
      textSecondary: '#64748b',
      buttonBg: '#2563eb',
      buttonText: '#ffffff',
      buttonHover: '#1d4ed8',
      buttonSecondaryBg: '#e2e8f0',
      buttonSecondaryText: '#1e293b',
      buttonSecondaryHover: '#cbd5e1',
      buttonDangerBg: '#dc2626',
      buttonDangerText: '#ffffff',
      buttonDangerHover: '#b91c1c',
      buttonSuccessBg: '#16a34a',
      buttonSuccessText: '#ffffff',
      buttonSuccessHover: '#15803d',
      buttonWarningBg: '#d97706',
      inputBg: '#ffffff',
      inputBorder: '#cbd5e1',
      inputFocus: '#2563eb',
      dialogBg: '#ffffff',
      dialogBorder: '#e2e8f0',
      menuBg: '#ffffff',
      menuBorder: '#e2e8f0',
      tabBg: '#e2e8f0',
      tabActiveBg: '#2563eb',
      linkColor: '#2563eb',
      iconColor: '#2563eb',
      chartPrimary: '#2563eb',
      chartSecondary: '#16a34a',
      progressBarBg: '#e2e8f0',
      progressFill: '#2563eb',
      scrollbarThumb: '#cbd5e1',
      scrollbarTrack: '#f1f5f9',
      primaryColor: '#2563eb',
      secondaryColor: '#1d4ed8'
    }
  },
  {
    id: 'dark-professional',
    name: 'داكن احترافي (Dark Professional)',
    desc: 'مظهر ليلي فخم عالي التباين والأداء يقلل إجهاد العين بلمسات سماوية',
    mode: 'dark',
    colors: {
      appBg: '#0f172a',
      headerBg: '#1e293b',
      headerText: '#f8fafc',
      sidebarBg: '#1e293b',
      sidebarText: '#94a3b8',
      sidebarActive: '#38bdf8',
      footerBg: '#1e293b',
      footerText: '#64748b',
      cardBg: '#1e293b',
      cardBorder: '#334155',
      cardGlow: 'rgba(56, 189, 248, 0.15)',
      frameBorder: '#334155',
      tableHeaderBg: '#0f172a',
      tableRowBg: '#1e293b',
      tableRowHoverBg: '#334155',
      tableRowActiveBg: '#1e3a8a',
      textMain: '#f8fafc',
      textSecondary: '#94a3b8',
      buttonBg: '#0284c7',
      buttonText: '#ffffff',
      buttonHover: '#0369a1',
      buttonSecondaryBg: '#334155',
      buttonSecondaryText: '#f1f5f9',
      buttonSecondaryHover: '#475569',
      buttonDangerBg: '#ef4444',
      buttonDangerText: '#ffffff',
      buttonDangerHover: '#dc2626',
      buttonSuccessBg: '#22c55e',
      buttonSuccessText: '#ffffff',
      buttonSuccessHover: '#16a34a',
      buttonWarningBg: '#f59e0b',
      inputBg: '#0f172a',
      inputBorder: '#334155',
      inputFocus: '#38bdf8',
      dialogBg: '#1e293b',
      dialogBorder: '#334155',
      menuBg: '#1e293b',
      menuBorder: '#334155',
      tabBg: '#0f172a',
      tabActiveBg: '#0284c7',
      linkColor: '#38bdf8',
      iconColor: '#38bdf8',
      chartPrimary: '#38bdf8',
      chartSecondary: '#4ade80',
      progressBarBg: '#334155',
      progressFill: '#38bdf8',
      scrollbarThumb: '#475569',
      scrollbarTrack: '#0f172a',
      primaryColor: '#0284c7',
      secondaryColor: '#0369a1'
    }
  },
  {
    id: 'ocean-blue',
    name: 'أزرق المحيط (Ocean Blue)',
    desc: 'مستوحى من زرقة البحر العماني، نضر وهادئ مع تباين عالي',
    mode: 'light',
    colors: {
      appBg: '#e0f2fe',
      headerBg: '#ffffff',
      headerText: '#0369a1',
      sidebarBg: '#ffffff',
      sidebarText: '#0c4a6e',
      sidebarActive: '#0284c7',
      footerBg: '#ffffff',
      footerText: '#0369a1',
      cardBg: '#ffffff',
      cardBorder: '#bae6fd',
      cardGlow: 'rgba(2, 132, 199, 0.15)',
      frameBorder: '#7dd3fc',
      tableHeaderBg: '#f0f9ff',
      tableRowBg: '#ffffff',
      tableRowHoverBg: '#e0f2fe',
      tableRowActiveBg: '#bae6fd',
      textMain: '#0c4a6e',
      textSecondary: '#0369a1',
      buttonBg: '#0284c7',
      buttonText: '#ffffff',
      buttonHover: '#0369a1',
      buttonSecondaryBg: '#bae6fd',
      buttonSecondaryText: '#0c4a6e',
      buttonSecondaryHover: '#7dd3fc',
      buttonDangerBg: '#e11d48',
      buttonDangerText: '#ffffff',
      buttonDangerHover: '#be123c',
      buttonSuccessBg: '#0d9488',
      buttonSuccessText: '#ffffff',
      buttonSuccessHover: '#0f766e',
      buttonWarningBg: '#d97706',
      inputBg: '#ffffff',
      inputBorder: '#7dd3fc',
      inputFocus: '#0284c7',
      dialogBg: '#ffffff',
      dialogBorder: '#bae6fd',
      menuBg: '#ffffff',
      menuBorder: '#bae6fd',
      tabBg: '#e0f2fe',
      tabActiveBg: '#0284c7',
      linkColor: '#0284c7',
      iconColor: '#0284c7',
      chartPrimary: '#0284c7',
      chartSecondary: '#0d9488',
      progressBarBg: '#bae6fd',
      progressFill: '#0284c7',
      scrollbarThumb: '#7dd3fc',
      scrollbarTrack: '#e0f2fe',
      primaryColor: '#0284c7',
      secondaryColor: '#0369a1'
    }
  },
  {
    id: 'emerald-green',
    name: 'زمردي خيري إسلامي (Emerald Green)',
    desc: 'سمة إسلامية خضراء تعبر عن العطاء، النماء، والعمل الخيري',
    mode: 'light',
    colors: {
      appBg: '#f0fdf4',
      headerBg: '#ffffff',
      headerText: '#166534',
      sidebarBg: '#ffffff',
      sidebarText: '#14532d',
      sidebarActive: '#15803d',
      footerBg: '#ffffff',
      footerText: '#166534',
      cardBg: '#ffffff',
      cardBorder: '#bbf7d0',
      cardGlow: 'rgba(21, 128, 61, 0.15)',
      frameBorder: '#86efac',
      tableHeaderBg: '#dcfce7',
      tableRowBg: '#ffffff',
      tableRowHoverBg: '#f0fdf4',
      tableRowActiveBg: '#dcfce7',
      textMain: '#14532d',
      textSecondary: '#166534',
      buttonBg: '#15803d',
      buttonText: '#ffffff',
      buttonHover: '#166534',
      buttonSecondaryBg: '#dcfce7',
      buttonSecondaryText: '#14532d',
      buttonSecondaryHover: '#bbf7d0',
      buttonDangerBg: '#dc2626',
      buttonDangerText: '#ffffff',
      buttonDangerHover: '#b91c1c',
      buttonSuccessBg: '#16a34a',
      buttonSuccessText: '#ffffff',
      buttonSuccessHover: '#15803d',
      buttonWarningBg: '#ea580c',
      inputBg: '#ffffff',
      inputBorder: '#86efac',
      inputFocus: '#15803d',
      dialogBg: '#ffffff',
      dialogBorder: '#bbf7d0',
      menuBg: '#ffffff',
      menuBorder: '#bbf7d0',
      tabBg: '#f0fdf4',
      tabActiveBg: '#15803d',
      linkColor: '#15803d',
      iconColor: '#15803d',
      chartPrimary: '#15803d',
      chartSecondary: '#0284c7',
      progressBarBg: '#bbf7d0',
      progressFill: '#15803d',
      scrollbarThumb: '#86efac',
      scrollbarTrack: '#f0fdf4',
      primaryColor: '#15803d',
      secondaryColor: '#166534'
    }
  },
  {
    id: 'royal-purple',
    name: 'ملكي أرجواني (Royal Purple)',
    desc: 'طابع ملكي رفيع بلمسات الأرجواني الفاخر والرصين',
    mode: 'light',
    colors: {
      appBg: '#faf5ff',
      headerBg: '#ffffff',
      headerText: '#6b21a8',
      sidebarBg: '#ffffff',
      sidebarText: '#581c87',
      sidebarActive: '#7e22ce',
      footerBg: '#ffffff',
      footerText: '#6b21a8',
      cardBg: '#ffffff',
      cardBorder: '#e9d5ff',
      cardGlow: 'rgba(126, 34, 206, 0.15)',
      frameBorder: '#d8b4fe',
      tableHeaderBg: '#f3e8ff',
      tableRowBg: '#ffffff',
      tableRowHoverBg: '#faf5ff',
      tableRowActiveBg: '#f3e8ff',
      textMain: '#3b0764',
      textSecondary: '#6b21a8',
      buttonBg: '#7e22ce',
      buttonText: '#ffffff',
      buttonHover: '#6b21a8',
      buttonSecondaryBg: '#f3e8ff',
      buttonSecondaryText: '#581c87',
      buttonSecondaryHover: '#e9d5ff',
      buttonDangerBg: '#e11d48',
      buttonDangerText: '#ffffff',
      buttonDangerHover: '#be123c',
      buttonSuccessBg: '#16a34a',
      buttonSuccessText: '#ffffff',
      buttonSuccessHover: '#15803d',
      buttonWarningBg: '#d97706',
      inputBg: '#ffffff',
      inputBorder: '#d8b4fe',
      inputFocus: '#7e22ce',
      dialogBg: '#ffffff',
      dialogBorder: '#e9d5ff',
      menuBg: '#ffffff',
      menuBorder: '#e9d5ff',
      tabBg: '#faf5ff',
      tabActiveBg: '#7e22ce',
      linkColor: '#7e22ce',
      iconColor: '#7e22ce',
      chartPrimary: '#7e22ce',
      chartSecondary: '#2563eb',
      progressBarBg: '#e9d5ff',
      progressFill: '#7e22ce',
      scrollbarThumb: '#d8b4fe',
      scrollbarTrack: '#faf5ff',
      primaryColor: '#7e22ce',
      secondaryColor: '#6b21a8'
    }
  },
  {
    id: 'sunset-orange',
    name: 'غروب صور الدافئ (Sunset Orange)',
    desc: 'يعكس ألوان حجر الجبال والطابع الأصيل لولاية صور والتراث العماني',
    mode: 'light',
    colors: {
      appBg: '#fff7ed',
      headerBg: '#ffffff',
      headerText: '#9a3412',
      sidebarBg: '#ffffff',
      sidebarText: '#7c2d12',
      sidebarActive: '#c2410c',
      footerBg: '#ffffff',
      footerText: '#9a3412',
      cardBg: '#ffffff',
      cardBorder: '#ffedd5',
      cardGlow: 'rgba(194, 65, 12, 0.15)',
      frameBorder: '#fed7aa',
      tableHeaderBg: '#ffedd5',
      tableRowBg: '#ffffff',
      tableRowHoverBg: '#fff7ed',
      tableRowActiveBg: '#ffedd5',
      textMain: '#431407',
      textSecondary: '#9a3412',
      buttonBg: '#c2410c',
      buttonText: '#ffffff',
      buttonHover: '#9a3412',
      buttonSecondaryBg: '#ffedd5',
      buttonSecondaryText: '#7c2d12',
      buttonSecondaryHover: '#fed7aa',
      buttonDangerBg: '#dc2626',
      buttonDangerText: '#ffffff',
      buttonDangerHover: '#b91c1c',
      buttonSuccessBg: '#16a34a',
      buttonSuccessText: '#ffffff',
      buttonSuccessHover: '#15803d',
      buttonWarningBg: '#d97706',
      inputBg: '#ffffff',
      inputBorder: '#fed7aa',
      inputFocus: '#c2410c',
      dialogBg: '#ffffff',
      dialogBorder: '#ffedd5',
      menuBg: '#ffffff',
      menuBorder: '#ffedd5',
      tabBg: '#fff7ed',
      tabActiveBg: '#c2410c',
      linkColor: '#c2410c',
      iconColor: '#c2410c',
      chartPrimary: '#c2410c',
      chartSecondary: '#0284c7',
      progressBarBg: '#ffedd5',
      progressFill: '#c2410c',
      scrollbarThumb: '#fed7aa',
      scrollbarTrack: '#fff7ed',
      primaryColor: '#c2410c',
      secondaryColor: '#9a3412'
    }
  },
  {
    id: 'crimson-red',
    name: 'قرمزي فاخر (Crimson Red)',
    desc: 'طابع قرمزي دافئ وعالي الوضوح يعطي شعوراً بالحيوية والأصالة',
    mode: 'light',
    colors: {
      appBg: '#fff1f2',
      headerBg: '#ffffff',
      headerText: '#9f1239',
      sidebarBg: '#ffffff',
      sidebarText: '#881337',
      sidebarActive: '#be123c',
      footerBg: '#ffffff',
      footerText: '#9f1239',
      cardBg: '#ffffff',
      cardBorder: '#fecdd3',
      cardGlow: 'rgba(190, 18, 60, 0.15)',
      frameBorder: '#fda4af',
      tableHeaderBg: '#ffe4e6',
      tableRowBg: '#ffffff',
      tableRowHoverBg: '#fff1f2',
      tableRowActiveBg: '#ffe4e6',
      textMain: '#4c0519',
      textSecondary: '#9f1239',
      buttonBg: '#be123c',
      buttonText: '#ffffff',
      buttonHover: '#9f1239',
      buttonSecondaryBg: '#ffe4e6',
      buttonSecondaryText: '#881337',
      buttonSecondaryHover: '#fecdd3',
      buttonDangerBg: '#991b1b',
      buttonDangerText: '#ffffff',
      buttonDangerHover: '#7f1d1d',
      buttonSuccessBg: '#16a34a',
      buttonSuccessText: '#ffffff',
      buttonSuccessHover: '#15803d',
      buttonWarningBg: '#d97706',
      inputBg: '#ffffff',
      inputBorder: '#fda4af',
      inputFocus: '#be123c',
      dialogBg: '#ffffff',
      dialogBorder: '#fecdd3',
      menuBg: '#ffffff',
      menuBorder: '#fecdd3',
      tabBg: '#fff1f2',
      tabActiveBg: '#be123c',
      linkColor: '#be123c',
      iconColor: '#be123c',
      chartPrimary: '#be123c',
      chartSecondary: '#2563eb',
      progressBarBg: '#fecdd3',
      progressFill: '#be123c',
      scrollbarThumb: '#fda4af',
      scrollbarTrack: '#fff1f2',
      primaryColor: '#be123c',
      secondaryColor: '#9f1239'
    }
  },
  {
    id: 'midnight-navy',
    name: 'كحلي الليل (Midnight Navy)',
    desc: 'سهرة داكنة بلمسات أزرق الليل والتباين الدقيق المريح في الإضاءة المنخفضة',
    mode: 'dark',
    colors: {
      appBg: '#0a0f1d',
      headerBg: '#111827',
      headerText: '#f3f4f6',
      sidebarBg: '#111827',
      sidebarText: '#9ca3af',
      sidebarActive: '#3b82f6',
      footerBg: '#111827',
      footerText: '#6b7280',
      cardBg: '#111827',
      cardBorder: '#1f2937',
      cardGlow: 'rgba(59, 130, 246, 0.2)',
      frameBorder: '#1f2937',
      tableHeaderBg: '#0a0f1d',
      tableRowBg: '#111827',
      tableRowHoverBg: '#1f2937',
      tableRowActiveBg: '#1e3a8a',
      textMain: '#f9fafb',
      textSecondary: '#9ca3af',
      buttonBg: '#2563eb',
      buttonText: '#ffffff',
      buttonHover: '#1d4ed8',
      buttonSecondaryBg: '#1f2937',
      buttonSecondaryText: '#f3f4f6',
      buttonSecondaryHover: '#374151',
      buttonDangerBg: '#ef4444',
      buttonDangerText: '#ffffff',
      buttonDangerHover: '#dc2626',
      buttonSuccessBg: '#22c55e',
      buttonSuccessText: '#ffffff',
      buttonSuccessHover: '#16a34a',
      buttonWarningBg: '#f59e0b',
      inputBg: '#0a0f1d',
      inputBorder: '#1f2937',
      inputFocus: '#3b82f6',
      dialogBg: '#111827',
      dialogBorder: '#1f2937',
      menuBg: '#111827',
      menuBorder: '#1f2937',
      tabBg: '#0a0f1d',
      tabActiveBg: '#2563eb',
      linkColor: '#60a5fa',
      iconColor: '#60a5fa',
      chartPrimary: '#60a5fa',
      chartSecondary: '#34d399',
      progressBarBg: '#1f2937',
      progressFill: '#3b82f6',
      scrollbarThumb: '#374151',
      scrollbarTrack: '#0a0f1d',
      primaryColor: '#2563eb',
      secondaryColor: '#1d4ed8'
    }
  },
  {
    id: 'graphite-gray',
    name: 'جرانيت رمادي (Graphite Gray)',
    desc: 'رمادي معدني حديث ومسطح يناسب المحترفين ومحبي البساطة الأنيقة',
    mode: 'dark',
    colors: {
      appBg: '#18181b',
      headerBg: '#27272a',
      headerText: '#f4f4f5',
      sidebarBg: '#27272a',
      sidebarText: '#a1a1aa',
      sidebarActive: '#e4e4e7',
      footerBg: '#27272a',
      footerText: '#71717a',
      cardBg: '#27272a',
      cardBorder: '#3f3f46',
      cardGlow: 'rgba(228, 228, 231, 0.12)',
      frameBorder: '#3f3f46',
      tableHeaderBg: '#18181b',
      tableRowBg: '#27272a',
      tableRowHoverBg: '#3f3f46',
      tableRowActiveBg: '#52525b',
      textMain: '#fafafa',
      textSecondary: '#a1a1aa',
      buttonBg: '#3f3f46',
      buttonText: '#ffffff',
      buttonHover: '#52525b',
      buttonSecondaryBg: '#27272a',
      buttonSecondaryText: '#e4e4e7',
      buttonSecondaryHover: '#3f3f46',
      buttonDangerBg: '#dc2626',
      buttonDangerText: '#ffffff',
      buttonDangerHover: '#b91c1c',
      buttonSuccessBg: '#16a34a',
      buttonSuccessText: '#ffffff',
      buttonSuccessHover: '#15803d',
      buttonWarningBg: '#d97706',
      inputBg: '#18181b',
      inputBorder: '#3f3f46',
      inputFocus: '#a1a1aa',
      dialogBg: '#27272a',
      dialogBorder: '#3f3f46',
      menuBg: '#27272a',
      menuBorder: '#3f3f46',
      tabBg: '#18181b',
      tabActiveBg: '#3f3f46',
      linkColor: '#e4e4e7',
      iconColor: '#e4e4e7',
      chartPrimary: '#e4e4e7',
      chartSecondary: '#38bdf8',
      progressBarBg: '#3f3f46',
      progressFill: '#e4e4e7',
      scrollbarThumb: '#52525b',
      scrollbarTrack: '#18181b',
      primaryColor: '#3f3f46',
      secondaryColor: '#52525b'
    }
  },
  {
    id: 'gold-luxury',
    name: 'ذهبي فاخر (Gold Luxury)',
    desc: 'مظهر أبنوسي داكن مع لمسات برنزية وذهبية مبهرة عالي الرقي والفخامة',
    mode: 'dark',
    colors: {
      appBg: '#0c0a09',
      headerBg: '#1c1917',
      headerText: '#fef08a',
      sidebarBg: '#1c1917',
      sidebarText: '#a8a29e',
      sidebarActive: '#eab308',
      footerBg: '#1c1917',
      footerText: '#78716c',
      cardBg: '#1c1917',
      cardBorder: '#292524',
      cardGlow: 'rgba(234, 179, 8, 0.2)',
      frameBorder: '#44403c',
      tableHeaderBg: '#0c0a09',
      tableRowBg: '#1c1917',
      tableRowHoverBg: '#292524',
      tableRowActiveBg: '#451a03',
      textMain: '#fafaf9',
      textSecondary: '#d6d3d1',
      buttonBg: '#ca8a04',
      buttonText: '#0c0a09',
      buttonHover: '#a16207',
      buttonSecondaryBg: '#292524',
      buttonSecondaryText: '#fef08a',
      buttonSecondaryHover: '#44403c',
      buttonDangerBg: '#dc2626',
      buttonDangerText: '#ffffff',
      buttonDangerHover: '#b91c1c',
      buttonSuccessBg: '#16a34a',
      buttonSuccessText: '#ffffff',
      buttonSuccessHover: '#15803d',
      buttonWarningBg: '#eab308',
      inputBg: '#0c0a09',
      inputBorder: '#44403c',
      inputFocus: '#eab308',
      dialogBg: '#1c1917',
      dialogBorder: '#44403c',
      menuBg: '#1c1917',
      menuBorder: '#44403c',
      tabBg: '#0c0a09',
      tabActiveBg: '#ca8a04',
      linkColor: '#fde047',
      iconColor: '#fde047',
      chartPrimary: '#eab308',
      chartSecondary: '#38bdf8',
      progressBarBg: '#292524',
      progressFill: '#eab308',
      scrollbarThumb: '#44403c',
      scrollbarTrack: '#0c0a09',
      primaryColor: '#ca8a04',
      secondaryColor: '#a16207'
    }
  }
];

export function getResolvedThemeColors(identity: Partial<VisualIdentity>, isDarkMode: boolean): ThemeColors {
  const defaultPreset = isDarkMode ? PRESET_THEMES[1] : PRESET_THEMES[0];
  const d = defaultPreset.colors;

  return {
    appBg: identity.appBg || d.appBg,
    headerBg: identity.headerBg || d.headerBg,
    headerText: identity.headerText || d.headerText,
    sidebarBg: identity.sidebarBg || d.sidebarBg,
    sidebarText: identity.sidebarText || d.sidebarText,
    sidebarActive: identity.sidebarActive || identity.primaryColor || d.sidebarActive,
    footerBg: identity.footerBg || d.footerBg,
    footerText: identity.footerText || d.footerText,
    cardBg: identity.cardBg || d.cardBg,
    cardBorder: identity.cardBorder || d.cardBorder,
    cardGlow: identity.cardGlow || d.cardGlow,
    frameBorder: identity.frameBorder || d.frameBorder,
    tableHeaderBg: identity.tableHeaderBg || d.tableHeaderBg,
    tableRowBg: identity.tableRowBg || d.tableRowBg,
    tableRowHoverBg: identity.tableRowHoverBg || d.tableRowHoverBg,
    tableRowActiveBg: identity.tableRowActiveBg || d.tableRowActiveBg,
    textMain: identity.textMain || d.textMain,
    textSecondary: identity.textSecondary || d.textSecondary,
    buttonBg: identity.buttonBg || identity.primaryColor || d.buttonBg,
    buttonText: identity.buttonText || d.buttonText,
    buttonHover: identity.buttonHover || identity.secondaryColor || d.buttonHover,
    buttonSecondaryBg: identity.buttonSecondaryBg || d.buttonSecondaryBg,
    buttonSecondaryText: identity.buttonSecondaryText || d.buttonSecondaryText,
    buttonSecondaryHover: identity.buttonSecondaryHover || d.buttonSecondaryHover,
    buttonDangerBg: identity.buttonDangerBg || d.buttonDangerBg,
    buttonDangerText: identity.buttonDangerText || d.buttonDangerText,
    buttonDangerHover: identity.buttonDangerHover || d.buttonDangerHover,
    buttonSuccessBg: identity.buttonSuccessBg || d.buttonSuccessBg,
    buttonSuccessText: identity.buttonSuccessText || d.buttonSuccessText,
    buttonSuccessHover: identity.buttonSuccessHover || d.buttonSuccessHover,
    buttonWarningBg: identity.buttonWarningBg || d.buttonWarningBg,
    inputBg: identity.inputBg || d.inputBg,
    inputBorder: identity.inputBorder || d.inputBorder,
    inputFocus: identity.inputFocus || d.inputFocus,
    dialogBg: identity.dialogBg || d.dialogBg,
    dialogBorder: identity.dialogBorder || d.dialogBorder,
    menuBg: identity.menuBg || d.menuBg,
    menuBorder: identity.menuBorder || d.menuBorder,
    tabBg: identity.tabBg || d.tabBg,
    tabActiveBg: identity.tabActiveBg || d.tabActiveBg,
    linkColor: identity.linkColor || d.linkColor,
    iconColor: identity.iconColor || d.iconColor,
    chartPrimary: identity.chartPrimary || d.chartPrimary,
    chartSecondary: identity.chartSecondary || d.chartSecondary,
    progressBarBg: identity.progressBarBg || d.progressBarBg,
    progressFill: identity.progressFill || d.progressFill,
    scrollbarThumb: identity.scrollbarThumb || d.scrollbarThumb,
    scrollbarTrack: identity.scrollbarTrack || d.scrollbarTrack,
    primaryColor: identity.primaryColor || d.primaryColor,
    secondaryColor: identity.secondaryColor || d.secondaryColor
  };
}

// --- Contrast Validation & Helper Functions ---

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let cleanHex = hex.trim().replace('#', '');
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map(c => c + c).join('');
  }
  const num = parseInt(cleanHex, 16);
  if (isNaN(num)) return { r: 0, g: 0, b: 0 };
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255
  };
}

export function getLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const a = [r, g, b].map(v => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

export function getContrastRatio(hex1: string, hex2: string): number {
  const lum1 = getLuminance(hex1);
  const lum2 = getLuminance(hex2);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

export interface ContrastCheckResult {
  pairKey: string;
  label: string;
  textKey: keyof ThemeColors;
  bgKey: keyof ThemeColors;
  textColor: string;
  bgColor: string;
  ratio: number;
  isLow: boolean;
  suggestedText: string;
}

export function validateThemeContrast(colors: ThemeColors): ContrastCheckResult[] {
  const pairs: Array<{ label: string; textKey: keyof ThemeColors; bgKey: keyof ThemeColors }> = [
    { label: 'النص الأساسي فوق خلفية التطبيق', textKey: 'textMain', bgKey: 'appBg' },
    { label: 'نص شريط العنوان فوق خلفية العنوان', textKey: 'headerText', bgKey: 'headerBg' },
    { label: 'نص القائمة فوق خلفية الشريط الجانبي', textKey: 'sidebarText', bgKey: 'sidebarBg' },
    { label: 'نص الأزرار الأساسية فوق خلفية الزر', textKey: 'buttonText', bgKey: 'buttonBg' },
    { label: 'نص الأزرار الثانوية فوق خلفيتها', textKey: 'buttonSecondaryText', bgKey: 'buttonSecondaryBg' },
    { label: 'نص أزرار الحذف فوق خلفية الخطر', textKey: 'buttonDangerText', bgKey: 'buttonDangerBg' },
    { label: 'نص أزرار النجاح فوق خلفية النجاح', textKey: 'buttonSuccessText', bgKey: 'buttonSuccessBg' },
  ];

  return pairs.map(p => {
    const textColor = colors[p.textKey] || '#000000';
    const bgColor = colors[p.bgKey] || '#ffffff';
    const ratio = Math.round(getContrastRatio(textColor, bgColor) * 10) / 10;
    const isLow = ratio < 4.5;
    const bgLum = getLuminance(bgColor);
    const suggestedText = bgLum < 0.5 ? '#ffffff' : '#0f172a';

    return {
      pairKey: `${p.textKey}-${p.bgKey}`,
      label: p.label,
      textKey: p.textKey,
      bgKey: p.bgKey,
      textColor,
      bgColor,
      ratio,
      isLow,
      suggestedText
    };
  });
}

