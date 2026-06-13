import {
  COLOMBO_OFFSET_MIN,
  dayOfWeekColombo,
  localToUtcISO,
  buildGrid,
  overlaps,
  minuteToHHMM,
  hhmmToMin,
  formatWhenLabel,
} from '@/lib/booking/time';

describe('booking time helpers', () => {
  test('COLOMBO_OFFSET_MIN is +05:30', () => {
    expect(COLOMBO_OFFSET_MIN).toBe(330);
  });

  test('localToUtcISO subtracts the Colombo offset', () => {
    // 09:00 Colombo on 2026-06-15 == 03:30 UTC
    expect(localToUtcISO('2026-06-15', 540)).toBe('2026-06-15T03:30:00.000Z');
  });

  test('localToUtcISO rolls back across midnight', () => {
    // 02:00 Colombo == 20:30 UTC previous day
    expect(localToUtcISO('2026-06-15', 120)).toBe('2026-06-14T20:30:00.000Z');
  });

  test('dayOfWeekColombo returns Colombo weekday', () => {
    // 2026-06-15 is a Monday
    expect(dayOfWeekColombo('2026-06-15')).toBe(1);
  });

  test('buildGrid yields 30-min starts that fit before close', () => {
    // open 09:00 (540), close 11:00 (660), duration 45, step 30
    // -> 540 (+45=585), 570 (615), 600 (645); 630+45=675>660 excluded
    expect(buildGrid(540, 660, 45)).toEqual([540, 570, 600]);
  });

  test('buildGrid excludes slots that overrun close', () => {
    // open 09:00, close 10:00 (600), duration 45 -> only 09:00 (540+45=585<=600); 570+45=615>600 excluded
    expect(buildGrid(540, 600, 45)).toEqual([540]);
  });

  test('overlaps is half-open', () => {
    expect(overlaps(0, 10, 10, 20)).toBe(false); // touching, no overlap
    expect(overlaps(0, 10, 5, 20)).toBe(true);
    expect(overlaps(5, 20, 0, 10)).toBe(true);
  });

  test('minuteToHHMM and hhmmToMin round-trip', () => {
    expect(minuteToHHMM(540)).toBe('09:00');
    expect(minuteToHHMM(615)).toBe('10:15');
    expect(hhmmToMin('09:00')).toBe(540);
    expect(hhmmToMin('10:15')).toBe(615);
  });

  test('formatWhenLabel renders Colombo wall-clock', () => {
    expect(formatWhenLabel('2026-06-15', 540)).toBe('Mon, Jun 15 · 9:00 AM');
  });
});
