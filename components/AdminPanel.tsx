
import React, { useState, useEffect } from 'react';
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
  setCupMatches: (m: Match[]) => void;
  onNews: (context: string, category: LeagueNews['category']) => void;
  onExpel: (teamId: string) => void;
  onStartPlayoffs: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ league, setLeague, teams, players, setPlayers, matches, setMatches, setCupMatches, onNews, onExpel, onStartPlayoffs }) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [leagueName, setLeagueName] = useState(league.name);
  const [finalFourDirect, setFinalFourDirect] = useState<number[]>(league.finalFourConfig?.direct || []);
  const [finalFourPlayoffs, setFinalFourPlayoffs] = useState<number[]>(league.finalFourConfig?.playoffs || []);
  const [configError, setConfigError] = useState<string>('');

  const configLocked = league.finalFourConfig?.locked || league.isStarted;

  const handleUpdateName = () => {
    setLeague({ ...league, name: leagueName });
    setIsEditingName(false);
    onNews(`IDENTIDAD: La liga ha sido renombrada a "${leagueName}".`, "ADMIN");
  };

  const getRoundName = (size: number) => {
    if (size <= 2) return 'Final';
    if (size <= 4) return 'Semifinales';
    if (size <= 8) return 'Cuartos';
    if (size <= 16) return 'Octavos';
    return 'Ronda Previa';
  };

  const shuffle = <T,>(list: T[]) => [...list].sort(() => Math.random() - 0.5);

  const generateCupSchedule = () => {
    const teamIds = shuffle(teams.map(t => t.id));
    const totalTeams = teamIds.length;
    if (totalTeams < 2) return [];

    let basePower = 1;
    while (basePower * 2 <= totalTeams) basePower *= 2;
    const isPowerOfTwo = basePower === totalTeams;
    const nextPower = isPowerOfTwo ? totalTeams : basePower * 2;
    const roundName = getRoundName(nextPower);

    const matches: Match[] = [];
    let matchIdCounter = 1;
    const initialMatchesCount = isPowerOfTwo ? totalTeams / 2 : totalTeams - basePower;
    const teamsInInitial = initialMatchesCount * 2;
    const initialTeams = teamIds.slice(0, teamsInInitial);
    const byes = teamIds.slice(teamsInInitial);

    for (let i = 0; i < initialTeams.length; i += 2) {
      const homeTeamId = initialTeams[i];
      const awayTeamId = initialTeams[i + 1];
      const tieId = `CUP-TIE-${matchIdCounter}`;
      matches.push({
        id: `CUP-${matchIdCounter++}-1`,
        homeTeamId,
        awayTeamId,
        homeScore: 0,
        awayScore: 0,
        isPlayed: false,
        round: 1,
        events: [],
        competition: 'CUP',
        leg: 1,
        tieId,
        cupRoundName: roundName
      });
      matches.push({
        id: `CUP-${matchIdCounter++}-2`,
        homeTeamId: awayTeamId,
        awayTeamId: homeTeamId,
        homeScore: 0,
        awayScore: 0,
        isPlayed: false,
        round: 2,
        events: [],
        competition: 'CUP',
        leg: 2,
        tieId,
        cupRoundName: roundName
      });
    }

    byes.forEach((teamId, index) => {
      matches.push({
        id: `CUP-BYE-${index + 1}`,
        homeTeamId: teamId,
        awayTeamId: 'BYE',
        homeScore: 3,
        awayScore: 0,
        isPlayed: true,
        round: 1,
        events: [],
        competition: 'CUP',
        cupRoundName: roundName,
        isBye: true
      });
    });

    return matches;
  };

  const validateFinalFourConfig = (direct = finalFourDirect, playoffs = finalFourPlayoffs) => {
    const totalTeams = teams.length;
    const invalidPosition = [...direct, ...playoffs].some(pos => pos < 1 || pos > totalTeams);
    if (invalidPosition) return "Las posiciones deben estar dentro del número de equipos.";

    const overlap = direct.filter(pos => playoffs.includes(pos));
    if (overlap.length > 0) return "Las posiciones de Final Four y Playoffs no pueden solaparse.";

    const remainingSpots = 4 - direct.length;
    if (remainingSpots < 0) return "No puedes clasificar directamente a más de 4 equipos.";
    if (remainingSpots === 0 && playoffs.length > 0) return "Si ya hay 4 clasificados directos, no debe haber Playoffs.";
    if (remainingSpots > 0 && playoffs.length < remainingSpots * 2) return "No hay suficientes equipos en Playoffs para cubrir las plazas restantes.";
    if (remainingSpots > 0 && playoffs.length % 2 !== 0) return "Los Playoffs deben tener un número par de equipos.";

    return "";
  };

  useEffect(() => {
    const error = validateFinalFourConfig();
    setConfigError(error);
  }, [finalFourDirect, finalFourPlayoffs, teams.length]);

  const handleTogglePosition = (pos: number, list: 'direct' | 'playoffs') => {
    if (configLocked) return;
    if (list === 'direct') {
      const next = finalFourDirect.includes(pos) ? finalFourDirect.filter(p => p !== pos) : [...finalFourDirect, pos];
      setFinalFourDirect(next);
      const error = validateFinalFourConfig(next, finalFourPlayoffs);
      setConfigError(error);
      setLeague({ ...league, finalFourConfig: { direct: next, playoffs: finalFourPlayoffs, locked: false } });
      return;
    }
    const next = finalFourPlayoffs.includes(pos) ? finalFourPlayoffs.filter(p => p !== pos) : [...finalFourPlayoffs, pos];
    setFinalFourPlayoffs(next);
    const error = validateFinalFourConfig(finalFourDirect, next);
    setConfigError(error);
    setLeague({ ...league, finalFourConfig: { direct: finalFourDirect, playoffs: next, locked: false } });
  };

  const generateSchedule = () => {
    if (teams.length < 2) return;
    
    let tempTeams = [...teams];
    if (tempTeams.length % 2 !== 0) {
      alert("Se requiere un número par de equipos para un calendario perfecto.");
      return;
    }

    const validationMessage = validateFinalFourConfig();
    if (validationMessage) {
      setConfigError(validationMessage);
      alert(validationMessage);
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
          events: [],
          competition: 'LEAGUE'
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
        round: m.round + roundsPerVuelta,
        competition: 'LEAGUE'
      }));
      finalSchedule = [...firstVueltaMatches, ...secondVueltaMatches];
    }

    const cupSchedule = generateCupSchedule();
    setMatches(finalSchedule);
    setCupMatches(cupSchedule);
    setLeague({ ...league, isStarted: true, startDate: Date.now(), currentRound: 1, finalFourConfig: { direct: finalFourDirect, playoffs: finalFourPlayoffs, locked: true } });
    onNews(`CALENDARIO OFICIAL: Generadas ${league.legs === 2 ? roundsPerVuelta * 2 : roundsPerVuelta} jornadas (${league.legs} Vuelta/s). ¡Que ruede el balón!`, "ADMIN");
    onNews(`COPA ACTIVADA: Cuadro generado con ${teams.length} equipos y emparejamientos al azar.`, "ADMIN");
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

      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-8 space-y-6">
        <div className="flex items-center gap-3">
          <Trophy className="text-amber-400" />
          <h2 className="text-xl font-bold">Configuración Final Four & Playoffs</h2>
        </div>
        <p className="text-xs text-slate-500">Define las posiciones exactas antes de iniciar la liga. Esta configuración quedará bloqueada al empezar.</p>
        {configError && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs font-bold uppercase tracking-widest">
            {configError}
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Clasificados Directos</h3>
            <div className="flex flex-wrap gap-2">
              {teams.map((_, idx) => (
                <button
                  key={`direct-${idx + 1}`}
                  onClick={() => handleTogglePosition(idx + 1, 'direct')}
                  disabled={configLocked}
                  className={`px-3 py-2 rounded-xl text-xs font-black uppercase tracking-widest border transition-all ${
                    finalFourDirect.includes(idx + 1) ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400' : 'bg-slate-800 border-slate-700 text-slate-500'
                  } ${configLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {idx + 1}º
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Playoffs</h3>
            <div className="flex flex-wrap gap-2">
              {teams.map((_, idx) => (
                <button
                  key={`playoffs-${idx + 1}`}
                  onClick={() => handleTogglePosition(idx + 1, 'playoffs')}
                  disabled={configLocked}
                  className={`px-3 py-2 rounded-xl text-xs font-black uppercase tracking-widest border transition-all ${
                    finalFourPlayoffs.includes(idx + 1) ? 'bg-indigo-500/10 border-indigo-500/40 text-indigo-400' : 'bg-slate-800 border-slate-700 text-slate-500'
                  } ${configLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {idx + 1}º
                </button>
              ))}
            </div>
          </div>
        </div>
        {configLocked && (
          <div className="text-xs font-bold uppercase tracking-widest text-slate-500">Configuración bloqueada tras iniciar la liga.</div>
        )}
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
                disabled={unreadyTeams.length > 0 || teams.length < 2 || !!configError} 
                className={`w-full flex items-center justify-center gap-3 py-4 rounded-xl font-bold transition-all ${unreadyTeams.length > 0 || !!configError ? 'bg-slate-800 text-slate-500' : 'bg-indigo-600 text-white shadow-xl shadow-indigo-500/20 hover:scale-[1.02]'}`}
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
