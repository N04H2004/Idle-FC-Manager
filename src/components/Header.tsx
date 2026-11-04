import { divisionInfo } from '../game/constants';
import { clubPosition, clubStrength, incomeBreakdown } from '../game/engine';
import { money, num } from '../game/format';
import type { GameState } from '../game/types';

export default function Header({ s }: { s: GameState }) {
  const inc = incomeBreakdown(s);
  return (
    <header className="header">
      <div className="brand">
        <span className="logo">⚽</span>
        <div>
          <h1>{s.clubName}</h1>
          <p className="muted">
            {divisionInfo(s.division).name} · Saison {s.season} · {clubPosition(s)}e
          </p>
        </div>
      </div>
      <div className="stats">
        <Stat label="Trésorerie" value={money(s.money)} sub={`${inc.net >= 0 ? '+' : ''}${money(inc.net)}/s`} negative={s.money < 0} />
        <Stat label="Supporters" value={num(s.fans)} />
        <Stat label="Force (XI)" value={clubStrength(s).toFixed(1)} />
      </div>
    </header>
  );
}

function Stat({ label, value, sub, negative }: { label: string; value: string; sub?: string; negative?: boolean }) {
  return (
    <div className="stat">
      <span className="stat-label">{label}</span>
      <span className={negative ? 'stat-value negative' : 'stat-value'}>{value}</span>
      {sub && <span className="stat-sub">{sub}</span>}
    </div>
  );
}
