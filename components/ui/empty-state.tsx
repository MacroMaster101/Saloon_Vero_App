import { View, Text } from 'react-native';
import { PressableScale } from '@/components/ui/pressable-scale';
import { useTheme } from '@/hooks/use-theme';

export function EmptyState({ icon, title, caption, actionLabel, onAction }: {
  icon?: string; title: string; caption?: string; actionLabel?: string; onAction?: () => void;
}) {
  const { c, Type, Spacing, Radius } = useTheme();
  return (
    <View style={{ alignItems: 'center', paddingVertical: Spacing.xl, gap: Spacing.xs }}>
      {!!icon && <Text style={{ fontSize: 40, marginBottom: Spacing.xs }}>{icon}</Text>}
      <Text style={[Type.h2, { color: c.fg, textAlign: 'center' }]}>{title}</Text>
      {!!caption && (
        <Text style={[Type.body, { color: c.fgMuted, textAlign: 'center', maxWidth: 280 }]}>{caption}</Text>
      )}
      {!!actionLabel && (
        <PressableScale
          onPress={onAction}
          style={{
            marginTop: Spacing.sm, backgroundColor: c.ctaBg, borderRadius: Radius.pill,
            paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, alignItems: 'center',
          }}
        >
          <Text style={[Type.label, { color: c.ctaFg }]}>{actionLabel}</Text>
        </PressableScale>
      )}
    </View>
  );
}
