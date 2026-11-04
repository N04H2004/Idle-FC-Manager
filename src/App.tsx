import { useState } from 'react';
import Header from './components/Header';
import ClubTab from './components/ClubTab';
import SquadTab from './components/SquadTab';
import MarketTab from './components/MarketTab';
import FacilitiesTab from './components/FacilitiesTab';
import LeagueTab from './components/LeagueTab';
import OfflineModal from './components/OfflineModal';
import { useGame } from './game/store';

const TABS = [
  { key: 'club', label: 'Club', icon: '🏠' },
  { key: 'squad', label: 'Effectif', icon: '👕' },
  { key: 'market', label: 'Transferts', icon: '🔁' },
  { key: 'facilities', label: 'Infrastructures', icon: '🏗️' },
  { key: 'league', label: 'Championnat', icon: '🏆' },
] as const;

type TabKey = (typeof TABS)[number]['key'];

export default function App() {
  const s = useGame();
  const [tab, setTab] = useState<TabKey>('club');

  return (
    <div className="app">
      <Header s={s} />
      <nav className="tabs" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={tab === t.key}
            className={tab === t.key ? 'tab active' : 'tab'}
            onClick={() => setTab(t.key)}
          >
            <span className="tab-icon">{t.icon}</span>
            <span className="tab-label">{t.label}</span>
            {t.key === 'market' && s.market.length > 0 && <span className="badge">{s.market.length}</span>}
          </button>
        ))}
      </nav>
      <main className="content">
        {tab === 'club' && <ClubTab s={s} />}
        {tab === 'squad' && <SquadTab s={s} />}
        {tab === 'market' && <MarketTab s={s} />}
        {tab === 'facilities' && <FacilitiesTab s={s} />}
        {tab === 'league' && <LeagueTab s={s} />}
      </main>
      <footer className="footer">Idle FC Manager · sauvegarde automatique dans votre navigateur</footer>
      <OfflineModal />
    </div>
  );
}
