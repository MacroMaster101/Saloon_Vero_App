import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import AntDesign from '@expo/vector-icons/AntDesign';
import { useTheme } from '@/hooks/use-theme';

export function GoogleButton({ onPress, busy }: { onPress: () => void; busy?: boolean }) {
  const { c, Radius, Spacing, Type, scheme } = useTheme();
  
  const isIOS = Platform.OS === 'ios';

  const bg = isIOS
    ? (scheme === 'dark' ? 'rgba(255, 255, 255, 0.03)' : 'rgba(255, 255, 255, 0.7)')
    : (scheme === 'dark' ? '#241C16' : '#FFFFFF');

  const border = isIOS
    ? (scheme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)')
    : (scheme === 'dark' ? '#3A2E24' : '#EBE2CF');

  const fg = c.fg;
  
  // Icon color: use Google Blue on light mode, and theme foreground on dark mode
  const iconColor = scheme === 'dark' ? '#FAF6EE' : '#4285F4';

  const shadowStyle = {
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  };

  return (
    <View style={{ marginBottom: Spacing.sm }}>
      <Pressable
        disabled={busy}
        android_ripple={{
          color: scheme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(184, 116, 42, 0.12)',
          borderless: false,
        }}
        onPress={onPress}
        style={[
          styles.button,
          {
            backgroundColor: bg,
            borderColor: border,
            borderRadius: Radius.md,
            paddingVertical: Spacing.md - 2,
            paddingHorizontal: Spacing.md,
          },
          shadowStyle,
        ]}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm }}>
          <AntDesign name="google" size={18} color={iconColor} />
          <Text style={[Type.button, { color: fg, fontSize: 15, letterSpacing: 0.5 }]}>
            {busy ? '…' : 'Continue with Google'}
          </Text>
        </View>
      </Pressable>
      <Text style={[Type.caption, { color: c.fgMuted, textAlign: 'center', marginTop: 6 }]}>
        Sign in with your Google account
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
