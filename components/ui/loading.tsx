import { StyleSheet, View, Text, Image } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence, Easing } from 'react-native-reanimated';
import { useTheme } from '@/hooks/use-theme';
import { useEffect } from 'react';

export function LoadingScreen({ message = 'Loading...', fullScreen = true }: { message?: string; fullScreen?: boolean }) {
  const { c, Spacing, Type } = useTheme();
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 900 }),
        withTiming(1.0, { duration: 900 })
      ),
      -1,
      true
    );

    rotation.value = withRepeat(
      withTiming(360, { duration: 3500, easing: Easing.linear }),
      -1,
      false
    );
  }, [rotation, scale]);

  const animatedInnerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const animatedOuterStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const containerStyle = fullScreen
    ? [styles.fullScreen, { backgroundColor: c.bg }]
    : [styles.inline, { backgroundColor: 'transparent' }];

  return (
    <View style={containerStyle}>
      <View style={styles.content}>
        {/* Designed visual loading graphic */}
        <View style={styles.graphicContainer}>
          {/* Rotating outer orbit ring */}
          <Animated.View style={[styles.outerRing, { borderColor: c.accent, borderStyle: 'dashed' }, animatedOuterStyle]} />
          
          {/* Pulsing inner monogram container containing the official logo */}
          <Animated.View style={[styles.innerCircle, { backgroundColor: '#FFFFFF', borderColor: c.line }, animatedInnerStyle]}>
            <Image
              source={require('@/assets/images/logo.jpg')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </Animated.View>
        </View>
        
        {!!message && (
          <Text style={[Type.body, { color: c.fg2, marginTop: Spacing.lg, fontFamily: 'Poppins_500Medium', textAlign: 'center' }]}>
            {message}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fullScreen: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  inline: {
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
  },
  graphicContainer: {
    width: 76,
    height: 76,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  outerRing: {
    position: 'absolute',
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 2,
  },
  innerCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  logoImage: {
    width: '85%',
    height: '85%',
    borderRadius: 24,
  },
});
