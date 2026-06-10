import { Tabs } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useTheme } from '@/hooks/use-theme';
export default function TabLayout() {
  const { c } = useTheme();
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: c.accentDark,
      tabBarInactiveTintColor: c.fgMuted,
      tabBarStyle: { backgroundColor: c.surface, borderTopColor: c.line },
      tabBarLabelStyle: { fontFamily: 'Poppins_500Medium', fontSize: 11 },
    }}>
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: ({ color }) => <IconSymbol name="house.fill" color={color} /> }} />
      <Tabs.Screen name="book" options={{ title: 'Book', tabBarIcon: ({ color }) => <IconSymbol name="calendar" color={color} /> }} />
      <Tabs.Screen name="account" options={{ title: 'Account', tabBarIcon: ({ color }) => <IconSymbol name="person.fill" color={color} /> }} />
    </Tabs>
  );
}
