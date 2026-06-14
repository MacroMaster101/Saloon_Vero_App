import { ReactNode } from 'react';
import { View, ViewStyle, Platform, useWindowDimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '@/hooks/use-theme';

export function Card({
  children,
  style,
  accent = false,
  flatOnMobile = false,
}: {
  children: ReactNode;
  style?: ViewStyle;
  accent?: boolean;
  flatOnMobile?: boolean;
}) {
  const { c, Radius, Shadow, Spacing, scheme } = useTheme();
  const { width: screenWidth } = useWindowDimensions();

  const isMobile = screenWidth < 500;
  const isFlat = flatOnMobile && isMobile;

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
    minWidth,
    maxWidth,
    minHeight,
    maxHeight,
    flex,
    flexGrow,
    flexShrink,
    flexBasis,
    alignSelf,
    position,
    top,
    bottom,
    left,
    right,
    zIndex,
    borderRadius,
    borderWidth,
    borderColor,
    borderLeftWidth,
    borderLeftColor,
    borderRightWidth,
    borderRightColor,
    borderTopWidth,
    borderTopColor,
    borderBottomWidth,
    borderBottomColor,
    backgroundColor,
    overflow,
    ...innerStyles
  } = (style || {}) as any;

  if (isFlat) {
    const flatOuterStyles: ViewStyle = {
      margin,
      marginHorizontal,
      marginVertical,
      marginTop,
      marginBottom,
      marginLeft,
      marginRight,
      width,
      height,
      minWidth,
      maxWidth,
      minHeight,
      maxHeight,
      flex,
      flexGrow,
      flexShrink,
      flexBasis,
      alignSelf,
      position,
      top,
      bottom,
      left,
      right,
      zIndex,
      borderRadius: 0,
      backgroundColor: 'transparent',
    };
    const flatInnerStyles = {
      ...innerStyles,
      padding: 0,
      paddingHorizontal: 0,
      paddingVertical: 0,
      paddingTop: 0,
      paddingBottom: 0,
      paddingLeft: 0,
      paddingRight: 0,
    };
    return (
      <View style={[flatOuterStyles, flatInnerStyles]}>
        {children}
      </View>
    );
  }

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
    minWidth,
    maxWidth,
    minHeight,
    maxHeight,
    flex,
    flexGrow,
    flexShrink,
    flexBasis,
    alignSelf,
    position,
    top,
    bottom,
    left,
    right,
    zIndex,
    borderRadius: borderRadius ?? Radius.sm,
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
            borderWidth: borderWidth ?? 1,
            borderLeftWidth,
            borderRightWidth,
            borderTopWidth,
            borderBottomWidth,
            borderColor: accent
              ? c.accent
              : (borderColor ?? (scheme === 'dark' ? 'rgba(255, 255, 255, 0.09)' : 'rgba(28, 26, 23, 0.08)')),
            borderLeftColor,
            borderRightColor,
            borderTopColor,
            borderBottomColor,
            backgroundColor: backgroundColor ?? (scheme === 'dark' ? 'rgba(30, 28, 25, 0.80)' : 'rgba(255, 255, 255, 0.70)'),
            overflow: overflow ?? 'hidden',
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
          backgroundColor: backgroundColor ?? c.surfaceRaised,
          borderWidth: borderWidth ?? 1,
          borderLeftWidth,
          borderRightWidth,
          borderTopWidth,
          borderBottomWidth,
          borderColor: accent ? c.accent : (borderColor ?? c.line),
          borderLeftColor,
          borderRightColor,
          borderTopColor,
          borderBottomColor,
          overflow,
        },
        Shadow.sm,
      ]}
    >
      <View style={[{ padding: Spacing.md }, innerStyles]}>
        {children}
      </View>
    </View>
  );
}
