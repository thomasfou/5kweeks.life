# Fable build prompt: 5k Weeks — cinematic "life in weeks" landing page

> This is the finished brief after a design review. It reuses the *animation DNA* of a
> reference site (cursor-following spotlight reveal, grid parallax, frosted-glass nav)
> but the concept, copy, and every layer are 5k Weeks' own. Hand this whole file to
> Claude Fable.

## Mission
Replace the current static `index.html` with a **React + Vite + TypeScript + Tailwind**
landing page for **5k Weeks**, a mindful-living app built on one idea: a life is only
about **4,000 weeks**, and you can *live more of them on purpose.* The signature moment
is a fullscreen (100vh) hero built on a **literal life-calendar grid of weeks** that is
cold and dim by default; a **soft spotlight that follows the cursor lights those weeks
warm** — and the few cells nearest the cursor **bloom into concrete evidence of a week
lived on purpose** ("walked daily", "called Dad", "screen-free Sunday"). *The
interaction is the thesis: attention is what turns time into a life.* Below the hero,
a short scroll gives the product real substance.

## Design decisions (resolved — do not re-litigate)
1. **Direction:** the "numbered life-calendar grid + reveal" concept (reference mockup:
   `variant-B-moments-reveal.png`). The base layer is an unmistakable grid of weeks
   numbered 1…~4,600, reading as one human life.
2. **Page scope:** cinematic 100vh hero that feels complete on its own, **followed by a
   short scroll**: How it works → The five habits → The science → Download.
3. **Reveal content:** **hybrid** — cold cells light warm inside the spotlight, and the
   handful nearest the cursor center **resolve into small labeled "intentional week"
   chips** (real product evidence, not stock photos). Rotate through a curated set of
   ~12 labels.
4. **Headline:** **"See your life in weeks. Live them on purpose."**
5. **4k→5k framing:** hero leads with *intentional living* (safe, on-brand). The
   **modern-science / healthspan** case lives in a dedicated "The science" scroll
   section where it has room for nuance — never an implied "live longer" promise in the
   hero.
6. **Touch / no-hover:** spotlight **auto-sweeps on a gentle loop** so mobile still shows
   weeks coming alive; tap also repositions it. Keyboard and reduced-motion get a static
   pre-lit "intentional path" so the meaning reads without motion.

## Tech stack
React 18 + Vite + TypeScript + Tailwind v3 (add a custom `xs` breakpoint ~400px). No
animation libraries; all motion is a single hand-rolled `requestAnimationFrame` loop
plus canvas. Minimal dependencies.

### Deploy compatibility (GitHub Pages, apex domain)
- Keep and serve from `public/`: `CNAME` (`5kweeks.life`), `.nojekyll`, `robots.txt`,
  `favicon.svg`/`favicon.ico`, `apple-touch-icon.png`, `icon-192.png`, `icon-512.png`,
  `site.webmanifest`.
- Vite `base: '/'`, build to `dist/`.
- **No client-side router.** GitHub Pages has no SPA fallback, so `/privacy` and
  `/terms` are built as **separate static HTML entry points via Vite multi-page**
  (Rollup `build.rollupOptions.input = { main: 'index.html', privacy: 'privacy.html',
  terms: 'terms.html' }`). Direct loads and refreshes just work; only the hero page
  ships the interactive JS bundle. Port the existing privacy/terms content into these
  two pages. Regenerate `sitemap.xml` for `/`, `/privacy`, `/terms`.
- Delete old `_assets/` and `og-image.png` from the old product (regenerate a new OG
  image for the new hero).

## Fonts
- **Inter** (Google, 300–700) — global default. `* { font-family: 'Inter', sans-serif; }`
- **Instrument Serif** (Google, `ital@0;1`) — headline and the big week numbers only.
  `https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&display=swap`

