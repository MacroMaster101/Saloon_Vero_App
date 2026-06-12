import { View, Text } from 'react-native';
import { useTheme } from '@/hooks/use-theme';

export function StepIndicator({ total, current }: { total: number; current: number }) {
  const { c, Spacing, Type } = useTheme();
  return (
    <View style={{ marginBottom: Spacing.md }}>
      <View style={{ flexDirection: 'row', gap: Spacing.xs }}>
        {Array.from({ length: total }).map((_, i) => {
          const active = i <= current;
          const bg = active ? c.accent : c.hairline;
          return (
            <View key={i} style={{ height: 4, flex: 1, borderRadius: 2, backgroundColor: bg }} />
          );
        })}
      </View>
      <Text style={[Type.caption, { color: c.fgMuted, marginTop: 4 }]}>
        Step {current + 1} of {total}
      </Text>
    </View>
  );
}
