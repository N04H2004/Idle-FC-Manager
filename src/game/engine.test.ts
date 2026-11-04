import { describe, expect, it } from 'vitest';
import { PLAYER_ID, ROUNDS, TEAMS_PER_DIVISION } from './constants';
import * as E from './engine';
import type { GameState } from './types';

describe('calendrier', () => {
  it('chaque équipe affronte chaque autre équipe à domicile et à l’extérieur', () => {
    const ids = Array.from({ length: TEAMS_PER_DIVISION }, (_, i) => `t${i}`);
    const fx = E.generateFixtures(ids);
    expect(fx).toHaveLength(ROUNDS);
    const pairs = new Set<string>();
    for (const round of fx) {
      const seen = new Set<string>();
      for (const [h, a] of round) {
        expect(seen.has(h) || seen.has(a)).toBe(false);
        seen.add(h);
        seen.add(a);
        pairs.add(`${h}-${a}`);
      }
      expect(round).toHaveLength(TEAMS_PER_DIVISION / 2);
    }
    expect(pairs.size).toBe(TEAMS_PER_DIVISION * (TEAMS_PER_DIVISION - 1));
  });
});

describe('joueurs', () => {
  it('progresse avec l’XP sans dépasser le potentiel', () => {
    const p = E.createPlayer({ rating: 40, potential: 45, age: 20 });
    E.addXp(p, 1e6);
    expect(p.rating).toBe(45);
    expect(p.xp).toBe(0);
  });
});

describe('saison', () => {
  it('joue une saison complète puis en démarre une nouvelle', () => {
    const s = E.newGame('Test FC');
    for (let i = 0; i < ROUNDS; i++) E.playRound(s);
    const played = s.standings.find((x) => x.teamId === PLAYER_ID)!.played;
    expect(played).toBe(ROUNDS);
    const totalPts = s.standings.reduce((a, b) => a + b.pts, 0);
    expect(totalPts).toBeGreaterThan(0);
    E.endSeason(s);
    expect(s.season).toBe(2);
    expect(s.round).toBe(0);
    expect(s.aiTeams).toHaveLength(TEAMS_PER_DIVISION - 1);
    expect(new Set(s.aiTeams.map((t) => t.name)).size).toBe(TEAMS_PER_DIVISION - 1);
  });

  it('simule le temps hors-ligne', () => {
    const s = E.newGame();
    const r = E.simulateOffline(s, 600);
    expect(r.seconds).toBe(600);
    expect(r.matches).toBeGreaterThan(5);
  });
});

/** Un joueur « automatique » simple pour vérifier que la progression est possible. */
function autoplay(s: GameState) {
  const keys = Object.keys(s.facilities) as (keyof GameState['facilities'])[];
  const cheapest = keys
    .filter((k) => s.facilities[k] < 20)
    .sort((a, b) => E.facilityCost(a, s.facilities[a]) - E.facilityCost(b, s.facilities[b]))[0];
  const cur = E.clubStrength(s);
  for (const p of [...s.market].sort((a, b) => b.rating - a.rating)) {
    const gain = E.bestEleven([...s.squad, p], s.formation).strength - cur;
    if (gain > 0.5 && s.money > E.buyPrice(p) * 1.5 && E.incomeBreakdown(s).net > E.playerSalary(p) * 2) {
      if (s.squad.length >= 25) {
        const worst = [...s.squad].sort((a, b) => a.rating - b.rating)[0];
        E.sellPlayer(s, worst.id);
      }
      E.buyPlayer(s, p.id);
      break;
    }
  }
  if (cheapest && s.money > E.facilityCost(cheapest, s.facilities[cheapest]) * 1.2) E.upgradeFacility(s, cheapest);
}

describe('équilibrage', () => {
  it('un joueur actif monte de division en quelques heures', () => {
    const s = E.newGame();
    const checkpoints: string[] = [];
    for (let t = 1; t <= 16 * 3600; t++) {
      E.tick(s, 1);
      if (t % 10 === 0) autoplay(s);
      if (t % 3600 === 0)
        checkpoints.push(
          `${t / 3600}h div${s.division} S${s.season} money=${Math.round(s.money)} fans=${Math.round(s.fans)} str=${E.clubStrength(s).toFixed(1)} net=${E.incomeBreakdown(s).net.toFixed(1)}`,
        );
    }
    console.log(checkpoints.join('\n'));
    expect(s.division).toBeLessThan(5);
  }, 60_000);
});
