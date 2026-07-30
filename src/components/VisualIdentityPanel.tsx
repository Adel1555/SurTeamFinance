/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { VisualIdentity, ButtonStyle, CardStyle } from '../types';
import { DatabaseService } from '../db';
import { 
  PRESET_THEMES, 
  PresetTheme, 
  ThemeColors, 
  getResolvedThemeColors, 
  validateThemeContrast, 
  ContrastCheckResult 
} from '../themes';
import { 
  Sparkles, 
  Palette, 
  Type, 
  Check, 
  RotateCcw, 
  Save, 
  Layout, 
  Eye, 
  FileText, 
  Settings, 
  MousePointerClick,
  Info,
  Plus,
  Edit3,
  Trash2,
  Copy,
  Download,
  Upload,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  Sun,
  Moon,
  Layers,
  ShieldCheck,
  X,
  PieChart
} from 'lucide-react';

interface VisualIdentityPanelProps {
  config: VisualIdentity;
  onUpdate: (newConfig: VisualIdentity) => void;
}

const LIGHT_DEFAULT_COLORS = {
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
  dialogBorder: '#cbd5e1',
  menuBg: '#ffffff',
  menuBorder: '#e2e8f0',
  tabBg: '#f1f5f9',
  tabActiveBg: '#ffffff',
  linkColor: '#2563eb',
  iconColor: '#3b82f6',
  chartPrimary: '#2563eb',
  chartSecondary: '#10b981',
  progressBarBg: '#e2e8f0',
  progressFill: '#2563eb',
  scrollbarThumb: '#94a3b8',
  scrollbarTrack: '#f1f5f9',
  primaryColor: '#2563eb',
  secondaryColor: '#1d4ed8'
};