## Color system (define as CSS variables)
- `--bg: #050507` (matches existing theme-color), cool near-black.
- `--cell-cold: #334155` (slate) at low alpha — unlived/unattended weeks.
- `--cell-warm: #f5b642` → `--cell-warm-hot: #ffd98a` — the amber "lived" gradient.
- `--text: #ffffff`, `--text-dim: rgba(255,255,255,0.6)`.
- One accent only (the amber). No purple/indigo. Warm/cold contrast carries the whole
  emotional arc — keep everything else near-monochrome.

## HERO — layer stack (single 100vh `<section>`, `overflow-hidden`, `bg-[--bg]`)

**z-0 — texture grid.** Faint 48px SVG pattern, opacity ~0.06, slate stroke, as ambient
texture *behind* the calendar. Parallax-drifts opposite the cursor:
`offset = (cursor − sectionCenter) * 16`, eased at `0.06` in the shared rAF loop.

**z-10 — atmosphere.** Deep radial gradient, near-black cool cast, darkest at edges
(vignette). This also forms the **quiet text zone**: keep a stable low-detail band
behind the headline (see z-40) so animation never fights the type.

**z-20 — the Weeks Grid (TWO static canvas layers — see "Render architecture" below).**
- ~4,600 cells (≈88 yrs × 52), laid out as a legible calendar: rows = years, columns =
  weeks. A few faint decade labels ("30", "40", "50") down the side sell "this is a
  life," not decoration.
- **Layer A (cold base):** slate cells at low alpha, painted ONCE at mount.
- **Layer B (warm):** the same cells in the amber gradient, painted ONCE at mount,
  stacked above A, revealed only through the spotlight mask.
- The **current week** gently pulses (a single warm cell) as a fixed anchor — this is
  the ONLY per-frame canvas work, and it's one cell.
- **Responsive:** desktop shows the full legible 52-wide calendar. On narrow viewports,
  keep the same canvas but scale/crop so cells stay visible and the grid **bleeds past
  the edges as texture** rather than shrinking to dust (never a 52-col squeeze on a
  phone). The auto-sweep (below) covers the visible region.

### Render architecture (RESOLVED — do not rebuild as a per-frame redraw)
Two pre-rendered canvas layers + a CSS mask. **No per-frame canvas redraw, no
`toDataURL()`, no dirty-rect bookkeeping.**
```
  [canvas A: cold grid]  painted once
  [canvas B: warm grid]  painted once, on top of A
        └─ CSS mask: radial-gradient(circle 260px at var(--mx) var(--my), ...)
           moved each frame by updating --mx/--my (GPU-composited)
  [DOM: evidence chips]  3–6 absolutely-positioned labels near the cursor
  [container transform]  parallax = translate3d() from the pointer offset
```
The rAF loop only writes CSS custom properties / transforms and repaints the single
pulsing current-week cell. Cells are ALWAYS canvas, NEVER 4,600 DOM nodes.

**z-30 — Spotlight reveal (the interaction).**
- The spotlight is the **CSS `radial-gradient` mask on canvas B**, radius ~260px,
  feathered stops (solid center 0–40%, then 0.75 @60%, 0.4 @75%, 0.12 @88%, 0 @100%).
  Position via `--mx`/`--my` updated each frame. Match the feather exactly.
- **Bloom-to-evidence (DOM overlays, not canvas):** the 3–6 cells nearest the cursor get
  a small **absolutely-positioned DOM label chip** (real text) that scales/fades in via
  CSS, sitting over its cell. Do NOT animate/enlarge canvas cells (that would force the
  per-frame redraw we designed out). Labels rotate through a curated set: `walked daily`,
  `called Dad`, `screen-free Sunday`, `trip booked`, `read 30 min`, `slept 8h`,
  `no alcohol`, `journaled`, `dinner with friends`, `10k steps`, `meditated`, `made art`.
  Chips fade in/out as the spotlight moves. This is what makes the animation prove the
  *product*, not just the philosophy.
- Smoothing: `smooth += (target − smooth) * 0.1` for x and y, in the one shared rAF loop.

