import type { FacilityKey, FormationKey, Position, Tactic } from './types';

export const SAVE_KEY = 'idle-fc-manager-save-v1';
export const SAVE_VERSION = 1;
export const PLAYER_ID = 'player';

export const MATCH_INTERVAL = 45; // secondes entre deux journées
export const SEASON_BREAK = 20; // pause avant la nouvelle saison
export const MARKET_INTERVAL = 180;
export const TEAMS_PER_DIVISION = 10;
export const ROUNDS = (TEAMS_PER_DIVISION - 1) * 2;
export const MAX_SQUAD = 25;
export const MIN_SQUAD = 11;
export const OFFLINE_CAP = 4 * 3600;
export const PROMOTED = 2;
export const RELEGATED = 2;

export interface DivisionInfo {
  id: number;
  name: string;
  base: number; // force moyenne des adversaires
  ticket: number; // prix du billet
  sponsor: number; // revenu sponsor / seconde
  prize: number; // prime de champion
  fanBase: number; // supporters attirables
}

export const DIVISIONS: DivisionInfo[] = [
  { id: 1, name: 'Ligue Élite', base: 77, ticket: 16, sponsor: 450, prize: 3_000_000, fanBase: 120_000 },
  { id: 2, name: 'Première Division', base: 67, ticket: 12, sponsor: 220, prize: 600_000, fanBase: 45_000 },
  { id: 3, name: 'Deuxième Division', base: 57, ticket: 9, sponsor: 100, prize: 140_000, fanBase: 16_000 },
  { id: 4, name: 'National', base: 47, ticket: 6, sponsor: 40, prize: 35_000, fanBase: 5_000 },
  { id: 5, name: 'Régional', base: 37, ticket: 4, sponsor: 15, prize: 8_000, fanBase: 1_500 },
];

export const divisionInfo = (d: number): DivisionInfo => DIVISIONS[d - 1];

export interface FacilityInfo {
  name: string;
  icon: string;
  desc: string;
  baseCost: number;
  growth: number;
  max: number;
}

export const FACILITIES: Record<FacilityKey, FacilityInfo> = {
  stadium: {
    name: 'Stade',
    icon: '🏟️',
    desc: 'Augmente la capacité du stade et donc la billetterie.',
    baseCost: 3000,
    growth: 1.7,
    max: 20,
  },
  training: {
    name: "Centre d'entraînement",
    icon: '🏋️',
    desc: "Les joueurs gagnent de l'expérience en continu, même hors ligne.",
    baseCost: 2500,
    growth: 1.75,
    max: 20,
  },
  academy: {
    name: 'Centre de formation',
    icon: '🎓',
    desc: 'Produit régulièrement des jeunes talents au potentiel plus élevé.',
    baseCost: 5000,
    growth: 1.85,
    max: 12,
  },
  marketing: {
    name: 'Marketing',
    icon: '📣',
    desc: 'Attire des supporters et augmente les revenus des sponsors.',
    baseCost: 2000,
    growth: 1.7,
    max: 20,
  },
  scouting: {
    name: 'Cellule de recrutement',
    icon: '🔭',
    desc: 'Plus de joueurs et de meilleure qualité sur le marché des transferts.',
    baseCost: 4000,
    growth: 1.8,
    max: 12,
  },
};

export const FORMATIONS: Record<FormationKey, Record<Position, number>> = {
  '4-4-2': { GK: 1, DEF: 4, MID: 4, ATT: 2 },
  '4-3-3': { GK: 1, DEF: 4, MID: 3, ATT: 3 },
  '3-5-2': { GK: 1, DEF: 3, MID: 5, ATT: 2 },
  '5-3-2': { GK: 1, DEF: 5, MID: 3, ATT: 2 },
  '4-5-1': { GK: 1, DEF: 4, MID: 5, ATT: 1 },
};

export const TACTICS: Record<Tactic, { name: string; attack: number; defense: number; desc: string }> = {
  defensive: { name: 'Défensive', attack: 0.8, defense: 0.72, desc: 'Moins de buts encaissés, moins de buts marqués.' },
  balanced: { name: 'Équilibrée', attack: 1, defense: 1, desc: 'Ni trop prudent, ni trop risqué.' },
  offensive: { name: 'Offensive', attack: 1.28, defense: 1.25, desc: 'Plus de buts… des deux côtés.' },
};

export const POSITION_LABELS: Record<Position, string> = {
  GK: 'Gardien',
  DEF: 'Défenseur',
  MID: 'Milieu',
  ATT: 'Attaquant',
};

export const POSITION_ORDER: Position[] = ['GK', 'DEF', 'MID', 'ATT'];