export default function VisualIdentityPanel({ config, onUpdate }: VisualIdentityPanelProps) {
  const [localConfig, setLocalConfig] = useState<VisualIdentity>({ ...config });
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveMessage, setSaveMessage] = useState('تم حفظ التغييرات وتعميمها بنجاح');
  const [activeSection, setActiveSection] = useState<'themes' | 'colors' | 'labels' | 'shapes'>('themes');
  const [isHoveredButton, setIsHoveredButton] = useState(false);

  // Advanced Theme Editor State
  const [isEditingCustomTheme, setIsEditingCustomTheme] = useState(false);
  const [editingThemeId, setEditingThemeId] = useState<string | null>(null);
  const [editorName, setEditorName] = useState('');
  const [editorDesc, setEditorDesc] = useState('');
  const [editorMode, setEditorMode] = useState<'light' | 'dark'>('light');
  const [editorColors, setEditorColors] = useState<ThemeColors>(() => 
    getResolvedThemeColors(config, config.themeMode === 'dark')
  );
  const [editorTab, setEditorTab] = useState<'structure' | 'nav' | 'typography' | 'buttons' | 'tables' | 'charts' | 'contrast'>('structure');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const customThemes: PresetTheme[] = localConfig.customThemes || [];

  // Active theme resolved colors for quick live preview
  const activeColors = getResolvedThemeColors(localConfig, localConfig.themeMode === 'dark');

  const triggerNotification = (msg: string) => {
    setSaveMessage(msg);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleFieldChange = (key: keyof VisualIdentity, value: any) => {
    let extraUpdates = {};
    if (key === 'buttonBg') {
      extraUpdates = { primaryColor: value };
    } else if (key === 'buttonHover') {
      extraUpdates = { secondaryColor: value };
    }
    const updated = { ...localConfig, [key]: value, ...extraUpdates };
    setLocalConfig(updated);
    onUpdate(updated);
  };

  const handlePresetSelect = (preset: PresetTheme) => {
    const updated: VisualIdentity = {
      ...localConfig,
      ...preset.colors,
      themeMode: preset.mode,
      selectedThemeName: preset.id
    };
    setLocalConfig(updated);
    DatabaseService.saveVisualIdentity(updated);
    onUpdate(updated);
    triggerNotification(`تم تفعيل سمة "${preset.name}" بنجاح`);
  };

  const handleResetCurrentThemeToOriginal = () => {
    const currentId = localConfig.selectedThemeName;
    const foundBuiltIn = PRESET_THEMES.find(p => p.id === currentId || p.name === currentId);
    const foundCustom = customThemes.find(c => c.id === currentId || c.name === currentId);
    
    let baselineColors: ThemeColors;
    let mode: 'light' | 'dark';

    if (foundBuiltIn) {
      baselineColors = { ...foundBuiltIn.colors };
      mode = foundBuiltIn.mode;
    } else if (foundCustom) {
      baselineColors = { ...foundCustom.colors };
      mode = foundCustom.mode;
    } else {
      baselineColors = { ...LIGHT_DEFAULT_COLORS };
      mode = 'light';
    }

    const resetConfig: VisualIdentity = {
      ...localConfig,
      ...baselineColors,
      themeMode: mode
    };

    setLocalConfig(resetConfig);
    DatabaseService.saveVisualIdentity(resetConfig);
    onUpdate(resetConfig);
    triggerNotification('تم إعادة تعيين السمة الحالية إلى إعداداتها الأصلية بنجاح');
  };

  // Open Editor for new theme
  const handleOpenNewThemeEditor = () => {
    setEditingThemeId(null);
    setEditorName('سمة مخصصة جديدة');
    setEditorDesc('سمة ذات ألوان مخصصة تناسب أسلوبك العملي');
    setEditorMode(localConfig.themeMode === 'dark' ? 'dark' : 'light');
    setEditorColors({ ...activeColors });
    setEditorTab('structure');
    setIsEditingCustomTheme(true);
  };

  // Open Editor for existing custom theme
  const handleOpenEditCustomTheme = (theme: PresetTheme) => {
    setEditingThemeId(theme.id);
    setEditorName(theme.name);
    setEditorDesc(theme.desc);
    setEditorMode(theme.mode);
    setEditorColors(getResolvedThemeColors(theme.colors, theme.mode === 'dark'));
    setEditorTab('structure');
    setIsEditingCustomTheme(true);
  };

  // Duplicate any theme
  const handleDuplicateTheme = (theme: PresetTheme) => {
    const dupId = `custom-${Date.now()}`;
    const duplicatedTheme: PresetTheme = {
      id: dupId,
      name: `${theme.name} (نسخة)`,
      desc: `نسخة مخصصة مستنسخة من ${theme.name}`,
      mode: theme.mode,
      colors: getResolvedThemeColors(theme.colors, theme.mode === 'dark')
    };

    setEditingThemeId(dupId);
    setEditorName(duplicatedTheme.name);
    setEditorDesc(duplicatedTheme.desc);
    setEditorMode(duplicatedTheme.mode);
    setEditorColors({ ...duplicatedTheme.colors });
    setEditorTab('structure');
    setIsEditingCustomTheme(true);
  };

  // Save custom theme from editor
  const handleSaveCustomTheme = () => {
    if (!editorName.trim()) {
      alert('يرجى إدخال اسم للسمة المخصصة');
      return;
    }

    const themeId = editingThemeId || `custom-${Date.now()}`;
    const newCustomTheme: PresetTheme = {
      id: themeId,
      name: editorName.trim(),
      desc: editorDesc.trim() || 'سمة مخصصة خاصة بالمستخدم',
      mode: editorMode,
      colors: { ...editorColors }
    };

    const existingIndex = customThemes.findIndex(t => t.id === themeId);
    let updatedCustomThemes: PresetTheme[];
    if (existingIndex >= 0) {
      updatedCustomThemes = [...customThemes];
      updatedCustomThemes[existingIndex] = newCustomTheme;
    } else {
      updatedCustomThemes = [...customThemes, newCustomTheme];
    }

    const updatedConfig: VisualIdentity = {
      ...localConfig,
      ...editorColors,
      themeMode: editorMode,
      selectedThemeName: themeId,
      customThemes: updatedCustomThemes
    };

    setLocalConfig(updatedConfig);
    DatabaseService.saveVisualIdentity(updatedConfig);
    onUpdate(updatedConfig);
    setIsEditingCustomTheme(false);
    triggerNotification(`تم حفظ وتفعيل السمة المخصصة "${newCustomTheme.name}" بنجاح`);
  };

  // Delete custom theme
  const handleDeleteCustomTheme = (themeId: string) => {
    const filtered = customThemes.filter(t => t.id !== themeId);
    let newSelectedThemeName = localConfig.selectedThemeName;
    let extraColorUpdates = {};

    if (localConfig.selectedThemeName === themeId) {
      const fallback = PRESET_THEMES[0];
      newSelectedThemeName = fallback.id;
      extraColorUpdates = { ...fallback.colors, themeMode: fallback.mode };
    }

    const updatedConfig: VisualIdentity = {
      ...localConfig,
      ...extraColorUpdates,
      selectedThemeName: newSelectedThemeName,
      customThemes: filtered
    };

    setLocalConfig(updatedConfig);
    DatabaseService.saveVisualIdentity(updatedConfig);
    onUpdate(updatedConfig);
    setDeleteConfirmId(null);
    triggerNotification('تم حذف السمة المخصصة بنجاح');
  };

  // Export theme to JSON
  const handleExportTheme = (theme: PresetTheme) => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(theme, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `theme-${theme.id || 'export'}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Export currently active theme to JSON
  const handleExportActiveTheme = () => {
    const activeThemeObj: PresetTheme = {
      id: localConfig.selectedThemeName || `theme-${Date.now()}`,
      name: localConfig.selectedThemeName || 'السمة الحالية',
      desc: 'سمة مخصصة تم تصديرها من الخزينة',
      mode: localConfig.themeMode === 'dark' ? 'dark' : 'light',
      colors: { ...activeColors }
    };
    handleExportTheme(activeThemeObj);
  };

  // Import theme from JSON
  const handleImportTheme = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed && parsed.name && parsed.colors) {
          const importedTheme: PresetTheme = {
            id: parsed.id || `custom-imp-${Date.now()}`,
            name: parsed.name,
            desc: parsed.desc || 'سمة مستوردة من ملف JSON',
            mode: parsed.mode || 'light',
            colors: getResolvedThemeColors(parsed.colors, parsed.mode === 'dark')
          };

          const updatedCustomThemes = [...customThemes, importedTheme];
          const updatedConfig: VisualIdentity = {
            ...localConfig,
            ...importedTheme.colors,
            themeMode: importedTheme.mode,
            selectedThemeName: importedTheme.id,
            customThemes: updatedCustomThemes
          };

          setLocalConfig(updatedConfig);
          DatabaseService.saveVisualIdentity(updatedConfig);
          onUpdate(updatedConfig);
          triggerNotification(`تم استيراد وتفعيل السمة "${importedTheme.name}" بنجاح`);
        } else {
          alert('الملف المحدد لا يحتوي على بنية سمة صالحة (مطلوب name و colors).');
        }
      } catch (err) {
        alert('حدث خطأ أثناء قراءة ملف JSON السمة.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Auto Fix Contrast handler for editor
  const handleAutoFixEditorContrast = (textKey: keyof ThemeColors, suggestedHex: string) => {
    setEditorColors(prev => ({ ...prev, [textKey]: suggestedHex }));
  };

  const contrastResults = validateThemeContrast(editorColors);
  const lowContrastCount = contrastResults.filter(r => r.isLow).length;

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

  return (
    <div className="space-y-6" id="visual-identity-advanced-panel">
      
      {/* Hidden file input for JSON Import */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleImportTheme} 
        accept=".json" 
        className="hidden" 
      />

      {/* Top Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[var(--frame-border)] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Palette className="w-6 h-6 text-[var(--sidebar-active)]" />
            <h2 className="text-xl font-black font-display text-[var(--text-main)]">
              نظام السمات الاحترافي ومحرر الهوية المتقدم
            </h2>
            <span className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[10px] px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> مخصص واحترافي
            </span>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-1.5 leading-relaxed">
            أنشئ، عدّل، واستورد سماتك الخاصة بمستوى تطبيقات Microsoft Office وVisual Studio وJetBrains مع التحقق التلقائي من التباين والمعاينة المباشرة.
          </p>
        </div>
        
        {/* Global Toolbar Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleOpenNewThemeEditor}
            className="px-3.5 py-2 text-xs font-bold bg-[var(--sidebar-active)] text-white hover:opacity-90 rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>إنشاء سمة جديدة</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-2 text-xs font-bold border border-[var(--card-border)] bg-[var(--card-bg)] text-[var(--text-main)] hover:bg-[var(--app-bg)] rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
            title="استيراد سمة من ملف JSON"
          >
            <Upload className="w-3.5 h-3.5 text-blue-500" />
            <span>استيراد JSON</span>
          </button>

          <button
            type="button"
            onClick={handleExportActiveTheme}
            className="px-3 py-2 text-xs font-bold border border-[var(--card-border)] bg-[var(--card-bg)] text-[var(--text-main)] hover:bg-[var(--app-bg)] rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
            title="تصدير السمة الحالية إلى ملف JSON"
          >
            <Download className="w-3.5 h-3.5 text-emerald-500" />
            <span>تصدير JSON</span>
          </button>

          <button
            type="button"
            onClick={handleResetCurrentThemeToOriginal}
            className="px-3 py-2 text-xs font-bold border border-rose-500/30 text-rose-600 dark:text-rose-400 bg-rose-500/5 hover:bg-rose-500/10 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
            title="إعادة تعيين السمة الحالية لإعداداتها الأصلية"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>إعادة تعيين</span>
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-between text-xs font-bold animate-fade-in">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            {saveMessage}
          </span>
        </div>
      )}

      {/* Main Tab Navigation */}
      <div className="flex border-b border-[var(--frame-border)] gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveSection('themes')}
          className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer shrink-0 ${
            activeSection === 'themes'
              ? 'border-[var(--sidebar-active)] text-[var(--sidebar-active)] font-black'
              : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-main)]'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <Layers className="w-4 h-4" />
            مكتبة السمات الرسمية والمخصصة ({10 + customThemes.length})
          </span>
        </button>

        <button
          onClick={() => setActiveSection('colors')}
          className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer shrink-0 ${
            activeSection === 'colors'
              ? 'border-[var(--sidebar-active)] text-[var(--sidebar-active)] font-black'
              : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-main)]'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <Sliders className="w-4 h-4" />
            مصفوفة ألوان الواجهة النشطة
          </span>
        </button>

        <button
          onClick={() => setActiveSection('labels')}
          className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer shrink-0 ${
            activeSection === 'labels'
              ? 'border-[var(--sidebar-active)] text-[var(--sidebar-active)] font-black'
              : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-main)]'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <Type className="w-4 h-4" />
            نصوص ومسميات الهوية الرسمية
          </span>
        </button>

        <button
          onClick={() => setActiveSection('shapes')}
          className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer shrink-0 ${
            activeSection === 'shapes'
              ? 'border-[var(--sidebar-active)] text-[var(--sidebar-active)] font-black'
              : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-main)]'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <Layout className="w-4 h-4" />
            هيكل وانحناءات الأزرار والبطاقات
          </span>
        </button>
      </div>

      {/* SECTION 1: THEME LIBRARY (Built-in + Custom Themes) */}
      {activeSection === 'themes' && (
        <div className="space-y-8 animate-fade-in">
          
          {/* Custom User Themes Category */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--frame-border)] pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-emerald-500" />
                <h3 className="text-sm font-extrabold text-[var(--text-main)]">
                  سمات المستخدم المخصصة (Custom Themes)
                </h3>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full font-bold">
                  {customThemes.length} سمة
                </span>
              </div>
              <button
                onClick={handleOpenNewThemeEditor}
                className="text-xs text-[var(--sidebar-active)] font-bold flex items-center gap-1 hover:underline cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                إنشاء سمة جديدة
              </button>
            </div>

            {customThemes.length === 0 ? (
              <div className="bg-[var(--card-bg)] border border-dashed border-[var(--card-border)] rounded-2xl p-8 text-center space-y-3">
                <Palette className="w-8 h-8 text-[var(--text-secondary)] mx-auto opacity-50" />
                <h4 className="text-xs font-bold text-[var(--text-main)]">لا توجد سمات مخصصة بعد</h4>
                <p className="text-[11px] text-[var(--text-secondary)] max-w-md mx-auto">
                  يمكنك تصميم سماتك الخاصة وتغيير كافة تفاصيل الألوان أو استنساخ أي سمة رسمية والتعديل عليها بنقرة زر واحدة.
                </p>
                <button
                  type="button"
                  onClick={handleOpenNewThemeEditor}
                  className="px-4 py-2 text-xs font-bold bg-[var(--sidebar-active)] text-white rounded-xl shadow-xs hover:opacity-90 transition-all inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>أنشئ سمك الأولى الآن</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {customThemes.map((theme) => {
                  const isActive = localConfig.selectedThemeName === theme.id;
                  return (
                    <div
                      key={theme.id}
                      className={`p-4 rounded-2xl border transition-all text-right space-y-3 relative flex flex-col justify-between ${
                        isActive
                          ? 'border-[var(--sidebar-active)] bg-[var(--card-bg)] shadow-md ring-2 ring-[var(--sidebar-active)]'
                          : 'border-[var(--card-border)] bg-[var(--card-bg)] hover:border-[var(--sidebar-active)]/50'
                      }`}
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-[var(--text-main)] flex items-center gap-1.5">
                            {theme.name}
                            {isActive && (
                              <span className="text-[9px] bg-[var(--sidebar-active)] text-white px-1.5 py-0.5 rounded font-bold">
                                نشطة
                              </span>
                            )}
                          </span>
                          <span className="text-[9px] text-[var(--text-secondary)] font-mono uppercase bg-[var(--app-bg)] px-2 py-0.5 rounded border border-[var(--card-border)]">
                            {theme.mode === 'dark' ? 'داكن' : 'فاتح'}
                          </span>
                        </div>
                        <p className="text-[10px] text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
                          {theme.desc}
                        </p>
                      </div>

                      {/* Color Palette Preview */}
                      <div className="flex items-center justify-between pt-2 border-t border-[var(--card-border)]">
                        <div className="flex gap-1.5">
                          <span className="w-4 h-4 rounded-full border border-black/15 shadow-2xs" style={{ backgroundColor: theme.colors.appBg }} title="الخلفية" />
                          <span className="w-4 h-4 rounded-full border border-black/15 shadow-2xs" style={{ backgroundColor: theme.colors.headerBg }} title="العناوين" />
                          <span className="w-4 h-4 rounded-full border border-black/15 shadow-2xs" style={{ backgroundColor: theme.colors.sidebarBg }} title="القائمة" />
                          <span className="w-4 h-4 rounded-full border border-black/15 shadow-2xs" style={{ backgroundColor: theme.colors.buttonBg }} title="الأزرار" />
                          <span className="w-4 h-4 rounded-full border border-black/15 shadow-2xs" style={{ backgroundColor: theme.colors.cardBg }} title="البطاقات" />
                        </div>
                      </div>

                      {/* Actions toolbar */}
                      <div className="flex items-center justify-between gap-1 pt-2 border-t border-[var(--card-border)]">
                        <button
                          type="button"
                          onClick={() => handlePresetSelect(theme)}
                          className={`text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                            isActive
                              ? 'bg-[var(--sidebar-active)] text-white'
                              : 'bg-[var(--app-bg)] text-[var(--text-main)] hover:bg-[var(--sidebar-active)] hover:text-white'
                          }`}
                        >
                          {isActive ? 'السمة مفعّلة' : 'تطبيق السمة'}
                        </button>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEditCustomTheme(theme)}
                            className="p-1.5 rounded-lg border border-[var(--card-border)] text-[var(--text-secondary)] hover:text-[var(--sidebar-active)] hover:bg-[var(--app-bg)] cursor-pointer"
                            title="تعديل السمة في المحرر المتقدم"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDuplicateTheme(theme)}
                            className="p-1.5 rounded-lg border border-[var(--card-border)] text-[var(--text-secondary)] hover:text-[var(--sidebar-active)] hover:bg-[var(--app-bg)] cursor-pointer"
                            title="استنساخ كنقطة بداية"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleExportTheme(theme)}
                            className="p-1.5 rounded-lg border border-[var(--card-border)] text-[var(--text-secondary)] hover:text-emerald-500 hover:bg-[var(--app-bg)] cursor-pointer"
                            title="تصدير السمة لملف JSON"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>

                          {deleteConfirmId === theme.id ? (
                            <div className="flex items-center gap-1 animate-fade-in">
                              <button
                                type="button"
                                onClick={() => handleDeleteCustomTheme(theme.id)}
                                className="px-2 py-1 bg-rose-600 text-white text-[9px] rounded font-bold cursor-pointer"
                              >
                                تأكيد
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteConfirmId(null)}
                                className="px-2 py-1 bg-slate-200 text-slate-800 text-[9px] rounded font-bold cursor-pointer"
                              >
                                إلغاء
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmId(theme.id)}
                              className="p-1.5 rounded-lg border border-[var(--card-border)] text-[var(--text-secondary)] hover:text-rose-500 hover:bg-[var(--app-bg)] cursor-pointer"
                              title="حذف السمة"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Built-in Official Themes Category */}
          <div className="space-y-4 pt-4">
            <div className="flex items-center justify-between border-b border-[var(--frame-border)] pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-500" />
                <h3 className="text-sm font-extrabold text-[var(--text-main)]">
                  السمات الرسمية المعتمدة (Built-in Themes)
                </h3>
                <span className="text-[10px] bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full font-bold">
                  10 سمات احترافية
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3.5">
              {PRESET_THEMES.map((preset) => {
                const isActive = localConfig.selectedThemeName === preset.id || localConfig.selectedThemeName === preset.name;
                return (
                  <div
                    key={preset.id}
                    className={`p-3.5 rounded-xl border text-right transition-all flex flex-col justify-between hover:scale-[1.02] text-xs space-y-2 relative overflow-hidden ${
                      isActive
                        ? 'border-[var(--sidebar-active)] bg-[var(--sidebar-active)]/10 shadow-md font-bold ring-2 ring-[var(--sidebar-active)]'
                        : 'border-[var(--card-border)] bg-[var(--card-bg)] hover:bg-[var(--app-bg)]'
                    }`}
                  >
                    {isActive && (
                      <span className="absolute top-2 left-2 text-[9px] bg-[var(--sidebar-active)] text-white px-1.5 py-0.5 rounded font-bold flex items-center gap-0.5 shadow-xs">
                        <Check className="w-3 h-3" /> مفعّل
                      </span>
                    )}
                    <div className="space-y-1">
                      <span className="block text-[11px] text-[var(--text-main)] font-bold">{preset.name}</span>
                      <span className="block text-[9px] text-[var(--text-secondary)] font-normal leading-tight opacity-85">{preset.desc}</span>
                    </div>

                    {/* Color swatches */}
                    <div className="flex items-center justify-between pt-2 border-t border-[var(--card-border)]">
                      <div className="flex gap-1">
                        <span className="w-3.5 h-3.5 rounded-full border border-black/15 shadow-2xs" style={{ backgroundColor: preset.colors.appBg }} title="الخلفية" />
                        <span className="w-3.5 h-3.5 rounded-full border border-black/15 shadow-2xs" style={{ backgroundColor: preset.colors.headerBg }} title="العناوين" />
                        <span className="w-3.5 h-3.5 rounded-full border border-black/15 shadow-2xs" style={{ backgroundColor: preset.colors.sidebarBg }} title="القائمة" />
                        <span className="w-3.5 h-3.5 rounded-full border border-black/15 shadow-2xs" style={{ backgroundColor: preset.colors.buttonBg }} title="الأزرار" />
                        <span className="w-3.5 h-3.5 rounded-full border border-black/15 shadow-2xs" style={{ backgroundColor: preset.colors.cardBg }} title="البطاقات" />
                      </div>
                      <span className="text-[9px] text-[var(--text-secondary)] font-mono uppercase">
                        {preset.mode === 'dark' ? 'داكن' : 'فاتح'}
                      </span>
                    </div>

                    {/* Card Actions */}
                    <div className="flex items-center justify-between gap-1 pt-2 border-t border-[var(--card-border)]">
                      <button
                        type="button"
                        onClick={() => handlePresetSelect(preset)}
                        className={`text-[10px] font-bold px-2.5 py-1 rounded transition-all cursor-pointer ${
                          isActive
                            ? 'bg-[var(--sidebar-active)] text-white'
                            : 'bg-[var(--app-bg)] text-[var(--text-main)] hover:bg-[var(--sidebar-active)] hover:text-white'
                        }`}
                      >
                        {isActive ? 'مفعّلة' : 'تطبيق'}
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleDuplicateTheme(preset)}
                          className="p-1 text-[10px] text-[var(--text-secondary)] hover:text-[var(--sidebar-active)] cursor-pointer flex items-center gap-0.5"
                          title="استنساخ كنقطة بداية للسمة المخصصة"
                        >
                          <Copy className="w-3 h-3" />
                          <span>استنسخ</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {/* SECTION 2: ACTIVE UI COLOR MATRIX */}
      {activeSection === 'colors' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-fade-in">
          
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-5 space-y-4 shadow-sm">
              <div className="flex justify-between items-center border-b border-[var(--frame-border)] pb-3">
                <div>
                  <h3 className="text-xs font-extrabold text-[var(--text-main)] flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-[var(--sidebar-active)]" />
                    مصفوفة الألوان التصميمية (Design Tokens Matrix)
                  </h3>
                  <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                    تغيير هذه القيم ينعكس فورا على الواجهة من خلال النظام المركزي لتشمل كافة الصفحات
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleOpenNewThemeEditor}
                  className="text-xs text-[var(--sidebar-active)] font-bold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  فتح المحرر المتقدم
                </button>
              </div>

              {/* Color Categories */}
              <div className="space-y-6">
                
                {/* Containers */}
                <div className="space-y-3">
                  <h4 className="text-[11px] font-bold text-[var(--text-main)] flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                    <Layout className="w-3.5 h-3.5" /> الهيكل والخلفيات الأساسية
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { key: 'appBg', label: 'خلفية التطبيق العامة' },
                      { key: 'cardBg', label: 'خلفية البطاقات والتقارير' },
                      { key: 'cardBorder', label: 'إطارات وحدود البطاقات' },
                      { key: 'frameBorder', label: 'حدود الفواصل الهيكلية' },
                      { key: 'dialogBg', label: 'خلفية النوافذ المنبثقة' },
                      { key: 'dialogBorder', label: 'حدود النوافذ المنبثقة' },
                    ].map(item => (
                      <div key={item.key} className="space-y-1">
                        <label className="text-[10px] font-bold text-[var(--text-main)] block">{item.label}</label>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            value={activeColors[item.key as keyof ThemeColors] || '#ffffff'}
                            onChange={(e) => handleFieldChange(item.key as keyof VisualIdentity, e.target.value)}
                            className="w-8 h-8 border rounded-lg cursor-pointer bg-transparent shrink-0"
                          />
                          <input
                            type="text"
                            value={activeColors[item.key as keyof ThemeColors] || ''}
                            onChange={(e) => handleFieldChange(item.key as keyof VisualIdentity, e.target.value)}
                            className="w-full text-xs px-3 py-1.5 rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-main)] font-mono"
                            dir="ltr"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Navigation */}
                <div className="space-y-3 border-t border-[var(--frame-border)] pt-4">
                  <h4 className="text-[11px] font-bold text-[var(--text-main)] flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
                    <Palette className="w-3.5 h-3.5" /> أشرطة العنوان والشريط الجانبي
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { key: 'headerBg', label: 'خلفية شريط العنوان' },
                      { key: 'headerText', label: 'نص شريط العنوان' },
                      { key: 'sidebarBg', label: 'خلفية القائمة الجانبية' },
                      { key: 'sidebarText', label: 'نص القائمة الجانبية' },
                      { key: 'sidebarActive', label: 'العنصر النشط بالقائمة' },
                      { key: 'footerBg', label: 'خلفية التذييل' },
                    ].map(item => (
                      <div key={item.key} className="space-y-1">
                        <label className="text-[10px] font-bold text-[var(--text-main)] block">{item.label}</label>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            value={activeColors[item.key as keyof ThemeColors] || '#ffffff'}
                            onChange={(e) => handleFieldChange(item.key as keyof VisualIdentity, e.target.value)}
                            className="w-8 h-8 border rounded-lg cursor-pointer bg-transparent shrink-0"
                          />
                          <input
                            type="text"
                            value={activeColors[item.key as keyof ThemeColors] || ''}
                            onChange={(e) => handleFieldChange(item.key as keyof VisualIdentity, e.target.value)}
                            className="w-full text-xs px-3 py-1.5 rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-main)] font-mono"
                            dir="ltr"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Buttons & Controls */}
                <div className="space-y-3 border-t border-[var(--frame-border)] pt-4">
                  <h4 className="text-[11px] font-bold text-[var(--text-main)] flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                    <MousePointerClick className="w-3.5 h-3.5" /> الأزرار وتفاعلات الإدخال
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { key: 'buttonBg', label: 'لون الأزرار الأساسية' },
                      { key: 'buttonText', label: 'نص الأزرار الأساسية' },
                      { key: 'buttonSecondaryBg', label: 'خلفية الأزرار الثانوية' },
                      { key: 'buttonDangerBg', label: 'خلفية أزرار الحذف' },
                      { key: 'buttonSuccessBg', label: 'خلفية أزرار النجاح' },
                      { key: 'inputBg', label: 'خلفية حقول الإدخال' },
                    ].map(item => (
                      <div key={item.key} className="space-y-1">
                        <label className="text-[10px] font-bold text-[var(--text-main)] block">{item.label}</label>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            value={activeColors[item.key as keyof ThemeColors] || '#ffffff'}
                            onChange={(e) => handleFieldChange(item.key as keyof VisualIdentity, e.target.value)}
                            className="w-8 h-8 border rounded-lg cursor-pointer bg-transparent shrink-0"
                          />
                          <input
                            type="text"
                            value={activeColors[item.key as keyof ThemeColors] || ''}
                            onChange={(e) => handleFieldChange(item.key as keyof VisualIdentity, e.target.value)}
                            className="w-full text-xs px-3 py-1.5 rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-main)] font-mono"
                            dir="ltr"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* Sticky Live Theme Preview */}
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

            <div 
              className="p-5 border rounded-2xl overflow-hidden transition-all duration-300 text-right flex flex-col space-y-4"
              style={{ 
                backgroundColor: activeColors.appBg, 
                borderColor: activeColors.frameBorder 
              }}
            >
              {/* Header Preview */}
              <div 
                className="p-3 border rounded-xl flex justify-between items-center shadow-sm"
                style={{ 
                  backgroundColor: activeColors.headerBg, 
                  borderColor: activeColors.cardBorder, 
                  color: activeColors.headerText 
                }}
              >
                <div className="flex items-center gap-1.5">
                  <span 
                    className="w-6 h-6 rounded-md flex items-center justify-center text-[8px] font-black text-white shrink-0"
                    style={{ backgroundColor: activeColors.buttonBg }}
                  >
                    {localConfig.logoText.substring(0, 3)}
                  </span>
                  <span className="text-[9px] font-bold opacity-90">{localConfig.title}</span>
                </div>
                <span className="text-[7px] font-bold font-mono opacity-60">مباشر</span>
              </div>

              {/* Sidebar and Card Row */}
              <div className="grid grid-cols-12 gap-3">
                <div 
                  className="col-span-4 p-2 border rounded-xl flex flex-col space-y-1.5 shadow-sm"
                  style={{ 
                    backgroundColor: activeColors.sidebarBg, 
                    borderColor: activeColors.cardBorder 
                  }}
                >
                  <div 
                    className="px-2 py-1 text-[7px] font-black flex items-center justify-between rounded-md"
                    style={{ 
                      backgroundColor: activeColors.sidebarActive, 
                      color: activeColors.buttonText 
                    }}
                  >
                    <span>الرئيسية</span>
                    <span>●</span>
                  </div>
                  <div className="px-2 py-1 text-[7px] font-bold flex items-center justify-between opacity-70" style={{ color: activeColors.sidebarText }}>
                    <span>التقارير</span>
                    <span>○</span>
                  </div>
                </div>

                <div className="col-span-8 space-y-3">
                  <div 
                    className="p-3 border rounded-xl shadow-xs"
                    style={{ 
                      backgroundColor: activeColors.cardBg, 
                      borderColor: activeColors.cardBorder 
                    }}
                  >
                    <h5 className="text-[8px] font-black mb-1" style={{ color: activeColors.textMain }}>معاينة سند قبض</h5>
                    <p className="text-[6px] mb-2 opacity-75" style={{ color: activeColors.textSecondary }}>المبلغ: ١٠٠.٠٠ ر.ع</p>
                    
                    <button
                      type="button"
                      className="w-full py-1 text-[7px] font-bold rounded-md shadow-2xs"
                      style={{ 
                        backgroundColor: activeColors.buttonBg, 
                        color: activeColors.buttonText 
                      }}
                    >
                      حفظ السند المالي
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-4 shadow-sm space-y-3">
              <button
                type="button"
                onClick={() => {
                  DatabaseService.saveVisualIdentity(localConfig);
                  onUpdate(localConfig);
                  triggerNotification('تم حفظ وتطبيق الهوية البصرية على كافة صفحات البرامج');
                }}
                className="w-full py-2.5 px-4 text-xs font-bold text-white transition-all shadow-sm rounded-xl flex items-center justify-center gap-2 cursor-pointer"
                style={{ backgroundColor: 'var(--sidebar-active)' }}
              >
                <Save className="w-4 h-4" />
                <span>حفظ الهوية والتغييرات الحالية</span>
              </button>
            </div>
          </div>

        </div>
      )}

      {/* SECTION 3: LABELS & TEXTS */}
      {activeSection === 'labels' && (
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] p-5 rounded-2xl space-y-4 animate-fade-in shadow-sm">
          <h3 className="text-xs font-extrabold text-[var(--text-main)] flex items-center gap-1.5 border-b border-[var(--frame-border)] pb-2">
            <Type className="w-4 h-4 text-slate-500" />
            تخصيص المسميات والعناوين وبنود السندات
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
        </div>
      )}

      {/* SECTION 4: SHAPES & STYLES */}
      {activeSection === 'shapes' && (
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] p-5 rounded-2xl space-y-4 animate-fade-in shadow-sm">
          <h3 className="text-xs font-extrabold text-[var(--text-main)] flex items-center gap-1.5 border-b border-[var(--frame-border)] pb-2">
            <Layout className="w-4 h-4 text-slate-500" />
            تخصيص انحناءات وهياكل الأزرار والبطاقات
          </h3>

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

      {/* ADVANCED THEME EDITOR MODAL / DRAWER */}
      {isEditingCustomTheme && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--text-main)] w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col my-auto animate-fade-in">
            
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-[var(--frame-border)] flex items-center justify-between bg-[var(--app-bg)]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[var(--sidebar-active)] text-white flex items-center justify-center shadow-xs">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-[var(--text-main)]">
                    {editingThemeId ? 'تعديل السمة المخصصة' : 'محرر السمات المتقدم (Advanced Theme Editor)'}
                  </h3>
                  <p className="text-[10px] text-[var(--text-secondary)]">
                    قم بضبط وتخصيص كل عنصر تصميمي مع المعاينة الفورية والتحقق من سهولة القراءة
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsEditingCustomTheme(false)}
                className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-main)] hover:bg-[var(--card-bg)] rounded-xl transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
              
              {/* Basic Theme Metadata */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-[var(--app-bg)] p-4 rounded-2xl border border-[var(--card-border)]">
                <div>
                  <label className="block text-[11px] font-bold mb-1">اسم السمة المخصصة</label>
                  <input
                    type="text"
                    value={editorName}
                    onChange={(e) => setEditorName(e.target.value)}
                    placeholder="مثال: سمة المكتب الفاخرة"
                    className="w-full text-xs px-3.5 py-2 rounded-xl border border-[var(--input-border)] bg-[var(--card-bg)] text-[var(--text-main)] font-bold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold mb-1">وصف قصير للسمة</label>
                  <input
                    type="text"
                    value={editorDesc}
                    onChange={(e) => setEditorDesc(e.target.value)}
                    placeholder="وصف النمط أو الانطباع البصري"
                    className="w-full text-xs px-3.5 py-2 rounded-xl border border-[var(--input-border)] bg-[var(--card-bg)] text-[var(--text-main)] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold mb-1">نمط الإضاءة الأساسية</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setEditorMode('light')}
                      className={`flex-1 py-2 text-xs font-bold rounded-xl border flex items-center justify-center gap-1.5 cursor-pointer ${
                        editorMode === 'light'
                          ? 'bg-amber-500/10 border-amber-500 text-amber-600 dark:text-amber-400 font-extrabold'
                          : 'border-[var(--card-border)] bg-[var(--card-bg)] text-[var(--text-secondary)]'
                      }`}
                    >
                      <Sun className="w-3.5 h-3.5" /> فاتح Light
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditorMode('dark')}
                      className={`flex-1 py-2 text-xs font-bold rounded-xl border flex items-center justify-center gap-1.5 cursor-pointer ${
                        editorMode === 'dark'
                          ? 'bg-indigo-500/10 border-indigo-500 text-indigo-600 dark:text-indigo-400 font-extrabold'
                          : 'border-[var(--card-border)] bg-[var(--card-bg)] text-[var(--text-secondary)]'
                      }`}
                    >
                      <Moon className="w-3.5 h-3.5" /> داكن Dark
                    </button>
                  </div>
                </div>
              </div>

              {/* Theme Editor Tabs */}
              <div className="flex border-b border-[var(--frame-border)] gap-2 overflow-x-auto pb-1">
                {[
                  { id: 'structure', label: 'الهيكل والخلفيات', icon: Layout },
                  { id: 'nav', label: 'العناوين والقائمة', icon: Palette },
                  { id: 'typography', label: 'النصوص والأيقونات', icon: Type },
                  { id: 'buttons', label: 'الأزرار والحقول', icon: MousePointerClick },
                  { id: 'tables', label: 'الجداول والقوائم', icon: FileText },
                  { id: 'charts', label: 'الرسوم البيانية والمؤشرات', icon: PieChart },
                  { id: 'contrast', label: `فحص التباين والقراءة (${lowContrastCount > 0 ? `⚠ ${lowContrastCount}` : '✓ ممتاز'})`, icon: ShieldCheck },
                ].map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setEditorTab(tab.id as any)}
                      className={`px-3.5 py-2 text-xs font-bold rounded-t-xl transition-all border-b-2 cursor-pointer shrink-0 flex items-center gap-1.5 ${
                        editorTab === tab.id
                          ? 'border-[var(--sidebar-active)] bg-[var(--app-bg)] text-[var(--sidebar-active)] font-black'
                          : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-main)]'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* TAB CONTENT & LIVE PREVIEW GRID */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Left Column: Color Controls (7 cols) */}
                <div className="lg:col-span-7 space-y-4">
                  
                  {/* Category 1: Structure */}
                  {editorTab === 'structure' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-fade-in">
                      {[
                        { key: 'appBg', label: 'خلفية التطبيق العامة' },
                        { key: 'cardBg', label: 'خلفية البطاقات والتقارير' },
                        { key: 'cardBorder', label: 'حدود البطاقات والإطارات' },
                        { key: 'cardGlow', label: 'لون ظلال وتوهج البطاقات' },
                        { key: 'frameBorder', label: 'حدود الفواصل الهيكلية' },
                        { key: 'dialogBg', label: 'خلفية النوافذ المنبثقة' },
                        { key: 'dialogBorder', label: 'حدود النوافذ المنبثقة' },
                      ].map((item) => (
                        <div key={item.key} className="space-y-1 bg-[var(--app-bg)] p-2.5 rounded-xl border border-[var(--card-border)]">
                          <label className="text-[10px] font-bold block">{item.label}</label>
                          <div className="flex gap-2">
                            <input
                              type="color"
                              value={editorColors[item.key as keyof ThemeColors] || '#ffffff'}
                              onChange={(e) => setEditorColors(prev => ({ ...prev, [item.key]: e.target.value }))}
                              className="w-8 h-8 rounded border cursor-pointer shrink-0 bg-transparent"
                            />
                            <input
                              type="text"
                              value={editorColors[item.key as keyof ThemeColors] || ''}
                              onChange={(e) => setEditorColors(prev => ({ ...prev, [item.key]: e.target.value }))}
                              className="w-full text-xs px-2.5 py-1 rounded border border-[var(--input-border)] bg-[var(--card-bg)] font-mono"
                              dir="ltr"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Category 2: Nav */}
                  {editorTab === 'nav' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-fade-in">
                      {[
                        { key: 'headerBg', label: 'خلفية شريط العنوان العلوي' },
                        { key: 'headerText', label: 'نص وأيقونات شريط العنوان' },
                        { key: 'sidebarBg', label: 'خلفية الشريط الجانبي' },
                        { key: 'sidebarText', label: 'نص القائمة الجانبية العادي' },
                        { key: 'sidebarActive', label: 'خلفية العنصر النشط بالقائمة' },
                        { key: 'footerBg', label: 'خلفية تذييل الصفحة' },
                        { key: 'footerText', label: 'نص التذييل وحقوق البرنامج' },
                      ].map((item) => (
                        <div key={item.key} className="space-y-1 bg-[var(--app-bg)] p-2.5 rounded-xl border border-[var(--card-border)]">
                          <label className="text-[10px] font-bold block">{item.label}</label>
                          <div className="flex gap-2">
                            <input
                              type="color"
                              value={editorColors[item.key as keyof ThemeColors] || '#ffffff'}
                              onChange={(e) => setEditorColors(prev => ({ ...prev, [item.key]: e.target.value }))}
                              className="w-8 h-8 rounded border cursor-pointer shrink-0 bg-transparent"
                            />
                            <input
                              type="text"
                              value={editorColors[item.key as keyof ThemeColors] || ''}
                              onChange={(e) => setEditorColors(prev => ({ ...prev, [item.key]: e.target.value }))}
                              className="w-full text-xs px-2.5 py-1 rounded border border-[var(--input-border)] bg-[var(--card-bg)] font-mono"
                              dir="ltr"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Category 3: Typography */}
                  {editorTab === 'typography' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-fade-in">
                      {[
                        { key: 'textMain', label: 'النص الرئيسي (العناوين والمبالغ)' },
                        { key: 'textSecondary', label: 'النص الثانوي Muted' },
                        { key: 'linkColor', label: 'لون الروابط القابلة للنقر' },
                        { key: 'iconColor', label: 'لون الأيقونات العامة' },
                      ].map((item) => (
                        <div key={item.key} className="space-y-1 bg-[var(--app-bg)] p-2.5 rounded-xl border border-[var(--card-border)]">
                          <label className="text-[10px] font-bold block">{item.label}</label>
                          <div className="flex gap-2">
                            <input
                              type="color"
                              value={editorColors[item.key as keyof ThemeColors] || '#ffffff'}
                              onChange={(e) => setEditorColors(prev => ({ ...prev, [item.key]: e.target.value }))}
                              className="w-8 h-8 rounded border cursor-pointer shrink-0 bg-transparent"
                            />
                            <input
                              type="text"
                              value={editorColors[item.key as keyof ThemeColors] || ''}
                              onChange={(e) => setEditorColors(prev => ({ ...prev, [item.key]: e.target.value }))}
                              className="w-full text-xs px-2.5 py-1 rounded border border-[var(--input-border)] bg-[var(--card-bg)] font-mono"
                              dir="ltr"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Category 4: Buttons & Controls */}
                  {editorTab === 'buttons' && (
                    <div className="space-y-4 animate-fade-in">
                      
                      {/* Primary Buttons */}
                      <div className="space-y-2 bg-[var(--app-bg)] p-3 rounded-2xl border border-[var(--card-border)]">
                        <span className="text-[11px] font-extrabold text-[var(--sidebar-active)] block">الأزرار الأساسية (Primary Buttons)</span>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { key: 'buttonBg', label: 'خلفية الزر' },
                            { key: 'buttonText', label: 'نص الزر' },
                            { key: 'buttonHover', label: 'عند التمرير' },
                          ].map(item => (
                            <div key={item.key} className="space-y-1">
                              <label className="text-[9px] font-bold block">{item.label}</label>
                              <input
                                type="color"
                                value={editorColors[item.key as keyof ThemeColors] || '#ffffff'}
                                onChange={(e) => setEditorColors(prev => ({ ...prev, [item.key]: e.target.value }))}
                                className="w-full h-7 rounded border cursor-pointer bg-transparent"
                              />
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Danger & Success Buttons */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2 bg-rose-500/5 p-3 rounded-2xl border border-rose-500/20">
                          <span className="text-[10px] font-extrabold text-rose-600 block">أزرار الحذف/الخطر</span>
                          <div className="flex gap-2">
                            <input
                              type="color"
                              value={editorColors.buttonDangerBg || '#dc2626'}
                              onChange={(e) => setEditorColors(prev => ({ ...prev, buttonDangerBg: e.target.value }))}
                              className="w-8 h-8 rounded cursor-pointer shrink-0"
                            />
                            <input
                              type="color"
                              value={editorColors.buttonDangerText || '#ffffff'}
                              onChange={(e) => setEditorColors(prev => ({ ...prev, buttonDangerText: e.target.value }))}
                              className="w-8 h-8 rounded cursor-pointer shrink-0"
                            />
                          </div>
                        </div>

                        <div className="space-y-2 bg-emerald-500/5 p-3 rounded-2xl border border-emerald-500/20">
                          <span className="text-[10px] font-extrabold text-emerald-600 block">أزرار النجاح والإضافة</span>
                          <div className="flex gap-2">
                            <input
                              type="color"
                              value={editorColors.buttonSuccessBg || '#16a34a'}
                              onChange={(e) => setEditorColors(prev => ({ ...prev, buttonSuccessBg: e.target.value }))}
                              className="w-8 h-8 rounded cursor-pointer shrink-0"
                            />
                            <input
                              type="color"
                              value={editorColors.buttonSuccessText || '#ffffff'}
                              onChange={(e) => setEditorColors(prev => ({ ...prev, buttonSuccessText: e.target.value }))}
                              className="w-8 h-8 rounded cursor-pointer shrink-0"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Inputs */}
                      <div className="space-y-2 bg-[var(--app-bg)] p-3 rounded-2xl border border-[var(--card-border)]">
                        <span className="text-[11px] font-extrabold text-[var(--text-main)] block">حقول النماذج والإدخال (Form Controls)</span>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { key: 'inputBg', label: 'خلفية الحقل' },
                            { key: 'inputBorder', label: 'إطار الحقل' },
                            { key: 'inputFocus', label: 'التركيز Focus' },
                          ].map(item => (
                            <div key={item.key} className="space-y-1">
                              <label className="text-[9px] font-bold block">{item.label}</label>
                              <input
                                type="color"
                                value={editorColors[item.key as keyof ThemeColors] || '#ffffff'}
                                onChange={(e) => setEditorColors(prev => ({ ...prev, [item.key]: e.target.value }))}
                                className="w-full h-7 rounded border cursor-pointer bg-transparent"
                              />
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>
                  )}

                  {/* Category 5: Tables & Menus */}
                  {editorTab === 'tables' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-fade-in">
                      {[
                        { key: 'tableHeaderBg', label: 'خلفية ترويسة الجداول' },
                        { key: 'tableRowBg', label: 'خلفية صفوف الجداول' },
                        { key: 'tableRowHoverBg', label: 'عند مرور الماوس على الصف' },
                        { key: 'tableRowActiveBg', label: 'خلفية الصف المحدد' },
                        { key: 'menuBg', label: 'خلفية القوائم المنسدلة' },
                        { key: 'menuBorder', label: 'حدود القوائم المنسدلة' },
                      ].map((item) => (
                        <div key={item.key} className="space-y-1 bg-[var(--app-bg)] p-2.5 rounded-xl border border-[var(--card-border)]">
                          <label className="text-[10px] font-bold block">{item.label}</label>
                          <div className="flex gap-2">
                            <input
                              type="color"
                              value={editorColors[item.key as keyof ThemeColors] || '#ffffff'}
                              onChange={(e) => setEditorColors(prev => ({ ...prev, [item.key]: e.target.value }))}
                              className="w-8 h-8 rounded border cursor-pointer shrink-0 bg-transparent"
                            />
                            <input
                              type="text"
                              value={editorColors[item.key as keyof ThemeColors] || ''}
                              onChange={(e) => setEditorColors(prev => ({ ...prev, [item.key]: e.target.value }))}
                              className="w-full text-xs px-2.5 py-1 rounded border border-[var(--input-border)] bg-[var(--card-bg)] font-mono"
                              dir="ltr"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Category 6: Charts & Scrollbars */}
                  {editorTab === 'charts' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-fade-in">
                      {[
                        { key: 'chartPrimary', label: 'اللون الرئيسي للرسم البياني' },
                        { key: 'chartSecondary', label: 'اللون الثانوي للرسم البياني' },
                        { key: 'progressBarBg', label: 'خلفية شريط التقدم' },
                        { key: 'progressFill', label: 'تعبئة شريط التقدم' },
                        { key: 'scrollbarThumb', label: 'مقبض شريط التمرير Scrollbar' },
                        { key: 'scrollbarTrack', label: 'مسار شريط التمرير Track' },
                      ].map((item) => (
                        <div key={item.key} className="space-y-1 bg-[var(--app-bg)] p-2.5 rounded-xl border border-[var(--card-border)]">
                          <label className="text-[10px] font-bold block">{item.label}</label>
                          <div className="flex gap-2">
                            <input
                              type="color"
                              value={editorColors[item.key as keyof ThemeColors] || '#ffffff'}
                              onChange={(e) => setEditorColors(prev => ({ ...prev, [item.key]: e.target.value }))}
                              className="w-8 h-8 rounded border cursor-pointer shrink-0 bg-transparent"
                            />
                            <input
                              type="text"
                              value={editorColors[item.key as keyof ThemeColors] || ''}
                              onChange={(e) => setEditorColors(prev => ({ ...prev, [item.key]: e.target.value }))}
                              className="w-full text-xs px-2.5 py-1 rounded border border-[var(--input-border)] bg-[var(--card-bg)] font-mono"
                              dir="ltr"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Category 7: Contrast Validation System */}
                  {editorTab === 'contrast' && (
                    <div className="space-y-3 animate-fade-in">
                      <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="w-5 h-5 text-blue-500 shrink-0" />
                          <div>
                            <span className="font-bold text-[var(--text-main)] block">نظام التحقق الذكي من التباين القراءة (WCAG)</span>
                            <span className="text-[10px] text-[var(--text-secondary)]">يحلل نسبة تباين النص مع الخلفية لضمان الوضوح التام مع اقتراح لون متوافق تلقائيا</span>
                          </div>
                        </div>
                        {lowContrastCount === 0 ? (
                          <span className="text-[10px] bg-emerald-500 text-white font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                            <Check className="w-3 h-3" /> ممتاز 100%
                          </span>
                        ) : (
                          <span className="text-[10px] bg-amber-500 text-white font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> {lowContrastCount} تحذيرات
                          </span>
                        )}
                      </div>

                      <div className="space-y-2">
                        {contrastResults.map((res) => (
                          <div
                            key={res.pairKey}
                            className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-all ${
                              res.isLow
                                ? 'border-amber-500/40 bg-amber-500/5'
                                : 'border-[var(--card-border)] bg-[var(--app-bg)]'
                            }`}
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-[var(--text-main)]">{res.label}</span>
                                <span className={`text-[9px] px-2 py-0.5 rounded-full font-mono font-bold ${
                                  res.isLow ? 'bg-amber-500 text-white' : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                                }`}>
                                  {res.ratio} : 1
                                </span>
                              </div>

                              <div className="flex items-center gap-2 text-[10px] text-[var(--text-secondary)]">
                                <span className="flex items-center gap-1">
                                  لون النص: <span className="w-3 h-3 rounded-full border" style={{ backgroundColor: res.textColor }} />
                                  <code className="font-mono">{res.textColor}</code>
                                </span>
                                <span>/</span>
                                <span className="flex items-center gap-1">
                                  خلفية: <span className="w-3 h-3 rounded-full border" style={{ backgroundColor: res.bgColor }} />
                                  <code className="font-mono">{res.bgColor}</code>
                                </span>
                              </div>
                            </div>

                            {res.isLow ? (
                              <button
                                type="button"
                                onClick={() => handleAutoFixEditorContrast(res.textKey, res.suggestedText)}
                                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-bold rounded-lg shadow-2xs flex items-center gap-1 cursor-pointer shrink-0"
                              >
                                <Sparkles className="w-3 h-3" />
                                <span>إصلاح تلقائي ({res.suggestedText})</span>
                              </button>
                            ) : (
                              <span className="text-emerald-500 font-bold text-[10px] flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" /> مريح للعين
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>

                {/* Right Column: Dynamic Live Preview in Editor (5 cols) */}
                <div className="lg:col-span-5 sticky top-0 space-y-3">
                  <div className="p-3 bg-[var(--app-bg)] border border-[var(--card-border)] rounded-xl flex items-center justify-between text-xs">
                    <span className="font-black text-[var(--text-main)] flex items-center gap-1.5">
                      <Eye className="w-4 h-4 text-indigo-500 animate-pulse" />
                      المعاينة الفورية للتعديل المباشر
                    </span>
                    <span className="text-[9px] font-mono opacity-70">
                      {editorMode === 'dark' ? 'مظهر ليلي' : 'مظهر ناصع'}
                    </span>
                  </div>

                  {/* Live Card Mockup Container */}
                  <div 
                    className="p-4 border rounded-2xl text-right space-y-3 transition-all duration-200 shadow-md"
                    style={{ 
                      backgroundColor: editorColors.appBg, 
                      borderColor: editorColors.frameBorder 
                    }}
                  >
                    {/* Header Mock */}
                    <div 
                      className="p-2.5 border rounded-xl flex justify-between items-center shadow-xs"
                      style={{ 
                        backgroundColor: editorColors.headerBg, 
                        borderColor: editorColors.cardBorder, 
                        color: editorColors.headerText 
                      }}
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded bg-blue-600 text-white flex items-center justify-center text-[8px] font-bold">
                          خزينة
                        </span>
                        <span className="text-[9px] font-bold">نظام السندات المالية</span>
                      </div>
                      <span className="text-[7px] font-mono opacity-60">تطبيقات 2026</span>
                    </div>

                    {/* Sidebar + Main Box */}
                    <div className="grid grid-cols-12 gap-2">
                      <div 
                        className="col-span-4 p-2 border rounded-xl space-y-1"
                        style={{ 
                          backgroundColor: editorColors.sidebarBg, 
                          borderColor: editorColors.cardBorder 
                        }}
                      >
                        <div 
                          className="px-2 py-1 text-[7px] font-extrabold rounded"
                          style={{ 
                            backgroundColor: editorColors.sidebarActive, 
                            color: editorColors.buttonText 
                          }}
                        >
                          الرئيسية
                        </div>
                        <div className="px-2 py-1 text-[7px] font-bold opacity-70" style={{ color: editorColors.sidebarText }}>
                          السندات
                        </div>
                      </div>

                      <div className="col-span-8 space-y-2">
                        <div 
                          className="p-2.5 border rounded-xl shadow-xs space-y-2"
                          style={{ 
                            backgroundColor: editorColors.cardBg, 
                            borderColor: editorColors.cardBorder 
                          }}
                        >
                          <span className="text-[8px] font-black block" style={{ color: editorColors.textMain }}>سند قبض جديد</span>
                          
                          <div 
                            className="p-1.5 rounded border text-[6px] font-mono"
                            style={{ 
                              backgroundColor: editorColors.inputBg, 
                              borderColor: editorColors.inputBorder,
                              color: editorColors.textMain
                            }}
                          >
                            المبلغ: 150.000 ر.ع
                          </div>

                          <div className="flex gap-1">
                            <button
                              type="button"
                              className="flex-1 py-1 text-[6px] font-bold rounded"
                              style={{ 
                                backgroundColor: editorColors.buttonBg, 
                                color: editorColors.buttonText 
                              }}
                            >
                              حفظ
                            </button>
                            <button
                              type="button"
                              className="py-1 px-2 text-[6px] font-bold rounded"
                              style={{ 
                                backgroundColor: editorColors.buttonDangerBg, 
                                color: editorColors.buttonDangerText 
                              }}
                            >
                              حذف
                            </button>
                          </div>
                        </div>

                        {/* Table mock */}
                        <div className="border rounded-lg overflow-hidden text-[6px]" style={{ borderColor: editorColors.frameBorder }}>
                          <div className="p-1 font-bold flex justify-between" style={{ backgroundColor: editorColors.tableHeaderBg, color: editorColors.textMain }}>
                            <span>البند</span>
                            <span>القيمة</span>
                          </div>
                          <div className="p-1 flex justify-between border-t" style={{ backgroundColor: editorColors.tableRowBg, borderColor: editorColors.frameBorder, color: editorColors.textSecondary }}>
                            <span>تبرع عام</span>
                            <span>١٥٠ ر.ع</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>

              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[var(--frame-border)] bg-[var(--app-bg)] flex items-center justify-between">
              <button
                type="button"
                onClick={() => setIsEditingCustomTheme(false)}
                className="px-4 py-2 text-xs font-bold border border-[var(--card-border)] bg-[var(--card-bg)] text-[var(--text-main)] hover:bg-[var(--app-bg)] rounded-xl transition-all cursor-pointer"
              >
                إلغاء
              </button>

              <button
                type="button"
                onClick={handleSaveCustomTheme}
                className="px-5 py-2 text-xs font-bold bg-[var(--sidebar-active)] text-white hover:opacity-90 rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>حفظ السمة المخصصة وتطبيقها فوراً</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
