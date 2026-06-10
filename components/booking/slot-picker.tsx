import { Platform, Pressable, Text, View } from 'react-native';
import { useTheme } from '@/hooks/use-theme';

export function SlotPicker({ slots, selected, onSelect }: { slots: string[]; selected: string | null; onSelect: (t: string) => void }) {
  const { c, Radius, Spacing, Type, scheme } = useTheme();
  
  if (slots.length === 0) {
    return <Text style={[Type.body, { color: c.fgMuted, paddingVertical: Spacing.md }]}>No times available — try another day.</Text>;
  }

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm }}>
      {slots.map((t) => {
        const active = selected === t;
        const bg = active 
          ? c.accentDark 
          : Platform.OS === 'ios'
            ? (scheme === 'dark' ? 'rgba(255, 255, 255, 0.03)' : 'rgba(255, 255, 255, 0.55)')
            : (scheme === 'dark' ? '#1E1712' : '#FFFFFF');
        const border = active 
          ? c.accentDark 
          : Platform.OS === 'ios'
            ? (scheme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(184, 116, 42, 0.15)')
            : (scheme === 'dark' ? '#2E251E' : '#EBE2CF');

        return (
          <Pressable 
            key={t} 
            onPress={() => onSelect(t)} 
            style={{ 
              paddingVertical: 10, 
              paddingHorizontal: Spacing.md, 
              borderRadius: Radius.md, 
              borderWidth: 1, 
              backgroundColor: bg, 
              borderColor: border 
            }}
          >
            <Text style={[Type.label, { color: active ? '#FFFFFF' : c.fg, fontFamily: 'Poppins_600SemiBold' }]}>{t}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
