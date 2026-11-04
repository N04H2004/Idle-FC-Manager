import {
  DIVISIONS,
  FACILITIES,
  FORMATIONS,
  MARKET_INTERVAL,
  MATCH_INTERVAL,
  MAX_SQUAD,
  MIN_SQUAD,
  OFFLINE_CAP,
  PLAYER_ID,
  POSITION_ORDER,
  PROMOTED,
  RELEGATED,
  ROUNDS,
  SAVE_VERSION,
  SEASON_BREAK,
  TACTICS,
  TEAMS_PER_DIVISION,
  divisionInfo,
} from './constants';
import { CITIES, CLUB_PREFIXES, FIRST_NAMES, LAST_NAMES } from './names';
import type {
  AiTeam,
  FacilityKey,
  FormationKey,
  GameState,
  LogEntry,
  MatchResult,
  OfflineReport,
  Player,
  Position,
  Standing,
  Tactic,
} from './types';

// ---------- Aléatoire ----------

export const rand = (a: number, b: number) => a + Math.random() * (b - a);
export const randInt = (a: number, b: number) => Math.floor(rand(a, b + 1));
export const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)];
export const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

export function poisson(lambda: number): number {
  const L = Math.exp(-lambda);
  let k = 0;
  let p = 1;
  do {
    k++;
    p *= Math.random();
  } while (p > L && k < 20);
  return k - 1;
}

// ---------- Joueurs ----------

export function createPlayer(opts: { pos?: Position; rating: number; potential?: number; age?: number }): Player {
  const rating = clamp(Math.round(opts.rating), 10, 99);
  const age = opts.age ?? randInt(18, 32);
  const potentialBonus = age < 22 ? randInt(8, 28) : age < 26 ? randInt(3, 15) : randInt(0, 5);
  return {
    id: uid(),
    name: `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`,
    pos: opts.pos ?? pick(POSITION_ORDER),
    age,
    rating,
    potential: clamp(Math.round(opts.potential ?? rating + potentialBonus), rating, 99),
    xp: 0,
    goals: 0,
  };
}

export function playerValue(p: Player): number {
  const growth = p.age < 24 ? Math.max(0, p.potential - p.rating) * 0.35 : 0;
  const ageFactor = p.age <= 23 ? 1.2 : p.age <= 29 ? 1 : p.age <= 32 ? 0.7 : 0.45;
  return Math.round(60 * Math.pow(1.12, p.rating + growth) * ageFactor);
}

export const buyPrice = (p: Player) => Math.round(playerValue(p) * 1.5);
export const sellPrice = (p: Player) => Math.round(playerValue(p) * 0.75);

/** Salaire par seconde. */
export function playerSalary(p: Player): number {
  return (60 * Math.pow(1.12, p.rating)) / 9000;
}

export const xpToNext = (rating: number) => 8 * Math.pow(1.055, rating);

export function addXp(p: Player, amount: number): boolean {
  if (p.rating >= p.potential) {
    p.xp = 0;
    return false;
  }
  p.xp += amount;
  let leveled = false;
  while (p.rating < p.potential && p.xp >= xpToNext(p.rating)) {
    p.xp -= xpToNext(p.rating);
    p.rating++;
    leveled = true;
  }
  if (p.rating >= p.potential) p.xp = 0;
  return leveled;
}

// ---------- Équipe ----------

export interface Lineup {
  starters: Player[];
  strength: number;
  missing: number;
}

export function bestEleven(squad: Player[], formation: FormationKey): Lineup {
  const shape = FORMATIONS[formation];
  const used = new Set<string>();
  const starters: Player[] = [];
  let total = 0;
  let filled = 0;

  for (const pos of POSITION_ORDER) {
    const candidates = squad.filter((p) => p.pos === pos).sort((a, b) => b.rating - a.rating);
    for (let i = 0; i < shape[pos] && i < candidates.length; i++) {
      starters.push(candidates[i]);
      used.add(candidates[i].id);
      total += candidates[i].rating;
      filled++;
    }
  }
  // Compléter les postes vides avec des joueurs hors-poste (pénalité).
  const rest = squad.filter((p) => !used.has(p.id)).sort((a, b) => b.rating - a.rating);
  while (filled < 11 && rest.length) {
    const p = rest.shift()!;
    starters.push(p);
    total += p.rating * 0.65;
    filled++;
  }
  const missing = 11 - filled;
  return { starters, strength: total / 11, missing };
}

export const clubStrength = (s: GameState) => bestEleven(s.squad, s.formation).strength;

