// Pure date/time helpers for the booking flow. No Deno or React-Native globals,
// so this file runs identically under Deno (Edge Functions) and Node (Jest).
//
// Sri Lanka (Asia/Colombo) is a fixed UTC+05:30 with no daylight saving, so all
// timezone math is plain arithmetic.

export const COLOMBO_OFFSET_MIN = 330; // +05:30

const WEEKDAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function parseDate(date: string): { y: number; m: number; d: number } {
  const [y, m, d] = date.split('-').map(Number);
  return { y, m, d };
}

/** UTC ms for midnight of the given Colombo calendar date. */
function colomboMidnightUtcMs(date: string): number {
  const { y, m, d } = parseDate(date);
  return Date.UTC(y, m - 1, d) - COLOMBO_OFFSET_MIN * 60_000;
}

/** Colombo wall-clock (date + minute-of-day) -> UTC ISO string. */
export function localToUtcISO(date: string, minuteOfDay: number): string {
  const ms = colomboMidnightUtcMs(date) + minuteOfDay * 60_000;
  return new Date(ms).toISOString();
}

/** 0..6 (Sun..Sat) weekday of the Colombo calendar date. */
export function dayOfWeekColombo(date: string): number {
  const { y, m, d } = parseDate(date);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

/** 30-min (default) grid of minute-of-day starts where start+duration fits before close. */
export function buildGrid(openMin: number, closeMin: number, durationMin: number, stepMin = 30): number[] {
  const out: number[] = [];
  for (let t = openMin; t + durationMin <= closeMin; t += stepMin) out.push(t);
  return out;
}

/** Half-open interval overlap on epoch ms (or any comparable number). */
export function overlaps(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return aStart < bEnd && bStart < aEnd;
}

export function minuteToHHMM(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function hhmmToMin(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

/** e.g. "Mon, Jun 15 · 9:00 AM" in Colombo wall-clock. */
export function formatWhenLabel(date: string, minuteOfDay: number): string {
  const { m, d } = parseDate(date);
  const dow = WEEKDAY[dayOfWeekColombo(date)];
  const h24 = Math.floor(minuteOfDay / 60);
  const min = minuteOfDay % 60;
  const ampm = h24 < 12 ? 'AM' : 'PM';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${dow}, ${MONTH[m - 1]} ${d} · ${h12}:${String(min).padStart(2, '0')} ${ampm}`;
}
