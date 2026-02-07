
import React from 'react';
import { AppNotification } from '../types';
import { X, Bell, Zap, TrendingUp, DollarSign, AlertCircle, Clock } from 'lucide-react';

interface NotificationPanelProps {
  notifications: AppNotification[];
  onClose: () => void;
  onMarkRead: (id: string) => void;
}

const NotificationPanel: React.FC<NotificationPanelProps> = ({ notifications, onClose, onMarkRead }) => {
  const getIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'CLAUSULAZO': return <Zap className="text-rose-500" />;
      case 'OFFER': return <DollarSign className="text-emerald-400" />;
      case 'REVALUATION': return <TrendingUp className="text-indigo-400" />;
      case 'MARKET_INFO': return <Clock className="text-sky-400" />;
      case 'FINANCE': return <AlertCircle className="text-rose-400" />;
      default: return <Bell />;
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl animate-in slide-in-from-right-full duration-300">
        <div className="p-8 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-4">
             <Bell className="text-indigo-500" size={24} />
             <h2 className="text-xl font-black uppercase tracking-tighter">Centro de Avisos</h2>
          </div>
          <button onClick={onClose} className="p-2 text-slate-500 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
          {notifications.length === 0 ? (
            <div className="text-center py-20 opacity-20 flex flex-col items-center gap-4">
               <Bell size={48} />
               <p className="text-xs font-black uppercase tracking-widest">Bandeja Vacía</p>
            </div>
          ) : (
            notifications.map((n) => (
              <div 
                key={n.id} 
                className={`p-6 rounded-3xl border transition-all ${n.isRead ? 'bg-slate-800/30 border-slate-800 opacity-60' : 'bg-slate-800 border-slate-700 shadow-lg'}`}
                onClick={() => onMarkRead(n.id)}
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center border border-slate-700">
                    {getIcon(n.type)}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between items-center">
                      <h4 className="font-black text-sm uppercase tracking-tight text-white">{n.title}</h4>
                      <span className="text-[9px] font-bold text-slate-500">
                        {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">{n.message}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        
        <div className="p-6 border-t border-slate-800 bg-slate-950/50">
           <p className="text-[10px] text-slate-600 font-bold uppercase text-center tracking-widest">
             Notificaciones push automáticas del ecosistema
           </p>
        </div>
      </div>
    </div>
  );
};

export default NotificationPanel;
