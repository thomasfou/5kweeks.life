import { describe, expect, it } from 'vitest';
import { COLS, EVIDENCE_LABELS, TOTAL_WEEKS } from '../../constants';
import {
  MIN_PITCH,
  cellAtPoint,
  cellPosition,
  computeLayout,
  createLabelRotator,
  intentionalPathCells,
  nearestCellIndices,
  visibleColumns,
  weekIndex,
} from '../grid';

describe('computeLayout', () => {
  it('desktop: full 52-wide calendar, every column visible', () => {
    const layout = computeLayout(1440, 900);
    expect(layout.cols).toBe(52);
    expect(layout.rows).toBe(88);
    expect(layout.pitch).toBeGreaterThanOrEqual(MIN_PITCH);
    expect(layout.width).toBeLessThanOrEqual(1440);
    expect(visibleColumns(layout)).toBe(52);
  });

  it('large desktop: still 52 columns, fully on-screen', () => {
    const layout = computeLayout(1920, 1200);
    expect(visibleColumns(layout)).toBe(52);
    expect(layout.offsetX).toBeGreaterThan(0);
    expect(layout.offsetX + layout.width).toBeLessThanOrEqual(1920);
    expect(layout.offsetY).toBeGreaterThan(0);
  });

  it('wide desktop: calendar anchors right of center, clear of the copy', () => {
    for (const [w, h] of [
      [1440, 900],
      [1920, 1200],
    ]) {
      const layout = computeLayout(w, h);
      const gridCenter = layout.offsetX + layout.width / 2;
      expect(gridCenter).toBeGreaterThan(w * 0.55);
      // anchored at 69% so the subhead's longest line clears the left column
      expect(gridCenter).toBeGreaterThan(w * 0.64);
      // hero copy column: centered max-w-6xl (1152) + px-10 (40) + max-w-xl
      // subhead (576). The grid's left edge must clear it entirely.
      const copyRight = Math.max((w - 1152) / 2, 0) + 40 + 576;
      expect(layout.offsetX).toBeGreaterThan(copyRight);
      expect(layout.offsetX + layout.width).toBeLessThanOrEqual(w);
    }
  });

  it('phone: holds the legibility floor and bleeds past the edges', () => {
    const layout = computeLayout(390, 844);
    expect(layout.pitch).toBe(MIN_PITCH); // never squeezed below the floor
    expect(layout.cell).toBeGreaterThanOrEqual(5); // cells stay visible
    expect(layout.width).toBeGreaterThan(390); // bleeds horizontally
    expect(layout.offsetX).toBeLessThan(0); // centered → both edges bleed
    const visible = visibleColumns(layout);
    expect(visible).toBeLessThan(52);
    expect(visible).toBeGreaterThan(20); // still reads as a calendar
  });

  it('xs breakpoint (~400px) keeps cells at the floor too', () => {
    const layout = computeLayout(400, 700);
    expect(layout.pitch).toBe(MIN_PITCH);
    expect(visibleColumns(layout)).toBeLessThan(52);
  });

  it('gap and cell always sum to pitch', () => {
    for (const [w, h] of [
      [320, 568],
      [390, 844],
      [768, 1024],
      [1440, 900],
      [2560, 1440],
    ]) {
      const layout = computeLayout(w, h);
      expect(layout.cell + layout.gap).toBe(layout.pitch);
      expect(layout.gap).toBeGreaterThanOrEqual(1);
    }
  });
});

describe('cellPosition / cellAtPoint', () => {
  const layout = computeLayout(1440, 900);

  it('lays out row-major: rows = years, cols = weeks', () => {
    const first = cellPosition(0, layout);
    expect(first.row).toBe(0);
    expect(first.col).toBe(0);
    expect(first.x).toBe(layout.offsetX);
    expect(first.y).toBe(layout.offsetY);

    const secondRow = cellPosition(52, layout);
    expect(secondRow.row).toBe(1);
    expect(secondRow.col).toBe(0);
    expect(secondRow.y).toBe(layout.offsetY + layout.pitch);

    const last = cellPosition(TOTAL_WEEKS - 1, layout);
    expect(last.row).toBe(87);
    expect(last.col).toBe(51);
  });

  it('cellAtPoint inverts cellPosition at cell centers', () => {
    for (const idx of [0, 51, 52, 1000, 2345, TOTAL_WEEKS - 1]) {
      const pos = cellPosition(idx, layout);
      expect(cellAtPoint(pos.cx, pos.cy, layout)).toBe(idx);
    }
  });

  it('cellAtPoint returns null outside the grid', () => {
    expect(cellAtPoint(layout.offsetX - 50, layout.offsetY, layout)).toBeNull();
    expect(cellAtPoint(0, layout.offsetY + layout.height + 100, layout)).toBeNull();
  });
});

