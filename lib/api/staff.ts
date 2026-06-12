import { supabase } from '@/lib/api/supabase';

export type StaffBookingStatus = 'completed' | 'no_show' | 'cancelled';
export type AdminBookingStatus = 'confirmed' | StaffBookingStatus;

export type StaffBooking = {
  id: string;
  reference: string;
  starts_at: string;
  ends_at: string;
  status: string;
  customer_name: string;
  customer_phone: string;
  notes: string;
  service_id: string;
};

const STAFF_BOOKING_COLUMNS = 'id,reference,starts_at,ends_at,status,customer_name,customer_phone,notes,service_id';

// RLS ("staff read bookings") already restricts rows to the stylist's own chair;
// the explicit stylist_id filter keeps the staff member's *personal* customer
// bookings (user_id = theirs) out of the work views.
export async function getMyAssignedBookings(opts: { stylistId: string; from: string; to: string }): Promise<StaffBooking[]> {
  const { data } = await supabase
    .from('bookings')
    .select(STAFF_BOOKING_COLUMNS)
    .eq('stylist_id', opts.stylistId)
    .gte('starts_at', opts.from)
    .lt('starts_at', opts.to)
    .order('starts_at');
  return (data as StaffBooking[] | null) ?? [];
}

export async function setBookingStatus(id: string, status: AdminBookingStatus): Promise<{ ok: true } | { error: string }> {
  const { error } = await supabase.from('bookings').update({ status }).eq('id', id);
  if (error) return { error: error.message };
  return { ok: true };
}
