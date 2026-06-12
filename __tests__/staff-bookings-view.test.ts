import { applyStatus, nextUp, groupByDay, colomboDayWindow } from '@/lib/staff/bookings-view';

const b = (id: string, starts: string, status = 'confirmed') =>
  ({ id, reference: `VS-${id}`, starts_at: starts, ends_at: starts, status, customer_name: 'A', customer_phone: '1', notes: '', service_id: 's1' });

test('applyStatus replaces only the matching booking status', () => {
  const out = applyStatus([b('1', '2026-06-11T09:00:00Z'), b('2', '2026-06-11T10:00:00Z')], '2', 'completed');
  expect(out[0].status).toBe('confirmed');
  expect(out[1].status).toBe('completed');
});

test('nextUp finds the soonest upcoming confirmed booking', () => {
  const list = [b('1', '2026-06-11T08:00:00Z'), b('2', '2026-06-11T10:00:00Z'), b('3', '2026-06-11T12:00:00Z', 'cancelled')];
  expect(nextUp(list, '2026-06-11T09:00:00Z')?.id).toBe('2');
});

test('nextUp returns undefined when nothing upcoming', () => {
  expect(nextUp([b('1', '2026-06-11T08:00:00Z')], '2026-06-11T09:00:00Z')).toBeUndefined();
});

test('groupByDay buckets by local day in order', () => {
  const grouped = groupByDay([b('1', '2026-06-11T09:00:00Z'), b('2', '2026-06-12T10:00:00Z'), b('3', '2026-06-11T11:00:00Z')]);
  expect(grouped).toHaveLength(2);
  expect(grouped[0].items.map((x) => x.id)).toEqual(['1', '3']);
  expect(grouped[1].items.map((x) => x.id)).toEqual(['2']);
});

test('colomboDayWindow returns a 24h window with from before to', () => {
  const w = colomboDayWindow(0);
  expect(new Date(w.to).getTime() - new Date(w.from).getTime()).toBe(86400000);
  expect(w.from < w.to).toBe(true);
});
