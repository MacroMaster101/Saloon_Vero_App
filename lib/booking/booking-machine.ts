export type Step = 'stylist' | 'date' | 'time' | 'details';

export type BookingState = {
  serviceId: string;
  stylistId: string | null;
  date: string | null;
  time: string | null;
  step: Step;
};

export type Action =
  | { type: 'setStylist'; stylistId: string | null }
  | { type: 'setDate'; date: string }
  | { type: 'setTime'; time: string }
  | { type: 'back' };

const ORDER: Step[] = ['stylist', 'date', 'time', 'details'];

export function initialBooking(serviceId: string): BookingState {
  return { serviceId, stylistId: null, date: null, time: null, step: 'stylist' };
}

function prev(step: Step): Step {
  const i = ORDER.indexOf(step);
  return ORDER[Math.max(0, i - 1)];
}

export function bookingReducer(s: BookingState, a: Action): BookingState {
  switch (a.type) {
    case 'setStylist':
      return { ...s, stylistId: a.stylistId, step: 'date' };
    case 'setDate':
      return { ...s, date: a.date, step: 'time' };
    case 'setTime':
      return { ...s, time: a.time, step: 'details' };
    case 'back':
      return { ...s, step: prev(s.step) };
  }
}
