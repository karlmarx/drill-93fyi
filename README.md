# drill-93fyi

https://drill.93.fyi: pickleball drill picker and scoreboard for two players (Karl and Roger).

Vite + React + TypeScript static SPA, offline-capable PWA. No backend; state lives in
`localStorage` (`drill93:v1`). Picks are shared with a link (`#from=Karl&picks=w1,g1`).

```sh
npm install
npm run dev        # local dev
npm test           # scoring + share-link tests (vitest)
npm run lint && npm run typecheck
npm run build      # validates src/data/drills.json, then builds dist/
```

- Drill data: `src/data/drills.json` (single source of truth). See `docs/ADDING_DRILLS.md`.
- Scoring engine: `src/lib/score.ts`.
- Storage: `src/lib/storage.ts` (`SyncAdapter` interface, `LocalAdapter` only for now).

Deploys: Vercel project `drill-93fyi` (team karlmarxs-projects) is linked to this repo.
Merges to `main` deploy to production; PRs get preview URLs.
