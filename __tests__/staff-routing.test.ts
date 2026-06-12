import { routeForSession } from '@/lib/auth/routing';

const staffProfile = { role: 'staff', stylistId: 'sty-1' } as const;

test('staff with linked stylist routes to staff workspace', () => {
  expect(routeForSession({ id: 'u1' }, staffProfile, false)).toBe('/(staff)/today');
});
test('staff WITHOUT stylist link falls back to customer tabs', () => {
  expect(routeForSession({ id: 'u1' }, { role: 'staff', stylistId: null }, false)).toBe('/(tabs)');
});
test('plain user routes to customer tabs', () => {
  expect(routeForSession({ id: 'u1' }, { role: 'user', stylistId: null }, false)).toBe('/(tabs)');
});
// Spec 2 (admin workspace) supersedes the Spec-1 fallback — sanctioned by the admin-workspace plan Task 1.
test('admin routes to admin workspace', () => {
  expect(routeForSession({ id: 'u1' }, { role: 'admin', stylistId: null }, false)).toBe('/(admin)/today');
});

test('admin with a stylist link still routes to admin workspace', () => {
  expect(routeForSession({ id: 'u1' }, { role: 'admin', stylistId: 'sty-1' }, false)).toBe('/(admin)/today');
});
test('user with missing profile routes to customer tabs', () => {
  expect(routeForSession({ id: 'u1' }, null, false)).toBe('/(tabs)');
});
test('guest routes to customer tabs', () => {
  expect(routeForSession(null, null, true)).toBe('/(tabs)');
});
test('signed-out non-guest routes nowhere (caller shows onboarding/access)', () => {
  expect(routeForSession(null, null, false)).toBeNull();
});
