jest.mock('expo-auth-session', () => ({ makeRedirectUri: (opts: any) => `${opts.scheme}://redirect` }));
jest.mock('expo-web-browser', () => ({ maybeCompleteAuthSession: () => {}, openAuthSessionAsync: jest.fn() }));
jest.mock('@/lib/api/supabase', () => ({ supabase: {} }));
import { buildRedirectUri } from '@/lib/auth/google';
test('builds app-scheme redirect uri', () => {
  expect(buildRedirectUri()).toBe('saloonveroapp://redirect');
});
