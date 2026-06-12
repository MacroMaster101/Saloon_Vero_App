import { View, Text } from 'react-native';
import { useTheme } from '@/hooks/use-theme';

export function SectionHeader({ eyebrow, title, number }: { eyebrow?: string; title: string; number?: number }) {
  const { c, Type, Spacing } = useTheme();
  return (
    <View style={{ marginTop: Spacing.lg, marginBottom: Spacing.sm }}>
      {!!eyebrow && <Text style={[Type.eyebrow, { color: c.accentText, textTransform: 'uppercase' }]}>{eyebrow}</Text>}
      <Text style={[Type.h2, { color: c.fg }]}>
        {number != null && (
          <Text style={{ color: c.accentDark }}>{`${String(number).padStart(2, '0')} — `}</Text>
        )}
        {title}
      </Text>
    </View>
  );
}
