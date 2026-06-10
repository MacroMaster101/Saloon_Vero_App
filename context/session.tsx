import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/api/supabase';

const GUEST_MODE_KEY = 'saloon_vero_guest_mode';

type SessionState = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isGuest: boolean;
  continueAsGuest: () => Promise<void>;
  clearGuestMode: () => Promise<void>;
  signOut: () => Promise<void>;
};

const Ctx = createContext<SessionState>({
  user: null,
  session: null,
  loading: true,
  isGuest: false,
  continueAsGuest: async () => {},
  clearGuestMode: async () => {},
  signOut: async () => {},
});

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    Promise.all([supabase.auth.getSession(), AsyncStorage.getItem(GUEST_MODE_KEY)]).then(([{ data }, guest]) => {
      if (!mounted) return;
      setSession(data.session);
      setIsGuest(!data.session && guest === 'true');
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange(async (_e, s) => {
      setSession(s);
      if (s) {
        await AsyncStorage.removeItem(GUEST_MODE_KEY);
        setIsGuest(false);
      }
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const clearGuestMode = async () => {
    await AsyncStorage.removeItem(GUEST_MODE_KEY);
    setIsGuest(false);
  };
  const continueAsGuest = async () => {
    await AsyncStorage.setItem(GUEST_MODE_KEY, 'true');
    setIsGuest(true);
  };
  const signOut = async () => {
    await supabase.auth.signOut();
    await clearGuestMode();
  };

  return (
    <Ctx.Provider value={{ user: session?.user ?? null, session, loading, isGuest, continueAsGuest, clearGuestMode, signOut }}>
      {children}
    </Ctx.Provider>
  );
}
export const useSession = () => useContext(Ctx);
