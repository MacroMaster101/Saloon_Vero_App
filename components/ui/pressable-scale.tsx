import { ReactNode } from 'react';
import { Pressable, StyleProp, ViewStyle, PressableProps } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Layout } from '@/constants/theme';

export function PressableScale({
  children,
  onPress,
  style,
  to = 0.97,
  rippleColor = 'rgba(168, 122, 46, 0.12)',
  disabled,
  ...rest
}: {
  children: ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  to?: number;
  rippleColor?: string;
  disabled?: boolean;
} & Omit<PressableProps, 'onPress' | 'style'>) {
  const scale = useSharedValue(1);
  const aStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={aStyle}>
      <Pressable
        disabled={disabled}
        android_ripple={{ color: rippleColor, borderless: false }}
        onPressIn={() => { scale.value = withSpring(to, { damping: 18, stiffness: 320 }); }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 18, stiffness: 320 }); }}
        onPress={onPress}
        style={[{ minHeight: Layout.touchMin, justifyContent: 'center' }, style]}
        {...rest}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}
