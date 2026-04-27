import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import { 
  FileText, 
  Download, 
  Search, 
  Calendar, 
  CheckCircle2, 
  Activity,
  History,
  HardDrive
} from "lucide-react";
import { api } from "../lib/api";
import { Computer } from "../types";

export function Reports() {
  const [computers, setComputers] = useState<Computer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await api.getComputers();
      setComputers(data);
    } finally {
      setLoading(false);
    }
  };

  const generateReport = (type: string) => {
    alert(`Генерация отчета: ${type}\nФормат: PDF/XLSX\nСтатус: Подготовка данных...`);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div>
        <h2 className="text-xl font-bold text-slate-800 uppercase tracking-[0.2em]">Центр отчетов</h2>
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Аналитика и экспорт данных инвентаризации</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { title: "Инвентарная ведомость", desc: "Полный список активов с текущими владельцами", icon: FileText, color: "text-blue-600", bg: "bg-blue-50" },
          { title: "История изменений", desc: "Журнал замены комплектующих за период", icon: History, color: "text-amber-600", bg: "bg-amber-50" },
          { title: "Отчет по износу", desc: "Список оборудования старше 4-х лет (амортизация)", icon: Activity, color: "text-rose-600", bg: "bg-rose-50" },
        ].map((report, i) => (
          <div key={i} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className={`w-10 h-10 ${report.bg} ${report.color} rounded-lg flex items-center justify-center mb-4`}>
              <report.icon className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-800 mb-2">{report.title}</h3>
            <p className="text-xs text-slate-500 mb-6 leading-relaxed">{report.desc}</p>
            <button 
              onClick={() => generateReport(report.title)}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-900 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-blue-600 transition-colors"
            >
              <Download className="w-4 h-4" /> Выгрузить
            </button>
          </div>
        ))}
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <Calendar className="w-3 h-3 text-blue-600" /> Резюме компьютерного парка
          </h3>
          <div className="text-[10px] font-bold text-emerald-600 uppercase">Актуально на: {new Date().toLocaleDateString()}</div>
        </div>
        
        <div className="p-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Всего мощностей</div>
              <div className="text-2xl font-black text-slate-900">{computers.length} ПК</div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Общая память</div>
              <div className="text-2xl font-black text-slate-900">
                {computers.reduce((acc, c) => acc + (parseInt(c.ram) || 0), 0)} GB
              </div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Сбои за месяц</div>
              <div className="text-2xl font-black text-rose-600">0</div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">1С Транзакции</div>
              <div className="text-2xl font-black text-emerald-600">99.8%</div>
            </div>
          </div>

          <div className="mt-12 space-y-4">
             <h4 className="text-[10px] font-bold text-slate-800 uppercase tracking-widest">Топ конфигураций CPU</h4>
             {[
               { name: "Intel Core i7-10700", count: "42%", color: "bg-blue-500" },
               { name: "Intel Core i5-11500", count: "35%", color: "bg-blue-400" },
               { name: "Apple M2", count: "12%", color: "bg-blue-300" },
               { name: "Прочие", count: "11%", color: "bg-slate-200" }
             ].map((cpu, i) => (
               <div key={i} className="space-y-1.5">
                 <div className="flex justify-between text-[10px] font-bold uppercase">
                   <span className="text-slate-600">{cpu.name}</span>
                   <span className="text-slate-900">{cpu.count}</span>
                 </div>
                 <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                   <div className={`${cpu.color} h-full`} style={{ width: cpu.count }} />
                 </div>
               </div>
             ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
