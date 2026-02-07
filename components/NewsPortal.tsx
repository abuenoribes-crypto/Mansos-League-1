
import React, { useState } from 'react';
import { LeagueNews } from '../types';
import { Newspaper, Calendar, Filter, Zap, TrendingUp, DollarSign, Swords } from 'lucide-react';

interface NewsPortalProps {
  news: LeagueNews[];
}

const NewsPortal: React.FC<NewsPortalProps> = ({ news }) => {
  const [filter, setFilter] = useState<LeagueNews['category'] | 'ALL'>('ALL');

  const filteredNews = filter === 'ALL' ? news : news.filter(n => n.category === filter);

  const getCategoryColor = (cat: LeagueNews['category']) => {
    switch (cat) {
      case 'MATCH': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
      case 'MARKET': return 'text-indigo-400 bg-indigo-400/10 border-indigo-400/20';
      case 'ECONOMY': return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
      case 'ADMIN': return 'text-rose-400 bg-rose-400/10 border-rose-400/20';
      default: return 'text-slate-400 bg-slate-400/10 border-slate-400/20';
    }
  };

  const getCategoryIcon = (cat: LeagueNews['category']) => {
    switch (cat) {
      case 'MATCH': return <Swords size={14} />;
      case 'MARKET': return <TrendingUp size={14} />;
      case 'ECONOMY': return <DollarSign size={14} />;
      default: return <Zap size={14} />;
    }
  };

  return (
    <div className="space-y-10 pb-20">
      {/* Header & Filters */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
           <h2 className="text-4xl font-black uppercase tracking-tighter flex items-center gap-4">
             <Newspaper size={36} className="text-indigo-500" /> 
             Mansos Press <span className="text-indigo-500">.</span>
           </h2>
           <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">Crónicas de Ingeniería Deportiva impulsadas por IA</p>
        </div>
        
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
           <button 
             onClick={() => setFilter('ALL')}
             className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${filter === 'ALL' ? 'bg-white text-slate-950' : 'bg-slate-900 text-slate-500 border border-slate-800'}`}
           >
             Todo
           </button>
           {(['MATCH', 'MARKET', 'ECONOMY', 'ADMIN'] as const).map(cat => (
             <button 
               key={cat}
               onClick={() => setFilter(cat)}
               className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${filter === cat ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-500 border border-slate-800'}`}
             >
               {cat === 'MATCH' ? 'Jornada' : cat === 'MARKET' ? 'Fichajes' : cat === 'ECONOMY' ? 'Economía' : 'Admin'}
             </button>
           ))}
        </div>
      </div>

      {/* Featured News (First one) */}
      {filteredNews.length > 0 && filter === 'ALL' && (
        <div className="group relative overflow-hidden rounded-[3rem] bg-slate-900 border border-slate-800 shadow-2xl transition-all hover:border-indigo-500/50">
          <div className="absolute top-0 right-0 p-12 opacity-5">
             <Newspaper size={200} />
          </div>
          <div className="p-10 md:p-16 space-y-6 relative z-10">
            <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-[0.2em] ${getCategoryColor(filteredNews[0].category)}`}>
               {getCategoryIcon(filteredNews[0].category)} {filteredNews[0].category}
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-white leading-[0.9] uppercase tracking-tighter max-w-4xl group-hover:text-indigo-400 transition-colors">
              {filteredNews[0].title}
            </h1>
            <p className="text-lg md:text-xl text-slate-400 leading-relaxed max-w-3xl italic">
              {filteredNews[0].content}
            </p>
            <div className="pt-6 flex items-center gap-4 text-xs font-bold text-slate-500">
               <Calendar size={14} /> {new Date(filteredNews[0].timestamp).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
          </div>
        </div>
      )}

      {/* News Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {(filter === 'ALL' ? filteredNews.slice(1) : filteredNews).map((item) => (
          <article 
            key={item.id} 
            className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 flex flex-col justify-between hover:border-slate-600 transition-all hover:-translate-y-1 shadow-xl"
          >
            <div className="space-y-4">
              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest ${getCategoryColor(item.category)}`}>
                {getCategoryIcon(item.category)} {item.category}
              </div>
              <h3 className="text-xl font-black text-white leading-tight uppercase tracking-tight group-hover:text-indigo-400 transition-colors">
                {item.title}
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed line-clamp-4">
                {item.content}
              </p>
            </div>
            <div className="pt-8 mt-8 border-t border-slate-800/50 flex items-center justify-between text-[10px] font-bold text-slate-600">
               <span>POR IA REPORTER</span>
               <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(item.timestamp).toLocaleDateString()}</span>
            </div>
          </article>
        ))}

        {filteredNews.length === 0 && (
          <div className="col-span-full py-40 text-center opacity-20">
             <Newspaper size={64} className="mx-auto mb-4" />
             <p className="text-xl font-black uppercase tracking-widest">No hay crónicas disponibles en esta categoría</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NewsPortal;