**z-40 — Hero copy** (left-aligned, sitting in the quiet band; spotlight **dims to ~40%
under the text block** so it never competes):
- Headline (Instrument Serif, huge, responsive `text-5xl`→`text-8xl`):
  **"See your life in weeks. Live them on purpose."**
- Subhead (Inter, `--text-dim`, ≤2 lines): "The average life is about 4,000 weeks. 5k
  Weeks helps you notice them, shape them, and live more of them intentionally."
- Primary CTA group: **App Store + Google Play** buttons. (App not shipped yet — render
  them in a labelled "Coming soon" state, matching the current site's convention, not a
  vague "Start your grid".) Small pulsing amber dot as the live-status affordance.

## Navigation (z-50, fixed, `.liquid-glass` frosted pills)
- Logo top-left: reuse existing `favicon.svg` 5k Weeks mark.
- Center pill (desktop `hidden md:flex`): **How it works · Five habits · Science ·
  Get the app** — each is a real anchor to a section below (nav must not overpromise).
- Top-right CTA pill: pulsing amber dot + **"Get the app"**.
- Mobile hamburger → fullscreen `#050507` menu, staggered slide-up entry
  (`translateY(24px)`→0, opacity 0→1, +60ms stagger from 100ms,
  `cubic-bezier(0.77,0,0.18,1)`), body-scroll lock, close button rotates in from −90°.
- `.liquid-glass` = the border-only gradient via mask-composite (see appendix).

## Scroll sections (below the hero — keep them tight, one job each)
1. **How it works** — 3 quiet steps (see your weeks · pick five habits · fill each week).
   No 3-column icon-in-circle SaaS grid; use a horizontal rhythm or a single annotated
   grid visual reusing the hero canvas at rest.
2. **The five habits** — goals, meditation, gratitude, exercise, fasting (the app's real
   five). One line each, calm.
3. **The science** — where the "do better than 4,000 weeks with modern health science"
   argument lives, with citation-grade specifics. This is the *only* place longevity is
   claimed, and it's argued, not asserted.
4. **Download** — repeat CTA, App Store + Google Play (Coming soon state).

## Interaction states (specify what the USER sees)
| Element | Loading | Empty/none | Error | Reduced-motion | Touch/no-hover |
|---|---|---|---|---|---|
| Weeks grid | Cells fade in cold over ~600ms | n/a | If canvas fails, CSS static warm "intentional path" | Static: a pre-lit warm cluster + current-week pulse off | Same grid, auto-sweep spotlight |
| Spotlight | Idle centered until first move | — | Falls back to static lit cluster | No follow; fixed lit region | Auto-sweep loop + tap to place |
| Evidence chips | — | If no label set, cells just glow | — | 2–3 chips shown statically | Shown as sweep passes |
| CTA (store) | — | "Coming soon" pill | — | — | 44px+ tap targets |
| Video/asset fetch | n/a (no video in this design) | — | — | — | — |

## Engineering & accessibility requirements
- **One rAF loop** driving spotlight lerp + grid parallax; pointer stored in a `ref`
  (never React state — no per-frame re-render). Cancel loop + remove listeners on unmount.
- `matchMedia('(pointer: coarse)')` → auto-sweep mode. Tap repositions spotlight.
- `prefers-reduced-motion` → freeze parallax, no lerp, render the static pre-lit path so
  the thesis still reads; skip the staggered menu animation.
- **Keyboard:** all nav/CTA are real focusable `<a>`/`<button>` with visible focus rings;
  hero is understandable without the pointer interaction (static composition already
  shows a warm intentional path).
- Decorative layers (`grid`, `atmosphere`, `spotlight canvas`) `aria-hidden`. Menu toggles
  `aria-expanded`. Body text ≥16px, contrast ≥4.5:1 (dim text on near-black must pass —
  verify `--text-dim` against `--bg`).
