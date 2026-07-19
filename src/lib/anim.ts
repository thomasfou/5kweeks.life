/**
 * Pure animation math. No DOM access — everything here is unit-testable.
 */

export const clamp = (v: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, v));

export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

/** One smoothing step: move `current` toward `target` by `factor` (0..1). */
export const damp = (current: number, target: number, factor: number): number =>
  current + (target - current) * factor;

export const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3);

/**
 * Pointer → parallax offset. Normalizes the pointer's distance from the
 * section center to [-1, 1] and maps it to a translation *opposite* the
 * cursor (`strength` px at the edges).
 */
export function parallaxOffset(
  pointer: number,
  center: number,
  halfExtent: number,
  strength = 16,
): number {
  if (halfExtent <= 0) return 0;
  const n = clamp((pointer - center) / halfExtent, -1, 1);
  return -n * strength;
}

export type Mode = 'follow' | 'sweep' | 'static';

/**
 * Pick the interaction mode from media-query results.
 * `null`/`undefined` means detection was unavailable or ambiguous — in that
 * case we default to `sweep`, so the grid is never dead.
 */
export function selectMode(
  coarsePointer: boolean | null | undefined,
  reducedMotion: boolean | null | undefined,
): Mode {
  if (reducedMotion === true) return 'static';
  if (coarsePointer === false) return 'follow';
  return 'sweep';
}

/**
 * Auto-sweep spotlight path for touch devices: a slow Lissajous-style loop
 * that stays well inside the viewport. `tMs` is a timestamp in ms.
 */
export function sweepPosition(
  tMs: number,
  width: number,
  height: number,
): { x: number; y: number } {
  const t = tMs / 1000;
  return {
    x: width * (0.5 + 0.36 * Math.sin(t * 0.33)),
    y: height * (0.48 + 0.3 * Math.sin(t * 0.21 + 1.7)),
  };
}

/** Pulse alpha for the current-week cell: smooth 0..1 oscillation. */
export function pulseAlpha(tMs: number, periodMs = 2400): number {
  return 0.5 + 0.5 * Math.sin((tMs / periodMs) * Math.PI * 2);
}
