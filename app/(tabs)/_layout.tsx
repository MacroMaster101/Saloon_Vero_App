import { ChatFab } from '@/components/chat/ChatFab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { LoadingScreen } from '@/components/ui/loading';
import { Layout } from '@/constants/theme';
import { useSession } from '@/context/session';
import { hasSeenWelcome } from '@/lib/auth/onboarding';
import { useTheme } from '@/hooks/use-theme';
import { BlurView } from 'expo-blur';
import { Redirect, Tabs, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform, StyleSheet, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
  const { c, scheme, Shadow } = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  // Align the floating dock's edges with the cards: cards live inside a centered
  // max-width column with a 16px gutter, so the dock's side offset matches.
  const dockSide = (width - Math.min(width, Layout.maxContentWidth)) / 2 + 16;
  const { user, isGuest, loading, profile, profileReady, recovering } = useSession();
  const showLoggedTabs = !!user;
  const showGuestTabs = !user && isGuest;
  const [welcomeSeen, setWelcomeSeen] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (loading || user || isGuest) {
      setWelcomeSeen(null);
      return () => {
        cancelled = true;
      };
    }

    hasSeenWelcome()
      .then((seen) => {
        if (!cancelled) setWelcomeSeen(seen);
      })
      .catch(() => {
        if (!cancelled) setWelcomeSeen(false);
      });

    return () => {
      cancelled = true;
    };
  }, [loading, user, isGuest]);

  const unauthenticatedWelcomePending = !loading && !user && !isGuest && welcomeSeen === null;

  useEffect(() => {
    if (loading || unauthenticatedWelcomePending) return;
    if (!user && !isGuest) router.replace((welcomeSeen ? '/access' : '/') as never);
    // A recovery session must finish setting a new password before using the app.
    else if (recovering) router.replace('/auth/reset-password' as never);
  }, [loading, user, isGuest, recovering, welcomeSeen, unauthenticatedWelcomePending]);

  // Wait for the profile before rendering: without this, staff/admin logging in
  // see the customer tab bar flash before their workspace redirect fires.
  if (loading || unauthenticatedWelcomePending || (!!user && !profileReady)) {
    return <LoadingScreen message="Loading..." />;
  }

  // Staff guard: redirect linked staff away from customer tabs
  // Placed after all hooks to respect rules-of-hooks
  if (profileReady && profile?.role === 'staff' && profile.stylistId) {
    return <Redirect href={'/(staff)/today' as never} />;
  }
  if (profileReady && profile?.role === 'admin') return <Redirect href={'/(admin)/today' as never} />;

  const isIOS = Platform.OS === 'ios';

  return (
    <>
    <Tabs screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: c.accent,
      tabBarInactiveTintColor: c.fgMuted,
      tabBarStyle: {
        position: 'absolute',
        // Android is edge-to-edge: keep the dock above the system nav bar.
        bottom: isIOS ? 24 : 16 + insets.bottom,
        left: dockSide,
        right: dockSide,
        height: Layout.tabBarHeight,
        borderRadius: 32,
        backgroundColor: isIOS
          ? (scheme === 'dark' ? 'rgba(30, 28, 25, 0.78)' : c.glassBg)
          : c.surfaceRaised,
        borderWidth: 1,
        borderColor: isIOS
          ? (scheme === 'dark' ? 'rgba(255, 255, 255, 0.09)' : c.glassBorder)
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
    {showLoggedTabs && <ChatFab />}
    </>
  );
}
