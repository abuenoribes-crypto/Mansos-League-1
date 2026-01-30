
import React, { useState, useRef, useEffect } from 'react';
import { Match, Team, LeagueNews, Player, MatchEvent, MatchReport } from '../types';
import { RULES } from '../constants';
import { Swords, Plus, Check, X, User, ShieldAlert, AlertCircle, Save, Camera, Upload, RefreshCw, Eye, UserCheck, Users } from 'lucide-react';
import { scanMatchPhoto } from '../services/geminiService';

interface MatchCenterProps {
  matches: Match[];
  teams: Team[];
  setMatches: (matches: Match[]) => void;
  setTeams: (teams: Team[]) => void;
  players: Player[];
  setPlayers: (players: Player[]) => void;
  isAdmin: boolean;
  userTeamId?: string;
  onNews: (context: string, category: LeagueNews['category']) => void;
}

const MatchCenter: React.FC<MatchCenterProps> = ({ matches, teams, setMatches, setTeams, players, setPlayers, isAdmin, userTeamId, onNews }) => {
  const [activeRound, setActiveRound] = useState(1);
  const [registeringMatch, setRegisteringMatch] = useState<Match | null>(null);
  const [reportStep, setReportStep] = useState(1);
  const [isScanning, setIsScanning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  const [homeEvents, setHomeEvents] = useState<MatchEvent[]>([]);
  const [awayEvents, setAwayEvents] = useState<MatchEvent[]>([]);
  
  const [homeStarters, setHomeStarters] = useState<string[]>([]);
  const [homeSubs, setHomeSubs] = useState<string[]>([]);
  const [awayStarters, setAwayStarters] = useState<string[]>([]);
  const [awaySubs, setAwaySubs] = useState<string[]>([]);

  const rounds = Array.from({ length: Math.max(...matches.map(m => m.round), 1) }, (_, i) => i + 1);
  const weekendBlocks = [];
  for (let i = 0; i < rounds.length; i += 2) {
    weekendBlocks.push([rounds[i], rounds[i+1]].filter(Boolean));
  }

  const startRegistration = (match: Match) => {
    if (match.isSanctionResult) return;
    setRegisteringMatch(match);
    setReportStep(1);
    setHomeScore(0);
    setAwayScore(0);
    setHomeEvents([]);
    setAwayEvents([]);
    setHomeStarters([]);
    setHomeSubs([]);
    setAwayStarters([]);
    setAwaySubs([]);
  };

  const addEvent = (teamId: string, type: MatchEvent['type'], playerId: string) => {
    const newEvent: MatchEvent = { type, playerId, teamId };
    if (teamId === registeringMatch?.homeTeamId) {
      setHomeEvents([...homeEvents, newEvent]);
    } else {
      setAwayEvents([...awayEvents, newEvent]);
    }
  };

  const togglePlayerStatus = (playerId: string, teamId: string, status: 'STARTER' | 'SUB' | 'NONE') => {
    if (teamId === registeringMatch?.homeTeamId) {
      setHomeStarters(prev => prev.filter(id => id !== playerId));
      setHomeSubs(prev => prev.filter(id => id !== playerId));
      if (status === 'STARTER') setHomeStarters(prev => [...prev, playerId]);
      else if (status === 'SUB') setHomeSubs(prev => [...prev, playerId]);
    } else {
      setAwayStarters(prev => prev.filter(id => id !== playerId));
      setAwaySubs(prev => prev.filter(id => id !== playerId));
      if (status === 'STARTER') setAwayStarters(prev => [...prev, playerId]);
      else if (status === 'SUB') setAwaySubs(prev => [...prev, playerId]);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !registeringMatch) return;

    setIsScanning(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      try {
        const data = await scanMatchPhoto(base64);
        setHomeScore(data.homeScore || 0);
        setAwayScore(data.awayScore || 0);
        const teamPlayers = players.filter(p => p.teamId === registeringMatch.homeTeamId || p.teamId === registeringMatch.awayTeamId);
        const assignList = (names: string[], teamId: string, status: 'STARTER' | 'SUB') => {
           names.forEach(name => {
              const match = teamPlayers.find(p => p.teamId === teamId && p.name.toLowerCase().includes(name.toLowerCase()));
              if (match) togglePlayerStatus(match.id, teamId, status);
           });
        };
        if (data.homeStarters) assignList(data.homeStarters, registeringMatch.homeTeamId, 'STARTER');
        if (data.homeSubs) assignList(data.homeSubs, registeringMatch.homeTeamId, 'SUB');
        if (data.awayStarters) assignList(data.awayStarters, registeringMatch.awayTeamId, 'STARTER');
        if (data.awaySubs) assignList(data.awaySubs, registeringMatch.awayTeamId, 'SUB');
        data.events.forEach((ev: any) => {
          const match = teamPlayers.find(p => p.name.toLowerCase().includes(ev.playerName.toLowerCase()));
          if (match) addEvent(match.teamId!, ev.type, match.id);
        });
      } catch (err) {
        alert("Escaneo fallido. Procede manualmente.");
      } finally {
        setIsScanning(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFinalizeReport = () => {
    if (!registeringMatch) return;
    const report: MatchReport = {
      reportedBy: userTeamId || 'ADMIN',
      homeScore,
      awayScore,
      events: [...homeEvents, ...awayEvents],
      homeStarters,
      homeSubs,
      awayStarters,
      awaySubs
    };
    if (isAdmin) executeMatchImpact(registeringMatch, report);
    else {
      setMatches(matches.map(m => m.id === registeringMatch.id ? { ...m, pendingReport: report } : m));
      onNews(`ACTA SUBIDA: Pendiente de confirmación rival en J${registeringMatch.round}.`, 'MATCH');
    }
    setRegisteringMatch(null);
  };

  const confirmReport = (match: Match) => {
    if (!match.pendingReport) return;
    executeMatchImpact(match, match.pendingReport);
  };

  const executeMatchImpact = (match: Match, report: MatchReport) => {
    let finalHomeScore = report.homeScore;
    let finalAwayScore = report.awayScore;
    let homeLossByDefault = false;
    let awayLossByDefault = false;

    // Verificar sanciones en convocatorias
    const homeSquad = [...report.homeStarters, ...report.homeSubs];
    const awaySquad = [...report.awayStarters, ...report.awaySubs];

    homeSquad.forEach(pid => {
      const p = players.find(player => player.id === pid);
      if (p && (p.cards > 0 || p.injuries > 0)) homeLossByDefault = true;
    });
    awaySquad.forEach(pid => {
      const p = players.find(player => player.id === pid);
      if (p && (p.cards > 0 || p.injuries > 0)) awayLossByDefault = true;
    });

    if (homeLossByDefault && awayLossByDefault) { finalHomeScore = 0; finalAwayScore = 0; }
    else if (homeLossByDefault) { finalHomeScore = 0; finalAwayScore = 3; }
    else if (awayLossByDefault) { finalHomeScore = 3; finalAwayScore = 0; }

    const updatedMatches = matches.map(m => m.id === match.id ? { ...m, homeScore: finalHomeScore, awayScore: finalAwayScore, isPlayed: true, events: report.events, pendingReport: undefined } : m);

    // Actualizar Jugadores: Goles, Asistencias y REGLA 3 AMARILLAS
    const updatedPlayers = players.map(p => {
      const isHome = p.teamId === match.homeTeamId;
      const isAway = p.teamId === match.awayTeamId;
      if (!isHome && !isAway) return p;

      const pEvents = report.events.filter(e => e.playerId === p.id);
      const pGoals = pEvents.filter(e => e.type === 'GOAL').length;
      const pAssists = pEvents.filter(e => e.type === 'ASSIST').length;
      const pYellows = pEvents.filter(e => e.type === 'YELLOW_CARD').length;
      const pRed = pEvents.filter(e => e.type === 'RED_CARD').length > 0;
      const pInjured = pEvents.filter(e => e.type === 'INJURY').length > 0;

      const oldYellows = p.yellowCards;
      const newYellows = oldYellows + pYellows;

      // Reducción de sanción (siempre 1 por acta jugada)
      let newCards = p.cards > 0 ? p.cards - 1 : 0;
      let newInjuries = p.injuries > 0 ? p.injuries - 1 : 0;

      // Aplicar nueva sanción por ciclo de 3 amarillas
      if (Math.floor(newYellows / 3) > Math.floor(oldYellows / 3)) {
        newCards += 1;
      }
      if (pRed) newCards += 1;
      if (pInjured) newInjuries += 2;

      return { ...p, goals: p.goals + pGoals, assists: p.assists + pAssists, yellowCards: newYellows, redCards: p.redCards + (pRed ? 1 : 0), cards: newCards, injuries: newInjuries };
    });

    // Actualizar Clasificación
    const updatedTeams = teams.map(t => {
      if (t.id === match.homeTeamId) {
        const win = finalHomeScore > finalAwayScore;
        const draw = finalHomeScore === finalAwayScore;
        return { ...t, played: t.played + 1, won: t.won + (win ? 1 : 0), drawn: t.drawn + (draw ? 1 : 0), lost: t.lost + (finalHomeScore < finalAwayScore ? 1 : 0), points: t.points + (win ? 3 : draw ? 1 : 0), gf: t.gf + finalHomeScore, ga: t.ga + finalAwayScore };
      }
      if (t.id === match.awayTeamId) {
        const win = finalAwayScore > finalHomeScore;
        const draw = finalAwayScore === finalHomeScore;
        return { ...t, played: t.played + 1, won: t.won + (win ? 1 : 0), drawn: t.drawn + (draw ? 1 : 0), lost: t.lost + (finalAwayScore < finalHomeScore ? 1 : 0), points: t.points + (win ? 3 : draw ? 1 : 0), gf: t.gf + finalAwayScore, ga: t.ga + finalHomeScore };
      }
      return t;
    });

    setMatches(updatedMatches);
    setPlayers(updatedPlayers);
    setTeams(updatedTeams);
    onNews(`RESULTADO OFICIAL: ${finalHomeScore}-${finalAwayScore} en la Jornada ${match.round}.`, 'MATCH');
  };

  const getStatus = (pid: string, tid: string) => {
    if (tid === registeringMatch?.homeTeamId) {
      if (homeStarters.includes(pid)) return 'STARTER';
      if (homeSubs.includes(pid)) return 'SUB';
    } else {
      if (awayStarters.includes(pid)) return 'STARTER';
      if (awaySubs.includes(pid)) return 'SUB';
    }
    return 'NONE';
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex items-center gap-4 overflow-x-auto pb-4 scrollbar-hide">
        {weekendBlocks.map((block, idx) => (
          <button key={idx} onClick={() => setActiveRound(block[0])} className={`px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all border ${block.includes(activeRound) ? 'bg-indigo-600 text-white border-indigo-500 shadow-xl' : 'bg-slate-900 text-slate-500 border-slate-800'}`}>
            Finde {idx + 1} (J{block.join('-')})
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {matches.filter(m => {
          const start = activeRound % 2 === 0 ? activeRound - 1 : activeRound;
          return m.round === start || m.round === start + 1;
        }).map(match => (
          <div key={match.id} className={`bg-slate-900 border ${match.isSanctionResult ? 'border-rose-500/50' : 'border-slate-800'} rounded-[2.5rem] p-10 relative overflow-hidden group hover:border-indigo-500/30 transition-all`}>
             <div className="absolute top-4 left-4 text-[9px] font-black uppercase text-slate-600">Jornada {match.round}</div>
             <div className="flex items-center justify-between gap-6">
                <div className="text-center space-y-3 flex-1">
                   <div className="w-16 h-16 bg-slate-800 rounded-2xl mx-auto flex items-center justify-center border border-slate-700 overflow-hidden">
                      {teams.find(t => t.id === match.homeTeamId)?.logo ? <img src={teams.find(t => t.id === match.homeTeamId)?.logo} className="w-full h-full object-cover" /> : <Users className="text-slate-600" />}
                   </div>
                   <h4 className="font-black text-xs truncate uppercase">{teams.find(t => t.id === match.homeTeamId)?.name}</h4>
                </div>
                <div className="flex flex-col items-center gap-4">
                   <span className="text-4xl font-black tracking-tighter">{match.isPlayed ? `${match.homeScore}:${match.awayScore}` : 'VS'}</span>
                   {((isAdmin || userTeamId === match.homeTeamId || userTeamId === match.awayTeamId) && !match.isPlayed && !match.pendingReport) && (
                     <button onClick={() => startRegistration(match)} className="bg-indigo-600 text-[10px] font-black uppercase px-4 py-2 rounded-xl">Reportar</button>
                   )}
                   {match.pendingReport && match.pendingReport.reportedBy !== userTeamId && (
                     <button onClick={() => confirmReport(match)} className="bg-emerald-600 text-[10px] font-black uppercase px-4 py-2 rounded-xl">Validar Acta</button>
                   )}
                </div>
                <div className="text-center space-y-3 flex-1">
                   <div className="w-16 h-16 bg-slate-800 rounded-2xl mx-auto flex items-center justify-center border border-slate-700 overflow-hidden">
                      {teams.find(t => t.id === match.awayTeamId)?.logo ? <img src={teams.find(t => t.id === match.awayTeamId)?.logo} className="w-full h-full object-cover" /> : <Users className="text-slate-600" />}
                   </div>
                   <h4 className="font-black text-xs truncate uppercase">{teams.find(t => t.id === match.awayTeamId)?.name}</h4>
                </div>
             </div>
          </div>
        ))}
      </div>

      {registeringMatch && (
        <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-4xl rounded-[3rem] p-10 shadow-2xl space-y-8 max-h-[90vh] overflow-y-auto scrollbar-hide">
             <div className="flex justify-between items-center">
               <h3 className="text-2xl font-black uppercase">Reporte Oficial J{registeringMatch.round}</h3>
               <button onClick={() => setRegisteringMatch(null)} className="text-slate-500 hover:text-white"><X size={24} /></button>
             </div>
             
             {reportStep === 1 ? (
               <div className="space-y-8">
                 <div className="flex items-center justify-center gap-12 text-center">
                    <div className="flex-1 space-y-4">
                      <p className="font-black text-xs uppercase text-slate-500">{teams.find(t => t.id === registeringMatch.homeTeamId)?.name}</p>
                      <input type="number" className="w-24 h-24 bg-slate-800 text-5xl font-black text-center rounded-3xl" value={homeScore} onChange={e => setHomeScore(parseInt(e.target.value)||0)} />
                    </div>
                    <div className="text-2xl font-black opacity-20">V</div>
                    <div className="flex-1 space-y-4">
                      <p className="font-black text-xs uppercase text-slate-500">{teams.find(t => t.id === registeringMatch.awayTeamId)?.name}</p>
                      <input type="number" className="w-24 h-24 bg-slate-800 text-5xl font-black text-center rounded-3xl" value={awayScore} onChange={e => setAwayScore(parseInt(e.target.value)||0)} />
                    </div>
                 </div>
                 
                 <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Alineación Local</p>
                      <div className="space-y-2 max-h-60 overflow-y-auto pr-2 scrollbar-hide">
                        {players.filter(p => p.teamId === registeringMatch.homeTeamId).map(p => (
                          <div key={p.id} className="flex items-center justify-between bg-slate-800/50 p-3 rounded-xl">
                            <span className="text-[10px] font-bold uppercase">{p.name}</span>
                            <div className="flex gap-1">
                              <button onClick={() => togglePlayerStatus(p.id, registeringMatch.homeTeamId, getStatus(p.id, registeringMatch.homeTeamId) === 'STARTER' ? 'NONE' : 'STARTER')} className={`w-7 h-7 rounded text-[9px] font-black ${getStatus(p.id, registeringMatch.homeTeamId) === 'STARTER' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-700'}`}>T</button>
                              <button onClick={() => togglePlayerStatus(p.id, registeringMatch.homeTeamId, getStatus(p.id, registeringMatch.homeTeamId) === 'SUB' ? 'NONE' : 'SUB')} className={`w-7 h-7 rounded text-[9px] font-black ${getStatus(p.id, registeringMatch.homeTeamId) === 'SUB' ? 'bg-sky-500 text-slate-950' : 'bg-slate-700'}`}>S</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-4">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Alineación Visitante</p>
                      <div className="space-y-2 max-h-60 overflow-y-auto pr-2 scrollbar-hide">
                        {players.filter(p => p.teamId === registeringMatch.awayTeamId).map(p => (
                          <div key={p.id} className="flex items-center justify-between bg-slate-800/50 p-3 rounded-xl">
                            <span className="text-[10px] font-bold uppercase">{p.name}</span>
                            <div className="flex gap-1">
                              <button onClick={() => togglePlayerStatus(p.id, registeringMatch.awayTeamId, getStatus(p.id, registeringMatch.awayTeamId) === 'STARTER' ? 'NONE' : 'STARTER')} className={`w-7 h-7 rounded text-[9px] font-black ${getStatus(p.id, registeringMatch.awayTeamId) === 'STARTER' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-700'}`}>T</button>
                              <button onClick={() => togglePlayerStatus(p.id, registeringMatch.awayTeamId, getStatus(p.id, registeringMatch.awayTeamId) === 'SUB' ? 'NONE' : 'SUB')} className={`w-7 h-7 rounded text-[9px] font-black ${getStatus(p.id, registeringMatch.awayTeamId) === 'SUB' ? 'bg-sky-500 text-slate-950' : 'bg-slate-700'}`}>S</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                 </div>
                 <button onClick={() => setReportStep(2)} className="w-full bg-indigo-600 font-black py-4 rounded-2xl uppercase text-xs tracking-widest shadow-xl">Continuar a Eventos</button>
               </div>
             ) : (
               <div className="space-y-8">
                  <div className="grid grid-cols-2 gap-8">
                     <div className="space-y-4">
                        <p className="text-[10px] font-black text-emerald-400 uppercase">Eventos Local</p>
                        {[...homeStarters, ...homeSubs].map(pid => (
                          <div key={pid} className="flex items-center justify-between bg-slate-800/50 p-2 rounded-xl">
                            <span className="text-[10px] font-bold">{players.find(p => p.id === pid)?.name}</span>
                            <div className="flex gap-1">
                               <button onClick={() => addEvent(registeringMatch.homeTeamId, 'GOAL', pid)} className="w-7 h-7 bg-emerald-500 text-slate-950 rounded font-black text-[9px]">G</button>
                               <button onClick={() => addEvent(registeringMatch.homeTeamId, 'ASSIST', pid)} className="w-7 h-7 bg-sky-500 text-slate-950 rounded font-black text-[9px]">A</button>
                               <button onClick={() => addEvent(registeringMatch.homeTeamId, 'YELLOW_CARD', pid)} className="w-7 h-7 bg-amber-500 text-slate-950 rounded font-black text-[9px]">Y</button>
                               <button onClick={() => addEvent(registeringMatch.homeTeamId, 'RED_CARD', pid)} className="w-7 h-7 bg-rose-500 text-white rounded font-black text-[9px]">R</button>
                            </div>
                          </div>
                        ))}
                     </div>
                     <div className="space-y-4">
                        <p className="text-[10px] font-black text-sky-400 uppercase">Eventos Visitante</p>
                        {[...awayStarters, ...awaySubs].map(pid => (
                          <div key={pid} className="flex items-center justify-between bg-slate-800/50 p-2 rounded-xl">
                            <span className="text-[10px] font-bold">{players.find(p => p.id === pid)?.name}</span>
                            <div className="flex gap-1">
                               <button onClick={() => addEvent(registeringMatch.awayTeamId, 'GOAL', pid)} className="w-7 h-7 bg-emerald-500 text-slate-950 rounded font-black text-[9px]">G</button>
                               <button onClick={() => addEvent(registeringMatch.awayTeamId, 'ASSIST', pid)} className="w-7 h-7 bg-sky-500 text-slate-950 rounded font-black text-[9px]">A</button>
                               <button onClick={() => addEvent(registeringMatch.awayTeamId, 'YELLOW_CARD', pid)} className="w-7 h-7 bg-amber-500 text-slate-950 rounded font-black text-[9px]">Y</button>
                               <button onClick={() => addEvent(registeringMatch.awayTeamId, 'RED_CARD', pid)} className="w-7 h-7 bg-rose-500 text-white rounded font-black text-[9px]">R</button>
                            </div>
                          </div>
                        ))}
                     </div>
                  </div>
                  <button onClick={handleFinalizeReport} className="w-full bg-indigo-600 font-black py-4 rounded-2xl uppercase text-xs shadow-xl">Firmar Acta Final</button>
               </div>
             )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MatchCenter;
