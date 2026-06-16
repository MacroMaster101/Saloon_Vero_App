export function money(n: number): string {
  // Guard against a null/NaN/Infinity price slipping through, which would
  // otherwise render as "LKR NaN" to the user.
  const safe = Number.isFinite(n) ? n : 0;
  return 'LKR ' + safe.toLocaleString('en-LK');
}

// minutes-from-midnight → "10:00 AM" / "12:00 AM" (1440 = midnight)
export function minutesToLabel(min: number): string {
  const m = min % 1440;
  const h24 = Math.floor(m / 60);
  const mm = m % 60;
  const period = h24 < 12 || h24 === 24 ? 'AM' : 'PM';
  let h12 = h24 % 12; if (h12 === 0) h12 = 12;
  // 1440 (midnight next day) and 0 both render as 12:00 AM
  return `${h12}:${String(mm).padStart(2, '0')} ${period}`;
}

// ISO timestamp → "just now" / "5m ago" / "3h ago" / "2d ago" / "12 Jun 25"
export function formatRelativeDate(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-LK', { day: 'numeric', month: 'short', year: '2-digit' });
}
