import { Text, View } from 'react-native';
import { useTheme } from '@/hooks/use-theme';

type Palette = { accent: string; fg2: string; error: string; fgMuted: string };
export function statusColor(status: string, c: Palette): string {
  switch (status) {
    case 'confirmed': return c.accent;
    case 'completed': return c.fg2;
    case 'cancelled': case 'no_show': return c.error;
    default: return c.fgMuted;
  }
}
export function StatusTag({ status }: { status: string }) {
  const { c, Radius, Type } = useTheme();
  const color = statusColor(status, c);
  return (
    <View style={{ borderRadius: Radius.pill, borderWidth: 1, borderColor: color, paddingHorizontal: 10, paddingVertical: 3 }}>
      <Text style={[Type.caption, { color, textTransform: 'capitalize' }]}>{status.replace('_', ' ')}</Text>
    </View>
  );
}
