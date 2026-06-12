import { Pressable } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useTheme } from '@/hooks/use-theme';
import { cycleThemePref, useOptionalThemePreference } from '@/context/theme';
import { IconSymbol } from '@/components/ui/icon-symbol';

const ICON_FOR_PREF = {
  light: 'sun.max.fill',
  dark: 'moon.fill',
  system: 'circle.lefthalf.filled',
} as const;

export function ThemeToggleButton() {
  const { c } = useTheme();
  const themeCtx = useOptionalThemePreference();
  const scale = useSharedValue(1);
  const aStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  // No-op when rendered outside ThemePreferenceProvider (e.g. isolated tests)
  if (!themeCtx) return null;

  const { pref, setPref } = themeCtx;

  return (
    <Animated.View style={aStyle}>
      <Pressable
        testID="theme-toggle"
        accessibilityRole="button"
        accessibilityLabel={`Theme: ${pref}. Tap to change.`}
        onPress={() => setPref(cycleThemePref(pref))}
        onPressIn={() => { scale.value = withTiming(0.94, { duration: 80 }); }}
        onPressOut={() => { scale.value = withTiming(1, { duration: 120 }); }}
        style={{
          width: 40, height: 40, borderRadius: 20,
          borderWidth: 1, borderColor: c.line, backgroundColor: c.surfaceRaised,
          alignItems: 'center', justifyContent: 'center',
        }}
      >
        <IconSymbol name={ICON_FOR_PREF[pref]} color={c.accentDark} size={20} />
      </Pressable>
    </Animated.View>
  );
}
