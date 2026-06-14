import { ReactNode } from 'react';
import { Pressable, StyleProp, ViewStyle, PressableProps, StyleSheet } from 'react-native';
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

  // Separate layout styles for Animated.View
  const flattened = StyleSheet.flatten(style) || {};
  const {
    margin, marginHorizontal, marginVertical, marginTop, marginBottom, marginLeft, marginRight,
    width, height, flex, alignSelf, position, top, bottom, left, right, zIndex,
    flexGrow, flexShrink, flexBasis, aspectRatio,
    ...innerStyle
  } = flattened;

  const outerStyle = {
    margin, marginHorizontal, marginVertical, marginTop, marginBottom, marginLeft, marginRight,
    width, height, flex, alignSelf, position, top, bottom, left, right, zIndex,
    flexGrow, flexShrink, flexBasis, aspectRatio,
  };

  return (
    <Animated.View style={[aStyle, outerStyle]}>
      <Pressable
        disabled={disabled}
        android_ripple={{ color: rippleColor, borderless: false }}
        onPressIn={() => { scale.value = withSpring(to, { damping: 18, stiffness: 320 }); }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 18, stiffness: 320 }); }}
        onPress={onPress}
        style={[
          { minHeight: Layout.touchMin, justifyContent: 'center' },
          width !== undefined || flex !== undefined ? { width: '100%' } : undefined,
          height !== undefined || aspectRatio !== undefined || flex !== undefined ? { height: '100%' } : undefined,
          innerStyle,
        ]}
        {...rest}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}

