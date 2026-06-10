import { Pressable, Text, View, StyleSheet } from 'react-native';
import { money } from '@/lib/utils/format';
import { useTheme } from '@/hooks/use-theme';
import type { Service } from '@/types/database';
export function ServiceCard({ service, onPress }: { service: Service; onPress?: () => void }) {
  const { c, Radius, Shadow, Spacing, Type } = useTheme();
  return (
    <Pressable onPress={onPress} style={[{ flexDirection: 'row', gap: Spacing.md, padding: Spacing.md, borderRadius: Radius.lg, backgroundColor: c.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: c.line, marginBottom: Spacing.sm }, Shadow.sm]}>
      <View style={{ flex: 1 }}>
        <Text style={[Type.label, { color: c.fg, fontSize: 16 }]}>{service.name}</Text>
        {!!service.description && <Text style={[Type.caption, { color: c.fgMuted, marginTop: 2 }]}>{service.description}</Text>}
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={[Type.label, { color: c.accentText }]}>{money(service.price_lkr)}</Text>
        <Text style={[Type.caption, { color: c.fgMuted }]}>{service.duration_min} min</Text>
      </View>
    </Pressable>
  );
}
