import { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/hooks/use-theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function ScreenHeader({ eyebrow, title, subtitle, left, right }: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  left?: ReactNode;
  right?: ReactNode;
}) {
  const { c, Spacing, Type } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <LinearGradient
      colors={[c.bg2, c.bg]}
      style={{
        marginHorizontal: -Spacing.md, // bleed past ScreenContainer padding
        paddingHorizontal: Spacing.md, 
        paddingTop: insets.top + Spacing.sm, 
        paddingBottom: Spacing.lg,
        borderBottomWidth: 1, borderBottomColor: c.hairline, marginBottom: Spacing.sm,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: Spacing.sm }}>
        {left && <View style={{ alignSelf: 'center' }}>{left}</View>}
        <View style={{ flex: 1 }}>
          {!!eyebrow && (
            <Text style={[Type.eyebrow, { color: c.accentDark, textTransform: 'uppercase' }]}>{eyebrow}</Text>
          )}
          <Text style={[Type.display, { color: c.fg }]}>{title}</Text>
          {!!subtitle && <Text style={[Type.body, { color: c.fg2, marginTop: Spacing.xs }]}>{subtitle}</Text>}
        </View>
        {right && <View style={{ alignSelf: 'center' }}>{right}</View>}
      </View>
    </LinearGradient>
  );
}
