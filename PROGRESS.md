# 5k Weeks — Progress & Status

_Last updated: 2026-07-18_

Status of the landing-site rebuild: the static single-page site was replaced with an
animated React/Vite/TS/Tailwind hero. Full build spec lives in `FABLE-BRIEF.md`.

## Done

- **Rebuilt the site** as a fullscreen animated "life in weeks" hero + four scroll
  sections (How it works, the five habits, the science, download) + two static legal
  pages. Merged to `main` in PR #1 (merge commit `bc1728a`).
- **Hero interaction:** cold grid of ~4,600 week-cells that a cursor-following spotlight
  lights warm; DOM evidence chips ("walked daily", "called Dad") bloom near the cursor.
  Two static canvas layers + CSS `--mx`/`--my` mask, one rAF loop, no per-frame redraw.
  Touch → auto-sweep; reduced-motion → static pre-lit path; full keyboard access; mobile
  scrim keeps hero copy legible under 640px.
- **Build/deploy:** Vite multi-page (`index/privacy/terms.html`, no SPA router), deploy
  files in `public/`, `.github/workflows/deploy.yml` added.
- **Review + QA trail:** `/plan-design-review` (6→9/10), `/plan-eng-review` (CLEAR), live
  browser QA, and a mobile-legibility fix cycle.
- **Tests green:** 38 Vitest units + 7 Playwright smokes; `npm run build` clean.

## Reference links

- PR: https://github.com/thomasfou/5kweeks.life/pull/1 (merged)
- Interactive preview (fixed build): https://claude.ai/code/artifact/605838c8-6a33-4710-b794-3c397502e115
- Build spec: `FABLE-BRIEF.md`

## Remaining work

### Blocking — go live
- [ ] **Switch GitHub Pages source to "GitHub Actions"** (repo Settings → Pages). The
      site now builds to `dist/`; without this the Actions deploy won't take effect.
      Only the repo owner can do this.
- [ ] **Verify the live deploy** at https://5kweeks.life renders after the Pages switch.

### Content sign-off (only the owner can supply)
- [ ] **Store buttons are "Coming soon" placeholders** with no links
      (`src/components/StoreButtons.tsx`). Add real App Store / Google Play URLs when the
      app ships.
- [ ] **Privacy / Terms** ported from the old drafts — review against the app's actual
      data practices (they mention birth date, life-expectancy horizon, fasting entries,
      iCloud sync).
- [ ] **Science section citations** (`src/components/sections/Science.tsx`) cite real
      studies (Lee 2022 Circulation, Li 2018, Goyal 2014 JAMA IM, Chen 2024). Confirm you
      stand behind how they're represented — it's the one health claim on the site.

### Optional polish
- [ ] Desktop headline italic "weeks." bleeds slightly over the grid's top edge
      (cosmetic, sits in the dark band).
- [ ] Literal per-cell week numbers (1…4,600). Cells are 6–9px, so decade labels + the
      live "week N" serif readout were used instead. Real numbers would be tricky work.
- [ ] No analytics on the page — add if you want to measure landing traffic/conversions.

### Deferred by design (not building unless requested)
- Live "your actual weeks" counter from a birthdate input → deferred to the app.
- Photographic life-moments in the reveal → chose labeled chips; revisit only if
  photography is commissioned.
- Blog/journal routes → cut from the nav.

## Local dev

```sh
npm install
npm run dev          # local dev server
npm run build        # → dist/ (multi-page: index/privacy/terms.html)
npm test             # Vitest units
npm run test:e2e     # Playwright smokes
```
