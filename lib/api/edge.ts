import { supabase } from '@/lib/api/supabase';
import type { CreateBookingInput } from '@/lib/validation/booking';

export async function getAvailability(input: { serviceId: string; stylistId: string | null; date: string }) {
  const { data, error } = await supabase.functions.invoke('get-availability', { body: input });
  if (error) throw error;
  return data as { slots: string[] };
}

export type CreateBookingResult =
  | { ok: true; reference: string; whenLabel: string; stylistName: string; serviceName: string; priceLkr: number; durationMin: number }
  | { ok: false; error: 'invalid' | 'slot_taken' | 'closed' | 'unknown'; message: string };

export async function createBooking(input: CreateBookingInput): Promise<CreateBookingResult> {
  const { data, error } = await supabase.functions.invoke('create-booking', { body: input });
  if (error) return { ok: false, error: 'unknown', message: 'Network error — please retry.' };
  return data as CreateBookingResult;
}
