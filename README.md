# ⚽ Idle FC Manager

Un jeu **idle / incrémental** de gestion de club de football, jouable dans le navigateur.
Partez de la division Régionale avec une équipe d'amateurs et menez votre club jusqu'au titre en **Ligue Élite** —
le club continue de jouer, de s'entraîner et de gagner de l'argent même quand vous fermez l'onglet.

[![Déployer avec Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FN04H2004%2FIdle-FC-Manager&project-name=idle-fc-manager)

## Fonctionnalités

- **Championnat automatique** : 10 clubs par division, 18 journées aller-retour, une journée toutes les 45 s.
- **5 divisions** avec promotions (top 2) et relégations (2 derniers), primes de fin de saison et palmarès.
- **Effectif** : progression des joueurs par l'XP (entraînement passif, matchs, clics), potentiel, âge, retraites.
- **XI automatique** selon la formation choisie (4-4-2, 4-3-3, 3-5-2, 5-3-2, 4-5-1) et **tactique** (défensive / équilibrée / offensive).
- **Marché des transferts** renouvelé régulièrement, achat / revente de joueurs.
- **Infrastructures** : stade, centre d'entraînement, centre de formation (jeunes talents), marketing, cellule de recrutement.
- **Économie** : sponsors, billetterie, primes de victoire, masse salariale.
- **Progression hors ligne** (jusqu'à 4 h) avec récapitulatif au retour, sauvegarde automatique (`localStorage`).
- Interface responsive (mobile & desktop), en français.

## Stack

React 18 + TypeScript + Vite. Aucun backend : tout tourne dans le navigateur.
Le moteur de jeu (`src/game/engine.ts`) est indépendant de l'interface et testé avec Vitest.

```
src/
  game/        moteur du jeu (types, constantes, simulation, store, tests)
  components/  onglets de l'interface (Club, Effectif, Transferts, Infrastructures, Championnat)
```

## Développement

```bash
npm install
npm run dev      # serveur de dev
npm test         # tests du moteur (calendrier, saisons, équilibrage)
npm run build    # build de production dans dist/
```

## Déploiement sur Vercel

Le dépôt contient un `vercel.json` (framework Vite, sortie `dist`).

1. Cliquez sur le bouton **Déployer avec Vercel** ci-dessus, ou allez sur <https://vercel.com/new> et importez le dépôt `N04H2004/Idle-FC-Manager`.
2. Vercel détecte automatiquement Vite : laissez les réglages par défaut et cliquez sur **Deploy**.
3. Chaque push sur la branche de production redéploie le jeu automatiquement (et chaque PR obtient une preview).

Ou en ligne de commande :

```bash
npx vercel --prod
```
