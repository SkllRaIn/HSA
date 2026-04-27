import { 
  Plus, 
  Search, 
  Monitor, 
  User, 
  MapPin, 
  Cpu, 
  Database, 
  HardDrive,
  Edit2,
  Edit3,
  Trash2,
  ExternalLink,
  History,
  Terminal,
  X,
  ShieldCheck,
  ShieldAlert,
  Info,
  Laptop,
  Folder,
  FolderOpen,
  ChevronRight,
  Package
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import React, { useEffect, useState } from "react";
import { api } from "../lib/api";
import { Computer } from "../types";
import { VNCViewer } from "./VNCViewer";

export function Inventory() {
  const [computers, setComputers] = useState<Computer[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedPC, setSelectedPC] = useState<Computer | null>(null);
  const [activeTab, setActiveTab] = useState<'specs' | 'software' | 'history'>('specs');
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [activeVncPC, setActiveVncPC] = useState<Computer | null>(null);

  useEffect(() => {
    loadComputers();
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      const g = await api.getGroups();
      setGroups(g);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddGroup = async () => {
    const name = prompt("Введите название новой группы (отдела):");
    if (name) {
      await api.addGroup({ name });
      loadGroups();
    }
  };

  const handleDeleteGroup = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("Удалить группу? Все ПК в ней перейдут в общий список.")) {
      await api.deleteGroup(id);
      if (selectedGroupId === id) setSelectedGroupId(null);
      loadGroups();
    }
  };

  const openDetails = (pc: Computer) => {
    setSelectedPC(pc);
    setActiveTab('specs');
    setIsDetailsOpen(true);
  };

  const loadComputers = async () => {
    try {
      const data = await api.getComputers();
      setComputers(data);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Удалить запись об устройстве?")) {
      await api.deleteComputer(id);
      loadComputers();
    }
  };

  const handleUpdatePC = async (id: string, updates: Partial<Computer>) => {
    await api.updateComputer(id, updates);
    loadComputers();
  };

  const handleRemoteAccess = (ip: string) => {
    if (!ip) return alert("IP-адрес не определен!");
    if (window.confirm(`Открыть VNC сессию для ${ip}?`)) {
      window.location.href = `vnc://${ip}`;
    }
  };

  const filtered = computers.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.assignedTo.toLowerCase().includes(search.toLowerCase()) ||
      c.serialNumber.toLowerCase().includes(search.toLowerCase());
    
    if (selectedGroupId) {
      return matchesSearch && c.groupId === selectedGroupId;
    }
    return matchesSearch;
  });

  return (
    <div className="flex gap-6 items-start h-full">
      {/* Groups Sidebar */}
      <div className="w-64 bg-white/50 backdrop-blur-md rounded-2xl border border-slate-200/50 p-4 shrink-0 shadow-tiny h-full flex flex-col">
        <div className="flex items-center justify-between mb-4 px-2">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Группы / Отделы</h3>
          <button 
            onClick={handleAddGroup}
            className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-blue-500 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-1 flex-1 overflow-y-auto">
          <button 
            onClick={() => setSelectedGroupId(null)}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all ${!selectedGroupId ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            <div className="flex items-center gap-3">
              <FolderOpen className={`w-4 h-4 ${!selectedGroupId ? 'text-white' : 'text-slate-400'}`} />
              <span className="text-xs font-bold">Все устройства</span>
            </div>
            <span className={`text-[10px] font-black ${!selectedGroupId ? 'text-blue-200' : 'text-slate-300'}`}>
              {computers.length}
            </span>
          </button>

          {groups.map(group => (
            <button 
              key={group.id}
              onClick={() => setSelectedGroupId(group.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all group ${selectedGroupId === group.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              <div className="flex items-center gap-3">
                <Folder className={`w-4 h-4 ${selectedGroupId === group.id ? 'text-white' : 'text-slate-400'}`} />
                <span className="text-xs font-bold">{group.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-black ${selectedGroupId === group.id ? 'text-blue-200' : 'text-slate-300'}`}>
                  {computers.filter(c => c.groupId === group.id).length}
                </span>
                <Trash2 
                  onClick={(e) => handleDeleteGroup(group.id, e)}
                  className={`w-3 h-3 text-white/40 hover:text-white transition-opacity ${selectedGroupId === group.id ? 'block' : 'hidden group-hover:block text-slate-300 hover:text-rose-500'}`} 
                />
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-widest">Учет оборудования</h2>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Реестр системных блоков и носимых устройств</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
            <input 
              type="text"
              placeholder="ПОИСК ПО ИМЕНИ ПК / СЕРИЙНИКУ..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all w-64 shadow-tiny"
            />
          </div>
          <button className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-black/10 hover:bg-blue-600 transition-all active:scale-95">
            <Plus className="w-4 h-4" /> Добавить
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[600px]">
        <div className="grid grid-cols-12 bg-slate-50 border-b border-slate-100 px-6 py-4">
          <div className="col-span-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Имя ПК / Модель</div>
          <div className="col-span-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Ответственный</div>
          <div className="col-span-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Конфигурация (CPU/RAM)</div>
          <div className="col-span-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Сетевой адрес</div>
          <div className="col-span-2 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Управление</div>
        </div>

        <div className="flex-1 divide-y divide-slate-50">
          {filtered.map((pc) => (
            <motion.div 
              layout
              key={pc.id} 
              className="grid grid-cols-12 px-6 py-4 items-center hover:bg-slate-50/80 transition-colors group"
            >
              <div className="col-span-3 flex items-center gap-4">
                <div className={`w-10 h-10 ${pc.status === 'In Use' ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-400'} rounded-xl flex items-center justify-center border border-slate-100 shadow-tiny group-hover:scale-110 transition-transform`}>
                  <Laptop className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                   <div className="flex items-center gap-2">
                      <div 
                        className="text-xs font-black text-slate-900 tracking-tight cursor-pointer hover:text-blue-600 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          const newName = prompt("Введите новое имя для ПК:", pc.name);
                          if (newName && newName !== pc.name) {
                            handleUpdatePC(pc.id, { name: newName });
                          }
                        }}
                      >
                        {pc.name}
                      </div>
                      <Edit3 className="w-2.5 h-2.5 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                   </div>
                   <div className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter truncate max-w-[150px]">{pc.model}</div>
                </div>
              </div>

              <div className="col-span-2 text-xs font-bold text-slate-600 truncate pr-4">
                {pc.assignedTo || <span className="text-slate-300 italic">НЕ НАЗНАЧЕН</span>}
              </div>

              <div className="col-span-3 flex items-center gap-4">
                <div className="flex flex-col gap-1 w-full">
                   <div className="flex items-center gap-1.5">
                      <Cpu className="w-3 h-3 text-blue-400" />
                      <span className="text-[10px] font-bold text-slate-700 truncate">{pc.cpu}</span>
                   </div>
                   <div className="flex items-center gap-1.5">
                      <Monitor className="w-3 h-3 text-emerald-400" />
                      <span className="text-[10px] font-bold text-slate-500 truncate">{pc.gpu || 'Интегрированная'}</span>
                   </div>
                   <div className="flex items-center gap-1.5">
                      <Database className="w-3 h-3 text-amber-400" />
                      <span className="text-[10px] font-bold text-slate-600">{pc.ram} | {pc.storage || "N/A"}</span>
                   </div>
                </div>
              </div>

              <div className="col-span-2">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-slate-50 border border-slate-100 rounded-lg">
                   <div className={`w-1.5 h-1.5 rounded-full ${pc.vncActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                   <span className="text-[10px] font-mono font-bold text-blue-600">{pc.lastIp || "—"}</span>
                </div>
              </div>

              <div className="col-span-2 flex justify-end items-center gap-1">
                <button 
                  onClick={() => pc.lastIp && setActiveVncPC(pc)}
                  title="Удаленное управление"
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all border border-transparent hover:border-blue-100"
                >
                  <ExternalLink className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => openDetails(pc)}
                  title="Детальная информация"
                  className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-all border border-transparent hover:border-amber-100"
                >
                  <Info className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => handleDelete(pc.id)}
                  title="Удалить устройство"
                  className="p-2 text-rose-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
        
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
           <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">База данных синхронизирована</span>
           </div>
           <div className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">HSA Management Console v1.4</div>
        </div>
      </div>

      {/* Asset Details Modal */}
      <AnimatePresence>
        {isDetailsOpen && selectedPC && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[2rem] w-full max-w-4xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="p-8 pb-4 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-md border border-slate-100 p-3">
                    <Laptop className="w-full h-full text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">{selectedPC.name}</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                       {selectedPC.hostname || selectedPC.model} <span className="text-slate-200">|</span> SN: {selectedPC.serialNumber}
                    </p>
                  </div>
                </div>
                <button onClick={() => setIsDetailsOpen(false)} className="p-3 hover:bg-slate-200 rounded-full transition-colors text-slate-400">
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Tabs Control */}
              <div className="px-8 border-b border-slate-100 flex gap-8">
                {[
                  { id: 'specs', label: 'Железо', icon: Cpu },
                  { id: 'software', label: 'Программы', icon: Database },
                  { id: 'history', label: 'История', icon: History },
                ].map(tab => (
                  <button 
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`py-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] transition-all relative ${
                      activeTab === tab.id ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    <tab.icon className="w-3 h-3" />
                    {tab.label}
                    {activeTab === tab.id && (
                      <motion.div layoutId="tab-active" className="absolute bottom-0 inset-x-0 h-1 bg-blue-600 rounded-t-full" />
                    )}
                  </button>
                ))}
              </div>
              
              <div className="p-8 overflow-auto flex-1 bg-white">
                {activeTab === 'specs' && (
                  <div className="grid grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                     <div className="space-y-6">
                        <section>
                           <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Основные компоненты</h4>
                           <div className="grid grid-cols-1 gap-4">
                              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-4">
                                 <Cpu className="w-8 h-8 text-blue-600 opacity-40" />
                                 <div>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase">Процессор</p>
                                    <p className="text-xs font-bold text-slate-900">{selectedPC.cpu} {selectedPC.cpuCores ? `(${selectedPC.cpuCores} ядер)` : ''}</p>
                                 </div>
                              </div>
                              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-4">
                                 <HardDrive className="w-8 h-8 text-blue-600 opacity-40" />
                                 <div>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase">Накопители / RAM</p>
                                    <p className="text-xs font-bold text-slate-900">{selectedPC.storage || "N/A"} | {selectedPC.ram}</p>
                                 </div>
                              </div>
                              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-4">
                                 <Monitor className="w-8 h-8 text-blue-600 opacity-40" />
                                 <div>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase">Видеокарта</p>
                                    <p className="text-xs font-bold text-slate-900">{selectedPC.gpu || 'Интегрированная'}</p>
                                 </div>
                              </div>
                           </div>
                        </section>
                     </div>
                     <div className="space-y-6">
                        <section>
                           <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Системная плата и ОС</h4>
                           <div className="grid grid-cols-1 gap-4">
                              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                 <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Материнская плата</p>
                                 <p className="text-xs font-bold text-slate-900">{selectedPC.motherboard || 'Не определено'}</p>
                                 <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase italic">{selectedPC.manufacturer}</p>
                              </div>
                              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                 <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">IP-Адрес (Агент)</p>
                                 <p className="text-sm font-mono font-black text-blue-600">{selectedPC.lastIp || 'Нет данных'}</p>
                              </div>
                              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                 <p className="text-[9px] font-bold text-slate-400 uppercase mb-2">Отдел / Группа</p>
                                 <select 
                                   value={selectedPC.groupId || ""}
                                   onChange={(e) => handleUpdatePC(selectedPC.id, { groupId: e.target.value })}
                                   className="w-full bg-white border border-slate-200 rounded-lg p-2 text-[10px] font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20"
                                 >
                                   <option value="">Общий список (Без группы)</option>
                                   {groups.map(g => (
                                     <option key={g.id} value={g.id}>{g.name}</option>
                                   ))}
                                 </select>
                              </div>
                              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                 <p className="text-[9px] font-bold text-slate-400 uppercase mb-2">Операционная система</p>
                                 <p className="text-xs font-bold text-slate-900">{selectedPC.os || 'Windows 10/11'}</p>
                              </div>
                           </div>
                        </section>
                     </div>
                  </div>
                )}

                {activeTab === 'software' && (
                  <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="flex items-center justify-between mb-6">
                       <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Перечень установленного ПО</h4>
                       <span className="text-[10px] font-bold text-blue-600 italic">Найдено: {selectedPC.software?.length || 0} позиций</span>
                    </div>
                    <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-tiny">
                       <table className="w-full text-left">
                          <thead className="bg-slate-50 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                             <tr>
                                <th className="px-6 py-3">Название</th>
                                <th className="px-6 py-3">Версия</th>
                                <th className="px-6 py-3">Издатель</th>
                             </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                             {selectedPC.software && selectedPC.software.length > 0 ? selectedPC.software.map((sw, i) => (
                                <tr key={i} className="hover:bg-slate-50/50">
                                   <td className="px-6 py-3 text-xs font-bold text-slate-800">{sw.name}</td>
                                   <td className="px-6 py-3 text-[10px] font-mono text-slate-500">{sw.version}</td>
                                   <td className="px-6 py-3 text-[10px] font-bold text-slate-400">{sw.publisher || "—"}</td>
                                </tr>
                             )) : (
                                <tr>
                                   <td colSpan={3} className="px-6 py-12 text-center text-[10px] font-bold text-slate-300 uppercase italic">Данные об инвентаризации ПО не поступали</td>
                                </tr>
                             )}
                          </tbody>
                       </table>
                    </div>
                  </div>
                )}

                {activeTab === 'history' && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    {selectedPC.history && selectedPC.history.length > 0 ? (
                      selectedPC.history.map((h, i) => (
                        <div key={i} className="relative pl-8 border-l-2 border-slate-100 last:border-0 pb-8 last:pb-0">
                          <div className="absolute -left-[9px] top-0 w-4 h-4 bg-white border-2 border-amber-500 rounded-full flex items-center justify-center">
                            <div className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                          </div>
                          <div className="flex justify-between items-start mb-2">
                             <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black text-slate-900 uppercase">Изменение: {h.field}</span>
                                {h.author === 'Agent' && <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[8px] font-black rounded uppercase">Auto-Sync</span>}
                             </div>
                             <span className="text-[9px] font-bold text-slate-400">{new Date(h.date).toLocaleString()}</span>
                          </div>
                          <div className="flex items-center gap-4">
                             <div className="flex-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
                                <span className="text-[8px] text-slate-400 line-through truncate">{h.oldValue}</span>
                             </div>
                             <span className="text-slate-300">→</span>
                             <div className="flex-1 bg-blue-50 p-3 rounded-xl border border-blue-100">
                                <span className="text-[10px] font-bold text-blue-900 truncate">{h.newValue}</span>
                             </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-20 text-center space-y-4 text-slate-300">
                         <Info className="w-12 h-12 mx-auto opacity-20" />
                         <p className="text-[10px] font-bold uppercase tracking-widest">История пуста</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                <div className="flex gap-2">
                   <button 
                    onClick={() => setActiveVncPC(selectedPC)}
                    className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20"
                   >
                     <ExternalLink className="w-4 h-4" /> Удаленное управление
                   </button>
                   <button className="flex items-center gap-2 px-6 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all">
                     <Terminal className="w-4 h-4" /> Remote CMD
                   </button>
                   <button 
                    onClick={() => {
                      if (window.confirm("Удалить этот ПК?")) {
                        handleDelete(selectedPC.id);
                        setIsDetailsOpen(false);
                      }
                    }}
                    className="flex items-center gap-2 px-6 py-2.5 bg-rose-50 text-rose-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-all ml-10"
                   >
                     <Trash2 className="w-4 h-4" /> Удалить
                   </button>
                </div>
                <button onClick={() => setIsDetailsOpen(false)} className="px-6 py-2.5 text-slate-400 hover:text-slate-600 text-[10px] font-black uppercase tracking-widest">
                  Закрыть
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activeVncPC && (
          <VNCViewer pc={activeVncPC} onClose={() => setActiveVncPC(null)} />
        )}
      </AnimatePresence>
    </div>
    </div>
  );
}
