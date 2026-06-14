import { Pressable, Text, View } from 'react-native';
import { IconSymbol, type IconSymbolName } from '@/components/ui/icon-symbol';
import { useTheme } from '@/hooks/use-theme';

export type SegmentOption<T extends string> = { value: T; label: string; icon?: IconSymbolName; emoji?: string };

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
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              {opt.icon ? <IconSymbol name={opt.icon} size={15} color={selected ? c.accentText : c.fgMuted} /> : null}
              <Text style={[Type.label, { fontSize: 12, color: selected ? c.accentText : c.fgMuted }]}>
                {opt.emoji ? `${opt.emoji} ` : ''}{opt.label}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}
