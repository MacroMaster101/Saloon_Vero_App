import { ReactNode } from 'react';
import { ViewStyle } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

export function FadeUp({
  children,
  index = 0,
  step = 60,
  duration = 380,
  animate = true,
  style,
}: {
  children: ReactNode;
  index?: number;
  step?: number;
  duration?: number;
  animate?: boolean;
  style?: ViewStyle;
}) {
  return (
    <Animated.View
      entering={animate ? FadeInDown.delay(index * step).duration(duration) : undefined}
      style={style}
    >
      {children}
    </Animated.View>
  );
}
