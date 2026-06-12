import { Pressable, Text, View } from 'react-native';
import { useTheme } from '@/hooks/use-theme';

export function SlotPicker({ slots, selected, onSelect }: { slots: string[]; selected: string | null; onSelect: (t: string) => void }) {
  const { c, Radius, Spacing, Type } = useTheme();

  if (slots.length === 0) {
    return <Text style={[Type.body, { color: c.fgMuted, paddingVertical: Spacing.md }]}>No times available — try another day.</Text>;
  }

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm }}>
      {slots.map((t) => {
        const active = selected === t;

        return (
          <Pressable
            key={t}
            onPress={() => onSelect(t)}
            style={{
              paddingVertical: 10,
              paddingHorizontal: Spacing.md,
              borderRadius: Radius.pill,
              borderWidth: 1,
              backgroundColor: active ? c.fg : c.surfaceRaised,
              borderColor: active ? c.fg : c.line,
            }}
          >
            <Text style={[Type.label, { color: active ? c.bg : c.fg, fontFamily: 'Poppins_600SemiBold' }]}>{t}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
