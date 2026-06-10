import { View, Text } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { ScreenContainer } from '@/components/ui/screen';
import { ThemedButton } from '@/components/ui/button';
import { useTheme } from '@/hooks/use-theme';
export default function Success() {
  const { c, Type, Spacing, Radius } = useTheme();
  const { reference, when, stylist } = useLocalSearchParams<{ reference: string; when: string; stylist: string }>();
  return (
    <ScreenContainer scroll={false} style={{ alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: 88, height: 88, borderRadius: 44, backgroundColor: c.accentTint, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md }}>
        <Text style={{ fontSize: 44, color: '#2E9E5B' }}>✓</Text>
      </View>
      <Text style={[Type.h1, { color: c.fg }]}>Booking confirmed</Text>
      <View style={{ backgroundColor: c.accentTint, borderRadius: Radius.pill, paddingHorizontal: Spacing.md, paddingVertical: 6, marginVertical: Spacing.sm }}>
        <Text style={[Type.h2, { color: c.accentText }]}>{reference}</Text>
      </View>
      <Text style={[Type.body, { color: c.fg2 }]}>{when}</Text>
      <Text style={[Type.body, { color: c.fg2 }]}>with {stylist}</Text>
      <ThemedButton label="View my bookings" onPress={() => router.replace('/(tabs)/account')} style={{ marginTop: Spacing.lg, alignSelf: 'stretch' }} />
    </ScreenContainer>
  );
}
