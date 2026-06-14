import { StyleSheet, Platform, useWindowDimensions } from 'react-native';
import { Tabs, Redirect } from 'expo-router';
import { BlurView } from 'expo-blur';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { LoadingScreen } from '@/components/ui/loading';
import { useSession } from '@/context/session';
import { useTheme } from '@/hooks/use-theme';
import { Layout } from '@/constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AdminLayout() {
  const { c, scheme, Shadow } = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  // Align the floating dock's edges with the cards: cards live inside a centered
  // max-width column with a 16px gutter, so the dock's side offset matches.
  const dockSide = (width - Math.min(width, Layout.maxContentWidth)) / 2 + 16;
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
        left: dockSide,
        right: dockSide,
        height: 64,
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
      <Tabs.Screen
        name="today"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => <IconSymbol name="chart.bar.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          title: 'Bookings',
          tabBarIcon: ({ color }) => <IconSymbol name="calendar" color={color} />,
        }}
      />
      <Tabs.Screen
        name="walk-in"
        options={{
          title: 'Walk-In',
          tabBarIcon: ({ color }) => <IconSymbol name="plus.circle.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'More',
          tabBarIcon: ({ color }) => <IconSymbol name="ellipsis.circle.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}
