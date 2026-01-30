
import React, { useState } from 'react';
import { League, Team, Player, Match, LeagueNews } from '../types';
import { RULES } from '../constants';
import { ShieldAlert, Play, Settings, Trash2, Edit3, Save, CheckCircle2, Trophy, Users, FastForward } from 'lucide-react';

interface AdminPanelProps {
  league: League;
  setLeague: (l: League) => void;
  teams: Team[];
  players: Player[];
  setPlayers: (p: Player[]) => void;
  matches: Match[];
  setMatches: (m: Match[]) => void;
  onNews: (context: string, category: LeagueNews['category']) => void;
  onExpel: (teamId: string) => void;
  onStartPlayoffs: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ league, setLeague, teams, players, setPlayers, matches, setMatches, onNews, onExpel, onStartPlayoffs }) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [leagueName, setLeagueName] = useState(league.name);

  const handleUpdateName = () => {
    setLeague({ ...league, name: leagueName });
    setIsEditingName(false);
    onNews(`IDENTIDAD: La liga ha sido renombrada a "${leagueName}".`, "ADMIN");
  };

  const generateSchedule = () => {
    if (teams.length < 2) return;
    
    let tempTeams = [...teams];
    if (tempTeams.length % 2 !== 0) {
      alert("Se requiere un número par de equipos para un calendario perfecto.");
      return;
    }

    const numTeams = tempTeams.length;
    const roundsPerVuelta = numTeams - 1;
    const matchesPerRound = numTeams / 2;
    const firstVueltaMatches: Match[] = [];
    let matchIdCounter = 1;

    // Generar Primera Vuelta (Algoritmo Round Robin)
    for (let r = 0; r < roundsPerVuelta; r++) {
      for (let m = 0; m < matchesPerRound; m++) {
        const home = tempTeams[m];
        const away = tempTeams[numTeams - 1 - m];
        firstVueltaMatches.push({
          id: `M${matchIdCounter++}`,
          homeTeamId: home.id,
          awayTeamId: away.id,
          homeScore: 0,
          awayScore: 0,
          isPlayed: false,
          round: r + 1,
          events: []
        });
      }
      tempTeams.splice(1, 0, tempTeams.pop()!);
    }

    let finalSchedule = firstVueltaMatches;

    // Generar Segunda Vuelta si aplica
    if (league.legs === 2) {
      const secondVueltaMatches = firstVueltaMatches.map(m => ({
        ...m,
        id: `M${matchIdCounter++}`,
        homeTeamId: m.awayTeamId,
        awayTeamId: m.homeTeamId,
        round: m.round + roundsPerVuelta
      }));
      finalSchedule = [...firstVueltaMatches, ...secondVueltaMatches];
    }

    setMatches(finalSchedule);
    setLeague({ ...league, isStarted: true, startDate: Date.now(), currentRound: 1 });
    onNews(`CALENDARIO OFICIAL: Generadas ${league.legs === 2 ? roundsPerVuelta * 2 : roundsPerVuelta} jornadas (${league.legs} Vuelta/s). ¡Que ruede el balón!`, "ADMIN");
  };

  const advanceWeekend = () => {
    const nextRound = league.currentRound + 2;
    const maxRound = league.legs === 2 ? (teams.length - 1) * 2 : (teams.length - 1);
    
    if (nextRound > maxRound) {
       alert("No hay más jornadas regulares. Inicia los Playoffs.");
       return;
    }
    
    setLeague({ ...league, currentRound: nextRound });
    onNews(`AVANCE TEMPORAL: El ecosistema entra en el fin de semana de las Jornadas ${nextRound} y ${nextRound + 1}.`, "ADMIN");
  };

  const checkTeamReadiness = () => {
    const unready = teams.filter(t => {
      const pCount = players.filter(p => p.teamId === t.id).length;
      const gkCount = players.filter(p => p.teamId === t.id && p.position === 'GK').length;
      return pCount < 22 || gkCount < 2;
    });
    return unready;
  };

  const unreadyTeams = checkTeamReadiness();

  return (
    <div className="space-y-8 pb-12">
      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3"><Settings className="text-indigo-400" /><h2 className="text-xl font-bold">Configuración de Liga</h2></div>
          <span className="text-xs font-bold text-slate-500 bg-slate-800 px-3 py-1 rounded-full uppercase">Panel de Control</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <label className="text-xs font-bold text-slate-500 uppercase">Nombre de la Competición</label>
            <div className="flex gap-2">
              <input type="text" value={leagueName} onChange={(e) => setLeagueName(e.target.value)} disabled={!isEditingName} className={`flex-1 bg-slate-800 border ${isEditingName ? 'border-indigo-500 shadow-lg shadow-indigo-500/10' : 'border-slate-700'} rounded-xl py-3 px-5 transition-all outline-none`} />
              {isEditingName ? <button onClick={handleUpdateName} className="bg-emerald-600 hover:bg-emerald-500 text-white p-3 rounded-xl"><Save size={20}/></button> : <button onClick={() => setIsEditingName(true)} className="bg-slate-800 hover:bg-slate-700 text-white p-3 rounded-xl border border-slate-700"><Edit3 size={20}/></button>}
            </div>
          </div>
          <div className="space-y-4">
            <label className="text-xs font-bold text-slate-500 uppercase">Vueltas Configuradas</label>
            <div className="bg-slate-800 border border-slate-700 rounded-xl py-3 px-5 text-white font-black uppercase text-center">{league.legs} Vuelta/s</div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-8 space-y-6">
          <div className="flex items-center gap-3"><Play className="text-emerald-400" /><h2 className="text-xl font-bold">Estado de la Temporada</h2></div>
          
          {unreadyTeams.length > 0 && !league.isStarted && (
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-amber-500 font-bold text-xs uppercase"><ShieldAlert size={14} /> Auditoría de Plantillas Necesaria</div>
              <p className="text-[10px] text-slate-400">Los siguientes equipos no cumplen el 21+1 o el mínimo de 2 porteros:</p>
              <ul className="text-[10px] text-rose-400 font-bold">
                {unreadyTeams.map(t => <li key={t.id}>• {t.name}</li>)}
              </ul>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4">
            {!league.isStarted ? (
              <button 
                onClick={generateSchedule} 
                disabled={unreadyTeams.length > 0 || teams.length < 2} 
                className={`w-full flex items-center justify-center gap-3 py-4 rounded-xl font-bold transition-all ${unreadyTeams.length > 0 ? 'bg-slate-800 text-slate-500' : 'bg-indigo-600 text-white shadow-xl shadow-indigo-500/20 hover:scale-[1.02]'}`}
              >
                <CheckCircle2 size={20}/> Generar Calendario Oficial
              </button>
            ) : (
              <button 
                onClick={advanceWeekend} 
                className="w-full flex items-center justify-center gap-3 py-4 rounded-xl font-bold bg-sky-600 text-white shadow-lg shadow-sky-500/20 hover:bg-sky-500 transition-all"
              >
                <FastForward size={20}/> Siguiente Fin de Semana (+2 Jornadas)
              </button>
            )}
            
            <button 
              onClick={() => { if(confirm("¿Confirmas el inicio de los Playoffs? La liga regular se cerrará definitivamente.")) onStartPlayoffs(); }} 
              disabled={!league.isStarted || !!league.playoffs} 
              className={`w-full flex items-center justify-center gap-3 py-4 rounded-xl font-bold transition-all ${!league.isStarted || !!league.playoffs ? 'bg-slate-800 text-slate-500' : 'bg-amber-600 text-white shadow-lg shadow-amber-500/20'}`}
            >
              <Trophy size={20}/> Iniciar Fase Final (Playoffs)
            </button>
          </div>
        </section>

        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-8 space-y-6">
          <div className="flex items-center gap-3"><Users className="text-indigo-400" /><h2 className="text-xl font-bold">Gestión de Franquicias ({teams.length}/8)</h2></div>
          <div className="space-y-3 max-h-60 overflow-y-auto pr-2 scrollbar-hide">
            {teams.map(t => (
              <div key={t.id} className="flex items-center justify-between p-4 bg-slate-800/50 border border-slate-800 rounded-xl group hover:border-slate-600 transition-all">
                <div><p className="font-bold text-white text-sm uppercase">{t.name}</p><p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">{t.managerName}</p></div>
                <button onClick={() => onExpel(t.id)} className="p-2 text-slate-600 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={18}/></button>
              </div>
            ))}
            {teams.length === 0 && <p className="text-center py-8 text-xs text-slate-600 font-bold uppercase italic">No hay equipos registrados</p>}
          </div>
        </section>
      </div>
    </div>
  );
};

export default AdminPanel;
