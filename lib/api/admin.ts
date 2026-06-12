import { supabase } from '@/lib/api/supabase';
import type { StaffBooking } from '@/lib/api/staff';
import type { Service, Stylist, GalleryItem, Profile } from '@/types/database';

export type AdminBooking = StaffBooking & { stylist_id: string | null };

type Result = { ok: true } | { error: string };
const toResult = (error: { message: string } | null): Result => (error ? { error: error.message } : { ok: true });

const ADMIN_BOOKING_COLUMNS = 'id,reference,starts_at,ends_at,status,customer_name,customer_phone,notes,service_id,stylist_id';

export async function getAllBookings(opts: { from: string; to: string }): Promise<AdminBooking[]> {
  const { data } = await supabase.from('bookings').select(ADMIN_BOOKING_COLUMNS)
    .gte('starts_at', opts.from).lt('starts_at', opts.to).order('starts_at');
  return (data as AdminBooking[] | null) ?? [];
}

// Admin getters: no is_active filter (admins must see inactive rows).
export async function getServicesAdmin(): Promise<Service[]> {
  const { data } = await supabase.from('services').select('*').order('sort_order');
  return (data as Service[] | null) ?? [];
}
export async function getStylistsAdmin(): Promise<Stylist[]> {
  const { data } = await supabase.from('stylists').select('*').order('sort_order');
  return (data as Stylist[] | null) ?? [];
}
export async function getGalleryAdmin(): Promise<GalleryItem[]> {
  const { data } = await supabase.from('gallery').select('*').order('sort_order');
  return (data as GalleryItem[] | null) ?? [];
}

export async function upsertService(
  row: Partial<Service> & { slug: string; name: string; category: Service['category']; price_lkr: number; duration_min: number },
): Promise<Result> {
  const { error } = await supabase.from('services').upsert(row);
  return toResult(error);
}
export async function upsertStylist(row: Partial<Stylist> & { slug: string; name: string }): Promise<Result> {
  const { error } = await supabase.from('stylists').upsert(row);
  return toResult(error);
}

export type AdminBlockedSlot = { id: string; stylist_id: string | null; starts_at: string; ends_at: string; reason: string };
export async function getBlockedSlots(opts: { from: string }): Promise<AdminBlockedSlot[]> {
  const { data } = await supabase.from('blocked_slots').select('*').gte('ends_at', opts.from).order('starts_at');
  return (data as AdminBlockedSlot[] | null) ?? [];
}
export async function createBlockedSlot(opts: { stylistId: string | null; startsAt: string; endsAt: string; reason: string }): Promise<Result> {
  const { error } = await supabase.from('blocked_slots').insert({ stylist_id: opts.stylistId, starts_at: opts.startsAt, ends_at: opts.endsAt, reason: opts.reason });
  return toResult(error);
}
export async function deleteBlockedSlot(id: string): Promise<Result> {
  const { error } = await supabase.from('blocked_slots').delete().eq('id', id);
  return toResult(error);
}

export async function getAllProfiles(): Promise<Profile[]> {
  const { data } = await supabase.from('profiles').select('*').order('created_at');
  return (data as Profile[] | null) ?? [];
}
export async function setProfileRole(id: string, role: Profile['role'], stylistId: string | null): Promise<Result> {
  const { error } = await supabase.from('profiles').update({ role, stylist_id: stylistId }).eq('id', id);
  return toResult(error);
}

export async function addGalleryItem(row: Partial<GalleryItem> & { title: string; image_url: string }): Promise<Result> {
  const { error } = await supabase.from('gallery').insert(row);
  return toResult(error);
}
export async function setGalleryActive(id: string, active: boolean): Promise<Result> {
  const { error } = await supabase.from('gallery').update({ is_active: active }).eq('id', id);
  return toResult(error);
}
export async function deleteGalleryItem(id: string): Promise<Result> {
  const { error } = await supabase.from('gallery').delete().eq('id', id);
  return toResult(error);
}
