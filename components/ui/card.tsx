import { ReactNode } from 'react';
import { View, ViewStyle, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '@/hooks/use-theme';

export function Card({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  const { c, Radius, Shadow, Spacing, scheme } = useTheme();

  // Destructure layout styles to apply on the outer container, 
  // and inner styles for the padding container.
  const {
    margin,
    marginHorizontal,
    marginVertical,
    marginTop,
    marginBottom,
    marginLeft,
    marginRight,
    width,
    height,
    flex,
    alignSelf,
    position,
    top,
    bottom,
    left,
    right,
    zIndex,
    ...innerStyles
  } = (style || {}) as any;

  const outerStyles: ViewStyle = {
    margin,
    marginHorizontal,
    marginVertical,
    marginTop,
    marginBottom,
    marginLeft,
    marginRight,
    width,
    height,
    flex,
    alignSelf,
    position,
    top,
    bottom,
    left,
    right,
    zIndex,
    borderRadius: style?.borderRadius ?? Radius.xl,
  };

  const isIOS = Platform.OS === 'ios';

  if (isIOS) {
    return (
      <BlurView
        intensity={scheme === 'dark' ? 22 : 40}
        tint={scheme === 'dark' ? 'dark' : 'light'}
        style={[
          outerStyles, 
          { 
            borderWidth: style?.borderWidth ?? 1,
            borderColor: style?.borderColor ?? (scheme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(28, 26, 23, 0.08)'),
            backgroundColor: style?.backgroundColor ?? (scheme === 'dark' ? 'rgba(24, 22, 20, 0.72)' : 'rgba(255, 255, 255, 0.70)'),
            overflow: 'hidden',
          },
          Shadow.sm
        ]}
      >
        <View style={[{ padding: Spacing.md }, innerStyles]}>
          {children}
        </View>
      </BlurView>
    );
  }

  // Android Solid Premium styling (clean, shadow-based, solid background)
  return (
    <View
      style={[
        outerStyles,
        {
          backgroundColor: style?.backgroundColor ?? c.surfaceRaised,
          borderWidth: style?.borderWidth ?? 1,
          borderColor: style?.borderColor ?? c.line,
          padding: Spacing.md,
          ...innerStyles,
        },
        Shadow.sm,
      ]}
    >
      {children}
    </View>
  );
}
