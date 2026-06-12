import { Pressable, Text, View } from 'react-native';
import { useTheme } from '@/hooks/use-theme';

export type SegmentOption<T extends string> = { value: T; label: string; emoji?: string };

export function SegmentedControl<T extends string>({ options, value, onChange }: {
  options: readonly SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
}) {
  const { c, Radius, Type, Spacing, Shadow } = useTheme();
  return (
    <View style={{ flexDirection: 'row', backgroundColor: c.bg2, borderRadius: Radius.pill, padding: 3, gap: 3 }}>
      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => onChange(opt.value)}
            style={[
              { flex: 1, alignItems: 'center', paddingVertical: Spacing.sm, borderRadius: Radius.pill },
              selected && { backgroundColor: c.surfaceRaised, ...Shadow.sm },
            ]}
          >
            <Text style={[Type.label, { fontSize: 12, color: selected ? c.accentText : c.fgMuted }]}>
              {opt.emoji ? `${opt.emoji} ` : ''}{opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
