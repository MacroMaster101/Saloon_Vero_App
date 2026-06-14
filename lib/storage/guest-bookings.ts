import AsyncStorage from '@react-native-async-storage/async-storage';

const GUEST_BOOKINGS_KEY = 'saloon_vero_guest_bookings';

export type GuestBooking = {
  id?: string;          // UUID from Supabase — stored so guest can cancel/reschedule
  reference: string;
  serviceId?: string;
  serviceName: string;
  stylistName: string;
  whenLabel: string;
  date?: string;
  time?: string;
  status: 'confirmed' | 'completed' | 'cancelled';
  priceLkr?: number;
  phone?: string;       // stored for phone-based ownership verification
  createdAt: string;
};

function isGuestBooking(value: unknown): value is GuestBooking {
  if (!value || typeof value !== 'object') return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.reference === 'string'
    && typeof item.serviceName === 'string'
    && typeof item.stylistName === 'string'
    && typeof item.whenLabel === 'string'
    && typeof item.status === 'string'
    && typeof item.createdAt === 'string'
  );
}

export async function getGuestBookings(): Promise<GuestBooking[]> {
  const raw = await AsyncStorage.getItem(GUEST_BOOKINGS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isGuestBooking) : [];
  } catch {
    return [];
  }
}

export async function saveGuestBooking(booking: GuestBooking): Promise<void> {
  const existing = await getGuestBookings();
  const next = [booking, ...existing.filter((item) => item.reference !== booking.reference)].slice(0, 20);
  await AsyncStorage.setItem(GUEST_BOOKINGS_KEY, JSON.stringify(next));
}

export async function updateGuestBookingStatus(
  reference: string,
  status: GuestBooking['status'],
): Promise<void> {
  const existing = await getGuestBookings();
  const next = existing.map((b) => (b.reference === reference ? { ...b, status } : b));
  await AsyncStorage.setItem(GUEST_BOOKINGS_KEY, JSON.stringify(next));
}

export async function updateGuestBookingTime(
  reference: string,
  whenLabel: string,
  date: string,
  time: string,
): Promise<void> {
  const existing = await getGuestBookings();
  const next = existing.map((b) => (b.reference === reference ? { ...b, whenLabel, date, time } : b));
  await AsyncStorage.setItem(GUEST_BOOKINGS_KEY, JSON.stringify(next));
}
