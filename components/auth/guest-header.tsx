import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Card } from '@/components/ui/card';
import { useTheme } from '@/hooks/use-theme';

export function GuestHeader() {
  const { c, Radius, Spacing, Type } = useTheme();
  return (
    <Card style={{ gap: Spacing.sm, marginBottom: Spacing.md }}>
      <View>
        <Text style={[Type.eyebrow, { color: c.accentText, letterSpacing: 1.5, textTransform: 'uppercase', fontFamily: 'Poppins_600SemiBold' }]}>Guest mode</Text>
        <Text style={[Type.caption, { color: c.fgMuted, marginTop: 2 }]}>Book now, then create an account anytime to keep everything together.</Text>
      </View>
      <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
        <Pressable
          onPress={() => router.push('/(auth)/login')}
          android_ripple={{ color: c.accentTint }}
          style={{
            flex: 1,
            alignItems: 'center',
            borderRadius: Radius.md,
            borderWidth: 1,
            borderColor: c.line,
            paddingVertical: Spacing.sm + 2,
            overflow: 'hidden', // clip the Android ripple to the rounded shape (transparent bg)
          }}>
          <Text style={[Type.label, { color: c.fg, fontFamily: 'Poppins_600SemiBold' }]}>Login</Text>
        </Pressable>
        <Pressable
          onPress={() => router.push('/(auth)/signup')}
          android_ripple={{ color: c.accentDark }}
          style={{
            flex: 1,
            alignItems: 'center',
            borderRadius: Radius.md,
            backgroundColor: c.accentDark,
            paddingVertical: Spacing.sm + 2,
          }}>
          <Text style={[Type.label, { color: c.bg, fontFamily: 'Poppins_600SemiBold' }]}>Create Account</Text>
        </Pressable>
      </View>
    </Card>
  );
}
