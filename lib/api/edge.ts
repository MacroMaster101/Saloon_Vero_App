import { supabase } from '@/lib/api/supabase';
import type { CreateBookingInput } from '@/lib/validation/booking';

export type SlotStatus = 'available' | 'booked' | 'blocked';

export interface SlotEntry {
  time: string;
  status: SlotStatus;
}

export async function getAvailability(input: { serviceId: string; stylistId: string | null; date: string }) {
  const { data, error } = await supabase.functions.invoke('get-availability', { body: input });
  if (error) throw error;
  const raw = data as { slots: (string | SlotEntry)[] };
  // Normalize: old deployed API returns plain strings; new API returns SlotEntry objects.
  // Handle both so the app works correctly regardless of which version is deployed.
  const slots: SlotEntry[] = (raw.slots ?? []).map((s) =>
    typeof s === 'string' ? { time: s, status: 'available' as SlotStatus } : s,
  );
  return { slots };
}

export type CreateBookingResult =
  | { ok: true; id: string | null; reference: string; whenLabel: string; stylistName: string; serviceName: string; priceLkr: number; durationMin: number }
  | { ok: false; error: 'invalid' | 'slot_taken' | 'closed' | 'unknown'; message: string };

export async function createBooking(input: CreateBookingInput): Promise<CreateBookingResult> {
  const { data, error } = await supabase.functions.invoke('create-booking', { body: input });
  if (error) return { ok: false, error: 'unknown', message: 'Network error — please retry.' };
  return data as CreateBookingResult;
}

export type RescheduleResult =
  | { ok: true; whenLabel: string }
  | { ok: false; error: string; message: string };

export async function rescheduleBooking(input: { bookingId: string; date: string; time: string }): Promise<RescheduleResult> {
  const { data, error } = await supabase.functions.invoke('reschedule-booking', { body: input });
  if (error) return { ok: false, error: 'unknown', message: 'Network error — please retry.' };
  return data as RescheduleResult;
}

export type CancelResult =
  | { ok: true }
  | { ok: false; error: string; message: string };

export async function cancelBooking(input: { bookingId: string; phone?: string }): Promise<CancelResult> {
  const { data, error } = await supabase.functions.invoke('cancel-booking', { body: input });
  if (error) return { ok: false, error: 'unknown', message: 'Network error — please retry.' };
  return data as CancelResult;
}
