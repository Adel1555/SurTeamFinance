/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { VisualIdentity, ButtonStyle, CardStyle } from '../types';
import { DatabaseService } from '../db';
import { 
  Sparkles, 
  Palette, 
  Type, 
  Check, 
  HelpCircle, 
  RotateCcw, 
  Save, 
  Layout, 
  Eye, 
  FileText, 
  Settings, 
  MousePointerClick,
  Info
} from 'lucide-react';

interface VisualIdentityPanelProps {
  config: VisualIdentity;
  onUpdate: (newConfig: VisualIdentity) => void;
}

const PRESET_THEMES = [
  {
    name: 'أزرق كلاسيكي احترافي',
    desc: 'نمط هادئ، واجهة رسمية ومريحة للأعين',
    mode: 'light',
    colors: {
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
    }
  },
  {
    name: 'كحلي وقار داكن',
    desc: 'مظهر ليلي فخم عالي التباين والأداء',
    mode: 'dark',
    colors: {
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
    }
  },
  {
    name: 'زمردي خيري إسلامي',
    desc: 'مستوحى من راية ونماء الأعمال التطوعية',
    mode: 'light',
    colors: {
      appBg: '#f0fdf4',
      headerBg: '#ffffff',
      headerText: '#166534',
      sidebarBg: '#ffffff',
      sidebarText: '#1f2937',
      sidebarActive: '#15803d',
      footerBg: '#ffffff',
      footerText: '#4b5563',
      cardBg: '#ffffff',
      cardBorder: '#bbf7d0',
      cardGlow: 'rgba(21, 128, 61, 0.15)',
      frameBorder: '#86efac',
      tableHeaderBg: '#f0fdf4',
      tableRowBg: '#ffffff',
      textMain: '#14532d',
      textSecondary: '#4b5563',
      buttonBg: '#15803d',
      buttonText: '#ffffff',
      buttonHover: '#166534',
      inputBg: '#ffffff',
      inputBorder: '#bbf7d0',
      dialogBg: '#ffffff',
      dialogBorder: '#bbf7d0',
      primaryColor: '#15803d',
      secondaryColor: '#166534'
    }
  },
  {
    name: 'تراث صور وعمان الدافئ',
    desc: 'يعكس ألوان حجر الجبال والطابع البحري التراثي',
    mode: 'light',
    colors: {
      appBg: '#fdf8f4',
      headerBg: '#ffffff',
      headerText: '#9a3412',
      sidebarBg: '#ffffff',
      sidebarText: '#3c1204',
      sidebarActive: '#b45309',
      footerBg: '#ffffff',
      footerText: '#78716c',
      cardBg: '#ffffff',
      cardBorder: '#ffedd5',
      cardGlow: 'rgba(180, 83, 9, 0.15)',
      frameBorder: '#fed7aa',
      tableHeaderBg: '#fff7ed',
      tableRowBg: '#ffffff',
      textMain: '#431407',
      textSecondary: '#78716c',
      buttonBg: '#b45309',
      buttonText: '#ffffff',
      buttonHover: '#9a3412',
      inputBg: '#ffffff',
      inputBorder: '#ffedd5',
      dialogBg: '#ffffff',
      dialogBorder: '#ffedd5',
      primaryColor: '#b45309',
      secondaryColor: '#9a3412'
    }
  },
  {
    name: 'أبيض ناصع معاصر',
    desc: 'تصميم مسطح بسيط خالي من أي مشتتات بصريّة',
    mode: 'light',
    colors: {
      appBg: '#f8fafc',
      headerBg: '#ffffff',
      headerText: '#0f172a',
      sidebarBg: '#ffffff',
      sidebarText: '#475569',
      sidebarActive: '#0f172a',
      footerBg: '#ffffff',
      footerText: '#64748b',
      cardBg: '#ffffff',
      cardBorder: '#e2e8f0',
      cardGlow: 'rgba(15, 23, 42, 0.08)',
      frameBorder: '#cbd5e1',
      tableHeaderBg: '#f1f5f9',
      tableRowBg: '#ffffff',
      textMain: '#0f172a',
      textSecondary: '#475569',
      buttonBg: '#0f172a',
      buttonText: '#ffffff',
      buttonHover: '#1e293b',
      inputBg: '#ffffff',
      inputBorder: '#cbd5e1',
      dialogBg: '#ffffff',
      dialogBorder: '#cbd5e1',
      primaryColor: '#0f172a',
      secondaryColor: '#1e293b'
    }
  }
];

const LIGHT_DEFAULT_COLORS = {
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
  dialogBorder: '#dbeafe',
  primaryColor: '#0f766e',
  secondaryColor: '#0369a1'
};

