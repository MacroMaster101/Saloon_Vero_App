import { View } from 'react-native';
import { useTheme } from '@/hooks/use-theme';

export function StepIndicator({ total, current }: { total: number; current: number }) {
  const { c, Spacing } = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: Spacing.xs, marginBottom: Spacing.md }}>
      {Array.from({ length: total }).map((_, i) => (
        <View key={i} style={{ height: 4, flex: 1, borderRadius: 2, backgroundColor: i <= current ? c.accent : c.line }} />
      ))}
    </View>
  );
}
