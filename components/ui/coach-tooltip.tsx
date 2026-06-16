import { useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '@/hooks/use-theme';
import { IconSymbol } from '@/components/ui/icon-symbol';

/**
 * A small first-run coach mark: a rounded callout bubble with a pointer aimed at
 * a nearby control (e.g. the theme toggle), plus a gentle pulsing glow ring that
 * draws the eye to it. Purely presentational and self-positioning via absolute
 * layout — the caller places it relative to the target.
 *
 * `pointer="up"` puts the arrow on top of the bubble (target sits above it).
 * The bubble right-aligns under a top-right control by default.
 */
export function CoachTooltip({
  label,
  visible,
  onDismiss,
  delayMs = 1200,
  autoHideMs = 5000,
}: {
  label: string;
  visible: boolean;
  onDismiss: () => void;
  delayMs?: number;
  autoHideMs?: number;
}) {
  const { c, Type, Spacing, Radius } = useTheme();
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(-6);

  useEffect(() => {
    if (!visible) return;
    // Settle in after the screen's own entrance animations.
    opacity.value = withDelay(delayMs, withTiming(1, { duration: 320, easing: Easing.out(Easing.quad) }));
    translateY.value = withDelay(delayMs, withTiming(0, { duration: 320, easing: Easing.out(Easing.quad) }));

    const t = setTimeout(onDismiss, delayMs + autoHideMs);
    return () => clearTimeout(t);
  }, [visible, delayMs, autoHideMs, onDismiss, opacity, translateY]);

  const bubbleStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  if (!visible) return null;

  // Fixed width so the bubble lays out as a horizontal callout. Right-anchored
  // under a top-right control; the pointer arrow sits near the right edge.
  const BUBBLE_WIDTH = 196;
  // Dark surface + light text reads cleanly in both themes; a thin accent border
  // keeps it on-brand without the heavy solid-gold block.
  const BUBBLE_BG = '#1F1D1A';

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        { position: 'absolute', top: 48, right: 0, width: BUBBLE_WIDTH, alignItems: 'flex-end' },
        bubbleStyle,
      ]}
    >
      {/* Pointer arrow (points up toward the control), aligned under the toggle. */}
      <View
        style={{
          width: 0,
          height: 0,
          marginRight: 15,
          borderLeftWidth: 6,
          borderRightWidth: 6,
          borderBottomWidth: 7,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderBottomColor: BUBBLE_BG,
        }}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={onDismiss}
        style={{
          marginTop: -1,
          width: BUBBLE_WIDTH,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          backgroundColor: BUBBLE_BG,
          borderRadius: Radius.md,
          borderWidth: 1,
          borderColor: c.accent,
          paddingVertical: Spacing.sm + 1,
          paddingHorizontal: Spacing.md,
          shadowColor: '#000',
          shadowOpacity: 0.22,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 4 },
          elevation: 5,
        }}
      >
        <IconSymbol name="circle.lefthalf.filled" size={15} color={c.accent} />
        <Text style={[Type.caption, { flex: 1, color: '#F5F1EA', fontFamily: 'Poppins_600SemiBold' }]}>
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

/**
 * A soft pulsing glow ring sized to wrap a circular control. Render it as a
 * sibling positioned behind the control to draw attention during onboarding.
 */
export function PulseRing({ size = 40, visible }: { size?: number; visible: boolean }) {
  const { c } = useTheme();
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.6);

  useEffect(() => {
    if (!visible) return;
    scale.value = withRepeat(
      withSequence(
        withTiming(1.35, { duration: 1100, easing: Easing.out(Easing.quad) }),
        withTiming(1, { duration: 0 }),
      ),
      -1,
      false,
    );
    opacity.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 1100, easing: Easing.out(Easing.quad) }),
        withTiming(0.6, { duration: 0 }),
      ),
      -1,
      false,
    );
  }, [visible, scale, opacity]);

  const ringStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  if (!visible) return null;

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 2,
          borderColor: c.accent,
        },
        ringStyle,
      ]}
    />
  );
}