export default function VisualIdentityPanel({ config, onUpdate }: VisualIdentityPanelProps) {
  const [localConfig, setLocalConfig] = useState<VisualIdentity>({ ...config });
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeSection, setActiveSection] = useState<'colors' | 'labels' | 'shapes'>('colors');
  const [isHoveredButton, setIsHoveredButton] = useState(false);

  // Fallbacks definitions to guard undefined older databases values
  const c = {
    appBg: localConfig.appBg || LIGHT_DEFAULT_COLORS.appBg,
    headerBg: localConfig.headerBg || LIGHT_DEFAULT_COLORS.headerBg,
    headerText: localConfig.headerText || LIGHT_DEFAULT_COLORS.headerText,
    sidebarBg: localConfig.sidebarBg || LIGHT_DEFAULT_COLORS.sidebarBg,
    sidebarText: localConfig.sidebarText || LIGHT_DEFAULT_COLORS.sidebarText,
    sidebarActive: localConfig.sidebarActive || LIGHT_DEFAULT_COLORS.sidebarActive,
    footerBg: localConfig.footerBg || LIGHT_DEFAULT_COLORS.footerBg,
    footerText: localConfig.footerText || LIGHT_DEFAULT_COLORS.footerText,
    cardBg: localConfig.cardBg || LIGHT_DEFAULT_COLORS.cardBg,
    cardBorder: localConfig.cardBorder || LIGHT_DEFAULT_COLORS.cardBorder,
    cardGlow: localConfig.cardGlow || LIGHT_DEFAULT_COLORS.cardGlow,
    frameBorder: localConfig.frameBorder || LIGHT_DEFAULT_COLORS.frameBorder,
    tableHeaderBg: localConfig.tableHeaderBg || LIGHT_DEFAULT_COLORS.tableHeaderBg,
    tableRowBg: localConfig.tableRowBg || LIGHT_DEFAULT_COLORS.tableRowBg,
    textMain: localConfig.textMain || LIGHT_DEFAULT_COLORS.textMain,
    textSecondary: localConfig.textSecondary || LIGHT_DEFAULT_COLORS.textSecondary,
    buttonBg: localConfig.buttonBg || LIGHT_DEFAULT_COLORS.buttonBg,
    buttonText: localConfig.buttonText || LIGHT_DEFAULT_COLORS.buttonText,
    buttonHover: localConfig.buttonHover || LIGHT_DEFAULT_COLORS.buttonHover,
    inputBg: localConfig.inputBg || LIGHT_DEFAULT_COLORS.inputBg,
    inputBorder: localConfig.inputBorder || LIGHT_DEFAULT_COLORS.inputBorder,
    dialogBg: localConfig.dialogBg || LIGHT_DEFAULT_COLORS.dialogBg,
    dialogBorder: localConfig.dialogBorder || LIGHT_DEFAULT_COLORS.dialogBorder,
    primaryColor: localConfig.primaryColor || LIGHT_DEFAULT_COLORS.primaryColor,
    secondaryColor: localConfig.secondaryColor || LIGHT_DEFAULT_COLORS.secondaryColor
  };

  const handleFieldChange = (key: keyof VisualIdentity, value: any) => {
    // If updating buttonBg or sidebarActive, synchronize primaryColor for legacy consistency
    let extraUpdates = {};
    if (key === 'buttonBg') {
      extraUpdates = { primaryColor: value };
    } else if (key === 'buttonHover') {
      extraUpdates = { secondaryColor: value };
    }
    const updated = { ...localConfig, [key]: value, ...extraUpdates };
    setLocalConfig(updated);
    // Instant Live Update so fields change immediately across app
    onUpdate(updated);
  };

  // Preset loading trigger
  const handlePresetSelect = (preset: typeof PRESET_THEMES[0]) => {
    const updated: VisualIdentity = {
      ...localConfig,
      ...preset.colors,
      themeMode: preset.mode as any,
      selectedThemeName: preset.name
    };
    setLocalConfig(updated);
    onUpdate(updated);
    triggerSuccess();
  };

  const handleSaveTheme = () => {
    DatabaseService.saveVisualIdentity(localConfig);
    onUpdate(localConfig);
    triggerSuccess();
  };

  const handleResetToDefault = () => {
    const resetConfig: VisualIdentity = {
      ...localConfig,
      ...LIGHT_DEFAULT_COLORS,
      themeMode: 'light',
      selectedThemeName: 'Light Blue Professional'
    };
    setLocalConfig(resetConfig);
    DatabaseService.saveVisualIdentity(resetConfig);
    onUpdate(resetConfig);
    triggerSuccess();
  };

  const handleApplyToAll = () => {
    DatabaseService.saveVisualIdentity(localConfig);
    onUpdate(localConfig);
    triggerSuccess();
    // Simulate short global state sync delay
    const icon = document.getElementById('apply-sync-icon');
    if (icon) {
      icon.classList.add('animate-spin');
      setTimeout(() => icon.classList.remove('animate-spin'), 1000);
    }
  };

  const triggerSuccess = () => {
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const buttonStyleLabels: { value: ButtonStyle; label: string; preview: string }[] = [
    { value: 'sharp', label: 'حواف حادة كلاسيكية', preview: 'rounded-none' },
    { value: 'rounded', label: 'حواف ناعمة افتراضية', preview: 'rounded-xl' },
    { value: 'pill', label: 'حواف دائرية كاملة (Pill)', preview: 'rounded-full' },
  ];

  const cardStyleLabels: { value: CardStyle; label: string; preview: string }[] = [
    { value: 'flat', label: 'مسطح بالكامل', preview: 'border-0 bg-blue-50/20' },
    { value: 'bordered', label: 'إطار خفيف ناعم', preview: 'border border-blue-100 bg-white' },
    { value: 'shadowed', label: 'ظلال كلاسيكية مرتفعة', preview: 'shadow-md border border-slate-100 bg-white' },
    { value: 'glass', label: 'تأثير زجاجي بلوري', preview: 'backdrop-blur bg-white/75 border border-white/40' },
  ];

  const colorFields: { key: keyof VisualIdentity; label: string; desc: string; category: string }[] = [
    // Main UI & Containers
    { key: 'appBg', label: 'لون الخلفية العامة للتطبيق', desc: 'خلفية الشاشة وقواعد المحتوى العريضة', category: 'containers' },
    { key: 'cardBg', label: 'لون خلفية البطاقات والتقارير', desc: 'خلفية حاويات البيانات والجداول الإحصائية', category: 'containers' },
    { key: 'cardBorder', label: 'لون إطارات وحدود البطاقات', desc: 'فاصل ومحدد البطاقة عن الخلفية الأساسية', category: 'containers' },
    { key: 'cardGlow', label: 'لون توهج وظلال البطاقات', desc: 'توهج الخلفية الناعم (RGBA أو لون محدد)', category: 'containers' },
    { key: 'frameBorder', label: 'لون حدود الإطارات واللوحات', desc: 'حدود الفواصل الهيكلية للتصميم والمفاتيح', category: 'containers' },

    // Header & sidebar Controls
    { key: 'headerBg', label: 'لون خلفية شريط العنوان العلوي', desc: 'الحجاب العلوي الذي يحوي الساعة واللوجو', category: 'nav' },
    { key: 'headerText', label: 'لون نصوص شريط العنوان العلوي', desc: 'لون المسميات والأيقونات في الشريط العلوي', category: 'nav' },
    { key: 'sidebarBg', label: 'لون خلفية شريط التنقل الجانبي', desc: 'خلفية لوحة القوائم الجانبية المساعدة باليمين', category: 'nav' },
    { key: 'sidebarText', label: 'لون عناصر شريط التنقل الجانبي', desc: 'نصوص قوائم الأقسام العادية غير المفعلة', category: 'nav' },
    { key: 'sidebarActive', label: 'لون عنصر القائمة المفعل والنشط', desc: 'خلفية التبويب الأساسي النشط المعروض بالواجهة', category: 'nav' },
    { key: 'footerBg', label: 'لون خلفية شريط التذييل السفلي', desc: 'الحوض السفلي وتطبيقات حقوق البرنامج المالية', category: 'nav' },
    { key: 'footerText', label: 'لون نصوص شريط التذييل السفلي', desc: 'عبارات شروط وحقوق السندات والتنبيهات المكتوبة', category: 'nav' },

    // Typography & Tables Layouts
    { key: 'textMain', label: 'لون النصوص الرئيسي (Main Text)', desc: 'العناوين والمبالغ المالية والبيانات البارزة المكتوبة', category: 'typography' },
    { key: 'textSecondary', label: 'لون النصوص الثانوي المساعد', desc: 'شروحات المسميات والإرشادات وتاريخ الحركات المكتوب', category: 'typography' },
    { key: 'tableHeaderBg', label: 'لون خلفية ترويسة الجداول', desc: 'الصف العلوي الحامل لعناوين أعمدة الجداول والتقارير', category: 'typography' },
    { key: 'tableRowBg', label: 'لون خلفية صفوف البيانات في الجداول', desc: 'الأسطر الحاملة للقيود المالية وسندات الإدخال', category: 'typography' },

    // Buttons & Form Fields
    { key: 'buttonBg', label: 'اللون الأساسي للأزرار والرموز', desc: 'خلفية أزرار الحفظ والإدخال والتفاعلات المالية', category: 'controls' },
    { key: 'buttonText', label: 'لون نصوص الأزرار', desc: 'العبارات المكتوبة على الزر بالأبيض أو الداكن', category: 'controls' },
    { key: 'buttonHover', label: 'لون الأزرار عند تمرير مؤشر الفأرة', desc: 'التفاعل الحركي للزر عند الإشارة فوقه بالماوس', category: 'controls' },
    { key: 'inputBg', label: 'لون خلفية حقول النماذج والإدخال', desc: 'خلفية مربعات كتابة المبالغ والأسماء والبيانات', category: 'controls' },
    { key: 'inputBorder', label: 'لون إطارات حقول الإدخال والبحث', desc: 'الحدود المحيطة بحقول الكتابة النشطة وغير النشطة', category: 'controls' },

    // Dialogs & Popups
    { key: 'dialogBg', label: 'لون خلفية النوافذ المنبثقة والخيارات', desc: 'خلفية شاشات المعاينة الفورية وصناديق الحذف والطباعة', category: 'dialogs' },
    { key: 'dialogBorder', label: 'لون إطارات النوافذ المنبثقة', desc: 'الحد الخارجي الكلي للنوافذ الطافية المفتوحة', category: 'dialogs' }
  ];

  return (
    <div className="space-y-6" id="visual-identity-advanced-panel">
      
      {/* Top Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-150 dark:border-zinc-850 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-[var(--sidebar-active)]" />
            <h2 className="text-xl font-bold font-display text-[var(--text-main)]">
              مركز التحكم الكامل بالسمات والسمات البصرية الشاملة
            </h2>
            <span className="bg-amber-100 text-amber-800 text-[9px] px-2 py-0.5 rounded-full font-bold">إصدار 2026 مطوّر</span>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-1.5 leading-relaxed">
            تجاوزنا تغيير ألوان الأزرار فقط! يمكنك الآن التحكم بالهيكل الكامل للنظام المالي: الألوان، الأطر، البطاقات، الطاولات، الحقول، الجداول، والمساحات المطبوعة لتقديم السندات بشكل يليق بفريق صور بمحافظة جنوب الشرقية.
          </p>
        </div>
        
        {saveSuccess && (
          <span className="text-xs bg-emerald-50 text-emerald-600 px-3.5 py-2 rounded-xl flex items-center gap-1.5 border border-emerald-200 animate-fade-in font-medium shadow-sm">
            <Check className="w-4 h-4 text-emerald-500 shrink-0" /> تم حفظ التغييرات وتعميمها فوراً
          </span>
        )}
      </div>

      {/* Preset Quick Loader Grid */}
      <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-5 shadow-sm space-y-3.5">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-[var(--text-secondary)] flex items-center gap-1.5 border-b border-[var(--frame-border)] pb-2">
          <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
          اختر من السمات البصرية واللوحات المعتمدة والجاهزة:
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3.5">
          {PRESET_THEMES.map((preset) => (
            <button
              key={preset.name}
              type="button"
              onClick={() => handlePresetSelect(preset)}
              className={`p-3.5 rounded-xl border text-right transition-all flex flex-col justify-between hover:scale-[1.03] text-xs space-y-2 cursor-pointer ${
                localConfig.selectedThemeName === preset.name
                  ? 'border-[var(--sidebar-active)] bg-[var(--sidebar-active)]/5 shadow-sm font-bold ring-1 ring-[var(--sidebar-active)]'
                  : 'border-[var(--card-border)] bg-[var(--card-bg)] hover:bg-[var(--app-bg)]'
              }`}
            >
              <div className="space-y-1">
                <span className="block text-[11px] text-[var(--text-main)] font-semibold">{preset.name}</span>
                <span className="block text-[9px] text-[var(--text-secondary)] font-normal leading-tight opacity-80">{preset.desc}</span>
              </div>
              
              {/* Color swatches layout */}
              <div className="flex gap-1 pt-2 border-t border-[var(--card-border)]">
                <span className="w-3.5 h-3.5 rounded-full border border-black/10" style={{ backgroundColor: preset.colors.appBg }} title="الخلفية" />
                <span className="w-3.5 h-3.5 rounded-full border border-black/10" style={{ backgroundColor: preset.colors.headerBg }} title="العناوين" />
                <span className="w-3.5 h-3.5 rounded-full border border-black/10" style={{ backgroundColor: preset.colors.sidebarBg }} title="القائمة" />
                <span className="w-3.5 h-3.5 rounded-full border border-black/10" style={{ backgroundColor: preset.colors.buttonBg }} title="الأزرار" />
                <span className="w-3.5 h-3.5 rounded-full border border-black/10" style={{ backgroundColor: preset.colors.cardBg }} title="البطاقات" />
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Editor Form Columns (col-span-7) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Sub Panels Selector Tabs */}
          <div className="flex border-b border-[var(--frame-border)] gap-2">
            <button
              onClick={() => setActiveSection('colors')}
              className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                activeSection === 'colors'
                  ? 'border-[var(--sidebar-active)] text-[var(--sidebar-active)] font-black'
                  : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-main)]'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5" />
                محرر مصفوفة الألوان الكامل (23 عنصر)
              </span>
            </button>
            <button
              onClick={() => setActiveSection('labels')}
              className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                activeSection === 'labels'
                  ? 'border-[var(--sidebar-active)] text-[var(--sidebar-active)] font-black'
                  : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-main)]'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Type className="w-3.5 h-3.5" />
                العناوين والمصطلحات ونصوص الهوية
              </span>
            </button>
            <button
              onClick={() => setActiveSection('shapes')}
              className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                activeSection === 'shapes'
                  ? 'border-[var(--sidebar-active)] text-[var(--sidebar-active)] font-black'
                  : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-main)]'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Layout className="w-3.5 h-3.5" />
                أشكال وهياكل الأزرار والبطاقات
              </span>
            </button>
          </div>

          {/* Section 1: Color Matrix controls */}
          {activeSection === 'colors' && (
            <div className="space-y-6 animate-fade-in">
              
              {/* Category: Containers, Sheets & Backgrounds */}
              <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-5 shadow-sm space-y-4">
                <h4 className="text-xs font-extrabold text-[var(--text-main)] flex items-center gap-2 border-b border-[var(--frame-border)] pb-2">
                  <Layout className="w-4 h-4 text-[var(--sidebar-active)]" />
                  مظهر واجهة البرنامج العام والبطاقات
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {colorFields.filter(f => f.category === 'containers').map(item => (
                    <div key={item.key} className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <label className="text-[11px] font-bold text-[var(--text-main)]">{item.label}</label>
                        <span className="text-[9px] text-[var(--text-secondary)]">({item.key})</span>
                      </div>
                      <p className="text-[10px] text-[var(--text-secondary)] opacity-75">{item.desc}</p>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={c[item.key as keyof typeof c]}
                          onChange={(e) => handleFieldChange(item.key, e.target.value)}
                          className="w-10 h-10 border border-slate-205 rounded-xl cursor-pointer bg-transparent"
                        />
                        <input
                          type="text"
                          value={c[item.key as keyof typeof c]}
                          onChange={(e) => handleFieldChange(item.key, e.target.value)}
                          className="w-full text-xs px-3.5 py-2 rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-main)] focus:outline-none font-mono"
                          dir="ltr"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Category: Navigation Headers & Sidebars */}
              <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-5 shadow-sm space-y-4">
                <h4 className="text-xs font-extrabold text-[var(--text-main)] flex items-center gap-2 border-b border-[var(--frame-border)] pb-2">
                  <Palette className="w-4 h-4 text-[var(--sidebar-active)]" />
                  مظهر وأشرطة التنقل (علوي، جانبي، وتذييل السند)
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {colorFields.filter(f => f.category === 'nav').map(item => (
                    <div key={item.key} className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <label className="text-[11px] font-bold text-[var(--text-main)]">{item.label}</label>
                        <span className="text-[9px] text-[var(--text-secondary)]">({item.key})</span>
                      </div>
                      <p className="text-[10px] text-[var(--text-secondary)] opacity-75">{item.desc}</p>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={c[item.key as keyof typeof c]}
                          onChange={(e) => handleFieldChange(item.key, e.target.value)}
                          className="w-10 h-10 border border-slate-205 rounded-xl cursor-pointer bg-transparent"
                        />
                        <input
                          type="text"
                          value={c[item.key as keyof typeof c]}
                          onChange={(e) => handleFieldChange(item.key, e.target.value)}
                          className="w-full text-xs px-3.5 py-2 rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-main)] focus:outline-none font-mono"
                          dir="ltr"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Category: Typography and Tables Layout */}
              <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-5 shadow-sm space-y-4">
                <h4 className="text-xs font-extrabold text-[var(--text-main)] flex items-center gap-2 border-b border-[var(--frame-border)] pb-2">
                  <FileText className="w-4 h-4 text-[var(--sidebar-active)]" />
                  مظهر النصوص والجداول المالية
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {colorFields.filter(f => f.category === 'typography').map(item => (
                    <div key={item.key} className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <label className="text-[11px] font-bold text-[var(--text-main)]">{item.label}</label>
                        <span className="text-[9px] text-[var(--text-secondary)]">({item.key})</span>
                      </div>
                      <p className="text-[10px] text-[var(--text-secondary)] opacity-75">{item.desc}</p>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={c[item.key as keyof typeof c]}
                          onChange={(e) => handleFieldChange(item.key, e.target.value)}
                          className="w-10 h-10 border border-slate-205 rounded-xl cursor-pointer bg-transparent"
                        />
                        <input
                          type="text"
                          value={c[item.key as keyof typeof c]}
                          onChange={(e) => handleFieldChange(item.key, e.target.value)}
                          className="w-full text-xs px-3.5 py-2 rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-main)] focus:outline-none font-mono"
                          dir="ltr"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Category: Buttons & Form Controls */}
              <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-5 shadow-sm space-y-4">
                <h4 className="text-xs font-extrabold text-[var(--text-main)] flex items-center gap-2 border-b border-[var(--frame-border)] pb-2">
                  <MousePointerClick className="w-4 h-4 text-[var(--sidebar-active)]" />
                  مظهر الأزرار وحقول النماذج المالية
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {colorFields.filter(f => f.category === 'controls').map(item => (
                    <div key={item.key} className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <label className="text-[11px] font-bold text-[var(--text-main)]">{item.label}</label>
                        <span className="text-[9px] text-[var(--text-secondary)]">({item.key})</span>
                      </div>
                      <p className="text-[10px] text-[var(--text-secondary)] opacity-75">{item.desc}</p>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={c[item.key as keyof typeof c]}
                          onChange={(e) => handleFieldChange(item.key, e.target.value)}
                          className="w-10 h-10 border border-slate-205 rounded-xl cursor-pointer bg-transparent"
                        />
                        <input
                          type="text"
                          value={c[item.key as keyof typeof c]}
                          onChange={(e) => handleFieldChange(item.key, e.target.value)}
                          className="w-full text-xs px-3.5 py-2 rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-main)] focus:outline-none font-mono"
                          dir="ltr"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Category: Dialogs & Popups */}
              <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-5 shadow-sm space-y-4">
                <h4 className="text-xs font-extrabold text-[var(--text-main)] flex items-center gap-2 border-b border-[var(--frame-border)] pb-2">
                  <Settings className="w-4 h-4 text-[var(--sidebar-active)]" />
                  مظهر النوافذ المنبثقة والخيارات المفتوحة
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {colorFields.filter(f => f.category === 'dialogs').map(item => (
                    <div key={item.key} className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <label className="text-[11px] font-bold text-[var(--text-main)]">{item.label}</label>
                        <span className="text-[9px] text-[var(--text-secondary)]">({item.key})</span>
                      </div>
                      <p className="text-[10px] text-[var(--text-secondary)] opacity-75">{item.desc}</p>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={c[item.key as keyof typeof c]}
                          onChange={(e) => handleFieldChange(item.key, e.target.value)}
                          className="w-10 h-10 border border-slate-205 rounded-xl cursor-pointer bg-transparent"
                        />
                        <input
                          type="text"
                          value={c[item.key as keyof typeof c]}
                          onChange={(e) => handleFieldChange(item.key, e.target.value)}
                          className="w-full text-xs px-3.5 py-2 rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-main)] focus:outline-none font-mono"
                          dir="ltr"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* Section 2: Text Terms and Titles customization */}
          {activeSection === 'labels' && (
            <div className="bg-[var(--card-bg)] border border-[var(--card-border)] p-5 rounded-2xl space-y-4 animate-fade-in shadow-sm">
              <h3 className="text-xs font-extrabold text-[var(--text-main)] flex items-center gap-1.5 border-b border-[var(--frame-border)] pb-2">
                <Type className="w-4 h-4 text-slate-500" />
                تخصيص المسميات، العناوين، وبنود السندات
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-[var(--text-main)] mb-1.5">الاسم الرسمي للجهة / الفريق</label>
                  <input
                    type="text"
                    value={localConfig.title}
                    onChange={(e) => handleFieldChange('title', e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-main)] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[var(--text-main)] mb-1.5">شعار اللوجو المختصر للبرنامج</label>
                  <input
                    type="text"
                    value={localConfig.logoText}
                    onChange={(e) => handleFieldChange('logoText', e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-main)] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[var(--text-main)] mb-1.5">مسمى سند القبض المالي</label>
                  <input
                    type="text"
                    value={localConfig.receiptTerm}
                    onChange={(e) => handleFieldChange('receiptTerm', e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-main)] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[var(--text-main)] mb-1.5">مسمى سند الصرف المالي</label>
                  <input
                    type="text"
                    value={localConfig.paymentTerm}
                    onChange={(e) => handleFieldChange('paymentTerm', e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-main)] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[var(--text-main)] mb-1.5">نص الشروط وتذييل السندات المطبوعة</label>
                <textarea
                  value={localConfig.termsAndConditions}
                  onChange={(e) => handleFieldChange('termsAndConditions', e.target.value)}
                  rows={2}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-main)] focus:outline-none resize-none"
                />
              </div>

              {/* Printing togglers */}
              <div className="border-t border-[var(--frame-border)] pt-4 mt-2 space-y-3">
                <p className="text-[10px] font-bold text-[var(--text-secondary)]">تفضيلات الهياكل الطباعيّة والمساعدة</p>
                
                <label className="flex items-center gap-3 cursor-pointer text-xs justify-between">
                  <div>
                    <span className="font-semibold text-[var(--text-main)] block">عرض حقل التوقيع للطرفين</span>
                    <span className="text-[9px] text-[var(--text-secondary)]">تضمين توقيع المستلم والدافع عند طباعة السندات</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={localConfig.showSignatureBlock}
                    onChange={(e) => handleFieldChange('showSignatureBlock', e.target.checked)}
                    className="w-5 h-5 cursor-pointer accent-[var(--sidebar-active)]"
                  />
                </label>

                <label className="flex items-center gap-3 cursor-pointer text-xs justify-between border-t border-[var(--frame-border)] pt-2.5">
                  <div>
                    <span className="font-semibold text-[var(--text-main)] block">تخصيص وإظهار ختم فريق صور المعتمد</span>
                    <span className="text-[9px] text-[var(--text-secondary)]">إضافة رمز الختم رسمي دائرية عند تصدير السندات</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={localConfig.showStamp}
                    onChange={(e) => handleFieldChange('showStamp', e.target.checked)}
                    className="w-5 h-5 cursor-pointer accent-[var(--sidebar-active)]"
                  />
                </label>

                <label className="flex items-center gap-3 cursor-pointer text-xs justify-between border-t border-[var(--frame-border)] pt-2.5">
                  <div>
                    <span className="font-semibold text-[var(--text-main)] block">إظهار تلميحات الإرشاد ومساعدة الإدخال</span>
                    <span className="text-[9px] text-[var(--text-secondary)]">عرض بطاقات التوجيه للمستخدم لتقليل أخطاء القيود المالية</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={localConfig.showHelpTips}
                    onChange={(e) => handleFieldChange('showHelpTips', e.target.checked)}
                    className="w-5 h-5 cursor-pointer accent-[var(--sidebar-active)]"
                  />
                </label>
              </div>

            </div>
          )}

          {/* Section 3: Layout Shapes and button Styles */}
          {activeSection === 'shapes' && (
            <div className="bg-[var(--card-bg)] border border-[var(--card-border)] p-5 rounded-2xl space-y-4 animate-fade-in shadow-sm">
              <h3 className="text-xs font-extrabold text-[var(--text-main)] flex items-center gap-1.5 border-b border-[var(--frame-border)] pb-2">
                <Layout className="w-4 h-4 text-slate-500" />
                تخصيص انحناءات وهوامش الأزرار والبطاقات
              </h3>

              {/* Button Shape selectors */}
              <div className="space-y-2">
                <label className="block text-[11px] font-bold text-[var(--text-main)]">زوايا انحناء أزرار وعناصر التفاعل</label>
                <div className="grid grid-cols-3 gap-2">
                  {buttonStyleLabels.map((style) => (
                    <button
                      key={style.value}
                      type="button"
                      onClick={() => handleFieldChange('buttonStyle', style.value)}
                      className={`px-3 py-2 text-xs font-semibold border transition-all cursor-pointer ${
                        localConfig.buttonStyle === style.value
                          ? 'border-[var(--sidebar-active)] bg-[var(--sidebar-active)]/10 text-[var(--sidebar-active)]'
                          : 'border-[var(--card-border)] text-[var(--text-secondary)] hover:bg-[var(--app-bg)]'
                      } ${style.preview}`}
                    >
                      {style.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Card Style selectors */}
              <div className="space-y-2 border-t border-[var(--frame-border)] pt-4 mt-2">
                <label className="block text-[11px] font-bold text-[var(--text-main)]">طراز وهيكل البطاقات واللوحات (Containers)</label>
                <div className="grid grid-cols-2 gap-3.5">
                  {cardStyleLabels.map((style) => (
                    <button
                      key={style.value}
                      type="button"
                      onClick={() => handleFieldChange('cardStyle', style.value)}
                      className={`p-3.5 text-xs text-right border transition-all h-20 flex flex-col justify-between cursor-pointer rounded-xl ${
                        localConfig.cardStyle === style.value
                          ? 'border-[var(--sidebar-active)] bg-[var(--sidebar-active)]/5 text-[var(--sidebar-active)] ring-1 ring-[var(--sidebar-active)]'
                          : 'border-[var(--card-border)] bg-[var(--card-bg)] text-[var(--text-secondary)] hover:bg-[var(--app-bg)]'
                      }`}
                    >
                      <span className="font-extrabold">{style.label}</span>
                      <span className={`w-full h-3 rounded block mt-1 ${style.preview}`} />
                    </button>
                  ))}
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Sticky Live Theme Preview (col-span-5) */}
        <div className="lg:col-span-5 sticky top-24 space-y-4">
          <div className="flex justify-between items-center bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-4 shadow-sm">
            <span className="text-xs font-black text-[var(--text-main)] flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-indigo-500 animate-pulse" />
              المعاينة الفورية للهوية والشعارات
            </span>
            <span className="text-[10px] bg-slate-100 text-slate-800 font-mono px-2 py-0.5 rounded font-black">
              {localConfig.selectedThemeName || 'تصميم محلي'}
            </span>
          </div>

          {/* Dynamic Mockup Device Container */}
          <div 
            className="p-5 border rounded-2xl overflow-hidden transition-all duration-300 relative text-right flex flex-col space-y-4.5"
            style={{ 
              backgroundColor: c.appBg, 
              borderColor: c.frameBorder 
            }}
          >
            
            {/* Header Preview Component */}
            <div 
              className="p-3 border rounded-xl flex justify-between items-center shadow-sm"
              style={{ 
                backgroundColor: c.headerBg, 
                borderColor: c.cardBorder, 
                color: c.headerText 
              }}
            >
              <div className="flex items-center gap-1">
                {/* Simulated Logo Emblem inside header preview */}
                <span 
                  className="w-6 h-6 rounded-md flex items-center justify-center text-[8px] font-black text-white shrink-0"
                  style={{ backgroundColor: c.buttonBg }}
                >
                  {localConfig.logoText.substring(0, 3)}
                </span>
                <span className="text-[9px] font-bold opacity-90">{localConfig.title}</span>
              </div>
              <span className="text-[7px] font-bold font-mono opacity-60">12:35 PM UTC</span>
            </div>

            {/* Content row (mock Sidebar and content layout side by side) */}
            <div className="grid grid-cols-12 gap-3">
              
              {/* Sidebar Preview Component (cols 5) */}
              <div 
                className="col-span-4 p-2 border rounded-xl flex flex-col space-y-1.5 shadow-sm"
                style={{ 
                  backgroundColor: c.sidebarBg, 
                  borderColor: c.cardBorder 
                }}
              >
                <span className="text-[6px] font-extrabold block text-center opacity-40 border-b pb-1 mb-2 leading-none" style={{ borderColor: c.frameBorder, color: c.sidebarText }}>قائمة الأقسام</span>
                
                {/* Active sidebar node mock */}
                <div 
                  className={`px-1.5 py-1 text-[7px] font-black flex items-center gap-1 flex-row-reverse justify-between ${
                    localConfig.buttonStyle === 'sharp' ? 'rounded-none' :
                    localConfig.buttonStyle === 'rounded' ? 'rounded-md' : 'rounded-full'
                  }`}
                  style={{ 
                    backgroundColor: c.sidebarActive, 
                    color: c.buttonText 
                  }}
                >
                  <span>الواجهة</span>
                  <span className="text-[5px]">●</span>
                </div>

                {/* Inactive sidebar node mock */}
                <div 
                  className="px-1.5 py-1 text-[7px] font-bold flex items-center gap-1 flex-row-reverse justify-between"
                  style={{ color: c.sidebarText }}
                >
                  <span>الأرشيف</span>
                  <span className="text-[5px] opacity-40">○</span>
                </div>
              </div>

              {/* Main Content Area mocks (cols 8) */}
              <div className="col-span-8 space-y-3">
                
                {/* Card Preview Component with glowing border shadows */}
                <div 
                  className={`p-3 border transition-all ${
                    localConfig.cardStyle === 'flat' ? 'border-transparent shadow-none' :
                    localConfig.cardStyle === 'bordered' ? 'border' : 'border shadow-md'
                  } ${
                    localConfig.buttonStyle === 'sharp' ? 'rounded-none' :
                    localConfig.buttonStyle === 'rounded' ? 'rounded-xl' : 'rounded-2xl'
                  }`}
                  style={{ 
                    backgroundColor: c.cardBg, 
                    borderColor: c.cardBorder, 
                    boxShadow: `0 4px 12px ${c.cardGlow}` 
                  }}
                >
                  <h5 className="text-[8px] font-black leading-none mb-1.5" style={{ color: c.textMain }}>{localConfig.receiptTerm}</h5>
                  <p className="text-[6px] opacity-75 mb-2 leading-tight" style={{ color: c.textSecondary }}>مبلغ السند: ١٠٠.٠٠ ريال عماني</p>
                  
                  {/* Form input Mock */}
                  <div className="space-y-1 mb-2.5">
                    <span className="text-[5px] block font-bold leading-none" style={{ color: c.textSecondary }}>اسم المتبرع</span>
                    <div 
                      className="w-full h-4 rounded border text-[5px] flex items-center px-1 font-semibold"
                      style={{ 
                        backgroundColor: c.inputBg, 
                        borderColor: c.inputBorder,
                        color: c.textMain
                      }}
                    >
                      فاعل خير من صور
                    </div>
                  </div>

                  {/* Button Preview Component with hover simulations */}
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onMouseEnter={() => setIsHoveredButton(true)}
                      onMouseLeave={() => setIsHoveredButton(false)}
                      className={`w-full py-1.5 text-[6px] font-black shadow-sm transition-all flex items-center justify-center leading-none ${
                        localConfig.buttonStyle === 'sharp' ? 'rounded-none' :
                        localConfig.buttonStyle === 'rounded' ? 'rounded-md' : 'rounded-full'
                      }`}
                      style={{ 
                        backgroundColor: isHoveredButton ? c.buttonHover : c.buttonBg, 
                        color: c.buttonText 
                      }}
                    >
                      حركة الحفظ المالي
                    </button>
                  </div>
                </div>

                {/* Table Preview Component */}
                <div className="border rounded-xl overflow-hidden shadow-sm" style={{ borderColor: c.frameBorder }}>
                  <div className="p-1 px-1.5 text-[6px] font-extrabold flex justify-between" style={{ backgroundColor: c.tableHeaderBg, color: c.textMain }}>
                    <span>البند</span>
                    <span>القيمة</span>
                  </div>
                  <div className="p-1 px-1.5 text-[6px] flex justify-between border-t" style={{ backgroundColor: c.tableRowBg, borderColor: c.frameBorder, color: c.textSecondary }}>
                    <span>كفالة أيتام</span>
                    <span className="font-mono">٥٠.٠ ر.ع</span>
                  </div>
                </div>

              </div>

            </div>

            {/* Dialog Preview Component Overlay overlayed neatly */}
            <div className="p-3.5 border rounded-xl shadow-lg mt-1 space-y-1.5"
                 style={{ 
                   backgroundColor: c.dialogBg, 
                   borderColor: c.dialogBorder 
                 }}
            >
              <div className="flex justify-between items-center border-[var(--frame-border)] border-b pb-1 mb-1">
                <span className="text-[7px] font-black" style={{ color: c.textMain }}>معاينة الصندوق المنبثق</span>
                <span className="text-[6px] cursor-pointer opacity-50" style={{ color: c.textSecondary }}>✕</span>
              </div>
              <p className="text-[6px] leading-relaxed" style={{ color: c.textSecondary }}>
                هكذا تظهر شاشات الخيارات المفتوحة، المطابقة والمنسجمة مع الهوية الشاملة.
              </p>
            </div>

            {/* Bottom Bar Footer Preview */}
            <div 
              className="p-2 border rounded-xl text-center shadow-sm select-none"
              style={{ 
                backgroundColor: c.footerBg, 
                borderColor: c.cardBorder, 
                color: c.footerText 
              }}
            >
              <p className="text-[6px] font-sans font-semibold">
                تم المراجعة والاعتماد المالي - {localConfig.title} 2026
              </p>
            </div>

          </div>

          {/* Core Action Command Panel */}
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-4 shadow-sm space-y-3 text-right">
            <span className="text-[10px] font-black text-[var(--text-secondary)] block border-b pb-1">أوامر التحكم والمزامنة بالسمة البصرية</span>
            
            <div className="flex flex-col gap-2">
              {/* Save Layout */}
              <button
                type="button"
                onClick={handleSaveTheme}
                className="w-full py-2.5 px-4 text-xs font-bold text-white transition-all shadow-md hover:scale-[1.01] active:translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer"
                style={{ 
                  backgroundColor: 'var(--sidebar-active)',
                  borderRadius: localConfig.buttonStyle === 'sharp' ? '0px' : localConfig.buttonStyle === 'rounded' ? '12px' : '99px'
                }}
              >
                <Save className="w-4 h-4 shrink-0" />
                <span>حفظ الهوية البصرية الحالية</span>
              </button>

              {/* Reset Layout */}
              <button
                type="button"
                onClick={handleResetToDefault}
                className="w-full py-2 px-4 text-xs font-semibold border border-dashed hover:bg-slate-50 text-slate-800 dark:text-zinc-650 bg-white transition-all rounded-xl flex items-center justify-center gap-2 cursor-pointer"
                style={{
                  borderRadius: localConfig.buttonStyle === 'sharp' ? '0px' : localConfig.buttonStyle === 'rounded' ? '12px' : '99px'
                }}
              >
                <RotateCcw className="w-4 h-4 text-rose-500 shrink-0" />
                <span>إعادة ضبط المصنع بالكامل</span>
              </button>

              {/* Apply Immediately */}
              <button
                type="button"
                onClick={handleApplyToAll}
                className="w-full py-2.5 px-4 text-xs font-bold border hover:bg-emerald-50 text-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-950 bg-emerald-50/20 border-emerald-500/20 transition-all rounded-xl flex items-center justify-center gap-2 cursor-pointer"
                style={{
                  borderRadius: localConfig.buttonStyle === 'sharp' ? '0px' : localConfig.buttonStyle === 'rounded' ? '12px' : '99px'
                }}
              >
                <Sparkles id="apply-sync-icon" className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>تطبيق مصفوفة الألوان على كافة الصفحات</span>
              </button>
            </div>

            <div className="p-3 bg-sky-50 dark:bg-sky-950/25 border border-sky-100 dark:border-sky-900/40 rounded-xl flex gap-2 text-[10px] text-sky-800 dark:text-sky-300 leading-normal">
              <Info className="w-4.5 h-4.5 text-sky-500 shrink-0" />
              <p>
                <strong>الربط التلقائي والشفافية:</strong> بمجرد تغيير أي لون، ستشعر بالتعديل فوراً في السطور، ومربعات كتابة البيانات والجداول واللوحات في كامل صفحات النظام، مع الحفاظ على التوافقية عند الحزم والتصدير.
              </p>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
