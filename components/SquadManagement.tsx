
import React, { useRef, useState, useEffect } from 'react';
import { Team, Player, League } from '../types';
import { RULES } from '../constants';
import { Shield, Info, AlertCircle, CheckCircle2, Upload, Camera, Save, Edit3, RefreshCw, Users } from 'lucide-react';

interface SquadProps {
  team: Team;
  allPlayers: Player[];
  setPlayers: (players: Player[]) => void;
  teams: Team[];
  setTeams: (teams: Team[]) => void;
  league: League;
}

const SquadManagement: React.FC<SquadProps> = ({ team, allPlayers, setPlayers, teams, setTeams, league }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isAdjustmentMode, setIsAdjustmentMode] = useState(false);
  const [editingClauses, setEditingClauses] = useState<Record<string, number>>({});

  const teamPlayers = allPlayers.filter(p => team.players.includes(p.id));
  const captain = teamPlayers.find(p => p.isCaptain);
  const regularPlayers = teamPlayers.filter(p => !p.isCaptain);

  useEffect(() => {
    if (!league.startDate) {
      setIsAdjustmentMode(false);
      return;
    }
    const now = new Date();
    const start = new Date(league.startDate!);
    const diffMs = now.getTime() - start.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    const diffWeeks = Math.floor(diffDays / 7);
    const isMarketWeek = diffWeeks >= 2 && (diffWeeks - 2) % 3 === 0;
    const dayOfWeek = now.getDay(); 
    const hour = now.getHours();

    // Reajuste: Viernes 00:01 a Sábado 00:00
    const inAdjustmentWindow = isMarketWeek && dayOfWeek === 5 && hour > 0;
    setIsAdjustmentMode(inAdjustmentWindow);

    if (inAdjustmentWindow) {
      const initial: Record<string, number> = {};
      regularPlayers.forEach(p => initial[p.id] = p.clause);
      setEditingClauses(initial);
    }
  }, [league.startDate, team.players]);

  const currentTotalClause = regularPlayers.reduce((sum, p) => 
    sum + (isAdjustmentMode ? (editingClauses[p.id] ?? p.clause) : p.clause), 0
  );

  const teamCap = team.maxClauseCap || 1000;
  
  // El CAP es válido si es exactamente el teamCap
  const isCapValid = currentTotalClause <= teamCap; 
  const isAdjustmentValid = currentTotalClause === teamCap;

  const handleSaveClauses = () => {
    if (currentTotalClause !== teamCap) {
      alert(`Debes ajustar tus cláusulas para que sumen exactamente ${teamCap}M.`);
      return;
    }

    const updatedPlayers = allPlayers.map(p => {
      if (editingClauses[p.id] !== undefined) {
        return { ...p, clause: editingClauses[p.id] };
      }
      return p;
    });

    const updatedTeams = teams.map(t => t.id === team.id ? { ...t, clausesConfirmed: true } : t);

    setPlayers(updatedPlayers);
    setTeams(updatedTeams);
    alert("Reajuste completado con éxito.");
  };

  const getPlayerStatus = (player: Player) => {
    if (player.injuries > 0) return { label: 'LESIONADO', color: 'text-rose-400 bg-rose-400/10' };
    if (player.cards > 0) return { label: 'SANCIONADO', color: 'text-amber-400 bg-amber-400/10' };
    return { label: 'ACTIVO', color: 'text-emerald-400 bg-emerald-400/10' };
  };

  const toggleTransferList = (playerId: string) => {
    const updatedPlayers = allPlayers.map(p => {
      if (p.id !== playerId) return p;
      return { ...p, transferListed: !p.transferListed };
    });
    setPlayers(updatedPlayers);
  };

  return (
    <div className="space-y-8">
      {isAdjustmentMode && (
        <div className={`p-6 rounded-3xl border flex flex-col md:flex-row items-center justify-between gap-6 ${team.clausesConfirmed ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-amber-500/10 border-amber-500/30 animate-pulse'}`}>
          <div className="flex items-center gap-4">
            <RefreshCw className={`text-amber-500 ${team.clausesConfirmed ? '' : 'animate-spin-slow'}`} size={32} />
            <div>
              <h3 className="text-lg font-black uppercase text-white">Periodo de Reajuste Obligatorio</h3>
              <p className="text-sm text-slate-400">Normaliza el valor de tu plantilla a {teamCap}M.</p>
            </div>
          </div>
          {team.clausesConfirmed ? (
            <div className="flex items-center gap-2 text-emerald-400 font-bold bg-emerald-400/10 px-4 py-2 rounded-xl border border-emerald-400/20">
              <CheckCircle2 size={18} /> Normalización Completada
            </div>
          ) : (
            <button 
              onClick={handleSaveClauses}
              className={`px-8 py-3 rounded-xl font-bold transition-all shadow-lg flex items-center gap-2 ${isAdjustmentValid ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/20' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}
            >
              <Save size={18} /> Confirmar Reajuste
            </button>
          )}
        </div>
      )}

      {teamCap < 1000 && (
        <div className="bg-rose-500/10 border border-rose-500/30 p-4 rounded-2xl flex items-center gap-4 text-rose-500">
           <AlertCircle />
           <p className="text-xs font-bold uppercase">Sanción de Deuda Activa: Tu límite de cláusulas ha sido reducido a {teamCap}M.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className={`p-6 rounded-2xl border ${isCapValid ? 'bg-slate-900 border-slate-800' : 'bg-rose-500/10 border-rose-500/30'}`}>
          <p className="text-xs text-slate-500 font-bold uppercase mb-1">Valor Plantilla</p>
          <div className="flex items-end justify-between">
            <h4 className={`text-2xl font-bold ${currentTotalClause > teamCap ? 'text-rose-500' : 'text-emerald-400'}`}>
              {currentTotalClause}M <span className="text-sm font-normal text-slate-500">/ {teamCap}M</span>
            </h4>
            {currentTotalClause > teamCap && <Info size={16} className="text-rose-500 mb-1" />}
          </div>
        </div>
        <div className="p-6 rounded-2xl border bg-slate-900 border-slate-800">
          <p className="text-xs text-slate-500 font-bold uppercase mb-1">Liquidez</p>
          <p className={`text-2xl font-bold ${team.budget >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>{team.budget}M</p>
        </div>
      </div>

      <section className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-xl font-bold flex items-center gap-2 uppercase tracking-tighter">
            <Users className="text-indigo-500" /> Ingeniería de Plantilla
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-800/50 text-slate-400 text-xs font-bold uppercase">
              <tr>
                <th className="px-6 py-4">Jugador</th>
                <th className="px-6 py-4">Pos</th>
                <th className="px-6 py-4">Cláusula</th>
                {isAdjustmentMode && <th className="px-6 py-4">Ajustar</th>}
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4 text-right">Transferible</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {captain && (
                <tr className="bg-indigo-500/5">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400"><Shield size={14}/></div>
                      <span className="font-bold text-white">{captain.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs font-bold text-slate-500">{captain.position}</td>
                  <td className="px-6 py-4 text-slate-600 font-mono font-bold italic">CAPITÁN</td>
                  {isAdjustmentMode && <td className="px-6 py-4">---</td>}
                  <td className="px-6 py-4">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded ${getPlayerStatus(captain).color}`}>{getPlayerStatus(captain).label}</span>
                  </td>
                  <td className="px-6 py-4 text-right text-xs text-slate-600 font-bold">---</td>
                </tr>
              )}
              {regularPlayers.map(p => (
                <tr key={p.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4 font-bold">{p.name}</td>
                  <td className="px-6 py-4 text-xs font-bold text-slate-500">{p.position}</td>
                  <td className="px-6 py-4 font-mono font-bold text-white">{p.clause}M</td>
                  {isAdjustmentMode && (
                    <td className="px-6 py-4">
                      <input 
                        type="number" 
                        min={RULES.MIN_CLAUSE}
                        value={editingClauses[p.id] ?? p.clause}
                        onChange={(e) => setEditingClauses({...editingClauses, [p.id]: parseInt(e.target.value)||0})}
                        className="w-20 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-sm text-white focus:border-indigo-500 outline-none"
                      />
                    </td>
                  )}
                  <td className="px-6 py-4">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded ${getPlayerStatus(p).color}`}>{getPlayerStatus(p).label}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => toggleTransferList(p.id)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest border transition-all ${
                        p.transferListed ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400' : 'bg-slate-900 border-slate-700 text-slate-500 hover:text-white'
                      }`}
                    >
                      {p.transferListed ? 'En lista' : 'Disponible'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default SquadManagement;
