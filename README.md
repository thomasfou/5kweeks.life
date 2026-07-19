# 5kweeks.life

Marketing landing page for **5k Weeks** — a habit-tracker and life-calendar app that helps you see your life as a grid of weeks and fill each one with five habits that matter (goals, meditation, gratitude, exercise, fasting).

Live at **[5kweeks.life](https://5kweeks.life)** · hosted on GitHub Pages.

## Stack

React 18 + Vite + TypeScript + Tailwind v3. No animation libraries — the hero is
two static canvas layers (cold/warm life-calendar) with a CSS radial-gradient
spotlight mask driven by a single `requestAnimationFrame` loop, plus DOM
"evidence chip" overlays.

## Structure

| Path | Purpose |
| --- | --- |
| `index.html` / `privacy.html` / `terms.html` | The three Vite multi-page entry points (no client router) |
| `src/components/Hero.tsx` | Hero layers + the one rAF loop (writes CSS vars only) |
| `src/components/WeeksGrid.tsx` | Two static canvas layers A/B + CSS spotlight mask |
| `src/components/EvidenceChips.tsx` | DOM label overlays near the cursor |
| `src/lib/anim.ts`, `src/lib/grid.ts` | Pure animation/layout math (unit-tested) |
| `public/` | `CNAME`, `.nojekyll`, robots, sitemap, favicons, manifest, `og-image.png` |
| `e2e/` | Playwright smoke tests |
| `scripts/generate-og.mjs` | Regenerates `public/og-image.png` (`npm run og`) |

## Develop

```sh
npm install
npm run dev        # local dev server
npm run build      # typecheck + build → dist/
npm run preview    # serve the built dist/
npm test           # Vitest unit tests
npm run test:e2e   # Playwright smokes (builds + previews automatically)
```

## Deploy

`.github/workflows/deploy.yml` builds `dist/` and deploys it to GitHub Pages on
every push to `main`. GitHub Pages must be set to "GitHub Actions" as the source.
Static deploy files (`CNAME`, `.nojekyll`, …) live in `public/` and are copied
into `dist/` by the build.

## Notes / TODO

- App-store buttons are in a **"Coming soon"** state. When the app ships, swap
  the `aria-disabled` buttons in `src/components/StoreButtons.tsx` for real
  `<a href="…">` links to the App Store / Google Play.
- `privacy.html` / `terms.html` are sensible starting drafts — review against
  the app's actual data practices before relying on them.
