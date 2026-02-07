
export enum Role {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER'
}

export interface User {
  id: string;
  email: string;
  password?: string;
  managerName: string;
  leagueId?: string;
  role?: Role;
  teamId?: string;
}

export interface Player {
  id: string;
  name: string;
  position: 'GK' | 'DF' | 'MF' | 'FW';
  clause: number;
  isCaptain: boolean;
  teamId?: string;
  goals: number;
  assists: number;
  yellowCards: number; 
  redCards: number; 
  cupGoals: number;
  cupAssists: number;
  cupYellowCards: number;
  cupRedCards: number;
  cards: number; // Matches remaining for suspension
  injuries: number; // Matches remaining for injury
  lastTransferCycle?: number;
  transferListed?: boolean;
}

export interface Team {
  id: string;
  name: string;
  managerName: string;
  logo?: string;
  budget: number;
  players: string[]; 
  points: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
  debtFactor: number;
  maxClauseCap: number; 
  clausesConfirmed?: boolean;
}

export interface MarketOffer {
  id: string;
  playerId: string;
  fromTeamId: string;
  toTeamId: string;
  amount: number;
  offeredPlayerId?: string;
  counterOfId?: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXECUTED' | 'COUNTERED';
  timestamp: number;
}

export interface AppNotification {
  id: string;
  userId: string;
  teamId: string;
  title: string;
  message: string;
  type: 'CLAUSULAZO' | 'OFFER' | 'REVALUATION' | 'MARKET_INFO' | 'FINANCE';
  isRead: boolean;
  timestamp: number;
}

export interface MatchReport {
  reportedBy: string; 
  homeScore: number;
  awayScore: number;
  events: MatchEvent[];
  homeStarters: string[];
  homeSubs: string[];
  awayStarters: string[];
  awaySubs: string[];
}

export interface Match {
  id: string;
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number;
  awayScore: number;
  isPlayed: boolean;
  round: number;
  events: MatchEvent[];
  pendingReport?: MatchReport;
  isSanctionResult?: boolean; 
  competition?: 'LEAGUE' | 'CUP' | 'PLAYOFF';
  leg?: number;
  tieId?: string;
  cupRoundName?: string;
  isBye?: boolean;
}

export interface MatchEvent {
  type: 'GOAL' | 'ASSIST' | 'YELLOW_CARD' | 'RED_CARD' | 'INJURY';
  playerId: string;
  teamId: string;
}

export interface LeagueNews {
  id: string;
  title: string;
  content: string;
  timestamp: number;
  category: 'MATCH' | 'MARKET' | 'ECONOMY' | 'ADMIN';
}

export interface PlayoffBracket {
  quarterFinals: Match[];
  semiFinals: Match[];
  final: Match[];
}

export interface League {
  id: string;
  name: string;
  code: string;
  isStarted: boolean;
  marketOpen: boolean;
  currentRound: number;
  legs: 1 | 2; // Número de vueltas (1 o 2)
  startDate?: number; 
  lastMarketCloseDate?: number;
  finalFourConfig?: {
    direct: number[];
    playoffs: number[];
    locked: boolean;
  };
  playoffs?: PlayoffBracket;
}
