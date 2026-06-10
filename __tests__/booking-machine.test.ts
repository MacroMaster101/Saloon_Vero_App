import { bookingReducer, initialBooking, type BookingState } from '@/lib/booking/booking-machine';

test('advances through steps as fields are set', () => {
  let s: BookingState = initialBooking('svc-1');
  expect(s.step).toBe('stylist');
  s = bookingReducer(s, { type: 'setStylist', stylistId: null });
  expect(s.step).toBe('date');
  s = bookingReducer(s, { type: 'setDate', date: '2026-06-15' });
  expect(s.step).toBe('time');
  s = bookingReducer(s, { type: 'setTime', time: '10:00' });
  expect(s.step).toBe('details');
});

test('back returns to previous step', () => {
  let s = initialBooking('svc-1');
  s = bookingReducer(s, { type: 'setStylist', stylistId: 'x' });
  s = bookingReducer(s, { type: 'back' });
  expect(s.step).toBe('stylist');
});
