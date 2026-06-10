import { readEnv } from '@/config/env';

test('throws when url missing', () => {
  expect(() => readEnv({ EXPO_PUBLIC_SUPABASE_ANON_KEY: 'k' } as any)).toThrow(/SUPABASE_URL/);
});

test('returns config when present', () => {
  const c = readEnv({ EXPO_PUBLIC_SUPABASE_URL: 'https://x.supabase.co', EXPO_PUBLIC_SUPABASE_ANON_KEY: 'k' });
  expect(c).toEqual({ supabaseUrl: 'https://x.supabase.co', supabaseAnonKey: 'k' });
});