- Full teardown of listeners / rAF / overflow lock in effect cleanups. Cache
  `sectionCenter` on resize, no layout reads inside the loop.
- **SEO:** keep 5k Weeks `<title>`/description/OG; `theme-color #050507`. Regenerate an
  OG image for the new hero.

## Suggested structure
```
index.html  privacy.html  terms.html   (3 Vite multi-page entry points, no router)
public/   (CNAME, .nojekyll, robots.txt, favicons, manifest, og-image.png)
src/
  constants.ts        (EVIDENCE_LABELS, color tokens if not in CSS)
  index.css           (Tailwind, .liquid-glass, * font, CSS vars)
  lib/
    anim.ts           (PURE: lerp/easing, pointer→parallax offset, mode selection)
    grid.ts           (PURE: cell-position layout, columns-per-viewport, label rotation)
  App.tsx             (hero page root; privacy/terms are plain HTML, minimal/no JS)
  components/
    Hero.tsx          (layers z-0..z-40 + the ONE rAF loop; writes CSS vars only)
    WeeksGrid.tsx      (two static canvas layers A/B + CSS mask)
    EvidenceChips.tsx  (DOM label overlays near cursor)
    Nav.tsx  MobileMenu.tsx  Logo.tsx
    sections/HowItWorks.tsx  FiveHabits.tsx  Science.tsx  Download.tsx
  lib/__tests__/       (Vitest units for anim.ts + grid.ts)
e2e/                   (Playwright smokes)
```

## Testing (build it in from the start — do not defer)
Extract the math into `src/lib/*` so it's unit-testable without a DOM/canvas.
- **Vitest units (pure logic):**
  - `anim.ts` — lerp/easing converges; `pointer→offset` mapping; `selectMode()` returns
    `follow | sweep | static` correctly from `(pointer:coarse)` + `prefers-reduced-motion`.
  - `grid.ts` — cell-position layout for N cells; columns-per-viewport at each breakpoint;
    evidence-label rotation cycles the full set without immediate repeats.
- **Playwright smokes:** hero renders; nav anchors scroll to each section; the
  `prefers-reduced-motion` path renders the static pre-lit composition (no rAF churn);
  built `dist/` contains `CNAME`, `privacy.html`, `terms.html`.
- **Skip:** canvas pixel/snapshot assertions (flaky across GPUs, high maintenance, low
  catch). The pulsing-cell and mask visuals are verified by the smoke render, not pixels.

## `.liquid-glass` (appendix — use verbatim)
```css
.liquid-glass {
  background: rgba(255,255,255,0.01);
  background-blend-mode: luminosity;
  backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px);
  border: none; box-shadow: inset 0 1px 1px rgba(255,255,255,0.1);
  position: relative; overflow: hidden;
}
.liquid-glass::before {
  content: ''; position: absolute; inset: 0; border-radius: inherit; padding: 1.4px;
  background: linear-gradient(180deg, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.15) 20%,
    rgba(255,255,255,0) 40%, rgba(255,255,255,0) 60%, rgba(255,255,255,0.15) 80%,
    rgba(255,255,255,0.45) 100%);
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor; mask-composite: exclude; pointer-events: none;
}
```

## Acceptance criteria
- Loads to a 100vh hero: a legible cold grid of ~4,600 weeks; moving the cursor lights
  weeks warm and blooms labeled evidence chips near the center; grid parallaxes opposite
  the cursor; spotlight dims under the headline.
- Headline reads "See your life in weeks. Live them on purpose."; subhead carries the
  4,000-week reference; CTA is App Store + Google Play (Coming soon).
- Below the hero: How it works, Five habits, Science, Download — nav anchors resolve.
- Mobile: auto-sweeping spotlight (never a dead grid); hamburger opens staggered menu;
  44px+ targets. Reduced-motion + keyboard paths render a static intentional path.
- `npm run dev` clean; `npm run build` → `dist/` deployable to `5kweeks.life` with
  static root files intact; `/privacy` and `/terms` render.

