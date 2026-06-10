import { toUtcInstant, minutesOfDayInTz } from '@/lib/utils/time';

const TZ = 'Asia/Colombo'; // UTC+5:30, no DST

test('toUtcInstant converts salon-local minute to UTC ISO', () => {
  // 10:00 Colombo == 04:30 UTC
  expect(toUtcInstant('2026-06-10', 600, TZ)).toBe('2026-06-10T04:30:00.000Z');
});

test('minutesOfDayInTz reverses it', () => {
  expect(minutesOfDayInTz('2026-06-10T04:30:00.000Z', TZ)).toBe(600);
});
