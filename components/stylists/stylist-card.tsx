import { Pressable, Text, View, Platform } from 'react-native';
import { Image } from 'expo-image';
import { dicebearUrl } from '@/lib/utils/avatar';
import { useTheme } from '@/hooks/use-theme';
import type { Stylist } from '@/types/database';

export function StylistCard({ stylist, selected, onPress }: { stylist: Stylist; selected?: boolean; onPress?: () => void }) {
  const { c, Radius, Spacing, Type, scheme } = useTheme();
  const src = stylist.avatar_url?.startsWith('http') ? stylist.avatar_url : dicebearUrl(stylist.name);

  const isIOS = Platform.OS === 'ios';

  const bg = selected 
    ? (scheme === 'dark' ? 'rgba(232, 176, 90, 0.10)' : 'rgba(217, 154, 61, 0.10)')
    : isIOS
      ? (scheme === 'dark' ? 'rgba(255, 255, 255, 0.03)' : 'rgba(255, 255, 255, 0.55)')
      : (scheme === 'dark' ? '#1E1712' : '#FFFFFF');
  
  const border = selected 
    ? c.accent 
    : isIOS
      ? (scheme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(184, 116, 42, 0.15)')
      : (scheme === 'dark' ? '#2E251E' : '#EBE2CF');

  return (
    <Pressable 
      onPress={onPress} 
      style={{ 
        flexDirection: 'row', 
        gap: Spacing.md, 
        alignItems: 'center', 
        padding: Spacing.md, 
        borderRadius: Radius.lg, 
        backgroundColor: bg, 
        borderWidth: selected ? 2 : 1, 
        borderColor: border, 
        marginBottom: Spacing.sm 
      }}
    >
      <Image source={{ uri: src }} style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: c.bg2 }} contentFit="cover" />
      <View style={{ flex: 1 }}>
        <Text style={[Type.label, { color: c.fg, fontSize: 16, fontFamily: 'Poppins_600SemiBold' }]}>{stylist.name}</Text>
        <Text style={[Type.caption, { color: c.fgMuted, marginTop: 2 }]}>{stylist.role}</Text>
      </View>
    </Pressable>
  );
}
