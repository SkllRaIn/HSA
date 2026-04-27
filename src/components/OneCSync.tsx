import { 
  ArrowRightLeft, 
  CheckCircle2, 
  RefreshCcw, 
  Database, 
  AlertTriangle,
  History,
  Cloud,
  Terminal,
  Settings
} from "lucide-react";
import { motion } from "motion/react";
import React, { useEffect, useState } from "react";
import { api } from "../lib/api";
import { SyncLog } from "../types";

export function OneCSync() {
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    const dbSettings = await api.getSettings();
    // Normally we would fetch logs from a dedicated endpoint, but server.ts stores them in db.json
    // For this demo we'll just show the concept
    setLogs([
      { timestamp: new Date().toISOString(), action: "Push to 1C", payload: { count: 12, status: "Success" } },
      { timestamp: new Date(Date.now() - 3600000).toISOString(), action: "Pull from 1C", payload: { new_assets: 0, status: "No change" } }
    ]);
  };

  const handleSync = () => {
    setSyncing(true);
    setTimeout(() => {
      setSyncing(false);
      loadLogs();
    }, 2000);
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center bg-slate-900 p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-xl font-black uppercase tracking-tighter mb-2">Шлюз интеграции 1С:Предприятие</h2>
          <p className="text-xs text-slate-400 font-medium max-w-sm mb-6 leading-relaxed">
            Автоматическая сверка инвентарных номеров и владельцев с бухгалтерской базой.
          </p>
          <div className="flex gap-4">
             <div className="flex items-center gap-2 px-3 py-1 bg-white/10 rounded-lg">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Link: Stable</span>
             </div>
             <div className="flex items-center gap-2 px-3 py-1 bg-white/10 rounded-lg">
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">Protocol: HTTP/REST</span>
             </div>
          </div>
        </div>
        <div className="relative z-10 flex flex-col items-center gap-4">
          <button 
            onClick={handleSync}
            disabled={syncing}
            className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all shadow-lg ${
              syncing ? 'bg-blue-600/50 animate-pulse' : 'bg-blue-600 hover:bg-blue-500 active:scale-95'
            }`}
          >
            <RefreshCcw className={`w-8 h-8 ${syncing ? 'animate-spin' : ''}`} />
          </button>
          <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">СИНХРОНИЗИРОВАТЬ</span>
        </div>
        <Cloud className="absolute -right-12 -top-12 w-48 h-48 text-white/5 -rotate-12" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
            <History className="w-4 h-4 text-amber-500" /> Журнал транзакций
          </h3>
          <div className="space-y-3">
            {logs.map((log, i) => (
              <div key={i} className="bg-white border border-slate-200 p-4 rounded-2xl flex items-center justify-between group hover:border-blue-600/20 transition-colors shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[10px] font-black text-slate-900 uppercase">{log.action}</div>
                    <div className="text-[9px] font-bold text-slate-400">{new Date(log.timestamp).toLocaleString()}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-emerald-600">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase">OK</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
           <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
            <Settings className="w-4 h-4 text-blue-500" /> Статус конечных точек
          </h3>
          <div className="bg-slate-900 rounded-3xl p-6 font-mono text-[10px] text-emerald-400/80 shadow-2xl relative border border-white/5">
             <div className="absolute top-4 right-4 flex gap-1.5">
                <div className="w-2 h-2 rounded-full bg-rose-500/30" />
                <div className="w-2 h-2 rounded-full bg-amber-500/30" />
                <div className="w-2 h-2 rounded-full bg-emerald-500/30" />
             </div>
             <div className="space-y-1 pt-6">
                <div>[08:42:12] Init secure handshake...</div>
                <div>[08:42:13] Requesting schema manifest...</div>
                <div className="text-emerald-400">[08:42:15] Schema verified (24 entities)</div>
                <div>[08:42:16] Mapping assets to standard...</div>
                <div className="flex items-center gap-2 my-4 bg-white/5 p-4 rounded-xl border border-white/10">
                   <Terminal className="w-4 h-4 text-blue-400" />
                   <span className="text-blue-400 font-bold uppercase tracking-widest">Waiting for incoming 1C signal...</span>
                   <span className="ml-auto animate-pulse">_</span>
                </div>
                <div className="opacity-40">Ready for data exchange.</div>
             </div>
          </div>
        </div>
      </div>

      <div className="p-8 bg-blue-600 rounded-3xl text-white shadow-xl relative overflow-hidden group">
         <div className="relative z-10 flex items-start gap-6">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center shrink-0">
               <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
               <h4 className="font-black uppercase text-sm mb-1">Рекомендация по безопасности</h4>
               <p className="text-[11px] text-blue-100 font-medium leading-relaxed opacity-80">
                 Используйте HTTPS соединение для передачи данных между этим порталом и сервером 1С. 
                 Убедитесь, что токен авторизации периодически обновляется в настройках.
               </p>
            </div>
         </div>
      </div>
    </div>
  );
}