---

## NOT in scope (deferred, with rationale)
- Live "your actual weeks" counter from a birthdate input — great app feature, but adds
  a form + state to a marketing hero. Defer to the app.
- Real photographic moments in the reveal — chose labeled chips (cheaper, on-brand, no
  licensing). Revisit if authentic photography is commissioned.
- Full blog/journal routes implied by earlier nav drafts — nav trimmed to real sections.

## What already exists (reuse, don't reinvent)
- `favicon.svg` 5k Weeks mark → hero logo. `theme-color #050507` → `--bg`.
- The product's real five habits (goals, meditation, gratitude, exercise, fasting) and
  the "life as a grid of weeks" concept — already the brand's, now made interactive.
- Existing privacy/terms drafts → port content into the two new static HTML pages.

## Failure modes (per new codepath — test + error handling status)
| Codepath | Realistic prod failure | Test? | Error handling | User sees |
|---|---|---|---|---|
| Two-layer canvas paint | Canvas context null / paint throws | Playwright smoke | Fallback: render Layer B fully-lit (no mask) | Static warm grid, still on-message |
| rAF loop | Loop not cancelled on unmount → leak | Unit (cleanup asserted) | `cancelAnimationFrame` in effect cleanup | Nothing (leak invisible) — **must** be covered |
| `selectMode()` | Wrong branch → dead grid on touch | Vitest unit | Default to `sweep` if detection ambiguous | Auto-sweeping grid, never dead-black |
| CSS mask unsupported | Old browser ignores `mask-image` | — | `@supports` guard → Layer B fully-lit | Warm grid without spotlight (graceful) |
| Multi-page build | `privacy.html`/`terms.html` missing from `dist/` | Playwright smoke (build assert) | — | Would 404 — smoke catches it pre-deploy |

No failure mode is both silent AND untested AND unhandled. The rAF-cleanup leak is the
one to watch — it's invisible, so the unit test asserting cleanup is non-negotiable.

## Parallelization (git worktrees)
| Lane | Steps | Modules | Notes |
|---|---|---|---|
| A | T1 → T2 → T3 | `Hero`, `WeeksGrid`, `EvidenceChips`, `lib/` | Sequential — all share the hero canvas/loop |
| B | T5, T6 | `sections/`, `Nav`, `MobileMenu` | Independent of A's canvas work |
| C | T7 | `vite.config`, `index/privacy/terms.html`, `public/` | Independent scaffolding |
- Launch **A + B + C in parallel worktrees**. B's `Nav` anchors need A's section IDs to
  exist, so merge C first (scaffold), then A and B, then wire nav anchors last.
- Conflict flag: both A and B import from `lib/` and `index.css` — keep shared tokens/
  helpers landed via C before A/B diverge.

## Implementation Tasks
Synthesized from both reviews. Each derives from a finding above.

- [ ] **T0 (P1, human: ~2h / CC: ~10min)** — scaffold: Vite multi-page (3 entry points),
  Tailwind, Vitest + Playwright, `lib/anim.ts` + `lib/grid.ts` stubs, deploy wiring.
  - Surfaced by: Eng review — render architecture + legal-pages + test decisions
  - Files: `vite.config.ts`, `index.html`, `privacy.html`, `terms.html`, `public/*`
  - Verify: `npm run build` emits `dist/` with `CNAME`, `privacy.html`, `terms.html`.
- [ ] **T1 (P1, human: ~1d / CC: ~30min)** — WeeksGrid — **two static canvas layers
  (cold A / warm B) + CSS `--mx`/`--my` mask**; single rAF writes CSS vars only; pointer
  in ref; only the pulsing current-week cell repaints per frame.
  - Surfaced by: Eng review A1 (render architecture RESOLVED)
  - Files: `src/components/WeeksGrid.tsx`, `src/components/Hero.tsx`, `src/lib/anim.ts`
  - Verify: cursor reveals warm cells; no per-frame full redraw; no re-render (DevTools);
    clean unmount (rAF cancelled — unit-asserted).
