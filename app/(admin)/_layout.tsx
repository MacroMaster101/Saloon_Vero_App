import { StyleSheet, Platform } from 'react-native';
import { Tabs, Redirect } from 'expo-router';
import { BlurView } from 'expo-blur';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { LoadingScreen } from '@/components/ui/loading';
import { useSession } from '@/context/session';
import { useTheme } from '@/hooks/use-theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AdminLayout() {
  const { c, scheme, Shadow } = useTheme();
  const insets = useSafeAreaInsets();
  const { user, profile, profileReady, loading } = useSession();

  if (loading || !profileReady) return <LoadingScreen message="Loading your salon..." />;

  const isAdmin = !!user && profile?.role === 'admin';
  if (!isAdmin) return <Redirect href="/(tabs)" />;

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
        backgroundColor: isIOS ? c.glassBg : c.surfaceRaised,
        borderWidth: 1,
        borderColor: isIOS ? c.glassBorder : c.hairline,
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
      <Tabs.Screen
        name="today"
        options={{
          title: 'Today',
          tabBarIcon: ({ color }) => <IconSymbol name="calendar" color={color} />,
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          title: 'Schedule',
          tabBarIcon: ({ color }) => <IconSymbol name="clock.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="manage"
        options={{
          title: 'Manage',
          tabBarIcon: ({ color }) => <IconSymbol name="gearshape.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'Account',
          tabBarIcon: ({ color }) => <IconSymbol name="person.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="walk-in"
        options={{ href: null }}
      />
    </Tabs>
  );
}
