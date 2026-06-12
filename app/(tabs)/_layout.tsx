import { useEffect } from 'react';
import { StyleSheet, Platform } from 'react-native';
import { Tabs, router, Redirect } from 'expo-router';
import { BlurView } from 'expo-blur';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { LoadingScreen } from '@/components/ui/loading';
import { useSession } from '@/context/session';
import { useTheme } from '@/hooks/use-theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
  const { c, scheme, Shadow } = useTheme();
  const insets = useSafeAreaInsets();
  const { user, isGuest, loading, profile, profileReady } = useSession();
  const showLoggedTabs = !!user;
  const showGuestTabs = !user && isGuest;

  useEffect(() => {
    if (!loading && !user && !isGuest) router.replace('/access' as never);
  }, [loading, user, isGuest]);

  // Wait for the profile before rendering: without this, staff/admin logging in
  // see the customer tab bar flash before their workspace redirect fires.
  if (loading || (!!user && !profileReady)) return <LoadingScreen message="Loading..." />;

  // Staff guard: redirect linked staff away from customer tabs
  // Placed after all hooks to respect rules-of-hooks
  if (profileReady && profile?.role === 'staff' && profile.stylistId) {
    return <Redirect href={'/(staff)/today' as never} />;
  }
  if (profileReady && profile?.role === 'admin') return <Redirect href={'/(admin)/today' as never} />;

  const isIOS = Platform.OS === 'ios';

  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: c.accent,
      tabBarInactiveTintColor: c.fgMuted,
      tabBarStyle: {
        position: 'absolute',
        // Android is edge-to-edge: keep the dock above the system nav bar.
        bottom: isIOS ? 24 : 16 + insets.bottom,
        left: 16,
        right: 16,
        height: 64,
        borderRadius: 32,
        backgroundColor: isIOS
          ? c.glassBg
          : c.surfaceRaised,
        borderWidth: 1,
        borderColor: isIOS
          ? c.glassBorder
          : c.hairline,
        ...Shadow.sm,
        overflow: 'hidden',
        borderTopWidth: 0,
        paddingBottom: 0,
      },
      tabBarBackground: isIOS ? () => (
        <BlurView
          tint={scheme === 'dark' ? 'dark' : 'light'}
          intensity={scheme === 'dark' ? 22 : 45}
          style={StyleSheet.absoluteFill}
        />
      ) : undefined,
      tabBarLabelStyle: { fontFamily: 'Poppins_600SemiBold', fontSize: 10, marginBottom: 8 },
      tabBarIconStyle: { marginTop: 6 },
    }}>
      <Tabs.Screen name="index" options={{ title: 'Home', href: showLoggedTabs ? undefined : null, tabBarIcon: ({ color }) => <IconSymbol name="house.fill" color={color} /> }} />
      <Tabs.Screen name="new-things" options={{ title: 'New Things', href: showLoggedTabs ? undefined : null, tabBarIcon: ({ color }) => <IconSymbol name="sparkles" color={color} /> }} />
      {/* Shadow.cta is iOS-only here: Android renders the elevation as a literal grey box behind the tab item. */}
      <Tabs.Screen name="book" options={{ title: 'Book', href: showLoggedTabs || showGuestTabs ? undefined : null, tabBarIcon: ({ color }) => <IconSymbol name="calendar" color={color} />, tabBarItemStyle: isIOS ? { ...Shadow.cta } : undefined }} />
      <Tabs.Screen name="schedules" options={{ title: 'Schedules', href: showLoggedTabs || showGuestTabs ? undefined : null, tabBarIcon: ({ color }) => <IconSymbol name="clock.fill" color={color} /> }} />
      <Tabs.Screen name="account" options={{ title: 'Account', href: showLoggedTabs ? undefined : null, tabBarIcon: ({ color }) => <IconSymbol name="person.fill" color={color} /> }} />
    </Tabs>
  );
}
