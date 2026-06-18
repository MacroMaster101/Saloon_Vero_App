import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, type ErrorBoundaryProps } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import {
  useFonts, Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold, Poppins_800ExtraBold,
} from '@expo-google-fonts/poppins';
import 'react-native-reanimated';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { SessionProvider, useSession } from '@/context/session';
import { ThemePreferenceProvider, useThemePreference } from '@/context/theme';
import { PermissionPrimerProvider } from '@/components/permissions/PermissionPrimer';
import { Colors } from '@/constants/theme';

// Native cold starts must enter `app/index.tsx` first; it owns the splash,
// onboarding, guest, and auth routing decision. Anchoring `(tabs)` lets the tab
// guard run before the first-launch check in release/development APKs.
export const unstable_settings = { anchor: 'index' };
SplashScreen.preventAutoHideAsync();

// Push notifications were removed from Expo Go in SDK 53. Only touch the
// expo-notifications APIs in a real/dev build so Expo Go stays usable for
// everything else.
const isExpoGo =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

if (!isExpoGo) {
  // Require lazily so expo-notifications is never imported in Expo Go (its
  // import-time side effects warn/error on SDK 53+). Show notifications while
  // the app is foregrounded.
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- lazy require keeps expo-notifications out of Expo Go
  const Notifications = require('expo-notifications') as typeof import('expo-notifications');
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

// Hardcoded (no theme/context dependency) so this still renders if a
// provider above it (Session/ThemePreference/PermissionPrimer) is what threw.
const FALLBACK_COLORS = {
  bg: '#1A1816',
  fg: '#F5F1EA',
  fgMuted: '#8A8378',
  accent: '#D9A648',
  accentText: '#1A1816',
};

/**
 * Root-level error boundary for Expo Router. Exporting this from the root
 * `_layout.tsx` gives an app-wide fallback so an uncaught render error shows
 * a friendly screen instead of a white screen / crash.
 *
 * Intentionally self-contained: no `useTheme()`, no app context. If a
 * provider itself throws, this still needs to render.
 */
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Something went wrong</Text>
        <Text style={styles.subtitle}>
          We hit a snag loading this screen. Your data is safe — let&apos;s try that again.
        </Text>

        {__DEV__ ? (
          <ScrollView style={styles.detailsBox} contentContainerStyle={styles.detailsContent}>
            <Text style={styles.detailsLabel}>{error.message}</Text>
            {error.stack ? (
              <Text style={styles.detailsStack}>{error.stack.slice(0, 600)}</Text>
            ) : null}
          </ScrollView>
        ) : (
          <Text style={styles.detailsLabel}>Please try again.</Text>
        )}

        <Pressable
          onPress={() => { retry(); }}
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
        >
          <Text style={styles.buttonText}>Try again</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: FALLBACK_COLORS.bg,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  title: {
    color: FALLBACK_COLORS.fg,
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    color: FALLBACK_COLORS.fgMuted,
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 20,
  },
  detailsBox: {
    maxHeight: 180,
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 12,
    marginBottom: 24,
  },
  detailsContent: {
    padding: 12,
  },
  detailsLabel: {
    color: FALLBACK_COLORS.fgMuted,
    fontSize: 13,
    fontFamily: 'monospace',
    textAlign: 'center',
  },
  detailsStack: {
    color: FALLBACK_COLORS.fgMuted,
    fontSize: 11,
    fontFamily: 'monospace',
    marginTop: 8,
  },
  button: {
    backgroundColor: FALLBACK_COLORS.accent,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 999,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonText: {
    color: FALLBACK_COLORS.accentText,
    fontSize: 16,
    fontWeight: '700',
  },
});

/** Registers the device for push once a user is signed in. */
function PushRegistrar() {
  const { user } = useSession();
  useEffect(() => {
    if (!user || isExpoGo) return;
    const { registerForPushNotifications } =
      // eslint-disable-next-line @typescript-eslint/no-require-imports -- lazy require keeps expo-notifications out of Expo Go
      require('@/lib/notifications/register') as typeof import('@/lib/notifications/register');
    registerForPushNotifications(user.id);
  }, [user]);
  return null;
}

function RootNavigator() {
  const { resolvedScheme } = useThemePreference();

  const nav = resolvedScheme === 'dark'
    ? { ...DarkTheme, colors: { ...DarkTheme.colors, background: Colors.dark.bg, card: Colors.dark.surface, text: Colors.dark.fg, primary: Colors.dark.accent, border: Colors.dark.line } }
    : { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: Colors.light.bg, card: Colors.light.surface, text: Colors.light.fg, primary: Colors.light.accent, border: Colors.light.line } };

  return (
    <ThemeProvider value={nav}>
      <Stack screenOptions={{ contentStyle: { backgroundColor: nav.colors.background }, animation: 'slide_from_right' }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="access" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="auth/callback" options={{ headerShown: false }} />
        <Stack.Screen name="auth/reset-password" options={{ headerShown: false }} />
        <Stack.Screen name="booking" options={{ headerShown: false }} />
        <Stack.Screen name="(staff)" options={{ headerShown: false }} />
        <Stack.Screen name="(admin)" options={{ headerShown: false }} />
        <Stack.Screen name="messages" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style={resolvedScheme === 'dark' ? 'light' : 'dark'} />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  const [loaded] = useFonts({ Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold, Poppins_800ExtraBold });
  useEffect(() => { if (loaded) SplashScreen.hideAsync(); }, [loaded]);
  if (!loaded) return null;

  return (
    <SessionProvider>
      <ThemePreferenceProvider>
        <PermissionPrimerProvider>
          <PushRegistrar />
          <RootNavigator />
        </PermissionPrimerProvider>
      </ThemePreferenceProvider>
    </SessionProvider>
  );
}
