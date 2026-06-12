import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { GoogleLogo } from '@/components/ui/google-logo';
import { useTheme } from '@/hooks/use-theme';

export function GoogleButton({ onPress, busy }: { onPress: () => void; busy?: boolean }) {
  const { c, Radius, Spacing, Type, scheme } = useTheme();
  
  const isIOS = Platform.OS === 'ios';

  const bg = isIOS
    ? (scheme === 'dark' ? 'rgba(255, 255, 255, 0.03)' : 'rgba(255, 255, 255, 0.7)')
    : (scheme === 'dark' ? '#1E1C19' : '#FFFFFF');

  const border = isIOS
    ? (scheme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)')
    : (scheme === 'dark' ? 'rgba(255, 255, 255, 0.09)' : '#E6E4DF');

  const fg = c.fg;

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
          color: scheme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(168, 122, 46, 0.12)',
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
          <GoogleLogo size={18} />
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
