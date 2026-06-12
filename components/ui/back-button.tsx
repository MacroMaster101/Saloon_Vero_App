import { Pressable } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { router } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useTheme } from '@/hooks/use-theme';

export function BackButton({ onPress }: { onPress?: () => void }) {
  const { c } = useTheme();
  const scale = useSharedValue(1);
  const aStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={aStyle}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Go back"
        android_ripple={{ color: c.accentTint, borderless: false }}
        onPressIn={() => { scale.value = withTiming(0.94, { duration: 80 }); }}
        onPressOut={() => { scale.value = withTiming(1, { duration: 120 }); }}
        onPress={onPress ?? (() => router.back())}
        style={{
          width: 36, height: 36, borderRadius: 18,
          backgroundColor: c.surfaceRaised, borderWidth: 1, borderColor: c.hairline,
          alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
        }}
      >
        <IconSymbol name="chevron.left" size={18} color={c.accentText} />
      </Pressable>
    </Animated.View>
  );
}
