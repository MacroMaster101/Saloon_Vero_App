import { Pressable, Text, ViewStyle, StyleSheet, Platform } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useTheme } from '@/hooks/use-theme';

type Variant = 'primary' | 'secondary' | 'social';

export function ThemedButton({ label, onPress, variant = 'primary', busy = false, style }: { label: string; onPress?: () => void; variant?: Variant; busy?: boolean; style?: ViewStyle }) {
  const { c, Radius, Type, Spacing, scheme } = useTheme();
  const scale = useSharedValue(1);
  const aStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const isIOS = Platform.OS === 'ios';

  // Premium styling values
  let bg = '';
  let fg = '';
  let border = '';

  if (variant === 'primary') {
    bg = c.accentDark;
    fg = '#FFFFFF';
    border = isIOS 
      ? (scheme === 'dark' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.3)')
      : c.accentDark;
  } else if (variant === 'secondary') {
    if (isIOS) {
      bg = scheme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.6)';
      border = scheme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(184, 116, 42, 0.25)';
    } else {
      bg = scheme === 'dark' ? '#2A2018' : '#FAF6EE';
      border = scheme === 'dark' ? '#3E3024' : '#EBE2CF';
    }
    fg = c.accentText;
  } else {
    // social variant
    if (isIOS) {
      bg = scheme === 'dark' ? 'rgba(255, 255, 255, 0.03)' : 'rgba(255, 255, 255, 0.7)';
      border = scheme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';
    } else {
      bg = scheme === 'dark' ? '#241C16' : '#FFFFFF';
      border = scheme === 'dark' ? '#3A2E24' : '#EBE2CF';
    }
    fg = c.fg;
  }

  const shadowStyle = variant === 'primary' 
    ? {
        shadowColor: c.accentDark,
        shadowOpacity: 0.25,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 3,
      }
    : {
        shadowColor: '#000',
        shadowOpacity: 0.03,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
        elevation: 1,
      };

  return (
    <Animated.View style={aStyle}>
      <Pressable
        disabled={busy}
        android_ripple={{
          color: variant === 'primary' ? 'rgba(255, 255, 255, 0.18)' : 'rgba(184, 116, 42, 0.12)',
          borderless: false,
        }}
        onPressIn={() => { scale.value = withTiming(0.96, { duration: 80 }); }}
        onPressOut={() => { scale.value = withTiming(1, { duration: 120 }); }}
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
          style
        ]}
      >
        <Text style={[Type.button, { color: fg, fontSize: 15, letterSpacing: 0.5 }]}>
          {busy ? '…' : label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
