import { ThemedButton } from '@/components/ui/button';
import { useSession } from '@/context/session';
import { useTheme } from '@/hooks/use-theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Dimensions, Image, Platform, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming, Easing } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { Card } from '@/components/ui/card';
import { ScreenContainer } from '@/components/ui/screen';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SPLASH_DELAY_MS = process.env.NODE_ENV === 'test' ? 0 : 3000;

export default function EntryScreen() {
  const { user, loading: sessionLoading, isGuest } = useSession();
  const { c, scheme, Spacing, Type, Radius } = useTheme();
  
  const featureItemStyle = {
    backgroundColor: Platform.OS === 'ios'
      ? (scheme === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.5)')
      : (scheme === 'dark' ? '#120E0A' : '#FAF6EE'),
    borderColor: Platform.OS === 'ios'
      ? (scheme === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)')
      : (scheme === 'dark' ? '#2E251E' : '#EBE2CF'),
  };
  const [isFirstTime, setIsFirstTime] = useState<boolean | null>(null);
  const [delayFinished, setDelayFinished] = useState(process.env.NODE_ENV === 'test');
  const [progress, setProgress] = useState(0);

  // Animations
  const logoScale = useSharedValue(1);
  const logoRotation = useSharedValue(0);

  useEffect(() => {
    if (process.env.NODE_ENV === 'test') {
      setProgress(100);
      setDelayFinished(true);
      return;
    }
    
    const startTime = Date.now();
    const duration = SPLASH_DELAY_MS;
    
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(Math.floor((elapsed / duration) * 100), 100);
      setProgress(pct);
      
      if (elapsed >= duration) {
        clearInterval(interval);
        setDelayFinished(true);
      }
    }, 16);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Check if user has seen onboarding
    AsyncStorage.getItem('has_seen_welcome').then((val) => {
      setIsFirstTime(val === null);
    });
  }, []);

  useEffect(() => {
    // Pulsing logo animation during loading
    logoScale.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 900 }),
        withTiming(1.0, { duration: 900 })
      ),
      -1,
      true
    );

    // Continuous rotation for the outer ring
    logoRotation.value = withRepeat(
      withTiming(360, { duration: 3500, easing: Easing.linear }),
      -1,
      false
    );
  }, [logoRotation, logoScale]);

  useEffect(() => {
    // Once both welcome check, session check, and minimum timer are loaded
    if (isFirstTime === null || sessionLoading || !delayFinished) return;

    if (!isFirstTime) {
      if (user) {
        router.replace('/(tabs)');
      } else if (isGuest) {
        router.replace('/(tabs)/book');
      } else {
        router.replace('/access' as never);
      }
    }
  }, [isFirstTime, sessionLoading, delayFinished, user, isGuest]);

  // Actions
  const handleGetStarted = async () => {
    await AsyncStorage.setItem('has_seen_welcome', 'true');
    router.replace('/access' as never);
  };

  const animatedLogoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
  }));

  const animatedOuterRingStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${logoRotation.value}deg` }],
  }));

  // Render Splash Loader
  if (isFirstTime === null || sessionLoading || !delayFinished || !isFirstTime) {
    const overlayColor = scheme === 'dark' ? 'rgba(18, 14, 10, 0.75)' : 'rgba(250, 246, 238, 0.75)';
    
    return (
      <View style={styles.container}>
        {/* Full-bleed background graphic */}
        <Image
          source={require('@/assets/images/splash_bg.png')}
          style={StyleSheet.absoluteFillObject}
          resizeMode="cover"
        />
        {/* Glassy backdrop blur overlay */}
        <BlurView
          intensity={55}
          tint={scheme === 'dark' ? 'dark' : 'light'}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: overlayColor }]} />
        
        <View style={[styles.splashContent, { flex: 1, justifyContent: 'center' }]}>
          {/* Designed premium splash logo mark */}
          <View style={styles.graphicContainer}>
            {/* Rotating outer ring */}
            <Animated.View style={[styles.outerRing, { borderColor: c.accent, borderStyle: 'dashed' }, animatedOuterRingStyle]} />
            
            {/* Pulsing inner circle containing the official logo */}
            <Animated.View style={[styles.logoCircle, { backgroundColor: 'rgba(255, 255, 255, 0.85)', borderColor: 'rgba(255,255,255,0.4)' }, animatedLogoStyle]}>
              <Image
                source={require('@/assets/images/logo.jpg')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </Animated.View>
          </View>
          
          <Animated.Text entering={FadeIn.delay(300)} style={[Type.h1, { color: c.fg, marginTop: Spacing.xl, textAlign: 'center', letterSpacing: 0.5 }]}>
            Saloon Vero
          </Animated.Text>
          <Animated.Text entering={FadeIn.delay(500)} style={[Type.caption, { color: c.accentText, letterSpacing: 3, textTransform: 'uppercase', textAlign: 'center', marginTop: 8, marginBottom: Spacing.xl * 1.5, fontFamily: 'Poppins_600SemiBold' }]}>
            Redefine Your Look
          </Animated.Text>

          {/* Progress bar and counter */}
          <View style={styles.progressContainer}>
            <View style={[styles.progressBarBg, { backgroundColor: scheme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
              <View style={[styles.progressBarFill, { backgroundColor: c.accent, width: `${progress}%` }]} />
            </View>
            <Text style={[Type.caption, { color: c.fg2, fontFamily: 'Poppins_600SemiBold', textAlign: 'center', marginTop: 8 }]}>
              {progress}%
            </Text>
          </View>
        </View>
      </View>
    );
  }

  // Render Onboarding Welcome Screen
  return (
    <ScreenContainer scroll={false} style={{ padding: 0 }}>
      {/* Top Graphic */}
      <View style={[styles.heroContainer, { height: SCREEN_HEIGHT * 0.4 }]}>
        <Image
          source={require('@/assets/images/onboarding_hero.png')}
          style={styles.heroImage}
          resizeMode="cover"
        />
        {/* Subtle overlay gradient */}
        <BlurView
          intensity={15}
          tint="dark"
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.overlay} />
      </View>

      {/* Bottom Content wrapped in premium glassy layout */}
      <View style={[styles.contentContainer, { padding: Spacing.md, marginTop: -20 }]}>
        <Card style={{ flex: 1, justifyContent: 'space-between', gap: Spacing.sm }}>
          <View>
            <Text style={[Type.eyebrow, { color: c.accentText, letterSpacing: 1.5, textTransform: 'uppercase' }]}>
              Welcome to Saloon Vero
            </Text>
            <Text style={[Type.h1, { color: c.fg, marginTop: Spacing.xs, lineHeight: 32, fontSize: 24 }]}>
              Redefine Your Style, Effortlessly
            </Text>
            <Text style={[Type.body, { color: c.fg2, marginTop: Spacing.xs, marginBottom: Spacing.md, fontSize: 14 }]}>
              Step into premium care. Schedule expert haircuts, professional styling, and treatments in seconds.
            </Text>

            {/* Feature Highlights */}
            <View style={styles.featuresList}>
              <Animated.View entering={FadeInDown.delay(200).duration(500)} style={[styles.featureItem, featureItemStyle, { padding: Spacing.sm, borderRadius: Radius.md, borderWidth: 1 }]}>
                <Text style={styles.featureIcon}>✂️</Text>
                <View style={styles.featureTextContainer}>
                  <Text style={[Type.label, { color: c.fg }]}>Expert Stylists</Text>
                  <Text style={[Type.caption, { color: c.fgMuted, marginTop: 2 }]}>Custom trims and style consultations</Text>
                </View>
              </Animated.View>

              <Animated.View entering={FadeInDown.delay(350).duration(500)} style={[styles.featureItem, featureItemStyle, { padding: Spacing.sm, borderRadius: Radius.md, borderWidth: 1 }]}>
                <Text style={styles.featureIcon}>📅</Text>
                <View style={styles.featureTextContainer}>
                  <Text style={[Type.label, { color: c.fg }]}>Real-time Booking</Text>
                  <Text style={[Type.caption, { color: c.fgMuted, marginTop: 2 }]}>Instant slot confirmations, zero phone tag</Text>
                </View>
              </Animated.View>

              <Animated.View entering={FadeInDown.delay(500).duration(500)} style={[styles.featureItem, featureItemStyle, { padding: Spacing.sm, borderRadius: Radius.md, borderWidth: 1 }]}>
                <Text style={styles.featureIcon}>✨</Text>
                <View style={styles.featureTextContainer}>
                  <Text style={[Type.label, { color: c.fg }]}>Luxe Experience</Text>
                  <Text style={[Type.caption, { color: c.fgMuted, marginTop: 2 }]}>Relaxing atmosphere and premium care products</Text>
                </View>
              </Animated.View>
            </View>
          </View>

          {/* Action Button */}
          <Animated.View entering={FadeInDown.delay(650).duration(500)} style={{ marginTop: Spacing.md }}>
            <ThemedButton label="Get Started" onPress={handleGetStarted} />
          </Animated.View>
        </Card>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  splashContent: {
    alignItems: 'center',
  },
  graphicContainer: {
    width: 110,
    height: 110,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  outerRing: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 2,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  logoImage: {
    width: '85%',
    height: '85%',
    borderRadius: 34,
  },
  progressContainer: {
    width: 200,
    alignItems: 'center',
  },
  progressBarBg: {
    width: '100%',
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  heroContainer: {
    width: '100%',
    position: 'relative',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(28, 22, 17, 0.15)',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  featuresList: {
    gap: 16,
    marginVertical: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureIcon: {
    fontSize: 24,
    textAlign: 'center',
    width: 32,
  },
  featureTextContainer: {
    flex: 1,
  },
});
