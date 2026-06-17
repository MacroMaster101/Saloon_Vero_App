import { ThemedButton } from '@/components/ui/button';
import { ThemeToggleButton } from '@/components/ui/theme-toggle-button';
import { CoachTooltip, PulseRing } from '@/components/ui/coach-tooltip';
import { useSession } from '@/context/session';
import { routeForSession } from '@/lib/auth/routing';
import { useTheme } from '@/hooks/use-theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Dimensions, Image, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming, Easing } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
// Detected at runtime. In Jest, NODE_ENV is genuinely 'test'. We must NOT use
// this to seed initial useState/module constants that gate the production splash:
// Metro's build-time inlining of process.env.NODE_ENV is unreliable in release
// bundles and was skipping the animated splash entirely in deployed builds.
const IS_TEST = process.env.NODE_ENV === 'test';
const SPLASH_DELAY_MS = 3000;

export default function EntryScreen() {
  const { user, loading: sessionLoading, isGuest, profile, profileReady, recovering } = useSession();
  const { c, scheme, Spacing, Type } = useTheme();
  const insets = useSafeAreaInsets();

  const [isFirstTime, setIsFirstTime] = useState<boolean | null>(null);
  // Always starts false in the real app so the timer below controls the splash.
  // Tests flip it to true immediately via the effect (IS_TEST), avoiding any
  // dependence on build-time env inlining for the splash to render.
  const [delayFinished, setDelayFinished] = useState(IS_TEST);
  const [progress, setProgress] = useState(0);
  // Dismissible coach mark pointing at the theme toggle (first-time users only).
  const [themeTipDismissed, setThemeTipDismissed] = useState(false);

  // Splash animations: pulsing logo + rotating outer ring.
  const logoScale = useSharedValue(1);
  const logoRotation = useSharedValue(0);

  useEffect(() => {
    if (IS_TEST) {
      setProgress(100);
      setDelayFinished(true);
      return;
    }

    const startTime = Date.now();
    const duration = SPLASH_DELAY_MS;

    // A guaranteed end-of-splash gate. setTimeout fires even if the progress
    // interval below is throttled/dropped under animation load in release.
    const done = setTimeout(() => {
      setProgress(100);
      setDelayFinished(true);
    }, duration);

    // Cosmetic progress bar updates; independent of the gate above.
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(Math.floor((elapsed / duration) * 100), 100);
      setProgress(pct);
      if (elapsed >= duration) clearInterval(interval);
    }, 50);

    return () => {
      clearTimeout(done);
      clearInterval(interval);
    };
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
    // Once both welcome check, session check, profile check, and minimum timer are loaded
    if (isFirstTime === null || sessionLoading || !profileReady || !delayFinished) return;

    // Mid password-recovery: the user has a session but must set a new password
    // first. Keep them on the reset screen rather than routing into the app.
    if (recovering) {
      router.replace('/auth/reset-password' as never);
      return;
    }

    if (!isFirstTime) {
      if (isGuest) {
        // Guests always land on the booking tab
        router.replace('/(tabs)/book');
      } else {
        const dest = routeForSession(user, profile, isGuest);
        if (dest !== null) {
          router.replace(dest as never);
        } else {
          router.replace('/access' as never);
        }
      }
    }
  }, [isFirstTime, sessionLoading, profileReady, delayFinished, user, profile, isGuest, recovering]);

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
  if (isFirstTime === null || sessionLoading || !profileReady || !delayFinished || !isFirstTime) {
    return (
      <View style={styles.container}>
        {/* Full-bleed background graphic */}
        <Image
          source={require('@/assets/images/splash_bg.png')}
          style={StyleSheet.absoluteFillObject}
          resizeMode="cover"
        />
        {/* Glassy backdrop blur overlay — iOS only; expo-blur on Android only tints,
            leaving a washed-out image, so Android gets a near-solid scrim instead. */}
        {Platform.OS === 'ios' && (
          <BlurView
            intensity={55}
            tint={scheme === 'dark' ? 'dark' : 'light'}
            style={StyleSheet.absoluteFillObject}
          />
        )}
        <View
          style={[
            StyleSheet.absoluteFillObject,
            Platform.OS === 'ios'
              ? { backgroundColor: scheme === 'dark' ? 'rgba(18, 17, 16, 0.88)' : c.glassBg }
              : { backgroundColor: c.bg, opacity: 0.92 },
          ]}
        />
        
        <View style={[styles.splashContent, { flex: 1, justifyContent: 'center' }]}>
          {/* Designed premium splash logo mark */}
          <View style={styles.graphicContainer}>
            {/* Rotating outer ring */}
            <Animated.View style={[styles.outerRing, { borderColor: c.accent, borderStyle: 'dashed' }, animatedOuterRingStyle]} />

            {/* Pulsing inner circle containing the official logo */}
            <Animated.View style={[styles.logoCircle, { backgroundColor: c.surfaceRaised, borderColor: c.hairline }, animatedLogoStyle]}>
              <Image
                source={require('@/assets/images/logo.jpg')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </Animated.View>
          </View>
          
          {/* Plain Text (no reanimated `entering`): FadeIn entering animations can
              leave these at opacity 0 in release builds, making the splash look
              blank. Render the text immediately instead. */}
          <Text style={[Type.h1, { color: c.fg, marginTop: Spacing.xl, textAlign: 'center', letterSpacing: 0.5 }]}>
            Saloon Vero
          </Text>
          <Text style={[Type.caption, { color: c.accentText, letterSpacing: 3, textTransform: 'uppercase', textAlign: 'center', marginTop: Spacing.sm, marginBottom: Spacing.xl * 1.5, fontFamily: 'Poppins_600SemiBold' }]}>
            Redefine Your Look
          </Text>

          {/* Progress bar and counter */}
          <View style={styles.progressContainer}>
            <View style={[styles.progressBarBg, { backgroundColor: c.line }]}>
              <View style={[styles.progressBarFill, { backgroundColor: c.accent, width: `${progress}%` }]} />
            </View>
            <Text style={[Type.caption, { color: c.fg2, fontFamily: 'Poppins_600SemiBold', textAlign: 'center', marginTop: Spacing.sm }]}>
              {progress}%
            </Text>
          </View>
        </View>
      </View>
    );
  }

  // Render Onboarding Welcome Screen
  return (
    <View style={[styles.container, { backgroundColor: c.bg }]}>
      {/* Floating ThemeToggleButton + first-run coach mark */}
      <View style={{ position: 'absolute', top: insets.top + Spacing.sm, right: Spacing.md, zIndex: 10, alignItems: 'flex-end' }}>
        <View style={{ alignItems: 'center', justifyContent: 'center' }}>
          <PulseRing size={40} visible={isFirstTime === true && !themeTipDismissed} />
          {/* Dismiss the tip as soon as the user interacts with the toggle. */}
          <View onTouchStart={() => setThemeTipDismissed(true)}>
            <ThemeToggleButton />
          </View>
        </View>
        <CoachTooltip
          label="Switch light or dark mode"
          visible={isFirstTime === true && !themeTipDismissed}
          onDismiss={() => setThemeTipDismissed(true)}
        />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'space-between',
          paddingBottom: insets.bottom + Spacing.xl,
        }}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Top Graphic Container */}
        <View style={[styles.graphicWrapper, { paddingTop: insets.top }]}>
          {/* Large stylist portrait cut-out */}
          <View style={styles.stylistImageWrapper}>
            <Image
              source={require('@/assets/images/onboarding_stylist.png')}
              style={styles.stylistImage}
              resizeMode="contain"
            />
          </View>

          {/* Overlapping service cards */}
          <View style={styles.cardsRow}>
            {/* Left card */}
            <Animated.View entering={FadeInDown.delay(200).duration(600)} style={{ zIndex: 1 }}>
              <View style={[styles.miniCard, styles.leftCard, { borderColor: c.line, backgroundColor: c.surfaceRaised }]}>
                <Image source={require('@/assets/images/service_wash.png')} style={styles.miniCardImage} resizeMode="cover" />
              </View>
            </Animated.View>

            {/* Center card */}
            <Animated.View entering={FadeInDown.delay(350).duration(600)} style={{ zIndex: 2 }}>
              <View style={[styles.miniCard, styles.centerCard, { borderColor: c.accent, backgroundColor: c.surfaceRaised }]}>
                <Image source={require('@/assets/images/service_style.png')} style={styles.miniCardImage} resizeMode="cover" />
              </View>
            </Animated.View>

            {/* Right card */}
            <Animated.View entering={FadeInDown.delay(500).duration(600)} style={{ zIndex: 1 }}>
              <View style={[styles.miniCard, styles.rightCard, { borderColor: c.line, backgroundColor: c.surfaceRaised }]}>
                <Image source={require('@/assets/images/service_facial.png')} style={styles.miniCardImage} resizeMode="cover" />
              </View>
            </Animated.View>
          </View>
        </View>

        {/* Bottom Content */}
        <View style={[styles.contentContainer, { paddingHorizontal: Spacing.lg }]}>
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', marginVertical: Spacing.lg }}>
            {/* Brand & Tagline */}
            <Text style={[Type.h1, { color: c.accent, textAlign: 'center', fontFamily: 'Poppins_800ExtraBold', fontSize: 24, letterSpacing: 0.2 }]}>
              Beauty Salon <Text style={{ color: c.fg }}>&</Text> Barber
            </Text>
            <Text style={[Type.display, { color: c.fg, textAlign: 'center', marginTop: 2, fontSize: 32, fontFamily: 'Poppins_800ExtraBold', lineHeight: 36 }]}>
              Booking Made Easy
            </Text>

            {/* Description */}
            <Text style={[Type.body, { color: c.fg2, textAlign: 'center', marginTop: Spacing.md, paddingHorizontal: Spacing.sm, fontSize: 14, lineHeight: 20 }]}>
              Step into premium care. Schedule expert haircuts, professional styling, and treatments in seconds.
            </Text>
          </View>

          {/* Action Button */}
          <Animated.View entering={FadeInDown.delay(650).duration(500)} style={{ width: '100%', maxWidth: 360, alignSelf: 'center', marginTop: Spacing.lg, marginBottom: Spacing.sm }}>
            <ThemedButton variant="primary" label="Let's Get Started" onPress={handleGetStarted} style={{ backgroundColor: c.ctaBg }} />
          </Animated.View>
        </View>
      </ScrollView>
    </View>
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
  graphicWrapper: {
    width: '100%',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginBottom: 24,
  },
  stylistImageWrapper: {
    width: '100%',
    height: SCREEN_HEIGHT * 0.40,
    alignSelf: 'center',
    marginTop: 24,
  },
  stylistImage: {
    width: '100%',
    height: '100%',
  },
  cardsRow: {
    position: 'absolute',
    bottom: -20,
    flexDirection: 'row',
    alignSelf: 'center',
    alignItems: 'flex-end',
    justifyContent: 'center',
    width: '100%',
    height: 140,
  },
  miniCard: {
    width: 105,
    height: 125,
    borderRadius: 16,
    borderWidth: 1.5,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  miniCardImage: {
    width: '100%',
    height: '100%',
  },
  leftCard: {
    transform: [{ rotate: '-8deg' }],
    marginRight: -16,
    bottom: -6,
  },
  centerCard: {
    width: 115,
    height: 135,
    bottom: 6,
  },
  rightCard: {
    transform: [{ rotate: '8deg' }],
    marginLeft: -16,
    bottom: -6,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
});
