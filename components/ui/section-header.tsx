import { View, Text } from 'react-native';
import { useTheme } from '@/hooks/use-theme';

export function SectionHeader({ eyebrow, title, number }: { eyebrow?: string; title: string; number?: number }) {
  const { c, Type, Spacing, Radius } = useTheme();
  return (
    <View style={{ marginTop: Spacing.lg, marginBottom: Spacing.sm }}>
      {!!eyebrow && <Text style={[Type.eyebrow, { color: c.accentText, textTransform: 'uppercase' }]}>{eyebrow}</Text>}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: 2 }}>
        {number != null && (
          <View style={{ backgroundColor: c.accentTint, borderRadius: Radius.sm, paddingHorizontal: 8, paddingVertical: 2 }}>
            <Text style={[Type.label, { color: c.accentDark }]}>{String(number).padStart(2, '0')}</Text>
          </View>
        )}
        <Text style={[Type.h2, { color: c.fg, flex: 1 }]}>{title}</Text>
      </View>
    </View>
  );
}