- [ ] **T2 (P1, human: ~3h / CC: ~15min)** — EvidenceChips — **DOM** label overlays near
  cursor from `EVIDENCE_LABELS` (no canvas cell-scaling).
  - Surfaced by: Eng review CQ1 (chips as DOM) + Design finding 1
  - Files: `src/components/EvidenceChips.tsx`, `src/constants.ts`, `src/lib/grid.ts`
  - Verify: 3–6 labeled chips fade/scale in near cursor; labels rotate without repeats.
- [ ] **T3 (P1, human: ~3h / CC: ~15min)** — Hero — quiet text zone (spotlight dims under
  headline); headline/subhead/CTA copy per decisions.
  - Files: `src/components/Hero.tsx`
- [ ] **T4 (P1, human: ~4h / CC: ~20min)** — touch/reduced-motion/keyboard: `selectMode()`
  → auto-sweep, static pre-lit path, focus rings; responsive scaled-bleed grid on mobile.
  - Surfaced by: Design touch decision + Eng grid-responsive decision
  - Files: `Hero.tsx`, `WeeksGrid.tsx`, `src/lib/anim.ts`
  - Verify: coarse-pointer sweeps; reduced-motion static; tab reaches all CTAs; phone grid legible.
- [ ] **T5 (P1, human: ~4h / CC: ~20min)** — Vitest units (`anim.ts`, `grid.ts`) +
  Playwright smokes (render, nav scroll, reduced-motion, build artifacts).
  - Surfaced by: Eng test-scope decision
  - Files: `src/lib/__tests__/*`, `e2e/*`
- [ ] **T6 (P2, human: ~1d / CC: ~30min)** — scroll sections + Nav/MobileMenu +
  `.liquid-glass`; nav anchors resolve to section IDs.
  - Files: `src/components/sections/*`, `Nav.tsx`, `MobileMenu.tsx`, `index.css`
- [ ] **T7 (P2, human: ~2h / CC: ~10min)** — port privacy/terms content; regenerate
  sitemap + OG image.
  - Files: `privacy.html`, `terms.html`, `public/*`

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|--------|---------|-----|------|--------|----------|
| CEO Review | `/plan-ceo-review` | Scope & strategy | 0 | — | — |
| Codex Review | `/codex review` | Independent 2nd opinion | 1 | issues_found | 7 findings (metaphor self-contained, no-scroll conversion, hover-only a11y, weak headline, 4k→5k risk, heavy nav, competing layers) — all addressed |
| Eng Review | `/plan-eng-review` | Architecture & tests (required) | 1 | CLEAR | 5 issues, 0 critical gaps — render arch, legal-page routing, mobile grid, chips-as-DOM, test scope all resolved |
| Design Review | `/plan-design-review` | UI/UX gaps | 1 | issues_open→resolved | score: 6/10 → 9/10, 6 decisions made |
| DX Review | `/plan-devex-review` | Developer experience gaps | 0 | — | — |

- **CODEX:** design-stage critique confirmed scroll + hybrid-reveal + a11y and added "reveal must prove the product" + "quiet text zone" — both folded in.
- **CROSS-MODEL:** Claude + Codex agreed on all major calls (scroll, touch fallback, headline). No unresolved tension.
- **ENG DECISIONS (this pass):** (1) two static canvas layers + CSS mask, no per-frame redraw; (2) Vite multi-page static build for privacy/terms, no SPA router; (3) full-grid desktop / scaled-bleed mobile; (4) evidence chips as DOM overlays; (5) Vitest units on pure `lib/` logic + Playwright smokes.
- **UNRESOLVED:** 0.
- **VERDICT:** DESIGN + ENG CLEARED — plan is implementation-ready. No further review required before building; run `/ship` when the build lands.
