
import React, { useState, useEffect } from 'react';
import { League, Team, LeagueNews, Match, Player } from '../types';
import { Newspaper, Trophy, TrendingUp, AlertTriangle, Clock, CheckCircle2, ShoppingBag } from 'lucide-react';

interface DashboardProps {
  league: League;
  teams: Team[];
  matches: Match[];
  players: Player[];
  news: LeagueNews[];
  currentTeamId?: string;
}

const Dashboard: React.FC<DashboardProps> = ({ league, teams, matches, players, news, currentTeamId }) => {
  const [marketStatus, setMarketStatus] = useState<{ label: string, time: string, isOpen: boolean, statusColor: string }>({ label: '', time: '', isOpen: false, statusColor: '' });
  const [financeCountdown, setFinanceCountdown] = useState<{ time: string, isUrgent: boolean }>({ time: '', isUrgent: false });

  const currentTeam = teams.find(t => t.id === currentTeamId);
  const isInDebt = currentTeam && currentTeam.budget < 0;

  const sortTeams = (teamList: Team[]) => {
    return [...teamList].sort((a, b) => {
      // 1. Puntos
      if (b.points !== a.points) return b.points - a.points;

      // 2. Head-to-Head (H2H) - Enfrentamientos particulares
      const tiedIds = teamList.filter(t => t.points === a.points).map(t => t.id);
      if (tiedIds.length >= 2) {
        const h2hMatches = matches.filter(m => m.isPlayed && tiedIds.includes(m.homeTeamId) && tiedIds.includes(m.awayTeamId));
        if (h2hMatches.length > 0) {
          const getH2HPts = (tid: string) => {
            let p = 0;
            h2hMatches.forEach(m => {
              if (m.homeTeamId === tid && m.homeScore > m.awayScore) p += 3;
              else if (m.awayTeamId === tid && m.awayScore > m.homeScore) p += 3;
              else if ((m.homeTeamId === tid || m.awayTeamId === tid) && m.homeScore === m.awayScore) p += 1;
            });
            return p;
          };
          const h2hA = getH2HPts(a.id);
          const h2hB = getH2HPts(b.id);
          if (h2hB !== h2hA) return h2hB - h2hA;
        }
      }

      // 3. Diferencia de Goles General
      const gdA = a.gf - a.ga;
      const gdB = b.gf - b.ga;
      if (gdB !== gdA) return gdB - gdA;

      // 4. Goles a Favor General
      if (b.gf !== a.gf) return b.gf - a.gf;

      return 0;
    });
  };

  const sortedTeams = sortTeams(teams);

  useEffect(() => {
    const timer = setInterval(() => {
      if (!league.startDate) {
        setMarketStatus({ label: 'LIGA NO INICIADA', time: 'ESPERANDO ADMIN', isOpen: false, statusColor: 'text-slate-500' });
        return;
      }

      const now = new Date();
      const start = new Date(league.startDate);
      const msPerWeek = 7 * 24 * 60 * 60 * 1000;
      const msSinceStart = now.getTime() - start.getTime();
      const currentWeekIndex = Math.floor(msSinceStart / msPerWeek);
      
      // Ciclo de 3 semanas: Semanas 0 y 1 juego, Semana 2 mercado (modulo 3 === 2)
      const isMarketWeek = (currentWeekIndex % 3 === 2);
      
      // Cálculo de apertura: Lunes 18:00 de la semana de mercado
      const weekStart = new Date(start.getTime() + (currentWeekIndex * msPerWeek));
      // Ajuste a Lunes 18:00
      const monday18 = new Date(weekStart);
      const day = monday18.getDay();
      const diff = day === 0 ? 1 : 1 - day;
      monday18.setDate(monday18.getDate() + diff);
      monday18.setHours(18, 0, 0, 0);

      const friday00 = new Date(monday18);
      friday00.setDate(monday18.getDate() + 4);
      friday00.setHours(0, 0, 0, 0);

      const isOpen = isMarketWeek && now >= monday18 && now < friday00;

      if (isOpen) {
        setMarketStatus({
          label: 'MERCADO ABIERTO',
          isOpen: true,
          time: `CIERRA EN ${formatTime(friday00.getTime() - now.getTime())}`,
          statusColor: 'text-emerald-400'
        });
      } else {
        // Encontrar el próximo lunes de mercado
        let nextMarketMonday = new Date(monday18);
        if (now >= friday00 || !isMarketWeek) {
          const weeksToWait = isMarketWeek ? 3 : (2 - (currentWeekIndex % 3) + 3) % 3;
          nextMarketMonday = new Date(monday18.getTime() + (weeksToWait || 3) * msPerWeek);
        }
        setMarketStatus({
          label: 'MERCADO CERRADO',
          isOpen: false,
          time: `ABRE EN ${formatTime(nextMarketMonday.getTime() - now.getTime())}`,
          statusColor: 'text-rose-500'
        });
      }

      // Cuenta atrás para Crisis Financiera (Cada Viernes 00:00)
      let nextFriday = new Date(now);
      nextFriday.setDate(now.getDate() + ((5 - now.getDay() + 7) % 7));
      nextFriday.setHours(0, 0, 0, 0);
      if (now >= nextFriday) nextFriday.setDate(nextFriday.getDate() + 7);
      const finDiff = nextFriday.getTime() - now.getTime();
      setFinanceCountdown({ time: formatTime(finDiff), isUrgent: finDiff < (24 * 60 * 60 * 1000) });

    }, 1000);
    return () => clearInterval(timer);
  }, [league.startDate]);

  const formatTime = (ms: number) => {
    if (ms < 0) return "00:00:00";
    const days = Math.floor(ms / (24 * 60 * 60 * 1000));
    const hours = Math.floor((ms % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    const mins = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
    const secs = Math.floor((ms % (60 * 1000)) / 1000);
    return days > 0 ? `${days}D ${hours}H ${mins}M` : `${hours}H ${mins}M ${secs}S`;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-6">
        <section className="bg-slate-900 border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
          <div className="p-8 border-b border-slate-800 flex items-center justify-between bg-slate-800/20">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500 shadow-inner"><Trophy size={24} /></div>
              <div><h2 className="text-2xl font-black uppercase tracking-tighter">Clasificación de Ingeniería</h2><p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Criterio: Puntos &gt; H2H &gt; GD &gt; GF</p></div>
            </div>
            <span className="text-xs font-black text-indigo-400 bg-indigo-400/10 border border-indigo-400/20 px-4 py-1.5 rounded-full uppercase tracking-widest">JORNADA {league.currentRound} & {league.currentRound + 1}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-950/50 text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                <tr><th className="px-8 py-5 w-16">#</th><th className="px-8 py-5">Equipo</th><th className="px-6 py-5 text-center">PJ</th><th className="px-4 py-5 text-center">G</th><th className="px-4 py-5 text-center">E</th><th className="px-4 py-5 text-center">P</th><th className="px-4 py-5 text-center">DG</th><th className="px-8 py-5 text-right">PTS</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {sortedTeams.map((team, idx) => (
                  <tr key={team.id} className="hover:bg-slate-800/30 transition-all group">
                    <td className="px-8 py-5"><span className={`text-sm font-black ${idx < 2 ? 'text-emerald-400' : idx > 5 ? 'text-rose-500' : 'text-slate-500'}`}>{idx + 1}</span></td>
                    <td className="px-8 py-5"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center border border-slate-700 overflow-hidden font-black text-xs">{team.logo ? <img src={team.logo} className="w-full h-full object-cover" /> : team.name[0]}</div><div><p className="font-black text-white uppercase text-sm tracking-tight truncate max-w-[100px]">{team.name}</p><p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">{team.managerName}</p></div></div></td>
                    <td className="px-6 py-5 text-center text-slate-400 font-bold font-mono">{team.played}</td><td className="px-4 py-5 text-center text-emerald-400 font-bold font-mono">{team.won}</td><td className="px-4 py-5 text-center text-slate-500 font-bold font-mono">{team.drawn}</td><td className="px-4 py-5 text-center text-rose-500 font-bold font-mono">{team.lost}</td><td className="px-4 py-5 text-center font-bold font-mono text-slate-500">{team.gf - team.ga}</td><td className="px-8 py-5 text-right font-black text-xl text-white tracking-tighter font-mono">{team.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <div className={`grid grid-cols-1 ${isInDebt ? 'md:grid-cols-2' : ''} gap-8`}>
          <div className={`group relative overflow-hidden p-8 rounded-[2rem] border transition-all ${marketStatus.isOpen ? 'bg-emerald-500/10 border-emerald-500/30 shadow-emerald-500/10 shadow-2xl' : 'bg-slate-900 border-slate-800'}`}>
            <div className="flex items-center gap-4 mb-6">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 ${marketStatus.isOpen ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-500'}`}>
                <ShoppingBag size={28} />
              </div>
              <div>
                <h3 className={`font-black uppercase tracking-tighter text-xl ${marketStatus.statusColor}`}>{marketStatus.label}</h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Ciclo de 3 Semanas</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="text-white font-black text-2xl tracking-tighter tabular-nums flex items-center gap-3">
                <Clock size={20} className="text-slate-600" /> {marketStatus.time}
              </div>
            </div>
          </div>
          
          {isInDebt && (
            <div className={`group relative overflow-hidden p-8 rounded-[2rem] border transition-all ${financeCountdown.isUrgent ? 'bg-rose-500/10 border-rose-500/30 shadow-rose-500/10 shadow-2xl animate-pulse' : 'bg-slate-900 border-slate-800'}`}>
              <div className="flex items-center gap-4 mb-6">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 ${financeCountdown.isUrgent ? 'bg-rose-600 text-white' : 'bg-rose-500/20 text-rose-400'}`}><AlertTriangle size={28} /></div>
                <div><h3 className="font-black uppercase tracking-tighter text-xl text-white">Riesgo x10</h3><p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Saneamiento Obligatorio</p></div>
              </div>
              <div className="space-y-4">
                <div className={`text-2xl font-black tracking-tighter tabular-nums ${financeCountdown.isUrgent ? 'text-rose-500' : 'text-white'}`}>
                  {financeCountdown.time}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-6">
        <section className="bg-slate-900 border border-slate-800 rounded-[3rem] h-full flex flex-col shadow-2xl overflow-hidden">
          <div className="p-8 border-b border-slate-800 flex items-center gap-4 bg-slate-800/20"><div className="w-10 h-10 bg-sky-500/10 rounded-xl flex items-center justify-center text-sky-400"><Newspaper size={20} /></div><h2 className="text-xl font-black uppercase tracking-tighter">Mansos News</h2></div>
          <div className="flex-1 overflow-y-auto p-8 space-y-8 max-h-[750px] scrollbar-hide">
            {news.length === 0 ? <div className="text-center py-20 opacity-20"><Newspaper size={48} className="mx-auto mb-4" /><p className="text-xs font-black uppercase tracking-widest">Sin crónicas recientes</p></div> : 
              news.map((item) => (
                <article key={item.id} className="group relative pl-8 border-l-2 border-slate-800 hover:border-indigo-500 transition-all">
                  <div className="absolute -left-[9px] top-0 w-4 h-4 bg-slate-900 rounded-full border-2 border-slate-800 group-hover:border-indigo-500 transition-all" />
                  <div className="space-y-3"><p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">{item.category} <span className="text-slate-700 mx-2">|</span> {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p><h3 className="text-lg font-black text-white leading-tight uppercase tracking-tight group-hover:text-indigo-400 transition-colors">{item.title}</h3><p className="text-slate-500 text-sm leading-relaxed line-clamp-3 group-hover:text-slate-400 transition-colors">{item.content}</p></div>
                </article>
              ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
