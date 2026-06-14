import { Text, ViewStyle, StyleSheet, Platform } from 'react-native';
import { PressableScale } from '@/components/ui/pressable-scale';
import { useTheme } from '@/hooks/use-theme';

type Variant = 'primary' | 'secondary' | 'destructive' | 'social';

export function ThemedButton({ label, onPress, variant = 'primary', busy = false, style }: { label: string; onPress?: () => void; variant?: Variant; busy?: boolean; style?: ViewStyle }) {
  const { c, Radius, Type, Spacing, Shadow, scheme } = useTheme();
  const isIOS = Platform.OS === 'ios';

  // Premium styling values
  let bg = '';
  let fg = '';
  let border = '';

  if (variant === 'primary') {
    bg = c.ctaBg;
    fg = c.ctaFg;
    border = (isIOS && scheme !== 'dark')
      ? 'rgba(255, 255, 255, 0.25)'
      : c.ctaBg;
  } else if (variant === 'secondary') {
    // Ghost look: transparent background with c.line border
    bg = 'transparent';
    border = c.line;
    fg = c.accentText;
  } else if (variant === 'destructive') {
    // Ghost-destructive: transparent bg, error-coloured border and text — readable in both schemes
    bg = 'transparent';
    fg = c.error;
    border = c.error;
  } else {
    // social variant
    if (isIOS) {
      bg = scheme === 'dark' ? 'rgba(30, 28, 25, 0.80)' : 'rgba(255, 255, 255, 0.7)';
      border = scheme === 'dark' ? 'rgba(255, 255, 255, 0.09)' : 'rgba(0, 0, 0, 0.08)';
    } else {
      bg = scheme === 'dark' ? '#1E1C19' : '#FFFFFF';
      border = scheme === 'dark' ? 'rgba(255, 255, 255, 0.09)' : '#E6E4DF';
    }
    fg = c.fg;
  }

  // Primary enabled: Shadow.cta; primary busy: no shadow; ghost variants (secondary/destructive): no shadow
  // to avoid Android elevation artifact under a transparent pill. Social keeps a subtle shadow.
  const shadowStyle = variant === 'primary' && !busy
    ? Shadow.cta
    : variant === 'primary' || variant === 'secondary' || variant === 'destructive'
      ? {}
      : {
          shadowColor: '#000',
          shadowOpacity: 0.03,
          shadowRadius: 4,
          shadowOffset: { width: 0, height: 2 },
          elevation: 1,
        };

  return (
    <PressableScale
      disabled={busy}
      onPress={onPress}
      rippleColor={variant === 'primary'
        ? (scheme === 'dark' ? 'rgba(18, 17, 16, 0.18)' : 'rgba(255, 255, 255, 0.18)')
        : 'rgba(168, 122, 46, 0.12)'}
      style={[
        styles.button,
        {
          backgroundColor: bg,
          borderColor: border,
          borderRadius: Radius.pill,
          minHeight: 52,
          paddingVertical: Spacing.md - 2,
          paddingHorizontal: Spacing.md,
          overflow: bg === 'transparent' ? 'hidden' : undefined,
        },
        shadowStyle,
        style,
      ]}
    >
      <Text style={[Type.button, { color: fg, fontSize: 15, letterSpacing: 0.5 }]}>
        {busy ? '…' : label}
      </Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  button: {
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
