
import React, { useState, useEffect, useRef } from 'react';
import { Role, Player, Team, Match, LeagueNews, League, User, MarketOffer, AppNotification } from './types';
import { RULES } from './constants';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import SquadManagement from './components/SquadManagement';
import Market from './components/Market';
import MatchCenter from './components/MatchCenter';
import AdminPanel from './components/AdminPanel';
import Onboarding from './components/Onboarding';
import TeamSetup from './components/TeamSetup';
import PlayoffView from './components/PlayoffView';
import Stats from './components/Stats';
import NewsPortal from './components/NewsPortal'; 
import NotificationPanel from './components/NotificationPanel';
import { generateLeagueNews } from './services/geminiService';
import { Plus, UserPlus, LogOut, Bell, Layers } from 'lucide-react';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [league, setLeague] = useState<League | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [news, setNews] = useState<LeagueNews[]>([]);
  const [offers, setOffers] = useState<MarketOffer[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showLeagueSelection, setShowLeagueSelection] = useState<'none' | 'create' | 'join'>('none');
  const [needsTeamSetup, setNeedsTeamSetup] = useState(false);
  
  const [newLeagueName, setNewLeagueName] = useState('');
  const [newLeagueLegs, setNewLeagueLegs] = useState<1 | 2>(1);

  const lastProcessedMinute = useRef<string>("");

  useEffect(() => {
    const session = localStorage.getItem('mansos_session');
    if (session) {
      const user = JSON.parse(session);
      setCurrentUser(user);
      loadLeagueData(user);
    }
  }, []);

  const loadLeagueData = (user: User) => {
    if (user.leagueId) {
      const leagueData = localStorage.getItem(`league_${user.leagueId}`);
      if (leagueData) {
        const data = JSON.parse(leagueData);
        setLeague(data.league || null);
        setTeams(data.teams || []);
        setPlayers(data.players || []);
        setMatches(data.matches || []);
        setNews(data.news || []);
        setOffers(data.offers || []);
        setNotifications(data.notifications || []);
        const myTeam = (data.teams || []).find((t: Team) => t.id === user.teamId);
        if (myTeam && myTeam.players.length === 0) setNeedsTeamSetup(true);
      }
    }
  };

  const saveLeagueState = (updatedState: Partial<{ league: League, teams: Team[], players: Player[], matches: Match[], news: LeagueNews[], offers: MarketOffer[], notifications: AppNotification[] }>) => {
    const leagueToSave = updatedState.league || league;
    if (!leagueToSave) return;
    const newState = {
      league: updatedState.league !== undefined ? updatedState.league : league,
      teams: updatedState.teams !== undefined ? updatedState.teams : teams,
      players: updatedState.players !== undefined ? updatedState.players : players,
      matches: updatedState.matches !== undefined ? updatedState.matches : matches,
      news: updatedState.news !== undefined ? updatedState.news : news,
      offers: updatedState.offers !== undefined ? updatedState.offers : offers,
      notifications: updatedState.notifications !== undefined ? updatedState.notifications : notifications,
    };
    localStorage.setItem(`league_${leagueToSave.id}`, JSON.stringify(newState));
  };

  // Motor de Auditoría Automática (Mercado y Deudas)
  useEffect(() => {
    if (!league?.isStarted || !league.startDate || !teams.length) return;

    const engineInterval = setInterval(() => {
      const now = new Date();
      const currentMinuteKey = `${now.getDay()}-${now.getHours()}-${now.getMinutes()}`;
      
      if (lastProcessedMinute.current === currentMinuteKey) return;
      lastProcessedMinute.current = currentMinuteKey;

      const start = new Date(league.startDate!);
      const msPerWeek = 7 * 24 * 60 * 60 * 1000;
      const msSinceStart = now.getTime() - start.getTime();
      const currentWeek = Math.floor(msSinceStart / msPerWeek);
      const isMarketWeek = (currentWeek % 3 === 2);

      // Cierre de Mercado: Viernes 00:00
      if (now.getDay() === 5 && now.getHours() === 0 && now.getMinutes() === 0) {
        applyMarketClosureLogic();
      }
    }, 10000);

    return () => clearInterval(engineInterval);
  }, [league, teams, players, matches]);

  const applyMarketClosureLogic = () => {
    let currentMatches = [...matches];
    let currentTeams = [...teams];
    let currentPlayers = [...players];
    let newsLog = "AUDITORÍA FINANCIERA: Ciclo cerrado. ";

    currentTeams = currentTeams.map(t => {
      const gkCount = currentPlayers.filter(p => p.teamId === t.id && p.position === 'GK').length;
      if (gkCount < RULES.REQUIRED_GK) {
        addNotification(t.id, "MULTA PORTEROS", "Plantilla sin 2 porteros. -50M de sanción.", "FINANCE");
        newsLog += ` ${t.name} multado. `;
        return { ...t, budget: t.budget + RULES.GK_PENALTY }; 
      }
      return t;
    });

    currentTeams = currentTeams.map(t => {
      if (t.budget < 0) {
        const debtAmount = Math.abs(t.budget);
        const newCap = Math.max(0, 1000 - (debtAmount * 10));
        addNotification(t.id, "COLAPSO ECONÓMICO", `Deuda detectada. Derrota 0-4 en J${league?.currentRound} y J${(league?.currentRound||0)+1}.`, 'FINANCE');

        const r1 = league?.currentRound || 1;
        const r2 = r1 + 1;

        currentMatches = currentMatches.map(m => {
          if ((m.round === r1 || m.round === r2) && !m.isPlayed) {
            if (m.homeTeamId === t.id) return { ...m, isPlayed: true, homeScore: 0, awayScore: 4, isSanctionResult: true };
            if (m.awayTeamId === t.id) return { ...m, isPlayed: true, homeScore: 4, awayScore: 0, isSanctionResult: true };
          }
          return m;
        });
        return { ...t, maxClauseCap: newCap, clausesConfirmed: false };
      }
      return { ...t, maxClauseCap: 1000 };
    });

    setTeams(currentTeams);
    setPlayers(currentPlayers);
    setMatches(currentMatches);
    saveLeagueState({ teams: currentTeams, players: currentPlayers, matches: currentMatches });
    addNews(newsLog, "ECONOMY");
  };

  const handleStartPlayoffs = () => {
    if (!league) return;

    // Ordenar para clasificar
    const sorted = [...teams].sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      const gdA = a.gf - a.ga; const gdB = b.gf - b.ga;
      return gdB - gdA;
    });

    const quarterFinals: Match[] = [
      { id: 'QF1', homeTeamId: sorted[2].id, awayTeamId: sorted[5].id, homeScore: 0, awayScore: 0, isPlayed: false, round: 99, events: [] },
      { id: 'QF2', homeTeamId: sorted[3].id, awayTeamId: sorted[4].id, homeScore: 0, awayScore: 0, isPlayed: false, round: 99, events: [] }
    ];

    const newLeague: League = {
      ...league,
      playoffs: {
        quarterFinals,
        semiFinals: [],
        final: []
      }
    };

    setLeague(newLeague);
    setActiveTab('playoffs');
    saveLeagueState({ league: newLeague });
    addNews(`PLAYOFFS INICIADOS: El camino a la gloria comienza. ${sorted[0].name} y ${sorted[1].name} esperan en Semis.`, "ADMIN");
  };

  const addNotification = (teamId: string, title: string, message: string, type: AppNotification['type']) => {
    const newNotif: AppNotification = {
      id: 'NOT' + Math.random().toString(36).substring(2, 9),
      userId: currentUser?.id || 'GLOBAL',
      teamId,
      title,
      message,
      type,
      isRead: false,
      timestamp: Date.now()
    };
    setNotifications(prev => {
      const updated = [newNotif, ...prev].slice(0, 50);
      saveLeagueState({ notifications: updated });
      return updated;
    });
  };

  const markNotifAsRead = (id: string) => {
    const updated = notifications.map(n => n.id === id ? { ...n, isRead: true } : n);
    setNotifications(updated);
    saveLeagueState({ notifications: updated });
  };

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('mansos_session', JSON.stringify(user));
    loadLeagueData(user);
  };

  const handleLogout = () => {
    localStorage.removeItem('mansos_session');
    setCurrentUser(null); setLeague(null); setTeams([]); setPlayers([]); setMatches([]); setNews([]); setOffers([]); setNotifications([]); setNeedsTeamSetup(false);
  };

  const addNews = async (context: string, category: LeagueNews['category']) => {
    const id = 'N' + Math.random().toString(36).substring(2, 9);
    const initialNews: LeagueNews = { id, title: 'Generando crónica...', content: context, timestamp: Date.now(), category };
    
    setNews(prev => {
      const updated = [initialNews, ...prev].slice(0, 100);
      saveLeagueState({ news: updated });
      return updated;
    });

    try {
      const aiResponse = await generateLeagueNews(context);
      setNews(prev => {
        const updated = prev.map(n => n.id === id ? { ...n, title: aiResponse.title, content: aiResponse.content } : n);
        saveLeagueState({ news: updated });
        return updated;
      });
    } catch (error) {
      console.error("AI News Error", error);
    }
  };

  const handleCreateLeagueAction = () => {
    if (!currentUser || !newLeagueName) return;
    const leagueId = 'L' + Math.random().toString(36).substring(2, 9);
    const newLeague: League = { 
      id: leagueId, 
      name: newLeagueName, 
      code: Math.random().toString(36).substring(2, 8).toUpperCase(), 
      isStarted: false, 
      marketOpen: false, 
      currentRound: 1,
      legs: newLeagueLegs
    };
    const adminTeam: Team = { id: 'T' + Math.random().toString(36).substring(2, 9), name: `FC ${currentUser.managerName}`, managerName: currentUser.managerName, budget: RULES.INITIAL_BUDGET, players: [], points: 0, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, debtFactor: 1, maxClauseCap: 1000 };
    setLeague(newLeague); setTeams([adminTeam]); setNeedsTeamSetup(true);
    setCurrentUser({...currentUser, leagueId: newLeague.id, role: Role.ADMIN, teamId: adminTeam.id});
    saveLeagueState({ league: newLeague, teams: [adminTeam] });
  };

  const handleJoinLeagueAction = (leagueCode: string) => {
    if (!currentUser || !leagueCode) return;
    let targetLeague: League | null = null;
    let data: any = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('league_')) {
        const stored = localStorage.getItem(key);
        if (stored) {
          data = JSON.parse(stored);
          if (data.league?.code === leagueCode.toUpperCase()) { targetLeague = data.league; break; }
        }
      }
    }
    if (targetLeague) {
      const newTeam: Team = { id: 'T' + Math.random().toString(36).substring(2, 9), name: `FC ${currentUser.managerName}`, managerName: currentUser.managerName, budget: RULES.INITIAL_BUDGET, players: [], points: 0, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, debtFactor: 1, maxClauseCap: 1000 };
      const updatedTeams = [...(data.teams || []), newTeam];
      setLeague(targetLeague); setTeams(updatedTeams); setPlayers(data.players || []); setMatches(data.matches || []); setNeedsTeamSetup(true);
      setCurrentUser({...currentUser, leagueId: targetLeague.id, role: Role.MANAGER, teamId: newTeam.id});
      saveLeagueState({ league: targetLeague, teams: updatedTeams, players: data.players, matches: data.matches, news: data.news, offers: data.offers, notifications: data.notifications });
    } else alert("Liga no encontrada.");
  };

  if (!currentUser) return <Onboarding onAuthSuccess={handleLogin} />;
  
  if (!league) return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/10 via-slate-950 to-slate-950">
      <div className="max-w-md w-full space-y-8 bg-slate-900 p-10 rounded-3xl border border-slate-800 shadow-2xl text-center">
        <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-3xl font-black mx-auto mb-6 shadow-xl shadow-indigo-500/20">M</div>
        <h2 className="text-3xl font-bold text-white mb-2">Bienvenido, {currentUser.managerName}</h2>
        <div className="space-y-4">
          {showLeagueSelection === 'none' && (
            <><button onClick={() => setShowLeagueSelection('create')} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg flex items-center justify-center gap-3"><Plus size={20} /> Crear Nueva Liga</button>
              <button onClick={() => setShowLeagueSelection('join')} className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-4 rounded-xl transition-all border border-slate-700 flex items-center justify-center gap-3"><UserPlus size={20} /> Unirse a una Liga</button></>
          )}
          {showLeagueSelection === 'create' && (
            <div className="space-y-4">
              <input type="text" placeholder="Nombre de la Liga" className="w-full bg-slate-800 border border-slate-700 rounded-xl py-4 px-5 text-white" value={newLeagueName} onChange={(e) => setNewLeagueName(e.target.value)} />
              <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700">
                <button onClick={() => setNewLeagueLegs(1)} className={`flex-1 py-3 rounded-lg text-xs font-black transition-all ${newLeagueLegs === 1 ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500'}`}>1 Vuelta</button>
                <button onClick={() => setNewLeagueLegs(2)} className={`flex-1 py-3 rounded-lg text-xs font-black transition-all ${newLeagueLegs === 2 ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500'}`}>2 Vueltas</button>
              </div>
              <button onClick={handleCreateLeagueAction} disabled={!newLeagueName} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold py-4 rounded-xl">Crear</button>
              <button onClick={() => setShowLeagueSelection('none')} className="text-slate-500 text-xs font-bold uppercase pt-2">Atrás</button>
            </div>
          )}
          {showLeagueSelection === 'join' && (
            <div className="space-y-4">
              <input type="text" placeholder="Código de la Liga" className="w-full bg-slate-800 border border-slate-700 rounded-xl py-4 px-5 text-white uppercase text-center text-2xl" onKeyDown={(e) => { if (e.key === 'Enter') handleJoinLeagueAction(e.currentTarget.value); }} />
              <button onClick={() => setShowLeagueSelection('none')} className="text-slate-500 text-xs font-bold uppercase pt-2">Atrás</button>
            </div>
          )}
          <button onClick={handleLogout} className="flex items-center justify-center gap-2 w-full text-slate-500 hover:text-rose-400 transition-colors pt-4 text-sm"><LogOut size={16} /> Cerrar Sesión</button>
        </div>
      </div>
    </div>
  );

  if (needsTeamSetup) return <TeamSetup managerName={currentUser.managerName} onComplete={(n,l,p) => {
    const myTeam = teams.find(t => t.id === currentUser.teamId);
    if (!myTeam) return;
    const playersWithTeam = p.map(player => ({ ...player, teamId: myTeam.id }));
    const updatedTeam = { ...myTeam, name: n, logo: l, players: playersWithTeam.map(player => player.id) };
    const updatedTeams = teams.map(t => t.id === updatedTeam.id ? updatedTeam : t);
    const updatedPlayers = [...players, ...playersWithTeam];
    setTeams(updatedTeams); setPlayers(updatedPlayers); setNeedsTeamSetup(false);
    saveLeagueState({ teams: updatedTeams, players: updatedPlayers });
    addNews(`NUEVO CLUB: ${n} inicia su andadura en la Mansos League.`, "ADMIN");
  }} onCancel={handleLogout} />;

  const currentTeam = teams.find(t => t.id === currentUser.teamId) || teams[0];
  const myNotifications = notifications.filter(n => n.teamId === currentTeam.id);
  const unreadCount = myNotifications.filter(n => !n.isRead).length;

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      <Sidebar role={currentUser.role || Role.MANAGER} activeTab={activeTab} setActiveTab={setActiveTab} leagueName={league.name} />
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div><h1 className="text-3xl font-black text-white uppercase tracking-tighter">{activeTab}</h1><p className="text-slate-500 text-xs font-bold uppercase tracking-widest">{league.name}</p></div>
          <div className="flex items-center gap-4">
            <button onClick={() => setShowNotifications(!showNotifications)} className="relative bg-slate-900 p-4 rounded-2xl border border-slate-800 hover:border-indigo-500 transition-all">
              <Bell size={24} className={unreadCount > 0 ? 'text-indigo-400 animate-pulse' : 'text-slate-500'} />
              {unreadCount > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-600 text-white text-[10px] font-black rounded-full flex items-center justify-center">{unreadCount}</span>}
            </button>
            <div className="flex items-center gap-4 bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-2xl">
              <div className="text-right"><p className="text-[10px] text-slate-500 font-bold uppercase">Presupuesto</p><p className={`text-xl font-black ${currentTeam.budget >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>{currentTeam.budget}M</p></div>
              <div className="h-10 w-[1px] bg-slate-800" /><div className="text-right"><p className="text-[10px] text-slate-500 font-bold uppercase">Manager</p><p className="text-xl font-bold text-indigo-400 truncate max-w-[120px]">{currentUser.managerName}</p></div>
            </div>
          </div>
        </header>
        {showNotifications && <NotificationPanel notifications={myNotifications} onClose={() => setShowNotifications(false)} onMarkRead={markNotifAsRead} />}
        {activeTab === 'dashboard' && <Dashboard league={league} teams={teams} matches={matches} players={players} news={news} currentTeamId={currentUser.teamId} />}
        {activeTab === 'news' && <NewsPortal news={news} />}
        {activeTab === 'squad' && <SquadManagement team={currentTeam} allPlayers={players} setPlayers={(p) => { setPlayers(p); saveLeagueState({ players: p }); }} teams={teams} setTeams={(t) => { setTeams(t); saveLeagueState({ teams: t }); }} league={league} />}
        {activeTab === 'market' && <Market players={players} team={currentTeam} setPlayers={(p) => { setPlayers(p); saveLeagueState({ players: p }); }} setTeams={(t) => { setTeams(t); saveLeagueState({ teams: t }); }} teams={teams} onNews={addNews} offers={offers} setOffers={(o) => { setOffers(o); saveLeagueState({ offers: o }); }} league={league} onNotify={addNotification} />}
        {activeTab === 'matches' && <MatchCenter matches={matches} teams={teams} setMatches={(m) => { setMatches(m); saveLeagueState({ matches: m }); }} setTeams={(t) => { setTeams(t); saveLeagueState({ teams: t }); }} players={players} setPlayers={(p) => { setPlayers(p); saveLeagueState({ players: p }); }} isAdmin={currentUser.role === Role.ADMIN} userTeamId={currentUser.teamId} onNews={addNews} />}
        {activeTab === 'stats' && <Stats players={players} teams={teams} />}
        {activeTab === 'playoffs' && <PlayoffView league={league} teams={teams} isAdmin={currentUser.role === Role.ADMIN} onNews={addNews} setLeague={(l) => { setLeague(l); saveLeagueState({ league: l }); }} setTeams={(t) => { setTeams(t); saveLeagueState({ teams: t }); }} />}
        {activeTab === 'admin' && currentUser.role === Role.ADMIN && <AdminPanel league={league} setLeague={(l) => { setLeague(l); saveLeagueState({ league: l }); }} teams={teams} players={players} setPlayers={(p) => { setPlayers(p); saveLeagueState({ players: p }); }} matches={matches} setMatches={(m) => { setMatches(m); saveLeagueState({ matches: m }); }} onNews={addNews} onExpel={(id) => {}} onStartPlayoffs={handleStartPlayoffs} />}
      </main>
    </div>
  );
};

export default App;