export function teamName(s: GameState, id: string): string {
  if (id === PLAYER_ID) return s.clubName;
  return s.aiTeams.find((t) => t.id === id)?.name ?? '???';
}

function teamStrengthById(s: GameState, id: string): number {
  if (id === PLAYER_ID) return clubStrength(s);
  return s.aiTeams.find((t) => t.id === id)?.strength ?? 40;
}

export function generateTeamName(taken: Set<string>): string {
  for (let i = 0; i < 100; i++) {
    const n = `${pick(CLUB_PREFIXES)} ${pick(CITIES)}`;
    if (!taken.has(n)) {
      taken.add(n);
      return n;
    }
  }
  return `FC ${uid()}`;
}

export function generateDivisionTeams(division: number, taken: Set<string>, count = TEAMS_PER_DIVISION - 1): AiTeam[] {
  const base = divisionInfo(division).base;
  return Array.from({ length: count }, () => ({
    id: uid(),
    name: generateTeamName(taken),
    strength: Math.round(base + rand(-6, 6)),
  }));
}

/** Calendrier aller-retour (méthode du cercle). */
export function generateFixtures(teamIds: string[]): [string, string][][] {
  const ids = [...teamIds];
  if (ids.length % 2) ids.push('BYE');
  const n = ids.length;
  const firstHalf: [string, string][][] = [];
  for (let r = 0; r < n - 1; r++) {
    const round: [string, string][] = [];
    for (let i = 0; i < n / 2; i++) {
      const a = ids[i];
      const b = ids[n - 1 - i];
      if (a === 'BYE' || b === 'BYE') continue;
      round.push(r % 2 === 0 ? [a, b] : [b, a]);
    }
    firstHalf.push(round);
    ids.splice(1, 0, ids.pop()!);
  }
  const secondHalf = firstHalf.map((round) => round.map(([h, a]) => [a, h] as [string, string]));
  return [...firstHalf, ...secondHalf];
}

const emptyStanding = (teamId: string): Standing => ({
  teamId,
  played: 0,
  won: 0,
  drawn: 0,
  lost: 0,
  gf: 0,
  ga: 0,
  pts: 0,
});

export function sortStandings(st: Standing[]): Standing[] {
  return [...st].sort(
    (a, b) => b.pts - a.pts || b.gf - b.ga - (a.gf - a.ga) || b.gf - a.gf || a.teamId.localeCompare(b.teamId),
  );
}

function setupSeason(s: GameState, keepTeams: AiTeam[] = []) {
  const taken = new Set<string>([s.clubName, ...keepTeams.map((t) => t.name)]);
  const fresh = generateDivisionTeams(s.division, taken, TEAMS_PER_DIVISION - 1 - keepTeams.length);
  s.aiTeams = [...keepTeams, ...fresh];
  const ids = [PLAYER_ID, ...s.aiTeams.map((t) => t.id)];
  s.fixtures = generateFixtures(ids);
  s.standings = ids.map(emptyStanding);
  s.round = 0;
  s.lastRound = [];
  s.matchTimer = MATCH_INTERVAL;
}

// ---------- Nouvelle partie ----------

export function newGame(clubName = 'Idle FC'): GameState {
  const squad: Player[] = [];
  const layout: [Position, number][] = [
    ['GK', 2],
    ['DEF', 5],
    ['MID', 5],
    ['ATT', 4],
  ];
  for (const [pos, n] of layout) {
    for (let i = 0; i < n; i++) squad.push(createPlayer({ pos, rating: randInt(28, 40) }));
  }
  const s: GameState = {
    version: SAVE_VERSION,
    clubName,
    money: 2500,
    fans: 300,
    division: DIVISIONS.length,
    season: 1,
    round: 0,
    matchTimer: MATCH_INTERVAL,
    marketTimer: MARKET_INTERVAL,
    academyTimer: academyInterval(1),
    tactic: 'balanced',
    formation: '4-4-2',
    squad,
    market: [],
    aiTeams: [],
    fixtures: [],
    standings: [],
    lastRound: [],
    clubHistory: [],
    trophies: [],
    facilities: { stadium: 1, training: 1, academy: 1, marketing: 1, scouting: 1 },
    log: [],
    stats: { totalEarned: 0, matchesPlayed: 0, wins: 0, clicks: 0, playTime: 0 },
    lastSaved: Date.now(),
  };
  setupSeason(s);
  refreshMarket(s);
  addLog(s, `Bienvenue, coach ! ${clubName} démarre en ${divisionInfo(s.division).name}.`, 'info');
  return s;
}

// ---------- Économie ----------

