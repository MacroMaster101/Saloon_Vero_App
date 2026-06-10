import { statusColor } from '@/components/ui/status-tag';
const c = { accent: '#D99A3D', fg2: '#6B5D49', error: '#C0392B', fgMuted: '#7A6A4E' } as any;
test('maps known statuses', () => {
  expect(statusColor('confirmed', c)).toBe('#D99A3D');
  expect(statusColor('cancelled', c)).toBe('#C0392B');
  expect(statusColor('completed', c)).toBe('#6B5D49');
});
test('falls back for unknown', () => {
  expect(statusColor('weird', c)).toBe('#7A6A4E');
});
