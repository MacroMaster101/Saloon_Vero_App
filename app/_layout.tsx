import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts, Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold, Poppins_800ExtraBold,
} from '@expo-google-fonts/poppins';
import 'react-native-reanimated';

import { SessionProvider } from '@/context/session';
import { ThemePreferenceProvider, useThemePreference } from '@/context/theme';
import { Colors } from '@/constants/theme';

export const unstable_settings = { anchor: '(tabs)' };
SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const { resolvedScheme } = useThemePreference();

  const nav = resolvedScheme === 'dark'
    ? { ...DarkTheme, colors: { ...DarkTheme.colors, background: Colors.dark.bg, card: Colors.dark.surface, text: Colors.dark.fg, primary: Colors.dark.accent, border: Colors.dark.line } }
    : { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: Colors.light.bg, card: Colors.light.surface, text: Colors.light.fg, primary: Colors.light.accent, border: Colors.light.line } };

  return (
    <ThemeProvider value={nav}>
      <Stack screenOptions={{ contentStyle: { backgroundColor: nav.colors.background } }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="access" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="auth/callback" options={{ headerShown: false }} />
        <Stack.Screen name="booking" options={{ headerShown: false }} />
        <Stack.Screen name="(staff)" options={{ headerShown: false }} />
        <Stack.Screen name="(admin)" options={{ headerShown: false }} />
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
        <RootNavigator />
      </ThemePreferenceProvider>
    </SessionProvider>
  );
}
