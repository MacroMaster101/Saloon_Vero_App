import { getMyAssignedBookings, setBookingStatus } from '@/lib/api/staff';
import { supabase } from '@/lib/api/supabase';

jest.mock('@/lib/api/supabase', () => {
  const order = jest.fn().mockResolvedValue({ data: [{ id: 'b1' }], error: null });
  const lt = jest.fn().mockReturnValue({ order });
  const gte = jest.fn().mockReturnValue({ lt });
  const eqSel = jest.fn().mockReturnValue({ gte });
  const select = jest.fn().mockReturnValue({ eq: eqSel });
  const eqUpd = jest.fn().mockResolvedValue({ error: null });
  const update = jest.fn().mockReturnValue({ eq: eqUpd });
  const from = jest.fn().mockReturnValue({ select, update });
  return { supabase: { from, __mock: { from, select, eqSel, gte, lt, order, update, eqUpd } } };
});

const m = (supabase as any).__mock;

test('getMyAssignedBookings queries bookings for the stylist in a window', async () => {
  const rows = await getMyAssignedBookings({ stylistId: 'sty-1', from: '2026-06-11T00:00:00Z', to: '2026-06-12T00:00:00Z' });
  expect(m.from).toHaveBeenCalledWith('bookings');
  expect(m.select).toHaveBeenCalledWith('id,reference,starts_at,ends_at,status,customer_name,customer_phone,notes,service_id');
  expect(m.eqSel).toHaveBeenCalledWith('stylist_id', 'sty-1');
  expect(m.gte).toHaveBeenCalledWith('starts_at', '2026-06-11T00:00:00Z');
  expect(m.lt).toHaveBeenCalledWith('starts_at', '2026-06-12T00:00:00Z');
  expect(m.order).toHaveBeenCalledWith('starts_at');
  expect(rows).toEqual([{ id: 'b1' }]);
});

test('setBookingStatus updates the row and reports ok', async () => {
  await expect(setBookingStatus('b1', 'completed')).resolves.toEqual({ ok: true });
  expect(m.update).toHaveBeenCalledWith({ status: 'completed' });
  expect(m.eqUpd).toHaveBeenCalledWith('id', 'b1');
});

test('setBookingStatus surfaces errors', async () => {
  m.eqUpd.mockResolvedValueOnce({ error: { message: 'denied' } });
  await expect(setBookingStatus('b1', 'cancelled')).resolves.toEqual({ error: 'denied' });
});
