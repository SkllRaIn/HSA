import { 
  UserPlus, 
  Trash2, 
  Shield, 
  User as UserIcon,
  X,
  Plus
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import React, { useEffect, useState } from "react";
import { api } from "../lib/api";
import { User } from "../types";

export function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    name: "",
    role: "admin" as const
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const data = await api.getUsers();
      setUsers(data);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.createUser(formData);
    setIsAddOpen(false);
    setFormData({ username: "", password: "", name: "", role: "admin" });
    loadUsers();
  };

  const handleDelete = async (id: string, username: string) => {
    if (username === 'admin') return alert("Нельзя удалить системного администратора!");
    if (window.confirm("Удалить пользователя из системы?")) {
      await api.deleteUser(id);
      loadUsers();
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Управление доступом</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Список администраторов системы мониторинга</p>
        </div>
        <button 
          onClick={() => setIsAddOpen(true)}
          className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-black/10 hover:bg-blue-600 transition-all active:scale-95"
        >
          <UserPlus className="w-4 h-4" /> Добавить админа
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {users.map((user) => (
          <motion.div 
            layout
            key={user.id}
            className="bg-white border border-slate-200 p-6 rounded-2xl flex items-center justify-between group hover:border-blue-600/20 transition-all shadow-sm"
          >
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 ${user.role === 'superadmin' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'} rounded-xl flex items-center justify-center border border-slate-100 shadow-tiny group-hover:scale-110 transition-transform`}>
                <Shield className="w-6 h-6" />
              </div>
              <div>
                 <div className="text-sm font-black text-slate-900">{user.name}</div>
                 <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{user.username} • {user.role.toUpperCase()}</div>
              </div>
            </div>
            {user.username !== 'admin' && (
              <button 
                onClick={() => handleDelete(user.id, user.username)}
                className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {isAddOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
             <motion.div 
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 0.9 }}
               className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-200 overflow-hidden"
             >
                <form onSubmit={handleAdd}>
                  <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <h3 className="text-lg font-black text-slate-900 uppercase tracking-tighter">Новый администратор</h3>
                    <button type="button" onClick={() => setIsAddOpen(false)} className="p-2 hover:bg-slate-200 rounded-full text-slate-400">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <div className="p-8 space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Имя Фамилия</label>
                      <input 
                        required
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Логин</label>
                      <input 
                        required
                        type="text"
                        value={formData.username}
                        onChange={(e) => setFormData({...formData, username: e.target.value})}
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Пароль</label>
                      <input 
                        required
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Роль</label>
                      <select 
                        value={formData.role}
                        onChange={(e) => setFormData({...formData, role: e.target.value as any})}
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 appearance-none bg-white"
                      >
                        <option value="admin">Администратор</option>
                        <option value="viewer">Наблюдатель</option>
                        <option value="superadmin">Супервайзер</option>
                      </select>
                    </div>
                  </div>

                  <div className="p-6 bg-slate-50 border-t border-slate-100">
                    <button type="submit" className="w-full py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg active:scale-[0.98]">
                      Создать аккаунт
                    </button>
                  </div>
                </form>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
