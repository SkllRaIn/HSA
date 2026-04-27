/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  Monitor, 
  RefreshCw, 
  Settings as SettingsIcon,
  FileText,
  Activity,
  LogOut,
  Users,
  ShieldCheck,
  Lock,
  User as UserIcon,
  Fingerprint
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import React, { useState, useEffect } from "react";
import { Dashboard } from "./components/Dashboard";
import { Inventory } from "./components/Inventory";
import { OneCSync } from "./components/OneCSync";
import { SettingsPage } from "./components/SettingsPage";
import { Reports } from "./components/Reports";
import { AdminUsers } from "./components/AdminUsers";
import { api } from "./lib/api";
import { User } from "./types";

function LoginPage({ onLogin }: { onLogin: (user: User) => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const data = await api.login({ username, password });
      localStorage.setItem("admin_token", data.token);
      localStorage.setItem("admin_user", JSON.stringify(data.user));
      onLogin(data.user);
    } catch (err) {
      setError("Неверное имя пользователя или пароль");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500 rounded-full blur-[120px] animate-pulse" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-10 shadow-2xl relative z-10"
      >
        <div className="flex flex-col items-center mb-10">
          <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-600/40 mb-6 group">
             <ShieldCheck className="w-10 h-10 text-white group-hover:scale-110 transition-transform" />
          </div>
          <h1 className="text-2xl font-black text-white uppercase tracking-tighter">HSA ENGINE V1.4</h1>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em] mt-2">HelperSystemAdmins - Professional Audit</p>
          <p className="text-[8px] font-bold text-slate-600 uppercase tracking-widest mt-1">Dev: Комиссаров Кирилл Александрович</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Security ID</label>
             <div className="relative">
                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input 
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="USERNAME"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:bg-white/10 transition-all placeholder:text-white/20"
                  required
                />
             </div>
          </div>

          <div className="space-y-2">
             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Access Key</label>
             <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="PASSWORD"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:bg-white/10 transition-all placeholder:text-white/20"
                  required
                />
             </div>
          </div>

          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-[10px] font-bold text-center uppercase tracking-widest">
              {error}
            </motion.div>
          )}

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded-2xl py-4 text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-blue-600/20 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
          >
            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : (
              <>
                <Fingerprint className="w-4 h-4" /> AUTHORIZE
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

function Sidebar({ user, onLogout }: { user: User, onLogout: () => void }) {
  const location = useLocation();
  
  const navItems = [
    { path: "/", icon: LayoutDashboard, label: "Обзор" },
    { path: "/inventory", icon: Monitor, label: "Активы" },
    { path: "/reports", icon: FileText, label: "Отчеты" },
    { path: "/sync", icon: RefreshCw, label: "1С Шлюз" },
    { path: "/users", icon: Users, label: "Доступ" },
    { path: "/settings", icon: SettingsIcon, label: "Система" },
  ];

  return (
    <div className="w-64 bg-slate-900 text-slate-300 flex flex-col h-screen border-r border-slate-800 shadow-2xl shrink-0">
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-bold text-white shadow-lg">
             <ShieldCheck className="w-6 h-6" />
          </div>
          <span className="font-black tracking-tighter text-lg text-white">HSA Core</span>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2 mt-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                isActive 
                  ? "bg-white/10 text-white shadow-xl shadow-black/20 border border-white/5" 
                  : "text-slate-500 hover:bg-white/5 hover:text-slate-100"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-blue-400" : "text-slate-600 group-hover:text-slate-400"}`} />
              <span className="font-black text-[10px] uppercase tracking-widest leading-none">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-6 bg-slate-950/50 border-t border-slate-800 space-y-4">
        <div className="flex items-center gap-3 mb-2">
           <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white text-[10px] font-black">
              {user.name.split(' ').map(n => n[0]).join('')}
           </div>
           <div className="overflow-hidden">
              <p className="text-[10px] font-black text-white uppercase truncate">{user.name}</p>
              <p className="text-[8px] font-bold text-slate-500 uppercase">{user.role}</p>
           </div>
        </div>
        <button 
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-2 hover:bg-rose-500/10 text-slate-500 hover:text-rose-500 rounded-xl transition-all group"
        >
          <LogOut className="w-4 h-4" />
          <span className="text-[9px] font-black uppercase tracking-widest">Выход</span>
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem("admin_user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_user");
    setUser(null);
  };

  if (loading) return null;

  if (!user) {
    return <LoginPage onLogin={setUser} />;
  }

  return (
    <Router>
      <div className="flex h-screen bg-slate-100 font-sans text-slate-800 overflow-hidden">
        <Sidebar user={user} onLogout={handleLogout} />
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
          <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 flex-shrink-0 shadow-sm z-10">
            <h1 className="text-sm font-bold text-slate-800 uppercase tracking-[0.2em]">Система Учета Активов</h1>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">1С: Предприятие - Активно</span>
              </div>
            </div>
          </header>
          <main className="flex-1 overflow-auto bg-slate-50/50">
            <AnimatePresence mode="wait">
              <div className="p-8 max-w-7xl mx-auto">
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/inventory" element={<Inventory />} />
                  <Route path="/reports" element={<Reports />} />
                  <Route path="/sync" element={<OneCSync />} />
                  <Route path="/users" element={<AdminUsers />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </Router>
  );
}
