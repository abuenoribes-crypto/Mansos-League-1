
import React, { useState, useEffect } from 'react';
import { Player, Team, LeagueNews, MarketOffer, League, AppNotification } from '../types';
import { RULES } from '../constants';
import { Gavel, Shield, Clock, CheckCircle, XCircle, Send, Users, Goal, Handshake, Tag, Repeat, CornerUpRight } from 'lucide-react';

interface MarketProps {
  players: Player[];
  team: Team;
  setPlayers: (players: Player[]) => void;
  setTeams: (teams: Team[]) => void;
  teams: Team[];
  onNews: (context: string, category: LeagueNews['category']) => void;
  offers: MarketOffer[];
  setOffers: (offers: MarketOffer[]) => void;
  league: League;
  onNotify: (teamId: string, title: string, message: string, type: AppNotification['type']) => void;
}

const Market: React.FC<MarketProps> = ({ players, team, setPlayers, setTeams, teams, onNews, offers, setOffers, league, onNotify }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPos, setFilterPos] = useState('ALL');
  const [activeTab, setActiveTab] = useState<'listings' | 'transfer-list' | 'scouting' | 'offers-received' | 'offers-sent'>('listings');
  const [selectedRivalId, setSelectedRivalId] = useState<string | null>(null);
  const [marketStatus, setMarketStatus] = useState<{ open: boolean, adjustment: boolean, gkRestricted: boolean, nextEvent: string }>({ open: false, adjustment: false, gkRestricted: false, nextEvent: '' });
  const [selectedOfferPlayer, setSelectedOfferPlayer] = useState<Player | null>(null);
  const [offerAmount, setOfferAmount] = useState<number>(0);
  const [offerSwapPlayerId, setOfferSwapPlayerId] = useState<string>('');
  const [counterOfferId, setCounterOfferId] = useState<string | null>(null);

  const myGkCount = players.filter(p => p.teamId === team.id && p.position === 'GK').length;

  useEffect(() => {
    if (!league.startDate) {
      setMarketStatus({ open: false, adjustment: false, gkRestricted: false, nextEvent: 'Liga no iniciada' });
      return;
    }

    const checkMarket = () => {
      const now = new Date();
      const start = new Date(league.startDate!);
      const msPerWeek = 7 * 24 * 60 * 60 * 1000;
      const msSinceStart = now.getTime() - start.getTime();
      const currentWeek = Math.floor(msSinceStart / msPerWeek);
      const isMarketWeek = currentWeek >= 2 && (currentWeek - 2) % 3 === 0;
      
      const dayOfWeek = now.getDay(); const hour = now.getHours();
      
      let isOpen = false; let isAdjustment = false; let isGkRestricted = false;

      if (isMarketWeek) {
        if (dayOfWeek === 1 && hour >= 18) isOpen = true;
        if (dayOfWeek > 1 && dayOfWeek < 5) isOpen = true;
        if (dayOfWeek === 5 && hour === 0) isOpen = true;
        
        // El mercado GK se restringe el jueves a las 00:00 (day 4)
        isGkRestricted = isOpen && (dayOfWeek >= 4);
        
        if (dayOfWeek === 5 && hour > 0) isAdjustment = true;
      }

      setMarketStatus({ 
        open: isOpen, adjustment: isAdjustment, gkRestricted: isGkRestricted,
        nextEvent: isOpen ? (isGkRestricted ? 'Restricción GK Activa (Jueves)' : 'Mercado General Abierto') : 
                   isAdjustment ? 'Periodo de Ajuste (24h)' : 'Próxima apertura el Lunes de mercado (18:00)'
      });
    };
    const interval = setInterval(checkMarket, 10000); checkMarket(); return () => clearInterval(interval);
  }, [league.startDate]);

  const availablePlayers = players.filter(p => p.teamId !== team.id && p.name.toLowerCase().includes(searchTerm.toLowerCase()) && (filterPos === 'ALL' || p.position === filterPos));
  const listedPlayers = players.filter(p => p.transferListed && p.teamId !== team.id);

  const handleClausulazo = (player: Player) => {
    if (!marketStatus.open) { alert("Mercado cerrado."); return; }
    if (player.isCaptain) return;

    // Lógica especial de Porteros (Jueves)
    if (player.position === 'GK' && marketStatus.gkRestricted) {
      if (myGkCount >= 2) {
        alert("Mercado de Porteros cerrado para equipos con plantilla completa (2+ GK).");
        return;
      }
      
      const seller = teams.find(t => t.id === player.teamId);
      const sellerGkCount = players.filter(p => p.teamId === seller?.id && p.position === 'GK').length;
      
      if (sellerGkCount < 3) {
        alert("En este periodo solo puedes fichar porteros de equipos que tengan 3 o más guardametas.");
        return;
      }
    }

    const seller = teams.find(t => t.id === player.teamId);
    if (!seller) return;

    const futureBudget = team.budget - player.clause;

    if (futureBudget < RULES.DEBT_LIMIT) { 
      alert(`Operación denegada. Superarías el límite de deuda (${RULES.DEBT_LIMIT}M).`); 
      return; 
    }

    if (futureBudget < 0) {
      const confirmSpend = confirm(
        `¡RIESGO FINANCIERO!\n\nTu saldo quedará en ${futureBudget}M.\n` +
        `Si no saneas antes del viernes: Factor x10 y derrotas 4-0.\n\n¿Proceder?`
      );
      if (!confirmSpend) return;
    }

    const updatedTeams = teams.map(t => {
      if (t.id === team.id) return { ...t, budget: futureBudget, players: [...t.players, player.id], clausesConfirmed: false };
      if (t.id === seller.id) return { ...t, budget: t.budget + player.clause, players: t.players.filter(pid => pid !== player.id), clausesConfirmed: false };
      return t;
    });
    setTeams(updatedTeams);
    setPlayers(players.map(p => p.id === player.id ? { ...p, teamId: team.id } : p));
    onNotify(seller.id, "¡CLAUSULAZO!", `${team.name} fichó a ${player.name} (${player.clause}M).`, 'CLAUSULAZO');
    onNews(`CLAUSULAZO: ${team.name} paga los ${player.clause}M por ${player.name}.`, 'MARKET');
  };

  const handleOpenOffer = (player: Player, isCounter = false, baseOfferId?: string) => {
    setSelectedOfferPlayer(player);
    setOfferAmount(player.clause);
    setOfferSwapPlayerId('');
    setCounterOfferId(isCounter ? baseOfferId || null : null);
  };

  const resetOfferForm = () => {
    setSelectedOfferPlayer(null);
    setOfferAmount(0);
    setOfferSwapPlayerId('');
    setCounterOfferId(null);
  };

  const handleSendOffer = () => {
    if (!selectedOfferPlayer) return;
    if (selectedOfferPlayer.isCaptain) return;
    const targetTeamId = selectedOfferPlayer.teamId;
    if (!targetTeamId) return;
    const amount = Number(offerAmount);
    if (Number.isNaN(amount) || amount < 0) {
      alert("Introduce un monto válido.");
      return;
    }

    const newOffer: MarketOffer = {
      id: 'OF' + Math.random().toString(36).substring(2, 9),
      playerId: selectedOfferPlayer.id,
      fromTeamId: team.id,
      toTeamId: targetTeamId,
      amount,
      offeredPlayerId: offerSwapPlayerId || undefined,
      counterOfId: counterOfferId || undefined,
      status: 'PENDING',
      timestamp: Date.now()
    };

    if (counterOfferId) {
      const updatedOffers = offers.map(o => o.id === counterOfferId ? { ...o, status: 'COUNTERED' } : o);
      setOffers([newOffer, ...updatedOffers]);
    } else {
      setOffers([newOffer, ...offers]);
    }
    onNotify(targetTeamId, "Nueva oferta", `${team.name} ofrece ${amount}M por ${selectedOfferPlayer.name}.`, 'OFFER');
    onNews(`OFERTA: ${team.name} envía propuesta por ${selectedOfferPlayer.name}.`, 'MARKET');
    resetOfferForm();
  };

  const handleUpdateOfferStatus = (offerId: string, status: MarketOffer['status']) => {
    const updated = offers.map(o => o.id === offerId ? { ...o, status } : o);
    setOffers(updated);
  };

  useEffect(() => {
    if (!marketStatus.open) return;

    const executableOffers = offers.filter(o => o.status === 'ACCEPTED');
    if (executableOffers.length === 0) return;

    let updatedTeams = [...teams];
    let updatedPlayers = [...players];
    let updatedOffers = [...offers];

    executableOffers.forEach(offer => {
      const buyer = updatedTeams.find(t => t.id === offer.fromTeamId);
      const seller = updatedTeams.find(t => t.id === offer.toTeamId);
      const targetPlayer = updatedPlayers.find(p => p.id === offer.playerId);

      if (!buyer || !seller || !targetPlayer || targetPlayer.teamId !== seller.id || targetPlayer.isCaptain) {
        updatedOffers = updatedOffers.map(o => o.id === offer.id ? { ...o, status: 'REJECTED' } : o);
        return;
      }

      const swapPlayer = offer.offeredPlayerId ? updatedPlayers.find(p => p.id === offer.offeredPlayerId) : undefined;
      if (swapPlayer && swapPlayer.teamId !== buyer.id) {
        updatedOffers = updatedOffers.map(o => o.id === offer.id ? { ...o, status: 'REJECTED' } : o);
        return;
      }

      const newBuyerBudget = buyer.budget - offer.amount;
      if (newBuyerBudget < RULES.DEBT_LIMIT) {
        updatedOffers = updatedOffers.map(o => o.id === offer.id ? { ...o, status: 'REJECTED' } : o);
        return;
      }

      updatedTeams = updatedTeams.map(t => {
        if (t.id === buyer.id) {
          const updatedPlayersList = [...t.players, targetPlayer.id];
          if (swapPlayer) {
            return { ...t, budget: newBuyerBudget, players: t.players.filter(pid => pid !== swapPlayer.id), clausesConfirmed: false };
          }
          return { ...t, budget: newBuyerBudget, players: updatedPlayersList, clausesConfirmed: false };
        }
        if (t.id === seller.id) {
          const updatedPlayersList = t.players.filter(pid => pid !== targetPlayer.id);
          if (swapPlayer) {
            return { ...t, budget: t.budget + offer.amount, players: [...updatedPlayersList, swapPlayer.id], clausesConfirmed: false };
          }
          return { ...t, budget: t.budget + offer.amount, players: updatedPlayersList, clausesConfirmed: false };
        }
        return t;
      });

      updatedPlayers = updatedPlayers.map(p => {
        if (p.id === targetPlayer.id) return { ...p, teamId: buyer.id, transferListed: false };
        if (swapPlayer && p.id === swapPlayer.id) return { ...p, teamId: seller.id, transferListed: false };
        return p;
      });

      updatedOffers = updatedOffers.map(o => o.id === offer.id ? { ...o, status: 'EXECUTED' } : o);
      onNotify(seller.id, "Oferta ejecutada", `${targetPlayer.name} cambia de club por ${offer.amount}M.`, 'OFFER');
      onNews(`FICHAJE POR OFERTA: ${targetPlayer.name} se marcha por ${offer.amount}M.`, 'MARKET');
    });

    setTeams(updatedTeams);
    setPlayers(updatedPlayers);
    setOffers(updatedOffers);
  }, [marketStatus.open, offers, teams, players]);

  const selectedRival = teams.find(t => t.id === selectedRivalId);
  const rivalPlayers = selectedRival ? players.filter(p => selectedRival.players.includes(p.id)).sort((a,b) => b.goals - a.goals) : [];

  return (
    <div className="space-y-8">
      <div className={`p-8 rounded-3xl border flex flex-col md:flex-row items-center justify-between gap-6 ${marketStatus.open ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-rose-500/10 border-rose-500/30'}`}>
        <div className="flex items-center gap-6">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-xl ${marketStatus.open ? 'bg-emerald-500' : 'bg-rose-500'}`}><Clock size={32} /></div>
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tighter">
               {marketStatus.gkRestricted && myGkCount < 2 ? 'VENTANA EMERGENCIA GK' : marketStatus.open ? 'Mercado Abierto' : 'Mercado Cerrado'}
            </h2>
            <p className="text-sm font-bold opacity-60 uppercase tracking-widest">{marketStatus.nextEvent}</p>
          </div>
        </div>
        {marketStatus.gkRestricted && (
          <div className="bg-amber-500/20 px-6 py-3 rounded-2xl border border-amber-500/30 flex items-center gap-3">
             <Shield className="text-amber-500" size={18} />
             <p className="text-[10px] font-black uppercase text-amber-500 tracking-widest">
               {myGkCount < 2 ? 'SOLO COMPRAS A EQUIPOS CON 3+ GK' : 'MERCADO GK CERRADO PARA TI'}
             </p>
          </div>
        )}
      </div>

      <div className="flex border-b border-slate-800 overflow-x-auto">
        {['listings', 'transfer-list', 'scouting', 'offers-received', 'offers-sent'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab as any)} className={`px-8 py-5 font-black text-xs transition-all border-b-2 uppercase tracking-widest whitespace-nowrap ${activeTab === tab ? 'border-indigo-500 text-white' : 'border-transparent text-slate-500 hover:text-white'}`}>{tab.replace('-', ' ')}</button>
        ))}
      </div>

      {activeTab === 'listings' && (
        <div className="space-y-6">
          <div className="flex gap-4"><input type="text" placeholder="Buscar jugadores..." className="flex-1 bg-slate-900 border border-slate-800 rounded-xl py-4 px-6 outline-none focus:ring-2 focus:ring-indigo-500" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availablePlayers.map(p => (
              <div key={p.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-8 hover:border-indigo-500/50 transition-all group">
                <div className="flex justify-between items-start mb-6">
                  <div><span className="text-[10px] font-black text-indigo-400 bg-indigo-400/10 px-2 py-1 rounded uppercase">{p.position}</span><h3 className="text-xl font-black mt-2 uppercase">{p.name}</h3><p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{teams.find(t => t.id === p.teamId)?.name}</p></div>
                  <div className="text-right"><p className="text-[10px] text-slate-500 font-bold uppercase">Cláusula</p><p className="text-2xl font-black">{p.clause}M</p></div>
                </div>
                <div className="flex gap-4 items-center mb-6 py-4 border-y border-slate-800/50">
                  <div className="flex-1 text-center"><p className="text-[9px] font-bold text-slate-500 uppercase">Goles</p><p className="font-black text-emerald-400">{p.goals}</p></div>
                  <div className="flex-1 text-center border-l border-slate-800"><p className="text-[9px] font-bold text-slate-500 uppercase">Asist</p><p className="font-black text-sky-400">{p.assists}</p></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                     onClick={() => handleClausulazo(p)} 
                     disabled={!marketStatus.open} 
                     className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 transition-all"
                  >
                     <Gavel size={18}/> Clausulazo
                  </button>
                  <button 
                     onClick={() => handleOpenOffer(p)} 
                     className="bg-slate-800 hover:bg-slate-700 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 transition-all"
                  >
                     <Send size={16}/> Oferta
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'transfer-list' && (
        <div className="space-y-6">
          <div className="flex items-center gap-3 text-xs font-bold text-slate-400 uppercase tracking-widest">
            <Tag size={14} /> Transferibles en el mercado
          </div>
          {listedPlayers.length === 0 ? (
            <div className="py-20 text-center text-slate-600 text-xs font-bold uppercase tracking-widest">Nadie ha puesto jugadores en venta.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {listedPlayers.map(p => (
                <div key={p.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-8 hover:border-emerald-500/40 transition-all">
                  <div className="flex justify-between items-start mb-6">
                    <div><span className="text-[10px] font-black text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded uppercase">{p.position}</span><h3 className="text-xl font-black mt-2 uppercase">{p.name}</h3><p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{teams.find(t => t.id === p.teamId)?.name}</p></div>
                    <div className="text-right"><p className="text-[10px] text-slate-500 font-bold uppercase">Cláusula</p><p className="text-2xl font-black">{p.clause}M</p></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                       onClick={() => handleClausulazo(p)} 
                       disabled={!marketStatus.open} 
                       className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 transition-all"
                    >
                       <Gavel size={18}/> Clausulazo
                    </button>
                    <button 
                       onClick={() => handleOpenOffer(p)} 
                       className="bg-slate-800 hover:bg-slate-700 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 transition-all"
                    >
                       <Send size={16}/> Oferta
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'scouting' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1 space-y-3">
             <h3 className="text-[10px] font-black text-slate-500 uppercase px-4 tracking-widest mb-4">Elegir Rival</h3>
             {teams.filter(t => t.id !== team.id).map(rival => (
               <button key={rival.id} onClick={() => setSelectedRivalId(rival.id)} className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all ${selectedRivalId === rival.id ? 'bg-indigo-600/10 border-indigo-500 text-white' : 'bg-slate-900 border-slate-800 hover:border-slate-700'}`}><div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center overflow-hidden">{rival.logo ? <img src={rival.logo} className="w-full h-full object-cover" /> : <Shield size={18} />}</div><div className="text-left"><p className="font-black text-xs uppercase">{rival.name}</p></div></button>
             ))}
          </div>
          <div className="lg:col-span-3">
             {selectedRivalId ? (
               <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
                 <div className="p-8 border-b border-slate-800 bg-slate-800/20 flex justify-between items-center"><h3 className="font-black text-xl uppercase tracking-tighter">Fichas Técnicas: {selectedRival?.name}</h3><div className="text-right font-black text-emerald-400">{selectedRival?.budget}M</div></div>
                 <table className="w-full text-left">
                    <thead className="bg-slate-950/50 text-slate-500 text-[9px] font-black uppercase tracking-widest">
                       <tr><th className="px-8 py-4">Jugador</th><th className="px-4 py-4 text-center"><Goal size={12}/></th><th className="px-4 py-4 text-center"><Handshake size={12}/></th><th className="px-8 py-4 text-right">Cláusula</th><th className="px-8 py-4 text-right">Acción</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                       {rivalPlayers.map(p => (
                         <tr key={p.id} className="hover:bg-slate-800/30 transition-all">
                            <td className="px-8 py-5"><div className="flex items-center gap-2">{p.isCaptain && <Shield size={10} className="text-indigo-400" />}<span className="font-bold text-white uppercase text-xs">{p.name}</span></div></td>
                            <td className="px-4 py-5 text-center font-black text-emerald-400">{p.goals}</td>
                            <td className="px-4 py-5 text-center font-black text-sky-400">{p.assists}</td>
                            <td className="px-8 py-5 text-right font-black text-white">{p.isCaptain ? '---' : `${p.clause}M`}</td>
                            <td className="px-8 py-5 text-right">
                              <div className="flex justify-end gap-2">
                                <button onClick={() => handleClausulazo(p)} disabled={!marketStatus.open || p.isCaptain} className="p-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white rounded-xl transition-all"><Gavel size={14}/></button>
                                <button onClick={() => handleOpenOffer(p)} disabled={p.isCaptain} className="p-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-all"><Send size={14}/></button>
                              </div>
                            </td>
                         </tr>
                       ))}
                    </tbody>
                 </table>
               </div>
             ) : (
               <div className="py-40 text-center opacity-20 flex flex-col items-center gap-4"><Users size={64} /><p className="font-black text-xs uppercase tracking-widest">Selecciona un club para espiar sus cracks</p></div>
             )}
          </div>
        </div>
      )}

      {activeTab === 'offers-received' && (
        <div className="space-y-4">
          {offers.filter(o => o.toTeamId === team.id).length === 0 && (
            <div className="py-12 text-center text-xs text-slate-600 font-bold uppercase">Sin ofertas recibidas</div>
          )}
          {offers.filter(o => o.toTeamId === team.id).map(offer => {
            const player = players.find(p => p.id === offer.playerId);
            const fromTeam = teams.find(t => t.id === offer.fromTeamId);
            const swapPlayer = offer.offeredPlayerId ? players.find(p => p.id === offer.offeredPlayerId) : undefined;
            if (!player) return null;
            return (
              <div key={offer.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Oferta por {player?.name}</p>
                  <h4 className="text-xl font-black">{offer.amount}M</h4>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{fromTeam?.name}</p>
                  {swapPlayer && <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest mt-2">Incluye cambio: {swapPlayer.name}</p>}
                </div>
                <div className="flex flex-wrap gap-3">
                  <span className="px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-slate-800 text-slate-400">{offer.status}</span>
                  {offer.status === 'PENDING' && (
                    <>
                      <button onClick={() => handleUpdateOfferStatus(offer.id, 'ACCEPTED')} className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center gap-2"><CheckCircle size={14}/> Aceptar</button>
                      <button onClick={() => handleUpdateOfferStatus(offer.id, 'REJECTED')} className="px-4 py-2 rounded-xl bg-rose-600 text-white font-bold text-xs flex items-center gap-2"><XCircle size={14}/> Rechazar</button>
                      <button onClick={() => handleOpenOffer(player, true, offer.id)} className="px-4 py-2 rounded-xl bg-slate-800 text-white font-bold text-xs flex items-center gap-2"><CornerUpRight size={14}/> Contraoferta</button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === 'offers-sent' && (
        <div className="space-y-4">
          {offers.filter(o => o.fromTeamId === team.id).length === 0 && (
            <div className="py-12 text-center text-xs text-slate-600 font-bold uppercase">Sin ofertas enviadas</div>
          )}
          {offers.filter(o => o.fromTeamId === team.id).map(offer => {
            const player = players.find(p => p.id === offer.playerId);
            const toTeam = teams.find(t => t.id === offer.toTeamId);
            const swapPlayer = offer.offeredPlayerId ? players.find(p => p.id === offer.offeredPlayerId) : undefined;
            if (!player) return null;
            return (
              <div key={offer.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Oferta enviada</p>
                  <h4 className="text-xl font-black">{offer.amount}M por {player?.name}</h4>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{toTeam?.name}</p>
                  {swapPlayer && <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest mt-2">Incluye cambio: {swapPlayer.name}</p>}
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-slate-800 text-slate-400">{offer.status}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedOfferPlayer && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Oferta por</p>
              <h3 className="text-xl font-black">{selectedOfferPlayer.name}</h3>
            </div>
            <button onClick={resetOfferForm} className="text-slate-500 hover:text-white text-xs font-bold uppercase">Cerrar</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold uppercase text-slate-500">Monto (M)</label>
              <input type="number" min={0} value={offerAmount} onChange={(e) => setOfferAmount(Number(e.target.value))} className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white" />
            </div>
            <div className="flex flex-col gap-2 md:col-span-2">
              <label className="text-[10px] font-bold uppercase text-slate-500">Cambio de jugador (opcional)</label>
              <select value={offerSwapPlayerId} onChange={(e) => setOfferSwapPlayerId(e.target.value)} className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white">
                <option value="">Sin cambio</option>
                {players.filter(p => p.teamId === team.id && !p.isCaptain).map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.position})</option>
                ))}
              </select>
            </div>
          </div>
          <button onClick={handleSendOffer} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 transition-all">
            <Repeat size={18}/> Enviar oferta
          </button>
        </div>
      )}
    </div>
  );
};

export default Market;
