import { Pressable, Text, View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { dicebearUrl } from '@/lib/utils/avatar';
import { useTheme } from '@/hooks/use-theme';
import type { Stylist } from '@/types/database';
export function StylistCard({ stylist, selected, onPress }: { stylist: Stylist; selected?: boolean; onPress?: () => void }) {
  const { c, Radius, Spacing, Type } = useTheme();
  const src = stylist.avatar_url?.startsWith('http') ? stylist.avatar_url : dicebearUrl(stylist.name);
  return (
    <Pressable onPress={onPress} style={{ flexDirection: 'row', gap: Spacing.md, alignItems: 'center', padding: Spacing.md, borderRadius: Radius.lg, backgroundColor: c.surface, borderWidth: selected ? 2 : StyleSheet.hairlineWidth, borderColor: selected ? c.accent : c.line, marginBottom: Spacing.sm }}>
      <Image source={{ uri: src }} style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: c.bg2 }} contentFit="cover" />
      <View><Text style={[Type.label, { color: c.fg, fontSize: 15 }]}>{stylist.name}</Text><Text style={[Type.caption, { color: c.fgMuted }]}>{stylist.role}</Text></View>
    </Pressable>
  );
}
