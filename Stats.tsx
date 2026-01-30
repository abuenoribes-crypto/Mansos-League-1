
import React, { useState } from 'react';
import { Player, Team } from '../types';
import { Trophy, Goal, Handshake, AlertTriangle, ShieldAlert, ChevronRight, BarChart3, Users, Shield } from 'lucide-react';

interface StatsProps {
  players: Player[];
  teams: Team[];
}

const Stats: React.FC<StatsProps> = ({ players, teams }) => {
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'by-team'>('leaderboard');
  const [activeStat, setActiveStat] = useState<'goals' | 'assists' | 'yellows' | 'reds'>('goals');
  const [selectedTeamId, setSelectedTeamId] = useState<string>(teams[0]?.id || '');

  const getTeamName = (teamId?: string) => teams.find(t => t.id === teamId)?.name || 'Sin equipo';

  const sortedPlayers = [...players].sort((a, b) => {
    if (activeStat === 'goals') return b.goals - a.goals;
    if (activeStat === 'assists') return b.assists - a.assists;
    if (activeStat === 'yellows') return b.yellowCards - a.yellowCards;
    return b.redCards - a.redCards;
  }).slice(0, 10);

  const statConfig = {
    goals: { label: 'Máximos Goleadores', icon: Goal, color: 'text-emerald-400', field: 'goals' },
    assists: { label: 'Máximos Asistentes', icon: Handshake, color: 'text-sky-400', field: 'assists' },
    yellows: { label: 'Tarjetas Amarillas', icon: AlertTriangle, color: 'text-amber-400', field: 'yellowCards' },
    reds: { label: 'Tarjetas Rojas', icon: ShieldAlert, color: 'text-rose-400', field: 'redCards' },
  };

  const selectedTeam = teams.find(t => t.id === selectedTeamId);
  const teamPlayers = players.filter(p => p.teamId === selectedTeamId).sort((a, b) => b.goals - a.goals || b.assists - a.assists);

  return (
    <div className="space-y-8 pb-12">
      {/* Tab Switcher */}
      <div className="flex p-1.5 bg-slate-900 border border-slate-800 rounded-2xl w-fit">
        <button onClick={() => setActiveTab('leaderboard')} className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'leaderboard' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-500 hover:text-white'}`}>Líderes Liga</button>
        <button onClick={() => setActiveTab('by-team')} className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'by-team' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-500 hover:text-white'}`}>Por Equipos</button>
      </div>

      {activeTab === 'leaderboard' ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(Object.keys(statConfig) as Array<keyof typeof statConfig>).map((key) => {
              const Config = statConfig[key];
              return (
                <button
                  key={key}
                  onClick={() => setActiveStat(key)}
                  className={`p-6 rounded-3xl border transition-all text-left flex flex-col gap-3 group ${
                    activeStat === key 
                    ? 'bg-indigo-600 border-indigo-500 shadow-xl shadow-indigo-500/20 text-white' 
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <Config.icon size={24} className={activeStat === key ? 'text-white' : Config.color} />
                  <div className="flex items-center justify-between w-full">
                    <span className="font-black uppercase text-[10px] tracking-widest">{Config.label}</span>
                    {activeStat === key && <ChevronRight size={14} className="animate-pulse" />}
                  </div>
                </button>
              );
            })}
          </div>

          <section className="bg-slate-900 border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
            <div className="p-8 border-b border-slate-800 flex items-center justify-between bg-slate-800/20">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${activeStat === 'goals' ? 'bg-emerald-500/10' : activeStat === 'assists' ? 'bg-sky-500/10' : activeStat === 'yellows' ? 'bg-amber-500/10' : 'bg-rose-500/10'}`}>
                    {React.createElement(statConfig[activeStat].icon, { className: statConfig[activeStat].color, size: 24 })}
                </div>
                <div><h2 className="text-2xl font-black uppercase tracking-tighter">{statConfig[activeStat].label}</h2><p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Top 10 de la Mansos</p></div>
              </div>
              <Trophy className="text-slate-800" size={32} />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-950/50 text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                  <tr><th className="px-8 py-5 w-24">Pos</th><th className="px-8 py-5">Jugador</th><th className="px-8 py-5">Club</th><th className="px-8 py-5 text-right">Total</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {sortedPlayers.map((player, idx) => (
                    <tr key={player.id} className="group hover:bg-slate-800/30 transition-all cursor-default">
                      <td className="px-8 py-6"><div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm ${idx === 0 ? 'bg-amber-500 text-slate-950 shadow-lg' : idx === 1 ? 'bg-slate-300 text-slate-950' : idx === 2 ? 'bg-amber-700 text-white' : 'bg-slate-800/50 text-slate-500'}`}>{idx + 1}</div></td>
                      <td className="px-8 py-6"><div><p className="font-black text-white group-hover:text-indigo-400 transition-colors uppercase tracking-tight">{player.name}</p><span className="text-[10px] font-bold text-slate-500 bg-slate-800 px-2 py-0.5 rounded uppercase">{player.position}</span></div></td>
                      <td className="px-8 py-6"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center border border-slate-700 overflow-hidden">{teams.find(t => t.id === player.teamId)?.logo ? <img src={teams.find(t => t.id === player.teamId)?.logo} className="w-full h-full object-cover" /> : <span className="text-[10px] font-bold">{getTeamName(player.teamId)[0]}</span>}</div><p className="text-slate-400 font-bold text-sm tracking-tight">{getTeamName(player.teamId)}</p></div></td>
                      <td className="px-8 py-6 text-right"><span className={`text-3xl font-black ${statConfig[activeStat].color}`}>{(player as any)[statConfig[activeStat].field]}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Team Selector List */}
          <div className="lg:col-span-1 space-y-3">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-4">Seleccionar Club</h3>
            {teams.map(team => (
              <button 
                key={team.id} 
                onClick={() => setSelectedTeamId(team.id)}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all ${selectedTeamId === team.id ? 'bg-indigo-600/10 border-indigo-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'}`}
              >
                <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center overflow-hidden border border-slate-700">
                  {team.logo ? <img src={team.logo} className="w-full h-full object-cover" /> : <Shield size={18} />}
                </div>
                <div className="text-left"><p className="font-bold text-sm uppercase">{team.name}</p><p className="text-[10px] font-bold opacity-40 uppercase tracking-widest">{team.managerName}</p></div>
              </button>
            ))}
          </div>

          {/* Team Detail Stats */}
          <div className="lg:col-span-3">
            {selectedTeam && (
              <section className="bg-slate-900 border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl animate-in fade-in duration-300">
                <div className="p-10 border-b border-slate-800 bg-slate-800/20 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-center gap-6">
                     <div className="w-20 h-20 bg-slate-800 rounded-3xl flex items-center justify-center overflow-hidden border border-slate-700 shadow-xl">
                        {selectedTeam.logo ? <img src={selectedTeam.logo} className="w-full h-full object-cover" /> : <Users size={40} className="text-slate-600" />}
                     </div>
                     <div>
                       <h2 className="text-3xl font-black text-white uppercase tracking-tighter leading-none">{selectedTeam.name}</h2>
                       <p className="text-indigo-400 font-bold text-xs uppercase tracking-[0.2em] mt-2">Manager: {selectedTeam.managerName}</p>
                     </div>
                  </div>
                  <div className="flex gap-4">
                     <div className="text-center px-6 py-3 bg-slate-950 rounded-2xl border border-slate-800">
                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Puntos</p>
                        <p className="text-xl font-black text-white">{selectedTeam.points}</p>
                     </div>
                     <div className="text-center px-6 py-3 bg-slate-950 rounded-2xl border border-slate-800">
                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">DG</p>
                        <p className="text-xl font-black text-emerald-400">{selectedTeam.gf - selectedTeam.ga}</p>
                     </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-950/50 text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                      <tr><th className="px-8 py-5">Jugador</th><th className="px-8 py-5 text-center">Pos</th><th className="px-8 py-5 text-right"><div className="flex items-center justify-end gap-2"><Goal size={12}/> Goles</div></th><th className="px-8 py-5 text-right"><div className="flex items-center justify-end gap-2"><Handshake size={12}/> Asist</div></th><th className="px-8 py-5 text-right">Tarjetas</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {teamPlayers.map(p => (
                        <tr key={p.id} className="hover:bg-slate-800/30 transition-all group">
                          <td className="px-8 py-6"><div className="flex items-center gap-2">{p.isCaptain && <Shield size={12} className="text-indigo-400" />}<span className="font-bold text-white uppercase">{p.name}</span></div></td>
                          <td className="px-8 py-6 text-center"><span className="text-[10px] font-bold text-slate-500 bg-slate-800 px-2 py-1 rounded">{p.position}</span></td>
                          <td className="px-8 py-6 text-right font-black text-emerald-400 text-xl">{p.goals}</td>
                          <td className="px-8 py-6 text-right font-black text-sky-400 text-xl">{p.assists}</td>
                          <td className="px-8 py-6 text-right">
                             <div className="flex items-center justify-end gap-3 font-bold text-[10px]">
                                <span className="text-amber-400">Y: {p.yellowCards}</span>
                                <span className="text-rose-500">R: {p.redCards}</span>
                             </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Stats;
