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

export function SkeletonCard({
  count = 3,
  layout = 'row',
}: {
  count?: number;
  layout?: 'row' | 'grid';
}) {
  const { c, Radius, Spacing } = useTheme();

  if (layout === 'grid') {
    return (
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md, width: '100%' }}>
        {Array.from({ length: count }).map((_, i) => (
          <View
            key={i}
            testID="skeleton-card"
            style={{
              width: '47.5%',
              borderRadius: Radius.lg,
              borderWidth: 1,
              borderColor: c.hairline,
              backgroundColor: c.surfaceRaised,
              overflow: 'hidden',
              marginBottom: Spacing.sm,
            }}
          >
            {/* Image placeholder */}
            <Skeleton width="100%" height={115} radius={0} />
            <View style={{ padding: Spacing.sm, gap: Spacing.sm }}>
              <Skeleton width="80%" height={14} />
              <Skeleton width="90%" height={10} />
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  marginTop: Spacing.xs,
                  borderTopWidth: 1,
                  borderTopColor: c.hairline,
                  paddingTop: Spacing.xs,
                }}
              >
                <Skeleton width="45%" height={12} />
                <Skeleton width="30%" height={12} />
              </View>
            </View>
          </View>
        ))}
      </View>
    );
  }

  return (
    <View style={{ gap: Spacing.sm }}>
      {Array.from({ length: count }).map((_, i) => (
        <View
          key={i}
          testID="skeleton-card"
          style={{
            borderRadius: Radius.xl,
            borderWidth: 1,
            borderColor: c.hairline,
            backgroundColor: c.surfaceRaised,
            padding: Spacing.md,
            gap: Spacing.sm,
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

