import { Pressable, Text, View } from 'react-native';
import { useTheme } from '@/hooks/use-theme';
export function SlotPicker({ slots, selected, onSelect }: { slots: string[]; selected: string | null; onSelect: (t: string) => void }) {
  const { c, Radius, Spacing, Type } = useTheme();
  if (slots.length === 0) return <Text style={[Type.body, { color: c.fgMuted, paddingVertical: Spacing.md }]}>No times available — try another day.</Text>;
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm }}>
      {slots.map((t) => {
        const on = selected === t;
        return (
          <Pressable key={t} onPress={() => onSelect(t)} style={{ paddingVertical: 10, paddingHorizontal: Spacing.md, borderRadius: Radius.md, borderWidth: 1, backgroundColor: on ? c.accentDark : c.surface, borderColor: on ? c.accentDark : c.line }}>
            <Text style={[Type.label, { color: on ? '#FFFFFF' : c.fg }]}>{t}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
