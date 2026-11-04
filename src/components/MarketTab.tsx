import { MAX_SQUAD } from '../game/constants';
import { bestEleven, buyPrice } from '../game/engine';
import { dispatch } from '../game/store';
import { duration, money } from '../game/format';
import type { GameState } from '../game/types';
import PlayerRow from './PlayerRow';

export default function MarketTab({ s }: { s: GameState }) {
  const full = s.squad.length >= MAX_SQUAD;
  const current = bestEleven(s.squad, s.formation).strength;
  return (
    <div className="stack">
      <section className="card">
        <h2>Marché des transferts</h2>
        <p className="muted small">
          Nouveaux joueurs dans {duration(s.marketTimer)}. Améliorez la cellule de recrutement pour plus de choix et de
          meilleurs profils.
        </p>
        {full && <p className="warn">Effectif complet ({MAX_SQUAD}) : vendez un joueur avant d’acheter.</p>}
      </section>
      <section className="card list">
        {s.market.length === 0 && <p className="muted">Plus aucun joueur disponible. Revenez plus tard !</p>}
        {[...s.market]
          .sort((a, b) => b.rating - a.rating)
          .map((p) => {
            const price = buyPrice(p);
            const gain = bestEleven([...s.squad, p], s.formation).strength - current;
            return (
              <PlayerRow
                key={p.id}
                p={p}
                action={
                  <div className="buy">
                    {gain > 0.05 && <span className="pos small">+{gain.toFixed(1)} XI</span>}
                    <button
                      className="btn primary small"
                      disabled={full || s.money < price}
                      onClick={() => dispatch({ type: 'buy', id: p.id })}
                    >
                      {money(price)}
                    </button>
                  </div>
                }
              />
            );
          })}
      </section>
    </div>
  );
}
