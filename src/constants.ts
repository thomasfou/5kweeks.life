/** Curated evidence labels — a week lived on purpose. Verbatim from the brief. */
export const EVIDENCE_LABELS: readonly string[] = [
  'walked daily',
  'called Dad',
  'screen-free Sunday',
  'trip booked',
  'read 30 min',
  'slept 8h',
  'no alcohol',
  'journaled',
  'dinner with friends',
  '10k steps',
  'meditated',
  'made art',
];

/** Calendar shape: rows = years of a life, columns = weeks of a year. */
export const COLS = 52;
export const YEARS = 88;
export const TOTAL_WEEKS = COLS * YEARS; // 4,576 ≈ the "~4,600 weeks" life

/** The fixed anchor cell — "you are here" in the calendar. */
export const CURRENT_AGE_YEARS = 36;
export const CURRENT_WEEK_OF_YEAR = 24;

/** Color tokens (mirrored as CSS variables in index.css). */
export const COLORS = {
  bg: '#050507',
  cellCold: '#334155',
  cellWarm: '#f5b642',
  cellWarmHot: '#ffd98a',
} as const;

/** Spotlight radius in px — must match the CSS mask radius. */
export const SPOTLIGHT_RADIUS = 260;
