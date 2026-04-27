import React, { useEffect, useRef, useState } from "react";
// @ts-ignore
import RFB from "@novnc/novnc/lib/rfb";
import { motion } from "motion/react";
import { 
  X, 
  Monitor, 
  Terminal, 
  Keyboard, 
  MousePointer2, 
  ShieldAlert,
  ShieldCheck,
  Settings,
  RefreshCw,
  Maximize2,
  Info,
  ExternalLink
} from "lucide-react";

interface VNCViewerProps {
  pc: any;
  onClose: () => void;
}

export function VNCViewer({ pc, onClose }: VNCViewerProps) {
  const ip = pc.lastIp?.split(",")[0].trim();
  const [status, setStatus] = useState<"connecting" | "available" | "unavailable">("connecting");

  useEffect(() => {
    async function checkVncStatus() {
      try {
        const res = await fetch(`/api/computers/${pc.id}/vnc-check`);
        const data = await res.json();
        setStatus(data.active ? "available" : "unavailable");
      } catch (err) {
        setStatus("unavailable");
      }
    }

    if (ip) {
      checkVncStatus();
    }
  }, [pc.id, ip]);

  const handleLaunchVNC = () => {
    window.location.href = `vnc://${ip}`;
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-200 overflow-hidden"
      >
        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm border border-slate-100 text-blue-600">
              <Monitor className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-tighter">Удаленный доступ</h3>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{pc.name} ({ip})</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-8 space-y-6">
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${status === 'available' ? 'bg-emerald-500 animate-pulse' : status === 'connecting' ? 'bg-amber-500 animate-pulse' : 'bg-rose-500'}`} />
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                {status === 'connecting' ? 'Проверка порта 5900...' : status === 'available' ? 'VNC Сервер доступен' : 'VNC Сервер не отвечает'}
              </span>
            </div>
            {status === 'available' && <ShieldCheck className="w-4 h-4 text-emerald-500" />}
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
              <p className="text-[10px] font-bold text-blue-800 uppercase tracking-widest mb-2 flex items-center gap-2">
                <Info className="w-3.5 h-3.5" /> Совет по подключению
              </p>
              <p className="text-[11px] font-medium text-blue-700 leading-relaxed">
                Используйте локальный клиент <span className="font-bold">TightVNC Viewer</span> или <span className="font-bold">UltraVNC</span>. 
                Нажмите кнопку ниже для автоматического запуска приложения.
              </p>
            </div>

            <button 
              onClick={handleLaunchVNC}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all shadow-xl shadow-blue-600/20 active:scale-[0.98] flex items-center justify-center gap-3"
            >
              <ExternalLink className="w-4 h-4" /> Запустить TightVNC
            </button>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between text-[9px] font-bold text-slate-400 uppercase tracking-widest">
              <span>Protocol: RFB 3.8</span>
              <span>Port: 5900</span>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