/** Nombre de supporters vers lequel le club tend (selon la division et le marketing). */
export function fanCap(s: GameState) {
  return divisionInfo(s.division).fanBase * (1 + 0.25 * (s.facilities.marketing - 1));
}

export const stadiumCapacity = (lvl: number) => Math.round(500 * Math.pow(1.4, lvl - 1));
export const academyInterval = (lvl: number) => Math.max(60, 300 - lvl * 18);
export const trainingXpPerSecond = (lvl: number) => 0.08 * lvl;
export const clickXp = (lvl: number) => 1 + lvl * 0.5;
export const facilityCost = (key: FacilityKey, lvl: number) =>
  Math.round(FACILITIES[key].baseCost * Math.pow(FACILITIES[key].growth, lvl - 1));

export function sponsorPerSecond(s: GameState): number {
  const d = divisionInfo(s.division);
  return d.sponsor * (1 + 0.15 * (s.facilities.marketing - 1)) + s.fans * 0.002;
}

export const salariesPerSecond = (s: GameState) => s.squad.reduce((sum, p) => sum + playerSalary(p), 0);

export function attendance(s: GameState) {
  return Math.min(Math.floor(s.fans), stadiumCapacity(s.facilities.stadium));
}

export function ticketRevenue(s: GameState) {
  return attendance(s) * divisionInfo(s.division).ticket;
}

export function incomeBreakdown(s: GameState) {
  const sponsor = sponsorPerSecond(s);
  const tickets = ticketRevenue(s) / (MATCH_INTERVAL * 2);
  const salaries = salariesPerSecond(s);
  return { sponsor, tickets, salaries, net: sponsor + tickets - salaries };
}

function earn(s: GameState, amount: number) {
  s.money += amount;
  if (amount > 0) s.stats.totalEarned += amount;
}

// ---------- Journal ----------

export function addLog(s: GameState, text: string, kind: LogEntry['kind'] = 'info') {
  s.log.unshift({ t: Date.now(), text, kind });
  if (s.log.length > 60) s.log.length = 60;
}

// ---------- Matchs ----------

export function simulateScore(home: number, away: number, homeTactic: Tactic = 'balanced', awayTactic: Tactic = 'balanced') {
  const diff = home + 2 - away;
  const ht = TACTICS[homeTactic];
  const at = TACTICS[awayTactic];
  const lh = clamp(1.35 * Math.exp(diff / 14) * ht.attack * at.defense, 0.15, 5);
  const la = clamp(1.15 * Math.exp(-diff / 14) * at.attack * ht.defense, 0.15, 5);
  return [poisson(lh), poisson(la)] as const;
}

function pickScorer(starters: Player[]): Player | undefined {
  const weights = starters.map((p) => (p.pos === 'ATT' ? 6 : p.pos === 'MID' ? 3 : p.pos === 'DEF' ? 1 : 0.05) * (p.rating / 50));
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < starters.length; i++) {
    r -= weights[i];
    if (r <= 0) return starters[i];
  }
  return starters[0];
}

function applyResult(s: GameState, res: MatchResult) {
  const h = s.standings.find((x) => x.teamId === res.homeId)!;
  const a = s.standings.find((x) => x.teamId === res.awayId)!;
  h.played++;
  a.played++;
  h.gf += res.homeGoals;
  h.ga += res.awayGoals;
  a.gf += res.awayGoals;
  a.ga += res.homeGoals;
  if (res.homeGoals > res.awayGoals) {
    h.won++;
    h.pts += 3;
    a.lost++;
  } else if (res.homeGoals < res.awayGoals) {
    a.won++;
    a.pts += 3;
    h.lost++;
  } else {
    h.drawn++;
    a.drawn++;
    h.pts++;
    a.pts++;
  }
}

