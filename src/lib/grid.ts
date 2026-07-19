/**
 * Pure grid math for the life-calendar of weeks. No DOM/canvas access —
 * everything here is unit-testable.
 */
import { COLS, TOTAL_WEEKS } from '../constants';

export interface GridLayout {
  cols: number;
  rows: number;
  /** Cell + gap, in px. */
  pitch: number;
  cell: number;
  gap: number;
  /** Total grid size in px. */
  width: number;
  height: number;
  /** Grid origin within the viewport; negative = grid bleeds past the edge. */
  offsetX: number;
  offsetY: number;
  viewportW: number;
  viewportH: number;
}

/**
 * Legibility floor: below this pitch the grid stops shrinking and instead
 * bleeds past the viewport edges (never a 52-col squeeze on a phone).
 */
export const MIN_PITCH = 9;

export interface LayoutOptions {
  totalWeeks?: number;
  cols?: number;
  minPitch?: number;
  padX?: number;
  padY?: number;
}

/**
 * Compute the cell layout for a viewport. Desktop viewports fit the full
 * 52-wide calendar; narrow viewports hold `minPitch` and let the (centered)
 * grid bleed past the edges as texture.
 */
export function computeLayout(
  viewportW: number,
  viewportH: number,
  opts: LayoutOptions = {},
): GridLayout {
  const cols = opts.cols ?? COLS;
  const totalWeeks = opts.totalWeeks ?? TOTAL_WEEKS;
  const rows = Math.ceil(totalWeeks / cols);
  const padX = opts.padX ?? Math.min(64, viewportW * 0.05);
  const padY = opts.padY ?? Math.min(56, viewportH * 0.06);
  const fit = Math.min(
    (viewportW - padX * 2) / cols,
    (viewportH - padY * 2) / rows,
  );
  const minPitch = opts.minPitch ?? MIN_PITCH;
  const pitch = Math.max(Math.floor(fit), minPitch);
  const gap = Math.max(1, Math.round(pitch * 0.28));
  const cell = pitch - gap;
  const width = cols * pitch - gap;
  const height = rows * pitch - gap;
  // With plenty of horizontal slack (wide desktop), anchor the calendar
  // right of center so the copy owns the quiet left zone; otherwise center
  // it (negative slack = symmetric bleed past both edges on phones).
  // Anchored at 69% (was 63%): at 1440x900 this puts the grid's left edge at
  // ~761px, clear of the copy column (max-w-6xl container + max-w-xl subhead
  // ends at 760px), so hero text never touches lit cells.
  const slack = viewportW - width;
  const offsetX = slack > 320 ? viewportW * 0.69 - width / 2 : slack / 2;
  return {
    cols,
    rows,
    pitch,
    cell,
    gap,
    width,
    height,
    offsetX,
    offsetY: (viewportH - height) / 2,
    viewportW,
    viewportH,
  };
}

export interface CellPosition {
  row: number;
  col: number;
  /** Top-left of the cell, in viewport px. */
  x: number;
  y: number;
  /** Center of the cell, in viewport px. */
  cx: number;
  cy: number;
}

/** Position of cell `index` (row-major: rows = years, cols = weeks). */
export function cellPosition(index: number, layout: GridLayout): CellPosition {
  const col = index % layout.cols;
  const row = Math.floor(index / layout.cols);
  const x = layout.offsetX + col * layout.pitch;
  const y = layout.offsetY + row * layout.pitch;
  return { row, col, x, y, cx: x + layout.cell / 2, cy: y + layout.cell / 2 };
}

/** Cell index under a viewport point, or null when outside the grid. */
export function cellAtPoint(
  px: number,
  py: number,
  layout: GridLayout,
  totalWeeks = TOTAL_WEEKS,
): number | null {
  const col = Math.floor((px - layout.offsetX) / layout.pitch);
  const row = Math.floor((py - layout.offsetY) / layout.pitch);
  if (col < 0 || col >= layout.cols || row < 0) return null;
  const index = row * layout.cols + col;
  return index >= 0 && index < totalWeeks ? index : null;
}

/**
 * Indices of up to `count` cells nearest to a viewport point, sorted by
 * distance, all within `maxDist` px of the point (measured to cell centers).
 */
export function nearestCellIndices(
  px: number,
  py: number,
  layout: GridLayout,
  count: number,
  maxDist: number,
  totalWeeks = TOTAL_WEEKS,
): number[] {
  const reach = Math.ceil(maxDist / layout.pitch) + 1;
  const centerCol = Math.round((px - layout.offsetX) / layout.pitch);
  const centerRow = Math.round((py - layout.offsetY) / layout.pitch);
  const rows = Math.ceil(totalWeeks / layout.cols);
  const candidates: { index: number; d: number }[] = [];
  for (let r = centerRow - reach; r <= centerRow + reach; r++) {
    if (r < 0 || r >= rows) continue;
    for (let c = centerCol - reach; c <= centerCol + reach; c++) {
      if (c < 0 || c >= layout.cols) continue;
      const index = r * layout.cols + c;
      if (index >= totalWeeks) continue;
      const cx = layout.offsetX + c * layout.pitch + layout.cell / 2;
      const cy = layout.offsetY + r * layout.pitch + layout.cell / 2;
      const d = Math.hypot(cx - px, cy - py);
      if (d <= maxDist) candidates.push({ index, d });
    }
  }
  candidates.sort((a, b) => a.d - b.d);
  return candidates.slice(0, count).map((c) => c.index);
}

/** How many columns are fully visible in the viewport (52 on desktop). */
export function visibleColumns(layout: GridLayout): number {
  let n = 0;
  for (let c = 0; c < layout.cols; c++) {
    const x = layout.offsetX + c * layout.pitch;
    if (x >= 0 && x + layout.cell <= layout.viewportW) n++;
  }
  return n;
}

/** Week index for an age in years + week of that year. */
export function weekIndex(ageYears: number, weekOfYear: number, cols = COLS): number {
  return ageYears * cols + weekOfYear;
}

/**
 * Label rotator: cycles the full label set (shuffled per cycle) without
 * immediate repeats across cycle boundaries. `rng` is injectable for tests.
 */
export function createLabelRotator(
  labels: readonly string[],
  rng: () => number = Math.random,
): () => string {
  if (labels.length === 0) return () => '';
  const shuffle = (arr: string[]): string[] => {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };
  let pool = shuffle([...labels]);
  let i = 0;
  let last: string | null = null;
  return () => {
    if (i >= pool.length) {
      pool = shuffle(pool);
      if (pool.length > 1 && pool[0] === last) {
        [pool[0], pool[pool.length - 1]] = [pool[pool.length - 1], pool[0]];
      }
      i = 0;
    }
    last = pool[i++];
    return last;
  };
}

/**
 * The static "intentional path" for reduced-motion / keyboard / fallback:
 * a deterministic meander of warm cells from the early rows down to the
 * current week, so the thesis reads without any motion.
 */
export function intentionalPathCells(
  currentWeek: number,
  cols = COLS,
): number[] {
  const currentRow = Math.floor(currentWeek / cols);
  const cells: number[] = [];
  for (let r = 2; r <= currentRow; r += 3) {
    const col = Math.round(
      cols / 2 + Math.sin(r * 0.55) * cols * 0.3 + Math.cos(r * 0.21) * cols * 0.12,
    );
    const c = Math.min(cols - 1, Math.max(0, col));
    cells.push(r * cols + c);
    // small cluster around every third anchor so it reads as lived seasons
    if (r % 9 === 2 && c + 1 < cols) cells.push(r * cols + c + 1);
  }
  cells.push(currentWeek);
  return cells;
}
