
import React from 'react';
import { Role } from '../types';
import { LayoutDashboard, Users, ShoppingBag, Swords, ShieldCheck, Trophy, LogOut, BarChart3, Newspaper } from 'lucide-react';

interface SidebarProps {
  role: Role;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  leagueName: string;
}

const Sidebar: React.FC<SidebarProps> = ({ role, activeTab, setActiveTab, leagueName }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'news', label: 'Noticias', icon: Newspaper }, // Nueva pestaña principal
    { id: 'squad', label: 'Mi Plantilla', icon: Users },
    { id: 'market', label: 'Mercado', icon: ShoppingBag },
    { id: 'matches', label: 'Partidos', icon: Swords },
    { id: 'cup', label: 'Copa', icon: Trophy },
    { id: 'stats', label: 'Estadísticas', icon: BarChart3 },
    { id: 'playoffs', label: 'Final Four', icon: Trophy },
  ];

  if (role === Role.ADMIN) {
    menuItems.push({ id: 'admin', label: 'Administración', icon: ShieldCheck });
  }

  return (
    <nav className="w-20 md:w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-screen sticky top-0">
      <div className="p-6 border-b border-slate-800 flex items-center gap-3">
        <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center font-bold text-xl shadow-lg shadow-indigo-500/20">M</div>
        <span className="hidden md:block font-black text-xl tracking-tighter uppercase">Mansos League</span>
      </div>

      <div className="flex-1 py-6 space-y-2 px-3 overflow-y-auto">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 ${
              activeTab === item.id 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 scale-105' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <item.icon size={22} />
            <span className="hidden md:block font-bold text-sm uppercase tracking-tight">{item.label}</span>
          </button>
        ))}
      </div>

      <div className="p-4 border-t border-slate-800">
        <div className="bg-slate-800/50 p-4 rounded-xl hidden md:block mb-4 border border-slate-700/50">
          <p className="text-[10px] text-slate-500 font-bold uppercase mb-1 tracking-widest">Estado</p>
          <p className="text-sm font-black text-indigo-400 truncate">
            {role === Role.ADMIN ? 'ADMINISTRADOR' : 'MANAGER'}
          </p>
        </div>
        <button 
          onClick={() => { localStorage.removeItem('mansos_session'); window.location.reload(); }}
          className="w-full flex items-center gap-4 px-4 py-3 text-slate-500 hover:text-rose-400 transition-colors font-bold uppercase text-xs"
        >
          <LogOut size={20} />
          <span className="hidden md:block">Salir del Ecosistema</span>
        </button>
      </div>
    </nav>
  );
};

export default Sidebar;
