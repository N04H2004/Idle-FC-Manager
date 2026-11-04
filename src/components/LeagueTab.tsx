import { DIVISIONS, PLAYER_ID, PROMOTED, RELEGATED, ROUNDS, TEAMS_PER_DIVISION, divisionInfo } from '../game/constants';
import { sortStandings, teamName } from '../game/engine';
import { money } from '../game/format';
import type { GameState } from '../game/types';

export default function LeagueTab({ s }: { s: GameState }) {
  const table = sortStandings(s.standings);
  const div = divisionInfo(s.division);
  const strength = (id: string) => s.aiTeams.find((t) => t.id === id)?.strength;
  return (
    <div className="grid wide-first">
      <section className="card">
        <div className="row between wrap">
          <h2>{div.name}</h2>
          <span className="muted small">
            Journée {Math.min(s.round, ROUNDS)}/{ROUNDS} · Prime du champion {money(div.prize)}
          </span>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th className="left">Club</th>
                <th>J</th>
                <th>G</th>
                <th>N</th>
                <th>P</th>
                <th>Diff</th>
                <th>Pts</th>
              </tr>
            </thead>
            <tbody>
              {table.map((t, i) => {
                const promo = i < PROMOTED && s.division > 1;
                const releg = i >= TEAMS_PER_DIVISION - RELEGATED && s.division < DIVISIONS.length;
                return (
                  <tr key={t.teamId} className={`${t.teamId === PLAYER_ID ? 'me' : ''} ${promo ? 'promo' : ''} ${releg ? 'releg' : ''}`}>
                    <td>{i + 1}</td>
                    <td className="left">
                      {teamName(s, t.teamId)}
                      {t.teamId !== PLAYER_ID && <span className="muted small"> ({strength(t.teamId)})</span>}
                    </td>
                    <td>{t.played}</td>
                    <td>{t.won}</td>
                    <td>{t.drawn}</td>
                    <td>{t.lost}</td>
                    <td>{t.gf - t.ga > 0 ? `+${t.gf - t.ga}` : t.gf - t.ga}</td>
                    <td>
                      <b>{t.pts}</b>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="muted small legend">
          <span className="dot promo" /> Promotion <span className="dot releg" /> Relégation · (force de l’adversaire)
        </p>
      </section>
      <section className="card">
        <h2>Dernière journée</h2>
        {s.lastRound.length === 0 ? (
          <p className="muted">La saison n’a pas encore commencé.</p>
        ) : (
          <ul className="fixtures">
            {s.lastRound.map((m, i) => (
              <li key={i} className={m.homeId === PLAYER_ID || m.awayId === PLAYER_ID ? 'me' : ''}>
                <span className="home">{teamName(s, m.homeId)}</span>
                <b className="score">
                  {m.homeGoals} - {m.awayGoals}
                </b>
                <span className="away">{teamName(s, m.awayId)}</span>
              </li>
            ))}
          </ul>
        )}
        <h3>Divisions</h3>
        <ol className="divisions">
          {DIVISIONS.map((d) => (
            <li key={d.id} className={d.id === s.division ? 'current' : ''}>
              <span>{d.name}</span>
              <span className="muted small">niveau ~{d.base}</span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
