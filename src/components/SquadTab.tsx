import { useState } from 'react';
import { FORMATIONS, MAX_SQUAD, MIN_SQUAD, POSITION_ORDER } from '../game/constants';
import { bestEleven, sellPrice } from '../game/engine';
import { dispatch } from '../game/store';
import { money } from '../game/format';
import type { FormationKey, GameState, Position } from '../game/types';
import PlayerRow from './PlayerRow';

export default function SquadTab({ s }: { s: GameState }) {
  const lineup = bestEleven(s.squad, s.formation);
  const starterIds = new Set(lineup.starters.map((p) => p.id));
  const [filter, setFilter] = useState<Position | 'ALL'>('ALL');
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const canSell = s.squad.length > MIN_SQUAD;

  const players = [...s.squad]
    .filter((p) => filter === 'ALL' || p.pos === filter)
    .sort((a, b) => POSITION_ORDER.indexOf(a.pos) - POSITION_ORDER.indexOf(b.pos) || b.rating - a.rating);

  return (
    <div className="stack">
      <section className="card">
        <div className="row between wrap">
          <h2>
            Effectif <span className="muted">({s.squad.length}/{MAX_SQUAD})</span>
          </h2>
          <div className="row wrap">
            <label className="muted small" htmlFor="formation">
              Formation
            </label>
            <select
              id="formation"
              value={s.formation}
              onChange={(e) => dispatch({ type: 'formation', formation: e.target.value as FormationKey })}
            >
              {(Object.keys(FORMATIONS) as FormationKey[]).map((f) => (
                <option key={f}>{f}</option>
              ))}
            </select>
          </div>
        </div>
        <p className="muted small">
          Le meilleur XI est choisi automatiquement selon la formation. Force du XI : <b>{lineup.strength.toFixed(1)}</b>
          {lineup.missing > 0 && <span className="neg"> · {lineup.missing} poste(s) vide(s) !</span>}
        </p>
        <div className="segmented">
          {(['ALL', ...POSITION_ORDER] as const).map((f) => (
            <button key={f} className={filter === f ? 'seg active' : 'seg'} onClick={() => setFilter(f)}>
              {f === 'ALL' ? 'Tous' : f}
            </button>
          ))}
        </div>
      </section>
      <section className="card list">
        {players.map((p) => (
          <PlayerRow
            key={p.id}
            p={p}
            starter={starterIds.has(p.id)}
            action={
              confirmId === p.id ? (
                <div className="row">
                  <button className="btn danger small" onClick={() => (dispatch({ type: 'sell', id: p.id }), setConfirmId(null))}>
                    Vendre {money(sellPrice(p))}
                  </button>
                  <button className="btn small" onClick={() => setConfirmId(null)}>
                    ✕
                  </button>
                </div>
              ) : (
                <button
                  className="btn small"
                  disabled={!canSell}
                  title={canSell ? `Valeur de revente : ${money(sellPrice(p))}` : `Minimum ${MIN_SQUAD} joueurs`}
                  onClick={() => setConfirmId(p.id)}
                >
                  Vendre
                </button>
              )
            }
          />
        ))}
      </section>
    </div>
  );
}