export function playRound(s: GameState) {
  const fixtures = s.fixtures[s.round];
  if (!fixtures) return;
  const results: MatchResult[] = [];
  const lineup = bestEleven(s.squad, s.formation);
  const div = divisionInfo(s.division);

  for (const [homeId, awayId] of fixtures) {
    const isOurs = homeId === PLAYER_ID || awayId === PLAYER_ID;
    const hs = homeId === PLAYER_ID ? lineup.strength : teamStrengthById(s, homeId);
    const as = awayId === PLAYER_ID ? lineup.strength : teamStrengthById(s, awayId);
    const [hg, ag] = simulateScore(
      hs,
      as,
      homeId === PLAYER_ID ? s.tactic : 'balanced',
      awayId === PLAYER_ID ? s.tactic : 'balanced',
    );
    const res: MatchResult = { round: s.round, homeId, awayId, homeGoals: hg, awayGoals: ag };
    results.push(res);
    applyResult(s, res);

    if (isOurs) {
      const home = homeId === PLAYER_ID;
      const gf = home ? hg : ag;
      const ga = home ? ag : hg;
      const opponent = teamName(s, home ? awayId : homeId);
      const scorers: string[] = [];
      for (let i = 0; i < gf; i++) {
        const sc = pickScorer(lineup.starters);
        if (sc) {
          sc.goals++;
          scorers.push(sc.name);
        }
      }
      let revenue = home ? ticketRevenue(s) : Math.round(div.sponsor * 8);
      const mk = s.facilities.marketing;
      const cap = fanCap(s);
      if (gf > ga) {
        revenue += div.ticket * 150;
        s.fans += Math.max(3, (cap - s.fans) * (0.03 + mk * 0.003));
        s.stats.wins++;
      } else if (gf === ga) {
        s.fans += Math.max(1, (cap - s.fans) * 0.008);
      } else {
        s.fans = Math.max(100, s.fans * 0.985);
      }
      earn(s, revenue);
      s.stats.matchesPlayed++;
      // Expérience de match pour les titulaires
      for (const p of lineup.starters) addXp(p, 2 + s.facilities.training * 0.5);

      s.clubHistory.unshift({ season: s.season, round: s.round + 1, opponent, home, goalsFor: gf, goalsAgainst: ga, scorers, revenue });
      if (s.clubHistory.length > 20) s.clubHistory.length = 20;
      const outcome = gf > ga ? 'Victoire' : gf === ga ? 'Match nul' : 'Défaite';
      addLog(
        s,
        `J${s.round + 1} · ${outcome} ${home ? 'contre' : 'chez'} ${opponent} (${gf}-${ga})${scorers.length ? ' — ' + scorers.join(', ') : ''}`,
        gf > ga ? 'good' : gf === ga ? 'match' : 'bad',
      );
    }
  }
  s.lastRound = results;
  s.round++;
  s.matchTimer = s.round >= ROUNDS ? SEASON_BREAK : MATCH_INTERVAL;
}

export function clubPosition(s: GameState): number {
  return sortStandings(s.standings).findIndex((x) => x.teamId === PLAYER_ID) + 1;
}

export function endSeason(s: GameState) {
  const table = sortStandings(s.standings);
  const pos = table.findIndex((x) => x.teamId === PLAYER_ID) + 1;
  const div = divisionInfo(s.division);
  const prize = Math.round(div.prize * Math.max(0.05, 1 - (pos - 1) / TEAMS_PER_DIVISION));
  earn(s, prize);

  let label = `${pos}e de ${div.name}`;
  let newDivision = s.division;
  if (pos === 1) label = `Champion de ${div.name}`;
  if (pos <= PROMOTED && s.division > 1) {
    newDivision = s.division - 1;
    addLog(s, `🎉 Promotion ! ${s.clubName} monte en ${divisionInfo(newDivision).name}.`, 'good');
  } else if (pos > TEAMS_PER_DIVISION - RELEGATED && s.division < DIVISIONS.length) {
    newDivision = s.division + 1;
    addLog(s, `😞 Relégation en ${divisionInfo(newDivision).name}…`, 'bad');
  }
  if (pos <= 3) s.trophies.unshift({ season: s.season, division: s.division, position: pos, label });
  if (s.trophies.length > 50) s.trophies.length = 50;
  addLog(s, `Fin de la saison ${s.season} : ${label}. Prime : ${Math.round(prize).toLocaleString('fr-FR')} €`, pos === 1 ? 'good' : 'info');

  // Vieillissement & retraites
  const retired: string[] = [];
  s.squad = s.squad.filter((p) => {
    p.age++;
    p.goals = 0;
    if (p.age > 30) {
      p.rating = Math.max(10, p.rating - randInt(0, Math.min(5, p.age - 29)));
      p.potential = Math.min(p.potential, p.rating);
    }
    if (p.age >= 37 || (p.age >= 34 && Math.random() < 0.35)) {
      retired.push(p.name);
      return false;
    }
    return true;
  });
  if (retired.length) addLog(s, `Retraite : ${retired.join(', ')}.`, 'info');

  // Les équipes restantes dans la même division sont conservées (légèrement modifiées).
  const keep =
    newDivision === s.division
      ? table
          .filter((x) => x.teamId !== PLAYER_ID)
          .slice(PROMOTED, TEAMS_PER_DIVISION - 1 - RELEGATED)
          .map((x) => s.aiTeams.find((t) => t.id === x.teamId)!)
          .filter(Boolean)
          .map((t) => ({ ...t, strength: clamp(Math.round(t.strength + rand(-3, 3)), 10, 99) }))
      : [];
  s.division = newDivision;
  s.season++;
  setupSeason(s, keep);
}

