import { useSyncExternalStore } from 'react';
import { SAVE_KEY, SAVE_VERSION } from './constants';
import * as E from './engine';
import type { FacilityKey, FormationKey, GameState, OfflineReport, Tactic } from './types';

export type Action =
  | { type: 'tick'; dt: number }
  | { type: 'train' }
  | { type: 'upgrade'; key: FacilityKey }
  | { type: 'buy'; id: string }
  | { type: 'sell'; id: string }
  | { type: 'tactic'; tactic: Tactic }
  | { type: 'formation'; formation: FormationKey }
  | { type: 'rename'; name: string }
  | { type: 'reset'; name?: string };

function reduce(s: GameState, a: Action): GameState {
  switch (a.type) {
    case 'tick':
      E.tick(s, a.dt);
      return s;
    case 'train':
      E.trainClick(s);
      return s;
    case 'upgrade':
      E.upgradeFacility(s, a.key);
      return s;
    case 'buy':
      E.buyPlayer(s, a.id);
      return s;
    case 'sell':
      E.sellPlayer(s, a.id);
      return s;
    case 'tactic':
      s.tactic = a.tactic;
      return s;
    case 'formation':
      s.formation = a.formation;
      return s;
    case 'rename': {
      const name = a.name.trim().slice(0, 30);
      if (name) s.clubName = name;
      return s;
    }
    case 'reset':
      return E.newGame(a.name || s.clubName);
  }
}

function load(): { state: GameState; report: OfflineReport | null } {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) {
      const saved = JSON.parse(raw) as GameState;
      if (saved.version === SAVE_VERSION) {
        const elapsed = (Date.now() - saved.lastSaved) / 1000;
        const report = elapsed > 30 ? E.simulateOffline(saved, elapsed) : null;
        return { state: saved, report };
      }
    }
  } catch {
    /* sauvegarde illisible : nouvelle partie */
  }
  return { state: E.newGame(), report: null };
}

const initial = load();
let state = initial.state;
let offlineReport = initial.report;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function dispatch(action: Action) {
  const draft = structuredClone(state);
  state = reduce(draft, action);
  if (action.type === 'reset') save();
  emit();
}

export function save() {
  try {
    state.lastSaved = Date.now();
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch {
    /* stockage indisponible */
  }
}

export const getState = () => state;
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
export const useGame = () => useSyncExternalStore(subscribe, getState);

export const getOfflineReport = () => offlineReport;
export const clearOfflineReport = () => {
  offlineReport = null;
  emit();
};

let started = false;
export function startLoop() {
  if (started) return;
  started = true;
  let last = performance.now();
  setInterval(() => {
    const now = performance.now();
    const dt = Math.min((now - last) / 1000, 5);
    last = now;
    dispatch({ type: 'tick', dt });
  }, 250);
  setInterval(save, 5000);
  window.addEventListener('beforeunload', save);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') save();
    else {
      // Rattraper le temps passé en arrière-plan (les onglets cachés sont ralentis).
      const elapsed = (Date.now() - state.lastSaved) / 1000;
      if (elapsed > 30) {
        const draft = structuredClone(state);
        offlineReport = E.simulateOffline(draft, elapsed);
        state = draft;
        last = performance.now();
        save();
        emit();
      }
    }
  });
}
