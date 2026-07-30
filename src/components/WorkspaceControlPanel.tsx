/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { WorkspaceConfig, WorkspacePreset, WorkspaceDensity, DEFAULT_WORKSPACE_CONFIG } from '../types';
import { DatabaseService } from '../db';
import { 
  Layout, 
  Monitor, 
  Smartphone, 
  Maximize2, 
  Minimize2, 
  Eye, 
  EyeOff, 
  RotateCcw, 
  Check, 
  Sliders, 
  Grid, 
  ArrowUp, 
  ArrowDown, 
  Sparkles, 
  Sidebar as SidebarIcon, 
  BarChart2, 
  Zap, 
  SlidersHorizontal,
  Laptop
} from 'lucide-react';

interface WorkspaceControlPanelProps {
  config: WorkspaceConfig;
  onUpdate: (newConfig: WorkspaceConfig) => void;
  onReset: () => void;
}

export default function WorkspaceControlPanel({ config, onUpdate, onReset }: WorkspaceControlPanelProps) {
  const [localConfig, setLocalConfig] = useState<WorkspaceConfig>({ ...config });
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const triggerSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 2500);
  };

  const handleUpdateConfig = (partial: Partial<WorkspaceConfig>) => {
    const updated = { ...localConfig, ...partial };
    setLocalConfig(updated);
    DatabaseService.saveWorkspaceConfig(updated);
    onUpdate(updated);
  };

  const handlePresetChange = (preset: WorkspacePreset) => {
    let presetConfig: Partial<WorkspaceConfig> = {};
    switch (preset) {
      case 'compact':
        presetConfig = {
          preset: 'compact',
          sidebarWidth: 200,
          sidebarVisible: true,
          toolbarVisible: true,
          statsVisible: true,
          quickActionsVisible: true,
          density: 'compact',
          containerMaxWidth: 'normal'
        };
        break;
      case 'wide':
        presetConfig = {
          preset: 'wide',
          sidebarWidth: 240,
          sidebarVisible: true,
          toolbarVisible: true,
          statsVisible: true,
          quickActionsVisible: true,
          density: 'comfortable',
          containerMaxWidth: 'wide'
        };
        break;
      case 'large':
        presetConfig = {
          preset: 'large',
          sidebarWidth: 320,
          sidebarVisible: true,
          toolbarVisible: true,
          statsVisible: true,
          quickActionsVisible: true,
          density: 'spacious',
          containerMaxWidth: 'full'
        };
        break;
      case 'laptop':
        presetConfig = {
          preset: 'laptop',
          sidebarWidth: 220,
          sidebarVisible: true,
          toolbarVisible: true,
          statsVisible: true,
          quickActionsVisible: false,
          density: 'compact',
          containerMaxWidth: 'normal'
        };
        break;
      case 'classic':
      default:
        presetConfig = {
          preset: 'classic',
          sidebarWidth: 260,
          sidebarVisible: true,
          toolbarVisible: true,
          statsVisible: true,
          quickActionsVisible: true,
          density: 'comfortable',
          containerMaxWidth: 'normal'
        };
        break;
    }

    handleUpdateConfig(presetConfig);
    triggerSuccess(`تم تفعيل "${getPresetLabel(preset)}" بنجاح`);
  };

  const getPresetLabel = (preset: WorkspacePreset) => {
    switch (preset) {
      case 'classic': return 'الوضع الكلاسيكي';
      case 'compact': return 'الوضع المضغوط';
      case 'wide': return 'الوضع الواسع';
      case 'large': return 'وضع الشاشات الكبيرة';
      case 'laptop': return 'وضع أجهزة اللابتوب';
      default: return preset;
    }
  };

  const cardLabels: Record<string, { label: string; desc: string; icon: React.ReactNode }> = {
    'stats': { label: 'لوحة الملخص المالي والإحصائيات', desc: 'إجمالي المقبوضات والمصروفات وصافي الميزانية', icon: <BarChart2 className="w-4 h-4 text-emerald-500" /> },
    'quick-actions': { label: 'لوحة الإجراءات السريعة', desc: 'أزرار إنشاء سند صرف وسند قبض وإدارة المشاريع', icon: <Zap className="w-4 h-4 text-amber-500" /> },
    'charts': { label: 'الرسوم البيانية وتوزيع المشاريع', desc: 'مؤشرات الأداء وتوزيع التبرعات على المشاريع', icon: <Grid className="w-4 h-4 text-indigo-500" /> },
    'recent-vouchers': { label: 'سجل السندات المالية الأخيرة', desc: 'جدول المعاملات الأخيرة مع خيارات المعاينة والطباعة', icon: <Layout className="w-4 h-4 text-sky-500" /> },
  };

  const moveCard = (index: number, direction: 'up' | 'down') => {
    const currentCards = [...(localConfig.cardOrder || ['stats', 'quick-actions', 'charts', 'recent-vouchers'])];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= currentCards.length) return;

    const temp = currentCards[index];
    currentCards[index] = currentCards[targetIndex];
    currentCards[targetIndex] = temp;

    handleUpdateConfig({ cardOrder: currentCards });
    triggerSuccess('تم إعادة ترتيب بطاقات الواجهة بنجاح');
  };

  const handleResetClick = () => {
    onReset();
    setLocalConfig({ ...DEFAULT_WORKSPACE_CONFIG });
    triggerSuccess('تم إعادة تعيين تخطيط الواجهة للإعدادات الافتراضية بنجاح');
  };

  return (
    <div className="space-y-6" id="workspace-customization-panel" dir="rtl">
      
      {/* Panel Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[var(--card-border)] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Layout className="w-6 h-6 text-[var(--sidebar-active)]" />
            <h2 className="text-xl font-black font-display text-[var(--text-main)]">
              تخصيص وتخطيط مساحة العمل (Workspace Layout)
            </h2>
            <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> مرن ومتجاوب
            </span>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-1.5 leading-relaxed">
            خصص أبعاد وأحجام القوائم، أظهر أو أخفِ الأقسام، وأعد ترتيب بطاقات الواجهة مع حفظ تلقائي متوافق مع السمة الحالية.
          </p>
        </div>

        <button
          type="button"
          onClick={handleResetClick}
          className="px-4 py-2.5 text-xs font-bold border border-rose-500/30 text-rose-600 dark:text-rose-400 bg-rose-500/5 hover:bg-rose-500/10 rounded-xl transition-all flex items-center gap-2 cursor-pointer shrink-0 shadow-xs"
        >
          <RotateCcw className="w-4 h-4" />
          <span>إعادة تعيين تخطيط الواجهة</span>
        </button>
      </div>

      {successMessage && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center gap-2 text-xs font-bold animate-toast-slide">
          <Check className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* 1. Workspace Presets Mode Selector */}
      <div className="space-y-3">
        <h3 className="text-xs font-extrabold text-[var(--text-main)] flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-[var(--sidebar-active)]" />
          الأنماط الجاهزة لتخطيط الواجهة (Presets)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {[
            { id: 'classic' as WorkspacePreset, title: 'الوضع الكلاسيكي', icon: <Monitor className="w-4 h-4" />, desc: 'شريط جانبي قياسي مع إظهار كافة الأقسام' },
            { id: 'compact' as WorkspacePreset, title: 'الوضع المضغوط', icon: <Minimize2 className="w-4 h-4" />, desc: 'مساحات مصغرة وزيادة كفاءة العرض' },
            { id: 'wide' as WorkspacePreset, title: 'الوضع الواسع', icon: <Maximize2 className="w-4 h-4" />, desc: 'عرض كامل للشاشات العريضة جداً' },
            { id: 'large' as WorkspacePreset, title: 'الشاشات الكبيرة', icon: <Grid className="w-4 h-4" />, desc: 'عناصر أكبر وشريط جانبي بعرض 320px' },
            { id: 'laptop' as WorkspacePreset, title: 'أجهزة اللابتوب', icon: <Laptop className="w-4 h-4" />, desc: 'تركيز أقصى على مساحة جداول البيانات' },
          ].map((preset) => {
            const isActive = localConfig.preset === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handlePresetChange(preset.id)}
                className={`p-3.5 rounded-2xl border text-right transition-all flex flex-col justify-between space-y-2 cursor-pointer ${
                  isActive
                    ? 'border-[var(--sidebar-active)] bg-[var(--sidebar-active)]/10 shadow-sm ring-2 ring-[var(--sidebar-active)] font-bold'
                    : 'border-[var(--card-border)] bg-[var(--card-bg)] hover:border-[var(--sidebar-active)]/40 hover:bg-[var(--app-bg)]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="p-2 rounded-xl bg-[var(--app-bg)] text-[var(--sidebar-active)]">
                    {preset.icon}
                  </span>
                  {isActive && (
                    <span className="text-[9px] bg-[var(--sidebar-active)] text-white px-2 py-0.5 rounded-full font-bold">
                      نشط
                    </span>
                  )}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[var(--text-main)]">{preset.title}</h4>
                  <p className="text-[10px] text-[var(--text-secondary)] leading-snug mt-1 font-normal">{preset.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Controls & Dimensional Customization */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Dimensions & Widths */}
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-5 space-y-4 shadow-xs">
          <h3 className="text-xs font-extrabold text-[var(--text-main)] flex items-center gap-2 border-b border-[var(--card-border)] pb-3">
            <SidebarIcon className="w-4 h-4 text-[var(--sidebar-active)]" />
            أبعاد وحجم الأقسام والشريط الجانبي
          </h3>

          {/* Sidebar Width Slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-[var(--text-main)]">عرض القائمة الجانبية (Sidebar Width)</span>
              <span className="font-mono bg-[var(--app-bg)] px-2.5 py-1 rounded-lg border border-[var(--card-border)] font-bold text-[var(--sidebar-active)]">
                {localConfig.sidebarWidth}px
              </span>
            </div>
            <input
              type="range"
              min="180"
              max="360"
              step="10"
              value={localConfig.sidebarWidth}
              onChange={(e) => handleUpdateConfig({ sidebarWidth: Number(e.target.value) })}
              className="w-full accent-[var(--sidebar-active)] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-[var(--text-secondary)] font-mono">
              <span>180px (مضغوط)</span>
              <span>260px (قياسي)</span>
              <span>360px (عريض)</span>
            </div>
          </div>

          {/* Container Max Width */}
          <div className="space-y-2 pt-3 border-t border-[var(--card-border)]">
            <label className="text-xs font-bold text-[var(--text-main)] block">
              اتساع الحاوية العامة للشاشة (Container Width)
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'normal', label: 'قياسي (7XL)' },
                { value: 'wide', label: 'عريض (1600px)' },
                { value: 'full', label: 'كامل الشاشة (Fluid)' },
              ].map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => handleUpdateConfig({ containerMaxWidth: item.value as any })}
                  className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                    localConfig.containerMaxWidth === item.value
                      ? 'bg-[var(--sidebar-active)] text-white border-[var(--sidebar-active)] shadow-xs'
                      : 'bg-[var(--app-bg)] text-[var(--text-main)] border-[var(--card-border)] hover:bg-[var(--card-bg)]'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Spatial Density */}
          <div className="space-y-2 pt-3 border-t border-[var(--card-border)]">
            <label className="text-xs font-bold text-[var(--text-main)] block">
              كثافة المسافات والهوامش (Interface Density)
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'compact', label: 'مكثف (Compact)' },
                { value: 'comfortable', label: 'مريح (Comfortable)' },
                { value: 'spacious', label: 'متسع (Spacious)' },
              ].map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => handleUpdateConfig({ density: item.value as WorkspaceDensity })}
                  className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                    localConfig.density === item.value
                      ? 'bg-[var(--sidebar-active)] text-white border-[var(--sidebar-active)] shadow-xs'
                      : 'bg-[var(--app-bg)] text-[var(--text-main)] border-[var(--card-border)] hover:bg-[var(--card-bg)]'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Visibility Toggles */}
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-5 space-y-4 shadow-xs">
          <h3 className="text-xs font-extrabold text-[var(--text-main)] flex items-center gap-2 border-b border-[var(--card-border)] pb-3">
            <Eye className="w-4 h-4 text-[var(--sidebar-active)]" />
            إظهار وإخفاء مكونات الواجهة الرئيسيّة
          </h3>

          <div className="space-y-3">
            {[
              { key: 'sidebarVisible', label: 'القائمة الجانبية للتنقل (Sidebar)', desc: 'قائمة الأقسام السريعة والشعار' },
              { key: 'toolbarVisible', label: 'شريط الأدوات العلوي (Top Header)', desc: 'مؤشر الوضع والمستخدم وأزرار التبديل' },
              { key: 'statsVisible', label: 'لوحة الإحصائيات والميزانية (Stats Panel)', desc: 'بطاقات الإجماليات والمقبوضات والمصروفات' },
              { key: 'quickActionsVisible', label: 'لوحة الإجراءات السريعة (Quick Actions)', desc: 'أزرار الاختصارات السريعة للسندات' },
            ].map((item) => {
              const isVisible = localConfig[item.key as keyof WorkspaceConfig] as boolean;
              return (
                <div
                  key={item.key}
                  className="flex items-center justify-between p-3 rounded-xl border border-[var(--card-border)] bg-[var(--app-bg)]"
                >
                  <div>
                    <h4 className="text-xs font-bold text-[var(--text-main)]">{item.label}</h4>
                    <p className="text-[10px] text-[var(--text-secondary)]">{item.desc}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleUpdateConfig({ [item.key]: !isVisible })}
                    className={`px-3 py-1.5 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer ${
                      isVisible
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                        : 'bg-slate-500/10 text-slate-500 border border-slate-500/20'
                    }`}
                  >
                    {isVisible ? (
                      <>
                        <Eye className="w-3.5 h-3.5" />
                        <span>ظاهر</span>
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-3.5 h-3.5" />
                        <span>مخفي</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* 3. Dashboard Card Reordering */}
      <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-5 space-y-4 shadow-xs">
        <div className="flex justify-between items-center border-b border-[var(--card-border)] pb-3">
          <div>
            <h3 className="text-xs font-extrabold text-[var(--text-main)] flex items-center gap-2">
              <Grid className="w-4 h-4 text-[var(--sidebar-active)]" />
              ترتيب وإعادة هيكلة بطاقات الواجهة الرئيسية
            </h3>
            <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">
              يمكنك تغيير الترتيب الرأسي لبطاقات الواجهة الرئيسية حسب أولويات عملك
            </p>
          </div>
        </div>

        <div className="space-y-2.5">
          {(localConfig.cardOrder || ['stats', 'quick-actions', 'charts', 'recent-vouchers']).map((cardKey, index, arr) => {
            const info = cardLabels[cardKey] || { label: cardKey, desc: '', icon: <Grid className="w-4 h-4" /> };
            return (
              <div
                key={cardKey}
                className="flex items-center justify-between p-3.5 rounded-xl border border-[var(--card-border)] bg-[var(--app-bg)] transition-all hover:border-[var(--sidebar-active)]/40"
              >
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-lg bg-[var(--card-bg)] border border-[var(--card-border)] flex items-center justify-center font-mono text-xs font-bold text-[var(--sidebar-active)]">
                    #{index + 1}
                  </span>
                  <div className="p-2 rounded-lg bg-[var(--card-bg)] border border-[var(--card-border)] shrink-0">
                    {info.icon}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[var(--text-main)]">{info.label}</h4>
                    <p className="text-[10px] text-[var(--text-secondary)]">{info.desc}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() => moveCard(index, 'up')}
                    className="p-1.5 rounded-lg border border-[var(--card-border)] bg-[var(--card-bg)] text-[var(--text-main)] hover:bg-[var(--sidebar-active)] hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
                    title="تحريك للأعلى"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    disabled={index === arr.length - 1}
                    onClick={() => moveCard(index, 'down')}
                    className="p-1.5 rounded-lg border border-[var(--card-border)] bg-[var(--card-bg)] text-[var(--text-main)] hover:bg-[var(--sidebar-active)] hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
                    title="تحريك للأسفل"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
