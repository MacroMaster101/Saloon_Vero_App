import type { StaffBooking, AdminBookingStatus } from '@/lib/api/staff';

export function applyStatus(list: StaffBooking[], id: string, status: AdminBookingStatus): StaffBooking[] {
  return list.map((booking) => (booking.id === id ? { ...booking, status } : booking));
}

export function serviceLabel(services: { id: string; name: string }[], id: string): string {
  return services.find((service) => service.id === id)?.name ?? 'Salon service';
}

export function nextUp(list: StaffBooking[], nowIso: string): StaffBooking | undefined {
  const now = new Date(nowIso).getTime();
  return list
    .filter((booking) => booking.status === 'confirmed' && new Date(booking.starts_at).getTime() >= now)
    .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())[0];
}

const dayFmt = new Intl.DateTimeFormat('en-LK', { timeZone: 'Asia/Colombo', weekday: 'long', day: 'numeric', month: 'short' });
const dayKeyFmt = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Colombo', year: 'numeric', month: '2-digit', day: '2-digit' });

export function groupByDay(list: StaffBooking[]): { dayKey: string; dayLabel: string; items: StaffBooking[] }[] {
  const groups = new Map<string, { dayKey: string; dayLabel: string; items: StaffBooking[] }>();
  // starts_at is always UTC-Z ISO from Supabase, so lexical order == chronological order.
  for (const booking of [...list].sort((a, b) => a.starts_at.localeCompare(b.starts_at))) {
    const date = new Date(booking.starts_at);
    const key = dayKeyFmt.format(date);
    if (!groups.has(key)) groups.set(key, { dayKey: key, dayLabel: dayFmt.format(date), items: [] });
    groups.get(key)!.items.push(booking);
  }
  return [...groups.values()];
}

// Day window for the salon's timezone (Asia/Colombo, UTC+05:30, no DST).
export function colomboDayWindow(offsetDays = 0): { from: string; to: string } {
  const dayKey = dayKeyFmt.format(new Date(Date.now() + offsetDays * 86400000));
  const from = new Date(`${dayKey}T00:00:00+05:30`).toISOString();
  const to = new Date(new Date(from).getTime() + 86400000).toISOString();
  return { from, to };
}
