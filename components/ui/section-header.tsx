import { View, Text } from 'react-native';
import { useTheme } from '@/hooks/use-theme';

export function SectionHeader({ eyebrow, title }: { eyebrow?: string; title: string }) {
  const { c, Type, Spacing } = useTheme();
  return (
    <View style={{ marginTop: Spacing.lg, marginBottom: Spacing.sm }}>
      {!!eyebrow && <Text style={[Type.eyebrow, { color: c.accentText, letterSpacing: 1, textTransform: 'uppercase' }]}>{eyebrow}</Text>}
      <Text style={[Type.h2, { color: c.fg }]}>{title}</Text>
    </View>
  );
}