// ---------- Marché & académie ----------

export function refreshMarket(s: GameState) {
  const sc = s.facilities.scouting;
  const count = 4 + sc;
  const ref = Math.max(clubStrength(s), divisionInfo(s.division).base - 4);
  s.market = Array.from({ length: count }, () =>
    createPlayer({ rating: ref + rand(-8, 3 + sc * 1.5), age: randInt(18, 33) }),
  );
  s.marketTimer = MARKET_INTERVAL;
}

function spawnYouth(s: GameState) {
  const lvl = s.facilities.academy;
  if (s.squad.length >= MAX_SQUAD) {
    addLog(s, "Le centre de formation a un talent, mais l'effectif est complet.", 'info');
    return;
  }
  const rating = 18 + lvl * 3 + randInt(0, 8);
  const p = createPlayer({ rating, age: randInt(16, 18), potential: rating + 22 + lvl * 3 + randInt(0, 18) });
  s.squad.push(p);
  addLog(s, `🎓 ${p.name} (${p.pos}, ${p.rating} → pot. ${p.potential}) rejoint l'équipe première.`, 'good');
}

// ---------- Actions ----------

export function trainClick(s: GameState) {
  const xp = clickXp(s.facilities.training);
  for (const p of s.squad) addXp(p, xp);
  s.stats.clicks++;
}

export function upgradeFacility(s: GameState, key: FacilityKey): boolean {
  const lvl = s.facilities[key];
  if (lvl >= FACILITIES[key].max) return false;
  const cost = facilityCost(key, lvl);
  if (s.money < cost) return false;
  s.money -= cost;
  s.facilities[key]++;
  addLog(s, `${FACILITIES[key].icon} ${FACILITIES[key].name} amélioré au niveau ${lvl + 1}.`, 'info');
  return true;
}

export function buyPlayer(s: GameState, id: string): boolean {
  const p = s.market.find((x) => x.id === id);
  if (!p || s.squad.length >= MAX_SQUAD) return false;
  const price = buyPrice(p);
  if (s.money < price) return false;
  s.money -= price;
  s.market = s.market.filter((x) => x.id !== id);
  s.squad.push(p);
  addLog(s, `✍️ Transfert : ${p.name} (${p.pos}, ${p.rating}) signe pour ${price.toLocaleString('fr-FR')} €.`, 'good');
  return true;
}

export function sellPlayer(s: GameState, id: string): boolean {
  if (s.squad.length <= MIN_SQUAD) return false;
  const p = s.squad.find((x) => x.id === id);
  if (!p) return false;
  const price = sellPrice(p);
  earn(s, price);
  s.squad = s.squad.filter((x) => x.id !== id);
  addLog(s, `💸 ${p.name} vendu pour ${price.toLocaleString('fr-FR')} €.`, 'info');
  return true;
}

// ---------- Boucle ----------

export function tick(s: GameState, dt: number) {
  s.stats.playTime += dt;
  earn(s, sponsorPerSecond(s) * dt);
  s.money -= salariesPerSecond(s) * dt;
  if (s.fans < fanCap(s)) s.fans += 0.04 * (s.facilities.marketing - 1) * dt;

  const xp = trainingXpPerSecond(s.facilities.training) * dt;
  for (const p of s.squad) addXp(p, xp);

  s.academyTimer -= dt;
  if (s.academyTimer <= 0) {
    spawnYouth(s);
    s.academyTimer = academyInterval(s.facilities.academy);
  }

  s.marketTimer -= dt;
  if (s.marketTimer <= 0) refreshMarket(s);

  s.matchTimer -= dt;
  if (s.matchTimer <= 0) {
    if (s.round >= ROUNDS) endSeason(s);
    else playRound(s);
  }
}

/** Simule le temps passé hors-ligne (plafonné). */
export function simulateOffline(s: GameState, seconds: number): OfflineReport {
  const total = Math.floor(clamp(seconds, 0, OFFLINE_CAP));
  const money0 = s.money;
  const fans0 = s.fans;
  const matches0 = s.stats.matchesPlayed;
  for (let i = 0; i < total; i++) tick(s, 1);
  return {
    seconds: total,
    moneyDelta: s.money - money0,
    fansDelta: s.fans - fans0,
    matches: s.stats.matchesPlayed - matches0,
  };
}
