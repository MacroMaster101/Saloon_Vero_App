import { View } from 'react-native';
import { useTheme } from '@/hooks/use-theme';

export function StepIndicator({ total, current }: { total: number; current: number }) {
  const { c, Spacing, scheme } = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: Spacing.xs, marginBottom: Spacing.md }}>
      {Array.from({ length: total }).map((_, i) => {
        const active = i <= current;
        const bg = active ? c.accent : (scheme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(184, 116, 42, 0.15)');
        return (
          <View key={i} style={{ height: 4, flex: 1, borderRadius: 2, backgroundColor: bg }} />
        );
      })}
    </View>
  );
}
