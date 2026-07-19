import { forwardRef, useImperativeHandle, useMemo, useRef } from 'react';
import { EVIDENCE_LABELS } from '../constants';
import type { Mode } from '../lib/anim';
import {
  cellPosition,
  createLabelRotator,
  intentionalPathCells,
  nearestCellIndices,
  type GridLayout,
} from '../lib/grid';

export interface ChipsHandle {
  /** Called from the ONE shared rAF loop; internally throttled. */
  update(x: number, y: number, t: number): void;
}

interface Props {
  layout: GridLayout;
  mode: Mode;
  currentWeek: number;
}

const POOL = 6; // 3–6 chips visible at a time
const NEAR_COUNT = 5;
const CAPTURE_RADIUS = 150; // px from spotlight center
const UPDATE_EVERY = 90; // ms
const SPAWN_EVERY = 140; // ms — at most one new chip per interval, keeps it calm
const FADE_OUT = 260; // ms before a slot can be reused
const MIN_SEPARATION = 96; // px between active chips so labels never overlap

interface Slot {
  cell: number;
  on: boolean;
  freeAt: number;
  x: number;
  y: number;
}

/**
 * Evidence chips: DOM overlays (real text) near the spotlight. The cells
 * themselves are never animated on canvas — these labels sit above them and
 * scale/fade in via CSS. Positioned imperatively so nothing re-renders per
 * frame.
 */
const EvidenceChips = forwardRef<ChipsHandle, Props>(function EvidenceChips(
  { layout, mode, currentWeek },
  ref,
) {
  const els = useRef<(HTMLSpanElement | null)[]>([]);
  const state = useRef({
    rotator: createLabelRotator(EVIDENCE_LABELS),
    slots: Array.from(
      { length: POOL },
      (): Slot => ({ cell: -1, on: false, freeAt: 0, x: 0, y: 0 }),
    ),
    lastUpdate: 0,
    lastSpawn: 0,
  });

  useImperativeHandle(
    ref,
    () => ({
      update(x: number, y: number, t: number) {
        const s = state.current;
        if (t - s.lastUpdate < UPDATE_EVERY) return;
        s.lastUpdate = t;
        const near = nearestCellIndices(x, y, layout, NEAR_COUNT, CAPTURE_RADIUS);
        const nearSet = new Set(near);
        // retire chips the spotlight has moved away from
        s.slots.forEach((slot, i) => {
          if (slot.on && !nearSet.has(slot.cell)) {
            slot.on = false;
            slot.freeAt = t + FADE_OUT;
            els.current[i]?.classList.remove('on');
          }
        });
        if (t - s.lastSpawn < SPAWN_EVERY) return;
        const activeSlots = s.slots.filter((sl) => sl.on);
        const active = new Set(activeSlots.map((sl) => sl.cell));
        for (const cell of near) {
          if (active.has(cell)) continue;
          const pos = cellPosition(cell, layout);
          // keep labels legible — never spawn on top of another chip
          const crowded = activeSlots.some(
            (sl) => Math.hypot(sl.x - pos.cx, sl.y - pos.cy) < MIN_SEPARATION,
          );
          if (crowded) continue;
          const idx = s.slots.findIndex((sl) => !sl.on && t >= sl.freeAt);
          if (idx === -1) break;
          const el = els.current[idx];
          if (!el) break;
          const slot = s.slots[idx];
          slot.on = true;
          slot.cell = cell;
          slot.x = pos.cx;
          slot.y = pos.cy;
          s.lastSpawn = t;
          el.style.left = `${pos.cx}px`;
          el.style.top = `${pos.cy}px`;
          el.textContent = s.rotator();
          el.classList.add('on');
          break; // one new chip per update
        }
      },
    }),
    [layout],
  );

  // Reduced-motion / keyboard: 2–3 chips shown statically along the path.
  const staticChips = useMemo(() => {
    if (mode !== 'static') return null;
    const path = intentionalPathCells(currentWeek, layout.cols);
    const picks = [
      path[Math.floor(path.length * 0.2)],
      path[Math.floor(path.length * 0.55)],
      path[path.length - 1],
    ];
    const labels = [EVIDENCE_LABELS[0], EVIDENCE_LABELS[1], EVIDENCE_LABELS[2]];
    return picks.map((cell, i) => ({
      label: labels[i],
      pos: cellPosition(cell, layout),
    }));
  }, [mode, layout, currentWeek]);

  if (mode === 'static' && staticChips) {
    return (
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-30">
        {staticChips.map((c, i) => (
          <span key={i} className="chip on" style={{ left: c.pos.cx, top: c.pos.cy }}>
            {c.label}
          </span>
        ))}
      </div>
    );
  }

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-30">
      {Array.from({ length: POOL }, (_, i) => (
        <span
          key={i}
          ref={(el) => {
            els.current[i] = el;
          }}
          className="chip"
        />
      ))}
    </div>
  );
});

export default EvidenceChips;
