import { Text, View } from 'react-native';
import { Card } from '@/components/ui/card';
import { useTheme } from '@/hooks/use-theme';

export function StatCard({ value, label }: { value: number | string; label: string }) {
  const { c, Type, Spacing } = useTheme();
  return (
    <Card>
      <View style={{ gap: Spacing.xs / 2 }}>
        <Text style={[Type.h1, { color: c.fg, fontFamily: 'Poppins_800ExtraBold' }]}>{value}</Text>
        <Text style={[Type.caption, { color: c.fgMuted, textTransform: 'uppercase', letterSpacing: 0 }]}>{label}</Text>
      </View>
    </Card>
  );
}
