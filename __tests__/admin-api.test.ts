import {
  getAllBookings, getServicesAdmin, getStylistsAdmin, getGalleryAdmin, upsertService, upsertStylist,
  getBlockedSlots, createBlockedSlot, deleteBlockedSlot, getAllProfiles, setProfileRole,
  addGalleryItem, setGalleryActive, deleteGalleryItem,
} from '@/lib/api/admin';
import { supabase } from '@/lib/api/supabase';

jest.mock('@/lib/api/supabase', () => {
  const result = { data: [{ id: 'x' }], error: null };
  const order = jest.fn().mockResolvedValue(result);
  const lt = jest.fn().mockReturnValue({ order });
  const gte = jest.fn().mockReturnValue({ lt, order });
  const select = jest.fn().mockReturnValue({ gte, order });
  const eqUpd = jest.fn().mockResolvedValue({ error: null });
  const update = jest.fn().mockReturnValue({ eq: eqUpd });
  const insert = jest.fn().mockResolvedValue({ error: null });
  const upsert = jest.fn().mockResolvedValue({ error: null });
  const eqDel = jest.fn().mockResolvedValue({ error: null });
  const del = jest.fn().mockReturnValue({ eq: eqDel });
  const from = jest.fn().mockReturnValue({ select, update, insert, upsert, delete: del });
  return { supabase: { from, __mock: { from, select, gte, lt, order, update, eqUpd, insert, upsert, del, eqDel } } };
});

const m = (supabase as any).__mock;
beforeEach(() => jest.clearAllMocks());

test('upsertStylist passes the row through', async () => {
  await expect(upsertStylist({ slug: 'ruwan', name: 'Ruwan', role: 'Barber' })).resolves.toEqual({ ok: true });
  expect(m.from).toHaveBeenCalledWith('stylists');
  expect(m.upsert).toHaveBeenCalledWith({ slug: 'ruwan', name: 'Ruwan', role: 'Barber' });
});

test('getAllProfiles queries profiles ordered by created_at', async () => {
  await getAllProfiles();
  expect(m.from).toHaveBeenCalledWith('profiles');
  expect(m.order).toHaveBeenCalledWith('created_at');
});

test('getAllBookings queries the window without stylist filter', async () => {
  await getAllBookings({ from: 'A', to: 'B' });
  expect(m.from).toHaveBeenCalledWith('bookings');
  expect(m.select).toHaveBeenCalledWith('id,reference,starts_at,ends_at,status,customer_name,customer_phone,notes,service_id,stylist_id');
  expect(m.gte).toHaveBeenCalledWith('starts_at', 'A');
  expect(m.lt).toHaveBeenCalledWith('starts_at', 'B');
});

test('admin getters do NOT filter is_active', async () => {
  await getServicesAdmin();
  expect(m.from).toHaveBeenCalledWith('services');
  expect(m.select).toHaveBeenCalledWith('*');
  expect(m.order).toHaveBeenCalledWith('sort_order');
  await getStylistsAdmin();
  expect(m.from).toHaveBeenCalledWith('stylists');
  await getGalleryAdmin();
  expect(m.from).toHaveBeenCalledWith('gallery');
});

test('upsertService passes the row through', async () => {
  await expect(upsertService({ slug: 's', name: 'N', category: 'hair', price_lkr: 1, duration_min: 2 })).resolves.toEqual({ ok: true });
  expect(m.upsert).toHaveBeenCalledWith({ slug: 's', name: 'N', category: 'hair', price_lkr: 1, duration_min: 2 });
});

test('blocked slots CRUD', async () => {
  await getBlockedSlots({ from: 'A' });
  expect(m.from).toHaveBeenCalledWith('blocked_slots');
  await expect(createBlockedSlot({ stylistId: null, startsAt: 'S', endsAt: 'E', reason: 'r' })).resolves.toEqual({ ok: true });
  expect(m.insert).toHaveBeenCalledWith({ stylist_id: null, starts_at: 'S', ends_at: 'E', reason: 'r' });
  await expect(deleteBlockedSlot('b1')).resolves.toEqual({ ok: true });
  expect(m.eqDel).toHaveBeenCalledWith('id', 'b1');
});

test('setProfileRole updates role and stylist link', async () => {
  await expect(setProfileRole('u2', 'staff', 'sty-1')).resolves.toEqual({ ok: true });
  expect(m.from).toHaveBeenCalledWith('profiles');
  expect(m.update).toHaveBeenCalledWith({ role: 'staff', stylist_id: 'sty-1' });
  expect(m.eqUpd).toHaveBeenCalledWith('id', 'u2');
});

test('gallery item lifecycle', async () => {
  await expect(addGalleryItem({ title: 'T', image_url: 'http://x/y.jpg', tag: 'Hair', category: 'c' })).resolves.toEqual({ ok: true });
  expect(m.insert).toHaveBeenCalledWith({ title: 'T', image_url: 'http://x/y.jpg', tag: 'Hair', category: 'c' });
  await expect(setGalleryActive('g1', false)).resolves.toEqual({ ok: true });
  expect(m.update).toHaveBeenCalledWith({ is_active: false });
  await expect(deleteGalleryItem('g1')).resolves.toEqual({ ok: true });
});
