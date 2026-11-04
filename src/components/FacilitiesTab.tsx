import { FACILITIES } from '../game/constants';
import {
  academyInterval,
  clickXp,
  facilityCost,
  stadiumCapacity,
  trainingXpPerSecond,
} from '../game/engine';
import { dispatch } from '../game/store';
import { duration, money, num } from '../game/format';
import type { FacilityKey, GameState } from '../game/types';

function effect(key: FacilityKey, lvl: number, s: GameState): string {
  switch (key) {
    case 'stadium':
      return `${num(stadiumCapacity(lvl))} places`;
    case 'training':
      return `${trainingXpPerSecond(lvl).toFixed(2)} XP/s · clic ${clickXp(lvl).toFixed(1)} XP`;
    case 'academy':
      return `1 jeune toutes les ${duration(academyInterval(lvl))}`;
    case 'marketing':
      return `+${(15 * (lvl - 1)).toFixed(0)} % sponsors · +${(0.04 * (lvl - 1) * 60).toFixed(1)} fans/min`;
    case 'scouting':
      return `${4 + lvl} joueurs sur le marché`;
    default:
      return s.clubName;
  }
}

export default function FacilitiesTab({ s }: { s: GameState }) {
  return (
    <div className="grid">
      {(Object.keys(FACILITIES) as FacilityKey[]).map((key) => {
        const f = FACILITIES[key];
        const lvl = s.facilities[key];
        const maxed = lvl >= f.max;
        const cost = facilityCost(key, lvl);
        const pct = Math.min(100, (s.money / cost) * 100);
        return (
          <section key={key} className="card facility">
            <div className="row between">
              <h2>
                {f.icon} {f.name}
              </h2>
              <span className="lvl">
                Niv. {lvl}/{f.max}
              </span>
            </div>
            <p className="muted small">{f.desc}</p>
            <p>
              <b>Actuel :</b> {effect(key, lvl, s)}
            </p>
            {!maxed && (
              <p className="muted small">
                <b>Niveau suivant :</b> {effect(key, lvl + 1, s)}
              </p>
            )}
            <button
              className="btn primary full"
              disabled={maxed || s.money < cost}
              onClick={() => dispatch({ type: 'upgrade', key })}
              style={!maxed && s.money < cost ? { background: `linear-gradient(90deg, var(--accent-dim) ${pct}%, var(--surface-2) ${pct}%)` } : undefined}
            >
              {maxed ? 'Niveau maximum' : `Améliorer · ${money(cost)}`}
            </button>
          </section>
        );
      })}
    </div>
  );
}
