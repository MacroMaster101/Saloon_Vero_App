import { Pressable, Text, View } from 'react-native';
import { money } from '@/lib/utils/format';
import { useTheme } from '@/hooks/use-theme';
import type { Service } from '@/types/database';

export function ServiceCard({ service, onPress }: { service: Service; onPress?: () => void }) {
  const { c, Radius, Shadow, Spacing, Type } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={[
        {
          flexDirection: 'row',
          gap: Spacing.md,
          padding: Spacing.md,
          borderRadius: Radius.lg,
          backgroundColor: c.surfaceRaised,
          borderWidth: 1,
          borderColor: c.hairline,
          marginBottom: Spacing.sm,
        },
        Shadow.sm,
      ]}
    >
      <View style={{ flex: 1 }}>
        <Text style={[Type.label, { color: c.fg, fontSize: 16, fontFamily: 'Poppins_600SemiBold' }]}>{service.name}</Text>
        {!!service.description && <Text style={[Type.caption, { color: c.fgMuted, marginTop: 4, fontSize: 12 }]}>{service.description}</Text>}
      </View>
      <View style={{ alignItems: 'flex-end', justifyContent: 'center' }}>
        <Text style={[Type.label, { color: c.accentDark, fontSize: 15, fontFamily: 'Poppins_700Bold' }]}>{money(service.price_lkr)}</Text>
        <Text style={[Type.caption, { color: c.fgMuted, marginTop: 2 }]}>{service.duration_min} min</Text>
      </View>
    </Pressable>
  );
}
