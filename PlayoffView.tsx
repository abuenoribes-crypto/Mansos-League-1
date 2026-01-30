
import React from 'react';
import { League, Team, Match, LeagueNews } from '../types';
import { Trophy, Swords, ShieldCheck, ChevronRight, AlertCircle } from 'lucide-react';

interface PlayoffViewProps {
  league: League;
  teams: Team[];
  isAdmin: boolean;
  onNews: (context: string, category: LeagueNews['category']) => void;
  setLeague: (l: League) => void;
  setTeams: (t: Team[]) => void;
}

const PlayoffView: React.FC<PlayoffViewProps> = ({ league, teams, isAdmin, onNews, setLeague, setTeams }) => {
  if (!league.playoffs) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-20 text-center space-y-4">
        <Trophy size={64} className="text-slate-800 mx-auto" />
        <h3 className="text-2xl font-black uppercase text-slate-500">Temporada Regular en Curso</h3>
        <p className="text-slate-600 max-w-md mx-auto">La Final Four se activará cuando la administración cierre la liga regular.</p>
      </div>
    );
  }

  const { playoffs } = league;

  const renderMatch = (match: Match) => {
    const home = teams.find(t => t.id === match.homeTeamId);
    const away = teams.find(t => t.id === match.awayTeamId);
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex items-center justify-between gap-4">
        <div className="flex-1 flex items-center gap-2">
          <span className="text-xs font-bold text-slate-400">{home?.name[0] || '?'}</span>
          <p className="font-bold truncate">{home?.name || 'TBD'}</p>
        </div>
        <div className="bg-slate-900 px-3 py-1 rounded-lg font-black text-indigo-400">
          {match.isPlayed ? `${match.homeScore} - ${match.awayScore}` : 'VS'}
        </div>
        <div className="flex-1 flex items-center gap-2 justify-end">
          <p className="font-bold truncate">{away?.name || 'TBD'}</p>
          <span className="text-xs font-bold text-slate-400">{away?.name[0] || '?'}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-12">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Quarter Finals / Playoff Preliminary */}
        <div className="space-y-6">
          <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest border-b border-slate-800 pb-2">Playoff (3º-6º)</h3>
          <div className="space-y-4">
            {playoffs.quarterFinals.map(m => renderMatch(m))}
          </div>
        </div>

        {/* Semi Finals */}
        <div className="space-y-6">
          <h3 className="text-xs font-black text-indigo-500 uppercase tracking-widest border-b border-indigo-500/30 pb-2 flex items-center gap-2">
             Final Four: Semifinales
          </h3>
          <div className="space-y-4 opacity-50">
            {playoffs.semiFinals.length > 0 ? (
               playoffs.semiFinals.map(m => renderMatch(m))
            ) : (
              <div className="p-8 border border-dashed border-slate-800 rounded-xl text-center text-xs text-slate-600 font-bold uppercase italic">
                Esperando resultados de Playoff...
              </div>
            )}
          </div>
        </div>

        {/* Final */}
        <div className="space-y-6">
          <h3 className="text-xs font-black text-amber-500 uppercase tracking-widest border-b border-amber-500/30 pb-2 flex items-center gap-2">
            <Trophy size={14} /> La Gran Final
          </h3>
          <div className="space-y-4 opacity-30">
            {playoffs.final.length > 0 ? (
               playoffs.final.map(m => renderMatch(m))
            ) : (
              <div className="p-8 border border-dashed border-slate-800 rounded-xl text-center text-xs text-slate-600 font-bold uppercase italic">
                 Gloria Reservada
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Rewards Reminder */}
      <div className="bg-gradient-to-r from-amber-500/10 to-transparent border-l-4 border-amber-500 p-6 rounded-r-2xl">
         <h4 className="font-bold text-amber-500 uppercase text-xs mb-2">Bolsa de Premios Final Four</h4>
         <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div><p className="text-[10px] text-slate-500 font-bold">CAMPEÓN</p><p className="font-black text-white">+25M y 20€</p></div>
            <div><p className="text-[10px] text-slate-500 font-bold">FINALISTA</p><p className="font-black text-white">+20M y 10€</p></div>
            <div><p className="text-[10px] text-slate-500 font-bold">ACCESO F4</p><p className="font-black text-white">+15M</p></div>
         </div>
      </div>
    </div>
  );
};

export default PlayoffView;
