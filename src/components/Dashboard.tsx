import { 
  Activity, 
  BarChart3, 
  Clock, 
  Monitor, 
  ShieldCheck, 
  TrendingUp, 
  UserSquare2,
  HardDrive,
  Cpu,
  History,
  AlertCircle
} from "lucide-react";
import { motion } from "motion/react";
import React, { useEffect, useState } from "react";
import { api } from "../lib/api";
import { Computer } from "../types";

export function Dashboard() {
  const [computers, setComputers] = useState<Computer[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    inUse: 0,
    available: 0,
    vncReady: 0
  });

  useEffect(() => {
    const load = async () => {
      const data = await api.getComputers();
      setComputers(data);
      setStats({
        total: data.length,
        inUse: data.filter(c => c.status === 'In Use').length,
        available: data.filter(c => c.status === 'Available').length,
        vncReady: data.filter(c => c.vncActive).length
      });
    };
    load();
  }, []);

  // Collect all history items globally for the feed
  const globalHistory = computers
    .flatMap(c => c.history?.map(h => ({ ...h, pcName: c.name })) || [])
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-8 pb-12">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">HSA Monitoring Dashboard</h2>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Global IT Infrastructure Audit Console</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
             <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Agent Link: active</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: "Всего устройств", value: stats.total, icon: Monitor, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "В эксплуатации", value: stats.inUse, icon: UserSquare2, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Свободный фонд", value: stats.available, icon: ShieldCheck, color: "text-indigo-600", bg: "bg-indigo-50" },
          { label: "VNC Доступно", value: stats.vncReady, icon: Activity, color: "text-rose-600", bg: "bg-rose-50" },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-6 rounded-2xl border border-slate-100 shadow-tiny hover:shadow-md transition-shadow relative overflow-hidden group"
          >
            <stat.icon className={`absolute -right-4 -bottom-4 w-24 h-24 ${stat.color} opacity-5 -rotate-12 transition-transform group-hover:rotate-0`} />
            <div className={`w-10 h-10 ${stat.bg} ${stat.color} rounded-lg flex items-center justify-center mb-4`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{stat.label}</div>
            <div className="text-3xl font-black text-slate-900 leading-none">{stat.value}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col h-full">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <TrendingUp className="w-3 h-3 text-blue-600" /> Распределение мощностей (RAM)
              </h3>
            </div>
            <div className="p-8 flex-1 flex flex-col justify-center">
              <div className="flex items-end gap-3 h-48">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="flex-1 space-y-2">
                    <div 
                      className="bg-blue-600 rounded-t-lg transition-all duration-1000 hover:bg-blue-400"
                      style={{ height: `${Math.random() * 80 + 20}%` }}
                    />
                    <div className="text-[8px] text-center font-bold text-slate-400 uppercase">P{i+1}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm h-full flex flex-col">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <History className="w-3 h-3 text-amber-600" /> Изменения комплектующих
              </h3>
            </div>
            <div className="p-6 space-y-6 flex-1 overflow-auto max-h-[360px]">
              {globalHistory.length > 0 ? globalHistory.map((item, i) => (
                <div key={i} className="relative pl-6 border-l-2 border-slate-100 last:border-0 pb-6 last:pb-0">
                  <div className="absolute -left-[9px] top-0 w-4 h-4 bg-white border-2 border-amber-500 rounded-full flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                  </div>
                  <div className="flex flex-col">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-[10px] font-black text-slate-900 border-b border-amber-200">{item.pcName}</span>
                      <span className="text-[8px] font-medium text-slate-400 italic">
                        {new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="text-[10px] font-bold text-slate-600 mb-1">
                      Замена: <span className="text-amber-600">{item.field}</span>
                    </div>
                    <div className="flex items-center gap-2 bg-slate-50 p-2 rounded border border-slate-100">
                      <span className="text-[9px] text-slate-400 line-through truncate max-w-[80px]">{item.oldValue}</span>
                      <span className="text-slate-300">→</span>
                      <span className="text-[9px] font-bold text-slate-700 truncate max-w-[80px]">{item.newValue}</span>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-300 py-12">
                   <Clock className="w-12 h-12 mb-4 opacity-20" />
                   <p className="text-[10px] font-bold uppercase tracking-widest">Нет активных данных</p>
                </div>
              )}
            </div>
            <div className="p-4 border-t border-slate-50 mt-auto">
              <button onClick={() => window.location.href='/reports'} className="w-full py-2 text-[10px] font-bold text-blue-600 uppercase tracking-widest bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                Полный журнал
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden group">
           <AlertCircle className="absolute -right-8 -bottom-8 w-48 h-48 text-white/5 -rotate-12" />
           <div className="relative z-10">
              <h4 className="text-lg font-black uppercase mb-2">Проверка безопасности VNC</h4>
              <p className="text-xs text-slate-400 leading-relaxed max-w-sm mb-6">
                Все сеансы удаленного управления шифруются. Рекомендуется ограничить доступ только для подсети администраторов (192.168.0.0/24).
              </p>
              <button className="px-6 py-2 bg-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-slate-900 transition-all">
                Настроить фаервол
              </button>
           </div>
        </div>
        
        <div className="flex flex-col gap-4">
           <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-1 items-center gap-6 group hover:translate-x-2 transition-transform cursor-pointer">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                 <HardDrive className="w-6 h-6" />
              </div>
              <div>
                 <h5 className="font-bold text-sm text-slate-900">Мониторинг дискового пространства</h5>
                 <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mt-1">Остаток ресурса SSD на парке: 84%</p>
              </div>
           </div>
           <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-1 items-center gap-6 group hover:translate-x-2 transition-transform cursor-pointer">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                 <Cpu className="w-6 h-6" />
              </div>
              <div>
                 <h5 className="font-bold text-sm text-slate-900">Нагрузка процессоров (Average)</h5>
                 <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mt-1">Текущая активность парка: 12.4%</p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
