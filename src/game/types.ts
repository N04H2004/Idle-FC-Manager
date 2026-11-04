export type Position = 'GK' | 'DEF' | 'MID' | 'ATT';
export type Tactic = 'defensive' | 'balanced' | 'offensive';
export type FormationKey = '4-4-2' | '4-3-3' | '3-5-2' | '5-3-2' | '4-5-1';
export type FacilityKey = 'stadium' | 'training' | 'academy' | 'marketing' | 'scouting';

export interface Player {
  id: string;
  name: string;
  pos: Position;
  age: number;
  rating: number;
  potential: number;
  xp: number;
  goals: number;
}

export interface AiTeam {
  id: string;
  name: string;
  strength: number;
}

export interface Standing {
  teamId: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
  pts: number;
}

export interface MatchResult {
  round: number;
  homeId: string;
  awayId: string;
  homeGoals: number;
  awayGoals: number;
}

export interface ClubMatch {
  season: number;
  round: number;
  opponent: string;
  home: boolean;
  goalsFor: number;
  goalsAgainst: number;
  scorers: string[];
  revenue: number;
}

export interface Trophy {
  season: number;
  division: number;
  position: number;
  label: string;
}

export interface LogEntry {
  t: number;
  text: string;
  kind: 'info' | 'good' | 'bad' | 'match';
}

export interface GameState {
  version: number;
  clubName: string;
  money: number;
  fans: number;
  division: number;
  season: number;
  round: number;
  matchTimer: number;
  marketTimer: number;
  academyTimer: number;
  tactic: Tactic;
  formation: FormationKey;
  squad: Player[];
  market: Player[];
  aiTeams: AiTeam[];
  fixtures: [string, string][][];
  standings: Standing[];
  lastRound: MatchResult[];
  clubHistory: ClubMatch[];
  trophies: Trophy[];
  facilities: Record<FacilityKey, number>;
  log: LogEntry[];
  stats: {
    totalEarned: number;
    matchesPlayed: number;
    wins: number;
    clicks: number;
    playTime: number;
  };
  lastSaved: number;
}

export interface OfflineReport {
  seconds: number;
  moneyDelta: number;
  fansDelta: number;
  matches: number;
}
