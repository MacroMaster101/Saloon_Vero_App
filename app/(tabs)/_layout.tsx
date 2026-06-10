import { useEffect } from 'react';
import { StyleSheet, Platform } from 'react-native';
import { Tabs, router } from 'expo-router';
import { BlurView } from 'expo-blur';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useSession } from '@/context/session';
import { useTheme } from '@/hooks/use-theme';

export default function TabLayout() {
  const { c, scheme } = useTheme();
  const { user, isGuest, loading } = useSession();
  const showLoggedTabs = !!user;
  const showGuestTabs = !user && isGuest;

  useEffect(() => {
    if (!loading && !user && !isGuest) router.replace('/access' as never);
  }, [loading, user, isGuest]);

  const isIOS = Platform.OS === 'ios';

  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: c.accent,
      tabBarInactiveTintColor: c.fgMuted,
      tabBarStyle: {
        position: 'absolute',
        bottom: isIOS ? 24 : 16,
        left: 16,
        right: 16,
        height: 64,
        borderRadius: 32,
        backgroundColor: isIOS 
          ? (scheme === 'dark' ? 'rgba(26, 20, 15, 0.45)' : 'rgba(255, 255, 255, 0.4)')
          : (scheme === 'dark' ? '#1E1712' : '#FFFFFF'),
        borderWidth: 1,
        borderColor: isIOS
          ? (scheme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(184, 116, 42, 0.15)')
          : (scheme === 'dark' ? '#2E251E' : '#EBE2CF'),
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 6,
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
      <Tabs.Screen name="book" options={{ title: 'Book', href: showLoggedTabs || showGuestTabs ? undefined : null, tabBarIcon: ({ color }) => <IconSymbol name="calendar" color={color} /> }} />
      <Tabs.Screen name="schedules" options={{ title: 'Schedules', href: showLoggedTabs || showGuestTabs ? undefined : null, tabBarIcon: ({ color }) => <IconSymbol name="clock.fill" color={color} /> }} />
      <Tabs.Screen name="account" options={{ title: 'Account', href: showLoggedTabs ? undefined : null, tabBarIcon: ({ color }) => <IconSymbol name="person.fill" color={color} /> }} />
    </Tabs>
  );
}
