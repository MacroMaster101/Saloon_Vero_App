import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/api/supabase';
import type { SessionProfile } from '@/lib/auth/routing';

const GUEST_MODE_KEY = 'saloon_vero_guest_mode';

type SessionState = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isGuest: boolean;
  // True between a PASSWORD_RECOVERY event and the password actually being reset.
  // A recovery session is a real session, so without this flag the app would route
  // the user straight in — skipping the "set a new password" step.
  recovering: boolean;
  profile: SessionProfile | null;
  profileReady: boolean;
  beginRecovery: () => void;
  continueAsGuest: () => Promise<void>;
  clearGuestMode: () => Promise<void>;
  signOut: () => Promise<void>;
};

const Ctx = createContext<SessionState>({
  user: null,
  session: null,
  loading: true,
  isGuest: false,
  recovering: false,
  profile: null,
  profileReady: true,
  beginRecovery: () => {},
  continueAsGuest: async () => {},
  clearGuestMode: async () => {},
  signOut: async () => {},
});

async function migrateGuestBookings(userId: string) {
  try {
    const raw = await AsyncStorage.getItem('saloon_vero_guest_bookings');
    if (!raw) return;
    const bookings = JSON.parse(raw);
    if (!Array.isArray(bookings) || bookings.length === 0) return;

    const references = bookings.map((b: any) => b.reference).filter(Boolean);
    if (references.length === 0) return;

    const { error } = await (supabase as any).rpc('claim_bookings', { p_booking_references: references });
    if (error) {
      console.error('Failed to claim guest bookings:', error);
      return;
    }

    // Success! Clear guest bookings from local storage
    await AsyncStorage.removeItem('saloon_vero_guest_bookings');
  } catch (err) {
    console.error('Error migrating guest bookings:', err);
  }
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [recovering, setRecovering] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<SessionProfile | null>(null);
  const [profileChecked, setProfileChecked] = useState(false);

  const userId = session?.user?.id ?? null;

  useEffect(() => {
    let mounted = true;
    Promise.all([supabase.auth.getSession(), AsyncStorage.getItem(GUEST_MODE_KEY)])
      .then(([{ data }, guest]) => {
        if (!mounted) return;
        setSession(data.session);
        setIsGuest(!data.session && guest === 'true');
        setLoading(false);
        if (data.session) {
          // migrateGuestBookings catches its own errors, but guard the call too so a
          // rejection can never become an unhandled promise.
          migrateGuestBookings(data.session.user.id).catch(() => {});
        }
      })
      .catch(() => {
        // If session/storage read fails, don't hang on the loading screen forever —
        // fall through as a logged-out user.
        if (mounted) setLoading(false);
      });
    const { data: sub } = supabase.auth.onAuthStateChange(async (event, s) => {
      setSession(s);
      // A recovery code/link creates a session, but the user must set a new
      // password before entering the app. The OTP path fires SIGNED_IN (not
      // PASSWORD_RECOVERY), so the reset screen sets the flag via beginRecovery()
      // *before* verifying — we must NOT clear it on SIGNED_IN here, or we'd undo
      // it instantly. Only a real sign-out (incl. after the password is updated)
      // clears recovery; PASSWORD_RECOVERY (link path) also sets it.
      if (event === 'PASSWORD_RECOVERY') setRecovering(true);
      else if (event === 'SIGNED_OUT') setRecovering(false);
      if (s) {
        await AsyncStorage.removeItem(GUEST_MODE_KEY);
        setIsGuest(false);
        await migrateGuestBookings(s.user.id);
      }
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!userId) {
      setProfile(null);
      setProfileChecked(true);
      return;
    }
    let cancelled = false;
    setProfile(null); // drop the previous user's profile while the new one loads
    setProfileChecked(false);
    (async () => {
      try {
        const { data } = await supabase.from('profiles').select('role,stylist_id').eq('id', userId).single();
        if (cancelled) return;
        setProfile(data ? { role: data.role, stylistId: data.stylist_id } : null);
      } catch {
        if (!cancelled) setProfile(null); // fetch failure -> customer experience, never block login
      } finally {
        if (!cancelled) setProfileChecked(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  // Handlers are stabilised with useCallback so the memoised context value below
  // only changes when actual state changes — otherwise every provider render
  // would hand consumers a new value and re-render most of the app.
  const clearGuestMode = useCallback(async () => {
    await AsyncStorage.removeItem(GUEST_MODE_KEY);
    setIsGuest(false);
  }, []);
  const continueAsGuest = useCallback(async () => {
    await AsyncStorage.setItem(GUEST_MODE_KEY, 'true');
    setIsGuest(true);
  }, []);
  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setRecovering(false);
    await clearGuestMode();
  }, [clearGuestMode]);
  // Called by the reset screen right after verifying the recovery code, so the
  // app holds the user on the new-password step instead of routing them in.
  const beginRecovery = useCallback(() => setRecovering(true), []);

  const value = useMemo(
    () => ({
      user: session?.user ?? null,
      session,
      loading,
      isGuest,
      recovering,
      profile,
      profileReady: profileChecked,
      beginRecovery,
      continueAsGuest,
      clearGuestMode,
      signOut,
    }),
    [session, loading, isGuest, recovering, profile, profileChecked, beginRecovery, continueAsGuest, clearGuestMode, signOut],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
export const useSession = () => useContext(Ctx);
