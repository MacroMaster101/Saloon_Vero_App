import { Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { dicebearUrl } from '@/lib/utils/avatar';
import { useTheme } from '@/hooks/use-theme';
import type { Stylist } from '@/types/database';

export function StylistCard({ stylist, selected, onPress }: { stylist: Stylist; selected?: boolean; onPress?: () => void }) {
  const { c, Radius, Spacing, Type } = useTheme();
  const src = stylist.avatar_url?.startsWith('http') ? stylist.avatar_url : dicebearUrl(stylist.name);

  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: 'row',
        gap: Spacing.md,
        alignItems: 'center',
        padding: Spacing.md,
        borderRadius: Radius.lg,
        backgroundColor: selected ? c.accentTint : c.surfaceRaised,
        borderWidth: selected ? 2 : 1,
        borderColor: selected ? c.accent : c.hairline,
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
