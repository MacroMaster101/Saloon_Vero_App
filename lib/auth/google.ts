import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import { supabase } from '@/lib/api/supabase';

WebBrowser.maybeCompleteAuthSession();

export function buildRedirectUri(): string {
  return makeRedirectUri({ scheme: 'saloonveroapp' });
}

export type GoogleResult = { ok: true } | { ok: false; message: string };

export async function signInWithGoogle(): Promise<GoogleResult> {
  const redirectTo = buildRedirectUri();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo, skipBrowserRedirect: true },
  });
  if (error || !data?.url) return { ok: false, message: error?.message ?? 'Could not start Google sign-in.' };

  const res = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (res.type !== 'success' || !res.url) return { ok: false, message: 'Sign-in was cancelled.' };

  const url = new URL(res.url);
  const params = new URLSearchParams(url.hash ? url.hash.substring(1) : url.search);
  const access_token = params.get('access_token');
  const refresh_token = params.get('refresh_token');
  if (access_token && refresh_token) {
    const { error: setErr } = await supabase.auth.setSession({ access_token, refresh_token });
    if (setErr) return { ok: false, message: setErr.message };
    return { ok: true };
  }
  const code = params.get('code');
  if (code) {
    const { error: exErr } = await supabase.auth.exchangeCodeForSession(code);
    if (exErr) return { ok: false, message: exErr.message };
    return { ok: true };
  }
  return { ok: false, message: 'No session returned from Google.' };
}
