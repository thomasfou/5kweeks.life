import { memo, useEffect, useRef, useState } from 'react';
import { TOTAL_WEEKS } from '../constants';
import type { Mode } from '../lib/anim';
import { cellPosition, intentionalPathCells, type GridLayout } from '../lib/grid';

interface Props {
  layout: GridLayout | null;
  mode: Mode;
  currentWeek: number;
  pulseCanvasRef: React.MutableRefObject<HTMLCanvasElement | null>;
}

/** Deterministic per-cell pseudo-noise in [0, 1). */
const hash01 = (i: number) => (((i * 2654435761) >>> 0) % 1000) / 1000;

/** Lerp between --cell-warm (#f5b642) and --cell-warm-hot (#ffd98a). */
function warmColor(t: number): string {
  const r = Math.round(245 + (255 - 245) * t);
  const g = Math.round(182 + (217 - 182) * t);
  const b = Math.round(66 + (138 - 66) * t);
  return `rgb(${r}, ${g}, ${b})`;
}

/** Layer A: the cold slate calendar. Painted ONCE (plus decade labels). */
function paintCold(
  ctx: CanvasRenderingContext2D,
  layout: GridLayout,
  currentWeek: number,
): void {
  ctx.clearRect(0, 0, layout.viewportW, layout.viewportH);
  for (let i = 0; i < TOTAL_WEEKS; i++) {
    const col = i % layout.cols;
    const row = (i / layout.cols) | 0;
    const x = layout.offsetX + col * layout.pitch;
    const y = layout.offsetY + row * layout.pitch;
    const past = i < currentWeek;
    const a = (past ? 0.46 : 0.22) + hash01(i) * 0.12;
    ctx.fillStyle = `rgba(51, 65, 85, ${a.toFixed(3)})`;
    ctx.fillRect(x, y, layout.cell, layout.cell);
  }
  // Faint decade labels down the side — "this is a life"
  ctx.font = 'italic 13px "Instrument Serif", Georgia, serif';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
  for (let age = 10; age <= 80; age += 10) {
    const y = layout.offsetY + age * layout.pitch + layout.cell / 2;
    ctx.fillText(String(age), layout.offsetX - 10, y);
  }
}

/**
 * Layer B: the warm calendar. Painted ONCE. In `static` mode only the
 * pre-lit "intentional path" (plus a soft halo) is painted, so the thesis
 * reads with zero motion.
 */
function paintWarm(
  ctx: CanvasRenderingContext2D,
  layout: GridLayout,
  staticPath: Set<number> | null,
): void {
  ctx.clearRect(0, 0, layout.viewportW, layout.viewportH);
  const drawCell = (i: number, alpha: number) => {
    const col = i % layout.cols;
    const row = (i / layout.cols) | 0;
    const x = layout.offsetX + col * layout.pitch;
    const y = layout.offsetY + row * layout.pitch;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = warmColor(hash01(i));
    ctx.fillRect(x, y, layout.cell, layout.cell);
  };
  if (staticPath) {
    // soft halo of neighbours first, then the path itself
    for (const i of staticPath) {
      const col = i % layout.cols;
      const row = (i / layout.cols) | 0;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const c = col + dc;
          const r = row + dr;
          if (c < 0 || c >= layout.cols || r < 0) continue;
          const j = r * layout.cols + c;
          if (j < TOTAL_WEEKS && !staticPath.has(j)) drawCell(j, 0.22);
        }
      }
    }
    for (const i of staticPath) drawCell(i, 0.95);
  } else {
    for (let i = 0; i < TOTAL_WEEKS; i++) drawCell(i, 0.82 + hash01(i + 13) * 0.18);
  }
  ctx.globalAlpha = 1;
}

/**
 * The ONLY per-frame canvas paint in the whole hero: one pulsing
 * current-week cell (with a soft glow) on its own tiny canvas.
 */
export function drawPulseFrame(
  canvas: HTMLCanvasElement,
  cell: number,
  alpha: number,
): void {
  try {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const size = canvas.width;
    const c = size / 2;
    ctx.clearRect(0, 0, size, size);
    const g = ctx.createRadialGradient(c, c, 0, c, c, size / 2);
    g.addColorStop(0, `rgba(245, 182, 66, ${(0.28 + alpha * 0.35).toFixed(3)})`);
    g.addColorStop(1, 'rgba(245, 182, 66, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = `rgba(255, 217, 138, ${(0.65 + alpha * 0.35).toFixed(3)})`;
    ctx.fillRect(c - cell / 2, c - cell / 2, cell, cell);
  } catch {
    // decorative only — never let a paint failure propagate
  }
}

/**
 * TWO static canvas layers: cold grid A painted once, warm grid B painted
 * once and revealed through the CSS radial-gradient mask positioned by
 * --mx/--my. No per-frame full redraw, ever.
 */
export default memo(function WeeksGrid({
  layout,
  mode,
  currentWeek,
  pulseCanvasRef,
}: Props) {
  const [failed, setFailed] = useState(false);
  const coldRef = useRef<HTMLCanvasElement | null>(null);
  const warmRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!layout || failed) return;
    const cold = coldRef.current;
    const warm = warmRef.current;
    if (!cold || !warm) return;
    try {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      for (const c of [cold, warm]) {
        c.width = Math.round(layout.viewportW * dpr);
        c.height = Math.round(layout.viewportH * dpr);
      }
      const coldCtx = cold.getContext('2d');
      const warmCtx = warm.getContext('2d');
      if (!coldCtx || !warmCtx) throw new Error('no 2d context');
      coldCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      warmCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      paintCold(coldCtx, layout, currentWeek);
      const staticPath =
        mode === 'static'
          ? new Set(intentionalPathCells(currentWeek, layout.cols))
          : null;
      paintWarm(warmCtx, layout, staticPath);

      // Position + first paint of the pulse canvas (the rAF loop repaints it;
      // in static mode this single steady paint is all there is).
      const pc = pulseCanvasRef.current;
      if (pc) {
        const size = Math.max(24, layout.pitch * 6);
        pc.width = size;
        pc.height = size;
        pc.style.width = `${size}px`;
        pc.style.height = `${size}px`;
        const pos = cellPosition(currentWeek, layout);
        pc.style.left = `${pos.cx - size / 2}px`;
        pc.style.top = `${pos.cy - size / 2}px`;
        drawPulseFrame(pc, layout.cell, mode === 'static' ? 1 : 0.6);
      }
    } catch {
      setFailed(true);
    }
  }, [layout, mode, currentWeek, failed, pulseCanvasRef]);

  if (failed) {
    // Canvas failed → CSS static warm "intentional path": still on-message.
    return (
      <div aria-hidden="true" data-grid-fallback className="grid-css-fallback absolute inset-0" />
    );
  }

  return (
    <div aria-hidden="true" className="absolute inset-0">
      <canvas ref={coldRef} data-canvas="cold" className="absolute inset-0 h-full w-full" />
      <canvas
        ref={warmRef}
        data-canvas="warm"
        className={`absolute inset-0 h-full w-full${mode === 'static' ? '' : ' spotlight-mask'}`}
      />
      <canvas ref={pulseCanvasRef} data-canvas="pulse" className="absolute" />
    </div>
  );
});
