import { motion } from "motion/react";
import { 
  Building2, 
  Globe, 
  Lock, 
  Save, 
  Download,
  AlertTriangle,
  Trash2,
  ShieldCheck,
  Monitor,
  Info
} from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { Settings } from "../types";

export function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    companyName: "",
    oneCBaseUrl: "",
    syncToken: ""
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    api.getSettings().then(setSettings);
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    await api.saveSettings(settings);
    setIsSaving(false);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="max-w-3xl space-y-8"
    >
      <div>
        <h2 className="text-xl font-bold text-slate-800 uppercase tracking-[0.2em]">Системные настройки</h2>
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Глобальная конфигурация узла</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <Building2 className="w-3 h-3 text-blue-600" /> Основные сведения
          </h3>
        </div>
        <div className="p-8 space-y-6">
          <div className="space-y-1.5 text-xs font-bold text-slate-500 uppercase tracking-widest">
            <label className="ml-1">Название предприятия</label>
            <input 
              type="text" 
              value={settings.companyName}
              onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-slate-800 outline-none focus:border-blue-600 transition-all font-medium"
            />
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <Globe className="w-3 h-3 text-blue-600" /> Интеграция шлюза (1C)
          </h3>
        </div>
        <div className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5 text-xs font-bold text-slate-500 uppercase tracking-widest">
              <label className="ml-1">API Endpoint</label>
              <input 
                type="text" 
                value={settings.oneCBaseUrl}
                onChange={(e) => setSettings({ ...settings, oneCBaseUrl: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-slate-800 outline-none focus:border-blue-600 transition-all font-medium"
              />
            </div>
            <div className="space-y-1.5 text-xs font-bold text-slate-500 uppercase tracking-widest">
              <label className="ml-1">Security Token</label>
              <div className="relative">
                <input 
                  type="password" 
                  value={settings.syncToken}
                  onChange={(e) => setSettings({ ...settings, syncToken: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-slate-800 outline-none focus:border-blue-600 transition-all font-medium pr-10"
                />
                <ShieldCheck className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden border-l-4 border-l-blue-600">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white">
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
              <Monitor className="w-4 h-4" />
            </div>
            Конфигурация VNC Агентов
          </h3>
        </div>
        <div className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Общий пароль VNC</label>
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Введите пароль для всех Агентов"
                  value={settings.vncPassword || ""}
                  onChange={(e) => setSettings({ ...settings, vncPassword: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-sm text-slate-800 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-500/5 transition-all font-mono"
                />
                <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Интервал синхронизации (мин)</label>
              <input 
                type="number" 
                value={settings.agentInterval || 15}
                onChange={(e) => setSettings({ ...settings, agentInterval: parseInt(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-sm text-slate-800 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-500/5 transition-all font-bold"
              />
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-2xl border border-blue-100">
            <Info className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
            <p className="text-[11px] font-medium text-blue-700 leading-relaxed">
              Этот пароль будет автоматически применен ко всем компьютерам при следующем сеансе связи с Агентом. 
              Рекомендуется использовать надежный пароль (минимум 8 символов).
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 flex items-center justify-between group">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 border border-amber-100">
            <Download className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">Внешняя компонента 1C</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Для версии Предприятие 8.3.21+</p>
          </div>
        </div>
        <button className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all active:scale-95 shadow-lg">
          Скачать .epf
        </button>
      </div>

      <div className="flex justify-between items-center py-4">
        <div className="flex items-center gap-4 p-4 bg-slate-200/50 rounded-xl border border-dashed border-slate-300">
          <AlertTriangle className="text-amber-600 w-4 h-4" />
          <div className="text-[10px] font-bold text-slate-500 uppercase">
            Сброс настроек приведет к удалению всех локальных связей.
          </div>
        </div>
        <div className="flex gap-4">
          <button className="text-rose-600 hover:text-rose-700 text-[10px] font-extrabold uppercase tracking-widest flex items-center gap-2 px-4 py-2 hover:bg-rose-50 rounded-lg transition-all">
            <Trash2 className="w-4 h-4" /> Hard Reset
          </button>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold px-10 py-3 rounded-lg flex items-center gap-2 transition-all shadow-lg shadow-blue-600/20 active:scale-95 text-xs uppercase tracking-widest"
          >
            {isSaving ? "Сохранение..." : <><Save className="w-4 h-4" /> Сохранить</>}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
