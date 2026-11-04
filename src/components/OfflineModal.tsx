import { clearOfflineReport, getOfflineReport, useGame } from '../game/store';
import { duration, money, num } from '../game/format';

export default function OfflineModal() {
  useGame(); // re-rendu à chaque mise à jour du store
  const r = getOfflineReport();
  if (!r) return null;
  return (
    <div className="modal-backdrop" onClick={clearOfflineReport}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Bon retour, coach ! 👋</h2>
        <p className="muted">Pendant votre absence ({duration(r.seconds)}) :</p>
        <ul className="report">
          <li>
            <span>Trésorerie</span>
            <b className={r.moneyDelta >= 0 ? 'pos' : 'neg'}>
              {r.moneyDelta >= 0 ? '+' : ''}
              {money(r.moneyDelta)}
            </b>
          </li>
          <li>
            <span>Supporters</span>
            <b className="pos">+{num(r.fansDelta)}</b>
          </li>
          <li>
            <span>Matchs joués</span>
            <b>{r.matches}</b>
          </li>
        </ul>
        <button className="btn primary" onClick={clearOfflineReport}>
          Continuer
        </button>
      </div>
    </div>
  );
}
