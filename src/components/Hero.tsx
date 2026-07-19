import { useCallback, useEffect, useRef, useState } from 'react';
import { CURRENT_AGE_YEARS, CURRENT_WEEK_OF_YEAR } from '../constants';
import {
  damp,
  parallaxOffset,
  pulseAlpha,
  selectMode,
  sweepPosition,
  type Mode,
} from '../lib/anim';
import { cellAtPoint, computeLayout, weekIndex, type GridLayout } from '../lib/grid';
import EvidenceChips, { type ChipsHandle } from './EvidenceChips';
import StoreButtons from './StoreButtons';
import WeeksGrid, { drawPulseFrame } from './WeeksGrid';

const CURRENT_WEEK = weekIndex(CURRENT_AGE_YEARS, CURRENT_WEEK_OF_YEAR);
const TAP_HOLD_MS = 3500; // a tap repositions the sweep spotlight for this long

/** Impure matchMedia wrapper; returns null when detection is unavailable. */
function readMedia(): { coarse: boolean | null; reduced: boolean | null } {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return { coarse: null, reduced: null };
  }
  try {
    return {
      coarse: window.matchMedia('(pointer: coarse)').matches,
      reduced: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    };
  } catch {
    return { coarse: null, reduced: null };
  }
}

export default function Hero() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const pulseCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const chipsRef = useRef<ChipsHandle | null>(null);
  const readoutRef = useRef<HTMLSpanElement | null>(null);
  // Pointer lives in a ref — NEVER React state (no per-frame re-render).
  const pointerRef = useRef({ x: 0, y: 0, moved: false });
  const tapRef = useRef({ x: 0, y: 0, at: -Infinity });

  const [mode, setMode] = useState<Mode>(() => {
    const m = readMedia();
    return selectMode(m.coarse, m.reduced);
  });
  const [layout, setLayout] = useState<GridLayout | null>(null);

  const measure = useCallback(() => {
    const el = sectionRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const w = rect.width || window.innerWidth;
    const h = rect.height || window.innerHeight;
    setLayout(computeLayout(w, h));
  }, []);

  // Measure at mount; re-measure (debounced) on resize. Cached here so the
  // rAF loop never reads layout.
  useEffect(() => {
    measure();
    let timer: number | undefined;
    const onResize = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(measure, 150);
    };
    window.addEventListener('resize', onResize);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('resize', onResize);
    };
  }, [measure]);

  // Re-select mode when media queries change.
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    let queries: MediaQueryList[];
    try {
      queries = [
        window.matchMedia('(pointer: coarse)'),
        window.matchMedia('(prefers-reduced-motion: reduce)'),
      ];
    } catch {
      return;
    }
    const onChange = () => {
      const m = readMedia();
      setMode(selectMode(m.coarse, m.reduced));
    };
    for (const q of queries) q.addEventListener?.('change', onChange);
    return () => {
      for (const q of queries) q.removeEventListener?.('change', onChange);
    };
  }, []);

  // Pointer listeners (none in static mode).
  useEffect(() => {
    const el = sectionRef.current;
    if (!el || mode === 'static') return;
    const toLocal = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    const onMove = (e: PointerEvent) => {
      const p = toLocal(e);
      pointerRef.current = { x: p.x, y: p.y, moved: true };
    };
    const onDown = (e: PointerEvent) => {
      const p = toLocal(e);
      tapRef.current = { x: p.x, y: p.y, at: performance.now() };
    };
    if (mode === 'follow') el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerdown', onDown);
    return () => {
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerdown', onDown);
    };
  }, [mode]);

  // THE one rAF loop: writes CSS custom properties/transform vars, repaints
  // the single pulsing current-week cell, and feeds the chips. Nothing else.
  useEffect(() => {
    const el = sectionRef.current;
    if (!el || !layout || mode === 'static') return;
    const w = layout.viewportW;
    const h = layout.viewportH;
    const cx = w / 2;
    const cy = h / 2;
    let sx = w / 2;
    let sy = h * 0.45;
    let px = 0;
    let py = 0;
    let lastReadout = 0;
    let raf = 0;

    const tick = (t: number) => {
      let tx: number;
      let ty: number;
      if (mode === 'follow') {
        if (pointerRef.current.moved) {
          tx = pointerRef.current.x;
          ty = pointerRef.current.y;
        } else {
          // idle centered until first move
          tx = w / 2;
          ty = h * 0.45;
        }
      } else if (t - tapRef.current.at < TAP_HOLD_MS) {
        tx = tapRef.current.x;
        ty = tapRef.current.y;
      } else {
        const p = sweepPosition(t, w, h);
        tx = p.x;
        ty = p.y;
      }
      sx = damp(sx, tx, 0.1);
      sy = damp(sy, ty, 0.1);
      el.style.setProperty('--mx', `${sx.toFixed(1)}px`);
      el.style.setProperty('--my', `${sy.toFixed(1)}px`);
      px = damp(px, parallaxOffset(sx, cx, w / 2, 16), 0.06);
      py = damp(py, parallaxOffset(sy, cy, h / 2, 16), 0.06);
      el.style.setProperty('--px', `${px.toFixed(2)}px`);
      el.style.setProperty('--py', `${py.toFixed(2)}px`);
      // the ONLY per-frame canvas work: one pulsing cell
      const pc = pulseCanvasRef.current;
      if (pc) drawPulseFrame(pc, layout.cell, pulseAlpha(t));
      chipsRef.current?.update(sx, sy, t);
      if (readoutRef.current && t - lastReadout > 120) {
        lastReadout = t;
        const idx = cellAtPoint(sx, sy, layout);
        readoutRef.current.textContent =
          idx === null ? '' : `week ${(idx + 1).toLocaleString('en-US')}`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [mode, layout]);

  const isStatic = mode === 'static';

  return (
    <section
      id="hero"
      ref={sectionRef}
      data-mode={mode}
      className="relative h-screen overflow-hidden bg-[#050507]"
      style={
        {
          '--mx': '50%',
          '--my': '45%',
          '--px': '0px',
          '--py': '0px',
        } as React.CSSProperties
      }
    >
      {/* z-0 — ambient texture grid, drifts opposite the cursor */}
      <div
        aria-hidden="true"
        className="texture-grid absolute -inset-16 z-0"
        style={
          isStatic ? undefined : { transform: 'translate3d(var(--px), var(--py), 0)' }
        }
      />

      {/* z-10 — atmosphere: deep radial vignette, cool cast */}
      <div
        aria-hidden="true"
        className="absolute inset-0 z-10"
        style={{
          background:
            'radial-gradient(ellipse 120% 90% at 50% 40%, rgba(5,5,7,0) 0%, rgba(5,5,7,0.5) 68%, rgba(5,5,7,0.9) 100%)',
        }}
      />

      {/* z-20 — the Weeks Grid: two static canvas layers + CSS mask */}
      <div
        aria-hidden="true"
        className="grid-fade-in absolute inset-0 z-20"
        style={
          isStatic
            ? undefined
            : {
                transform:
                  'translate3d(calc(var(--px) * 0.45), calc(var(--py) * 0.45), 0)',
              }
        }
      >
        <WeeksGrid
          layout={layout}
          mode={mode}
          currentWeek={CURRENT_WEEK}
          pulseCanvasRef={pulseCanvasRef}
        />
      </div>

      {/* z-30 — evidence chips (DOM overlays) */}
      {layout && (
        <EvidenceChips ref={chipsRef} layout={layout} mode={mode} currentWeek={CURRENT_WEEK} />
      )}

      {/* z-30 — quiet text zone: dims the spotlight to ~40% under the copy */}
      <div
        aria-hidden="true"
        className="absolute inset-y-0 left-0 z-30 w-full md:w-[64%]"
        style={{
          background:
            'radial-gradient(ellipse 78% 64% at 30% 52%, rgba(5,5,7,0.72) 0%, rgba(5,5,7,0.42) 55%, rgba(5,5,7,0) 78%)',
        }}
      />

      {/* z-30 — mobile-only scrim: below sm the grid runs full-bleed behind
          the copy, so back the text zone with --bg fading to transparent.
          Desktop needs none (the copy already sits in the dark left band). */}
      <div
        aria-hidden="true"
        data-testid="hero-scrim"
        className="hero-copy-scrim absolute inset-0 z-30 sm:hidden"
      />

      {/* big serif week readout (decorative) */}
      <span
        ref={readoutRef}
        aria-hidden="true"
        className="week-readout absolute bottom-6 right-8 z-30 hidden text-4xl md:block"
      />

      {/* z-40 — hero copy in the quiet band */}
      <div className="relative z-40 flex h-full items-center">
        <div className="mx-auto w-full max-w-6xl px-6 md:px-10">
          <div className="max-w-2xl pt-10">
            <h1 className="font-serif text-5xl leading-[1.05] tracking-tight text-white sm:text-6xl lg:text-7xl xl:text-8xl">
              See your life in weeks.{' '}
              <em className="text-warmhot">Live them on purpose.</em>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-white/60 sm:text-lg">
              The average life is about 4,000 weeks. 5k Weeks helps you notice
              them, shape them, and live more of them intentionally.
            </p>
            <div className="mt-9">
              <StoreButtons />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
