import { makeRedirectUri } from 'expo-auth-session';
import { buildRedirectUri, createSessionFromAuthCallback, withMobileRedirect } from '@/lib/auth/google';
import { supabase } from '@/lib/api/supabase';

jest.mock('expo-auth-session', () => ({ makeRedirectUri: jest.fn((opts: any) => `${opts.scheme}://${opts.path}`) }));
jest.mock('expo-web-browser', () => ({ maybeCompleteAuthSession: () => {}, openAuthSessionAsync: jest.fn() }));
jest.mock('@/lib/api/supabase', () => ({
  supabase: {
    auth: {
      setSession: jest.fn(),
      exchangeCodeForSession: jest.fn(),
    },
  },
}));

const mockSetSession = supabase.auth.setSession as jest.Mock;
const mockExchangeCodeForSession = supabase.auth.exchangeCodeForSession as jest.Mock;

beforeEach(() => {
  mockSetSession.mockClear();
  mockExchangeCodeForSession.mockClear();
  mockSetSession.mockResolvedValue({ error: null });
  mockExchangeCodeForSession.mockResolvedValue({ error: null });
});

test('builds app-scheme redirect uri', () => {
  expect(buildRedirectUri()).toBe('saloonveroapp://auth/callback');
});

test('rewrites Expo Go LAN-IP redirect host to localhost so Supabase accepts it', () => {
  (makeRedirectUri as jest.Mock).mockReturnValueOnce('exp://192.168.1.2:8081/--/auth/callback');
  expect(buildRedirectUri()).toBe('exp://localhost:8081/--/auth/callback');
});

test('leaves non-IP exp redirect uris untouched', () => {
  (makeRedirectUri as jest.Mock).mockReturnValueOnce('exp://localhost:8081/--/auth/callback');
  expect(buildRedirectUri()).toBe('exp://localhost:8081/--/auth/callback');
});

test('forces Supabase OAuth URL to use the app callback', () => {
  const authUrl = 'https://project.supabase.co/auth/v1/authorize?provider=google&redirect_to=https%3A%2F%2Fsaloon-vero.vercel.app%2Fauth%2Fcallback';
  const url = new URL(withMobileRedirect(authUrl, 'saloonveroapp://auth/callback'));

  expect(url.searchParams.get('redirect_to')).toBe('saloonveroapp://auth/callback');
});

test('creates a session from token callback params', async () => {
  await expect(createSessionFromAuthCallback('saloonveroapp://auth/callback#access_token=access&refresh_token=refresh')).resolves.toEqual({ ok: true });
  expect(mockSetSession).toHaveBeenCalledWith({ access_token: 'access', refresh_token: 'refresh' });
});

test('exchanges a code from callback params', async () => {
  await expect(createSessionFromAuthCallback('saloonveroapp://auth/callback?code=code-123')).resolves.toEqual({ ok: true });
  expect(mockExchangeCodeForSession).toHaveBeenCalledWith('code-123');
});
