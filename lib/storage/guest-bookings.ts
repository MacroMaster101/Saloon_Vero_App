import AsyncStorage from '@react-native-async-storage/async-storage';

const GUEST_BOOKINGS_KEY = 'saloon_vero_guest_bookings';

export type GuestBooking = {
  reference: string;
  serviceId?: string;
  serviceName: string;
  stylistName: string;
  whenLabel: string;
  date?: string;
  time?: string;
  status: 'confirmed' | 'completed' | 'cancelled';
  priceLkr?: number;
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
