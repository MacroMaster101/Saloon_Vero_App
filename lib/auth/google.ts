import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import { supabase } from '@/lib/api/supabase';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_AUTH_CALLBACK_PATH = 'auth/callback';
const NATIVE_GOOGLE_AUTH_CALLBACK = `saloonveroapp://${GOOGLE_AUTH_CALLBACK_PATH}`;

// Supabase Auth hard-rejects redirect URLs whose host is an IP address
// (only localhost/127.0.0.1 are exempt) and silently falls back to the
// Site URL, even when the exact URL is in the dashboard allow list. Expo Go
// redirect URIs look like exp://192.168.1.2:8081/--/auth/callback, so swap
// the LAN IP for localhost. The auth session matches the callback by scheme
// alone and the tokens are parsed in-app, so the host never gets dereferenced.
function normalizeExpoGoRedirect(uri: string): string {
  if (!uri.startsWith('exp://')) return uri;
  return uri.replace(/^exp:\/\/\d{1,3}(?:\.\d{1,3}){3}/, 'exp://localhost');
}

export function buildRedirectUri(): string {
  return normalizeExpoGoRedirect(
    makeRedirectUri({
      scheme: 'saloonveroapp',
      path: GOOGLE_AUTH_CALLBACK_PATH,
      native: NATIVE_GOOGLE_AUTH_CALLBACK,
    })
  );
}

export type GoogleResult = { ok: true } | { ok: false; message: string };

export function withMobileRedirect(authUrl: string, redirectTo: string): string {
  const url = new URL(authUrl);
  url.searchParams.set('redirect_to', redirectTo);
  return url.toString();
}

function isExpectedCallback(callbackUrl: string, redirectTo: string): boolean {
  return callbackUrl.startsWith(redirectTo);
}

function getCallbackParams(callbackUrl: string) {
  const params = new URLSearchParams();
  const [urlWithoutHash, hash = ''] = callbackUrl.split('#');
  const query = urlWithoutHash.split('?')[1] ?? '';

  for (const [key, value] of new URLSearchParams(query)) params.set(key, value);
  for (const [key, value] of new URLSearchParams(hash)) params.set(key, value);

  return params;
}

export async function createSessionFromAuthCallback(callbackUrl: string): Promise<GoogleResult> {
  const params = getCallbackParams(callbackUrl);
  const authError = params.get('error_description') ?? params.get('error') ?? params.get('error_code');
  if (authError) return { ok: false, message: authError };

  const access_token = params.get('access_token');
  const refresh_token = params.get('refresh_token');
  if (access_token && refresh_token) {
    const { error } = await supabase.auth.setSession({ access_token, refresh_token });
    if (error) return { ok: false, message: error.message };
    return { ok: true };
  }

  const code = params.get('code');
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) return { ok: false, message: error.message };
    return { ok: true };
  }

  return { ok: false, message: 'No session returned from Google.' };
}

export async function signInWithGoogle(): Promise<GoogleResult> {
  const redirectTo = buildRedirectUri();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo, skipBrowserRedirect: true },
  });
  if (error || !data?.url) return { ok: false, message: error?.message ?? 'Could not start Google sign-in.' };

  const authUrl = withMobileRedirect(data.url, redirectTo);
  if (__DEV__) {
    console.log('[Google OAuth] redirectTo:', redirectTo);
    console.log('[Google OAuth] authUrl:', authUrl);
  }
  const res = await WebBrowser.openAuthSessionAsync(authUrl, redirectTo, { createTask: false });
  // Log only the result type — res.url carries access/refresh tokens.
  if (__DEV__) console.log('[Google OAuth] result type:', res.type);
  if (res.type !== 'success' || !res.url) return { ok: false, message: 'Sign-in was cancelled.' };
  if (!isExpectedCallback(res.url, redirectTo)) {
    const debug = __DEV__ ? ` Tried redirect: ${redirectTo}` : '';
    return { ok: false, message: `Google returned to the website instead of the app.${debug}` };
  }

  return createSessionFromAuthCallback(res.url);
}
