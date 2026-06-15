// Static business configuration for the salon.
// Keep contact details and the holiday calendar here rather than inline in screens.

/** Salon contact number used by "call us" actions (tel: links). */
export const SALON_PHONE = '+94771234567';

/**
 * Poya (full-moon) public holidays the salon is closed for, as 'YYYY-MM-DD'
 * (Asia/Colombo local dates). Poya dates shift each year, so extend this list
 * annually. Booking screens highlight these dates as closed.
 */
export const POYA_HOLIDAYS: ReadonlySet<string> = new Set<string>([
  '2026-06-29', // Poson Full Moon Poya Day
]);

/** True when the given 'YYYY-MM-DD' date is a salon Poya holiday. */
export function isPoyaHoliday(date: string): boolean {
  return POYA_HOLIDAYS.has(date);
}
