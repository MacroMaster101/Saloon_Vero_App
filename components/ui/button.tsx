import { Pressable, Text, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useTheme } from '@/hooks/use-theme';

type Variant = 'primary' | 'secondary' | 'social';
export function ThemedButton({ label, onPress, variant = 'primary', busy = false, style }: { label: string; onPress?: () => void; variant?: Variant; busy?: boolean; style?: ViewStyle }) {
  const { c, Radius, Type, Spacing } = useTheme();
  const scale = useSharedValue(1);
  const aStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const bg = variant === 'primary' ? c.accentDark : 'transparent';
  const fg = variant === 'primary' ? '#FFFFFF' : c.fg;
  const border = variant === 'primary' ? c.accentDark : c.line;
  return (
    <Animated.View style={aStyle}>
      <Pressable
        disabled={busy}
        onPressIn={() => { scale.value = withTiming(0.97, { duration: 80 }); }}
        onPressOut={() => { scale.value = withTiming(1, { duration: 120 }); }}
        onPress={onPress}
        style={[{ backgroundColor: bg, borderColor: border, borderWidth: 1, borderRadius: Radius.md, paddingVertical: Spacing.md, alignItems: 'center', opacity: busy ? 0.7 : 1 }, style]}>
        <Text style={[Type.button, { color: fg }]}>{busy ? '…' : label}</Text>
      </Pressable>
    </Animated.View>
  );
}
