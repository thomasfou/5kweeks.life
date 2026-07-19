import { describe, expect, it } from 'vitest';
import {
  clamp,
  damp,
  easeOutCubic,
  lerp,
  parallaxOffset,
  pulseAlpha,
  selectMode,
  sweepPosition,
} from '../anim';

describe('lerp / damp / easing', () => {
  it('lerp interpolates endpoints and midpoint', () => {
    expect(lerp(0, 10, 0)).toBe(0);
    expect(lerp(0, 10, 1)).toBe(10);
    expect(lerp(0, 10, 0.5)).toBe(5);
    expect(lerp(-4, 4, 0.5)).toBe(0);
  });

  it('damp converges monotonically toward the target', () => {
    let v = 0;
    let prevDist = Math.abs(100 - v);
    for (let i = 0; i < 100; i++) {
      v = damp(v, 100, 0.1);
      const dist = Math.abs(100 - v);
      expect(dist).toBeLessThan(prevDist);
      prevDist = dist;
    }
    expect(v).toBeCloseTo(100, 1);
  });

  it('damp with the spec factor 0.1 halves the distance in ~7 steps', () => {
    let v = 0;
    for (let i = 0; i < 7; i++) v = damp(v, 1, 0.1);
    expect(v).toBeGreaterThan(0.5);
  });

  it('easeOutCubic is bounded and monotonic', () => {
    expect(easeOutCubic(0)).toBe(0);
    expect(easeOutCubic(1)).toBe(1);
    let prev = -1;
    for (let t = 0; t <= 1.0001; t += 0.05) {
      const e = easeOutCubic(t);
      expect(e).toBeGreaterThanOrEqual(prev);
      prev = e;
    }
  });

  it('clamp bounds values', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-5, 0, 10)).toBe(0);
    expect(clamp(15, 0, 10)).toBe(10);
  });
});

describe('parallaxOffset (pointer → offset)', () => {
  it('is zero at the section center', () => {
    expect(parallaxOffset(500, 500, 500, 16)).toBeCloseTo(0, 10);
  });

  it('moves opposite the cursor, reaching -strength at the far edge', () => {
    expect(parallaxOffset(1000, 500, 500, 16)).toBe(-16);
    expect(parallaxOffset(0, 500, 500, 16)).toBe(16);
  });

  it('clamps beyond the edges', () => {
    expect(parallaxOffset(5000, 500, 500, 16)).toBe(-16);
    expect(parallaxOffset(-5000, 500, 500, 16)).toBe(16);
  });

  it('is safe with a degenerate extent', () => {
    expect(parallaxOffset(100, 0, 0, 16)).toBe(0);
  });
});

describe('selectMode', () => {
  it('fine pointer, no reduced motion → follow', () => {
    expect(selectMode(false, false)).toBe('follow');
  });

  it('coarse pointer → sweep', () => {
    expect(selectMode(true, false)).toBe('sweep');
  });

  it('reduced motion wins over everything → static', () => {
    expect(selectMode(false, true)).toBe('static');
    expect(selectMode(true, true)).toBe('static');
    expect(selectMode(null, true)).toBe('static');
  });

  it('ambiguous detection defaults to sweep (never a dead grid)', () => {
    expect(selectMode(null, null)).toBe('sweep');
    expect(selectMode(undefined, undefined)).toBe('sweep');
    expect(selectMode(true, null)).toBe('sweep');
  });

  it('fine pointer with unknown reduced-motion still follows', () => {
    expect(selectMode(false, null)).toBe('follow');
  });
});

describe('sweepPosition', () => {
  it('stays inside the viewport for all sampled times', () => {
    const w = 1200;
    const h = 800;
    for (let t = 0; t < 120_000; t += 137) {
      const p = sweepPosition(t, w, h);
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.x).toBeLessThanOrEqual(w);
      expect(p.y).toBeGreaterThanOrEqual(0);
      expect(p.y).toBeLessThanOrEqual(h);
    }
  });

  it('actually moves over time', () => {
    const a = sweepPosition(0, 1200, 800);
    const b = sweepPosition(2000, 1200, 800);
    expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThan(10);
  });
});

describe('pulseAlpha', () => {
  it('oscillates within [0, 1]', () => {
    for (let t = 0; t < 10_000; t += 61) {
      const a = pulseAlpha(t);
      expect(a).toBeGreaterThanOrEqual(0);
      expect(a).toBeLessThanOrEqual(1);
    }
  });

  it('is periodic', () => {
    expect(pulseAlpha(0)).toBeCloseTo(pulseAlpha(2400), 6);
  });
});