describe('nearestCellIndices', () => {
  const layout = computeLayout(1440, 900);

  it('the nearest cell to a cell center is that cell', () => {
    const pos = cellPosition(1234, layout);
    const near = nearestCellIndices(pos.cx, pos.cy, layout, 5, 150);
    expect(near[0]).toBe(1234);
  });

  it('returns at most count cells, sorted by distance, within maxDist', () => {
    const pos = cellPosition(1234, layout);
    const near = nearestCellIndices(pos.cx, pos.cy, layout, 6, 150);
    expect(near.length).toBeLessThanOrEqual(6);
    let prev = -1;
    for (const idx of near) {
      const p = cellPosition(idx, layout);
      const d = Math.hypot(p.cx - pos.cx, p.cy - pos.cy);
      expect(d).toBeLessThanOrEqual(150);
      expect(d).toBeGreaterThanOrEqual(prev);
      prev = d;
    }
  });

  it('returns nothing far outside the grid', () => {
    expect(nearestCellIndices(-2000, -2000, layout, 5, 150)).toHaveLength(0);
  });
});

describe('weekIndex', () => {
  it('maps age + week-of-year to a cell index', () => {
    expect(weekIndex(0, 0)).toBe(0);
    expect(weekIndex(1, 0)).toBe(52);
    expect(weekIndex(36, 24)).toBe(36 * 52 + 24);
  });
});

describe('createLabelRotator', () => {
  const seededRng = (seed: number) => () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };

  it('cycles the full set each cycle', () => {
    const next = createLabelRotator(EVIDENCE_LABELS, seededRng(42));
    for (let cycle = 0; cycle < 3; cycle++) {
      const seen = new Set<string>();
      for (let i = 0; i < EVIDENCE_LABELS.length; i++) seen.add(next());
      expect(seen.size).toBe(EVIDENCE_LABELS.length);
    }
  });

  it('never repeats a label immediately, across many seeds', () => {
    for (let seed = 1; seed <= 25; seed++) {
      const next = createLabelRotator(EVIDENCE_LABELS, seededRng(seed));
      let prev = '';
      for (let i = 0; i < EVIDENCE_LABELS.length * 5; i++) {
        const label = next();
        expect(label).not.toBe(prev);
        prev = label;
      }
    }
  });

  it('handles degenerate label sets', () => {
    const empty = createLabelRotator([]);
    expect(empty()).toBe('');
    const single = createLabelRotator(['only']);
    expect(single()).toBe('only');
    expect(single()).toBe('only');
  });
});

describe('intentionalPathCells', () => {
  it('is deterministic, in range, and ends at the current week', () => {
    const currentWeek = weekIndex(36, 24);
    const a = intentionalPathCells(currentWeek);
    const b = intentionalPathCells(currentWeek);
    expect(a).toEqual(b);
    expect(a.length).toBeGreaterThan(5);
    expect(a[a.length - 1]).toBe(currentWeek);
    for (const idx of a) {
      expect(idx).toBeGreaterThanOrEqual(0);
      expect(idx).toBeLessThan(TOTAL_WEEKS);
      expect(idx % COLS).toBeGreaterThanOrEqual(0);
    }
  });

  it('does not wander past the current row', () => {
    const currentWeek = weekIndex(36, 24);
    for (const idx of intentionalPathCells(currentWeek)) {
      expect(Math.floor(idx / COLS)).toBeLessThanOrEqual(36);
    }
  });
});
