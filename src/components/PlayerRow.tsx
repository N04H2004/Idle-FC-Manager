import { POSITION_LABELS } from '../game/constants';
import { playerSalary, xpToNext } from '../game/engine';
import { money, ratingClass } from '../game/format';
import type { Player } from '../game/types';
import type { ReactNode } from 'react';

export default function PlayerRow({ p, starter, action }: { p: Player; starter?: boolean; action?: ReactNode }) {
  const pct = p.rating >= p.potential ? 100 : Math.min(100, (p.xp / xpToNext(p.rating)) * 100);
  return (
    <div className={starter ? 'player starter' : 'player'}>
      <span className={`ppos ppos-${p.pos}`} title={POSITION_LABELS[p.pos]}>
        {p.pos}
      </span>
      <div className="p-main">
        <div className="p-name">
          {p.name}
          {starter && <span className="tag">Titulaire</span>}
        </div>
        <div className="p-meta muted small">
          {p.age} ans · pot. {p.potential} · {money(playerSalary(p) * 60)}/min{p.goals ? ` · ⚽ ${p.goals}` : ''}
        </div>
        <div className="xp">
          <div className="xp-bar" style={{ width: `${pct}%` }} />
        </div>
      </div>
      <span className={`rating ${ratingClass(p.rating)}`}>{p.rating}</span>
      {action}
    </div>
  );
}
