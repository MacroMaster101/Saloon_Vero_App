import { computeOpenSlots } from '@/lib/booking/availability';

test('returns 30-min grid slots that fit duration and avoid busy', () => {
  const slots = computeOpenSlots({
    date: '2026-06-10',
    hours: { open_minute: 600, close_minute: 720 }, // 10:00–12:00
    durationMin: 60,
    stepMin: 30,
    busy: [{ startMin: 630, endMin: 660 }], // 10:30–11:00 busy
    tz: 'Asia/Colombo',
  });
  expect(slots).toEqual(['11:00']);
});

test('closed day yields no slots', () => {
  expect(
    computeOpenSlots({
      date: '2026-06-10',
      hours: { open_minute: 600, close_minute: 720, is_closed: true },
      durationMin: 30,
      stepMin: 30,
      busy: [],
      tz: 'Asia/Colombo',
    })
  ).toEqual([]);
});
