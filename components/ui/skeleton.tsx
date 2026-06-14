import { useEffect } from 'react';
import { View, DimensionValue } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence } from 'react-native-reanimated';
import { useTheme } from '@/hooks/use-theme';

export function Skeleton({ width = '100%', height = 14, radius, testID }: {
  width?: DimensionValue; height?: number; radius?: number; testID?: string;
}) {
  const { c, Radius } = useTheme();
  const opacity = useSharedValue(0.5);
  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(withTiming(1, { duration: 700 }), withTiming(0.5, { duration: 700 })),
      -1, true,
    );
  }, [opacity]);
  const aStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return (
    <Animated.View
      testID={testID}
      style={[{ width, height, borderRadius: radius ?? Radius.sm, backgroundColor: c.line }, aStyle]}
    />
  );
}

export function SkeletonCard({ count = 3 }: { count?: number }) {
  const { c, Radius, Spacing } = useTheme();
  return (
    <View style={{ gap: Spacing.sm }}>
      {Array.from({ length: count }).map((_, i) => (
        <View
          key={i}
          testID="skeleton-card"
          style={{
            borderRadius: Radius.xl, borderWidth: 1, borderColor: c.hairline,
            backgroundColor: c.surfaceRaised, padding: Spacing.md, gap: Spacing.sm,
          }}
        >
          <Skeleton width="60%" height={16} />
          <Skeleton width="90%" height={12} />
          <Skeleton width="40%" height={12} />
        </View>
      ))}
    </View>
  );
}
