export interface DayRange {
  start: number;
  end: number;
}

export function buildDayRange(timestampMs: number): DayRange {
  const d = new Date(timestampMs);
  const start = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const end = start + 24 * 60 * 60 * 1000 - 1;
  return { start, end };
}