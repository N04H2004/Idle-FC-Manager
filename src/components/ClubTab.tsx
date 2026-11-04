import { useEffect, useState } from 'react';
import { MATCH_INTERVAL, PLAYER_ID, ROUNDS, SEASON_BREAK, TACTICS, divisionInfo } from '../game/constants';
import { attendance, clickXp, incomeBreakdown, stadiumCapacity, teamName } from '../game/engine';
import { dispatch } from '../game/store';
import { duration, money, num } from '../game/format';
import type { GameState, Tactic } from '../game/types';

export default function ClubTab({ s }: { s: GameState }) {
  const inc = incomeBreakdown(s);
  const seasonOver = s.round >= ROUNDS;
  const next = s.fixtures[s.round]?.find(([h, a]) => h === PLAYER_ID || a === PLAYER_ID);
  const total = seasonOver ? SEASON_BREAK : MATCH_INTERVAL;
  const progress = 1 - s.matchTimer / total;
  const [pops, setPops] = useState<{ id: number; x: number }[]>([]);
  const [name, setName] = useState(s.clubName);

  useEffect(() => setName(s.clubName), [s.clubName]);

  const train = () => {
    dispatch({ type: 'train' });
    const id = Date.now() + Math.random();
    setPops((p) => [...p.slice(-8), { id, x: Math.random() * 60 - 30 }]);
    setTimeout(() => setPops((p) => p.filter((x) => x.id !== id)), 900);
  };

  return (
    <div className="grid">
      <section className="card match-card">
        <h2>Prochain match</h2>
        {seasonOver ? (
          <p className="big">Fin de saison — bilan dans {duration(s.matchTimer)}</p>
        ) : next ? (
          <div className="next-match">
            <div className={next[0] === PLAYER_ID ? 'team me' : 'team'}>{teamName(s, next[0])}</div>
            <div className="vs">VS</div>
            <div className={next[1] === PLAYER_ID ? 'team me' : 'team'}>{teamName(s, next[1])}</div>
          </div>
        ) : null}
        <div className="progress">
          <div className="progress-bar" style={{ width: `${Math.min(100, progress * 100)}%` }} />
        </div>
        <p className="muted center">
          {seasonOver ? 'Nouvelle saison' : `Journée ${s.round + 1}/${ROUNDS}`} dans {duration(s.matchTimer)}
          {next && !seasonOver && (next[0] === PLAYER_ID ? ' · à domicile 🏟️' : ' · à l’extérieur 🚌')}
        </p>

        <h3>Tactique</h3>
        <div className="segmented">
          {(Object.keys(TACTICS) as Tactic[]).map((t) => (
            <button
              key={t}
              className={s.tactic === t ? 'seg active' : 'seg'}
              onClick={() => dispatch({ type: 'tactic', tactic: t })}
              title={TACTICS[t].desc}
            >
              {TACTICS[t].name}
            </button>
          ))}
        </div>
        <p className="muted small">{TACTICS[s.tactic].desc}</p>
      </section>

      <section className="card train-card">
        <h2>Entraînement</h2>
        <p className="muted">Cliquez pour faire progresser tout l’effectif.</p>
        <div className="train-wrap">
          <button className="train-btn" onClick={train} aria-label="Séance d'entraînement">
            ⚽
          </button>
          {pops.map((p) => (
            <span key={p.id} className="pop" style={{ left: `calc(50% + ${p.x}px)` }}>
              +{clickXp(s.facilities.training).toFixed(1)} XP
            </span>
          ))}
        </div>
        <p className="muted center small">{num(s.stats.clicks)} séances effectuées</p>
      </section>

      <section className="card">
        <h2>Finances</h2>
        <ul className="kv">
          <li>
            <span>Sponsors</span>
            <b className="pos">+{money(inc.sponsor)}/s</b>
          </li>
          <li>
            <span>Billetterie (moyenne)</span>
            <b className="pos">+{money(inc.tickets)}/s</b>
          </li>
          <li>
            <span>Salaires</span>
            <b className="neg">-{money(inc.salaries)}/s</b>
          </li>
          <li className="total">
            <span>Bilan</span>
            <b className={inc.net >= 0 ? 'pos' : 'neg'}>
              {inc.net >= 0 ? '+' : ''}
              {money(inc.net)}/s
            </b>
          </li>
        </ul>
        <ul className="kv">
          <li>
            <span>Affluence</span>
            <b>
              {num(attendance(s))} / {num(stadiumCapacity(s.facilities.stadium))}
            </b>
          </li>
          <li>
            <span>Prix du billet</span>
            <b>{money(divisionInfo(s.division).ticket)}</b>
          </li>
          <li>
            <span>Total gagné</span>
            <b>{money(s.stats.totalEarned)}</b>
          </li>
        </ul>
        {s.money < 0 && <p className="warn">⚠️ Trésorerie négative : vendez des joueurs ou réduisez la masse salariale.</p>}
      </section>

      <section className="card">
        <h2>Derniers résultats</h2>
        {s.clubHistory.length === 0 ? (
          <p className="muted">Aucun match joué pour l’instant.</p>
        ) : (
          <ul className="results">
            {s.clubHistory.slice(0, 8).map((m, i) => {
              const r = m.goalsFor > m.goalsAgainst ? 'W' : m.goalsFor === m.goalsAgainst ? 'D' : 'L';
              return (
                <li key={i}>
                  <span className={`pill ${r}`}>{r === 'W' ? 'V' : r === 'D' ? 'N' : 'D'}</span>
                  <span className="grow">
                    {m.home ? 'vs' : '@'} {m.opponent}
                  </span>
                  <b>
                    {m.goalsFor}-{m.goalsAgainst}
                  </b>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="card">
        <h2>Palmarès</h2>
        {s.trophies.length === 0 ? (
          <p className="muted">Terminez sur le podium pour remplir l’armoire à trophées.</p>
        ) : (
          <ul className="results">
            {s.trophies.slice(0, 10).map((t, i) => (
              <li key={i}>
                <span>{t.position === 1 ? '🏆' : t.position === 2 ? '🥈' : '🥉'}</span>
                <span className="grow">{t.label}</span>
                <span className="muted">S{t.season}</span>
              </li>
            ))}
          </ul>
        )}
        <ul className="kv">
          <li>
            <span>Matchs / victoires</span>
            <b>
              {s.stats.matchesPlayed} / {s.stats.wins}
            </b>
          </li>
          <li>
            <span>Temps de jeu</span>
            <b>{duration(s.stats.playTime)}</b>
          </li>
        </ul>
      </section>

      <section className="card">
        <h2>Journal</h2>
        <ul className="log">
          {s.log.slice(0, 12).map((l, i) => (
            <li key={i} className={`log-${l.kind}`}>
              {l.text}
            </li>
          ))}
        </ul>
      </section>

      <section className="card">
        <h2>Paramètres du club</h2>
        <form
          className="row"
          onSubmit={(e) => {
            e.preventDefault();
            dispatch({ type: 'rename', name });
          }}
        >
          <input value={name} maxLength={30} onChange={(e) => setName(e.target.value)} aria-label="Nom du club" />
          <button className="btn" type="submit">
            Renommer
          </button>
        </form>
        <button
          className="btn danger"
          onClick={() => {
            if (confirm('Recommencer une nouvelle partie ? Toute la progression sera perdue.')) dispatch({ type: 'reset' });
          }}
        >
          Nouvelle partie
        </button>
      </section>
    </div>
  );
}
