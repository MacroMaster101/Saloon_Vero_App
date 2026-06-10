import { makeReference } from '@/lib/utils/reference';
import { money } from '@/lib/utils/format';
import { dicebearUrl } from '@/lib/utils/avatar';
import { createBookingSchema } from '@/lib/validation/booking';

test('reference format', () => {
  expect(makeReference()).toMatch(/^VS-[A-Z2-9]{5}$/);
});

test('money format', () => {
  expect(money(900)).toBe('LKR 900');
});

test('dicebear url', () => {
  expect(dicebearUrl('a@b.com')).toContain('api.dicebear.com');
});

test('booking schema rejects bad phone', () => {
  const r = createBookingSchema.safeParse({
    serviceId: '11111111-1111-1111-1111-111111111111',
    stylistId: null,
    date: '2026-06-10',
    time: '10:00',
    name: 'Al',
    phone: '123',
    email: '',
    notes: '',
  });
  expect(r.success).toBe(false);
});
