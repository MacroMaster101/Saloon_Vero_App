import { ThemedButton } from '@/components/ui/button';
import { ThemeToggleButton } from '@/components/ui/theme-toggle-button';
import { CoachTooltip, PulseRing } from '@/components/ui/coach-tooltip';
import { useSession } from '@/context/session';
import { hasSeenWelcome, markWelcomeSeen } from '@/lib/auth/onboarding';
import { routeForSession } from '@/lib/auth/routing';
import { useTheme } from '@/hooks/use-theme';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Dimensions, Image, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming, Easing } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
// Test detection via JEST_WORKER_ID, which Jest sets at runtime and is never
// present in a release bundle. We deliberately avoid process.env.NODE_ENV:
// Metro's build-time inlining of NODE_ENV proved unreliable in release builds and
// made IS_TEST truthy in the APK, which skipped the splash entirely.
const IS_TEST = !!process.env.JEST_WORKER_ID;
// Minimum splash visible time so it never just flashes. Skipped under Jest.
const SPLASH_DELAY_MS = 1500;

export default function EntryScreen() {
  const { user, loading: sessionLoading, isGuest, profile, profileReady, recovering } = useSession();
  const { c, scheme, Spacing, Type } = useTheme();
  const insets = useSafeAreaInsets();

  const [isFirstTime, setIsFirstTime] = useState<boolean | null>(null);
  const [minTimeElapsed, setMinTimeElapsed] = useState(IS_TEST);
  const [progress, setProgress] = useState(0);
  // Dismissible coach mark pointing at the theme toggle (first-time users only).
  const [themeTipDismissed, setThemeTipDismissed] = useState(false);
  const didRoute = useRef(false);

  // Splash animations: pulsing logo + rotating outer ring.
  const logoScale = useSharedValue(1);
  const logoRotation = useSharedValue(0);

  // Minimum splash time so it never just flashes. The cosmetic progress bar runs
  // alongside; the setTimeout is the authoritative gate even if the interval is
  // throttled under animation load in release.
  useEffect(() => {
    if (IS_TEST) {
      setProgress(100);
      setMinTimeElapsed(true);
      return;
    }
    const startTime = Date.now();
    const done = setTimeout(() => {
      setProgress(100);
      setMinTimeElapsed(true);
    }, SPLASH_DELAY_MS);
    const interval = setInterval(() => {
      const pct = Math.min(Math.floor(((Date.now() - startTime) / SPLASH_DELAY_MS) * 100), 100);
      setProgress(pct);
      if (pct >= 100) clearInterval(interval);
    }, 50);
    return () => { clearTimeout(done); clearInterval(interval); };
  }, []);

  useEffect(() => {
    let cancelled = false;
    hasSeenWelcome()
      .then((seen) => {
        if (!cancelled) setIsFirstTime(!seen);
      })
      .catch(() => {
        // Storage should not strand users on the splash. If the read fails, use
        // the most forgiving path and let them see the welcome screen.
        if (!cancelled) setIsFirstTime(true);
      });
    return () => {
      cancelled = true;
    };
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

  // Single readiness gate: every input the decision depends on must be resolved.
  const ready = !sessionLoading && profileReady && isFirstTime !== null && minTimeElapsed;
  // Whether this user should land in the app rather than onboarding/login.
  const hasAccess = !!user || isGuest;

  // One-shot route decision, only once `ready`.
  useEffect(() => {
    if (!ready || didRoute.current) return;
    if (recovering) {
      didRoute.current = true;
      router.replace('/auth/reset-password' as never);
      return;
    }
    if (hasAccess) {
      if (isFirstTime) markWelcomeSeen().catch(() => {});
      didRoute.current = true;
      router.replace((routeForSession(user, profile, isGuest) ?? '/(tabs)') as never);
      return;
    }
    if (!isFirstTime) {
      // Returning, logged out: straight to login.
      didRoute.current = true;
      router.replace('/access' as never);
    }
    // First-time + logged out: fall through and render Get Started in-place.
  }, [ready, recovering, hasAccess, isFirstTime, user, profile, isGuest]);

  // Actions
  const handleGetStarted = async () => {
    try {
      await markWelcomeSeen();
    } finally {
      router.replace('/access' as never);
    }
  };

  const animatedLogoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
  }));

  const animatedOuterRingStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${logoRotation.value}deg` }],
  }));

  // Show splash until ready; once ready, only first-time logged-out users fall
  // through to Get Started — everyone else is mid-redirect, so keep the splash.
  const showGetStarted = ready && !recovering && !hasAccess && isFirstTime === true;
  if (!showGetStarted) {
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
                source={require('@/assets/images/logo-mark-vero.png')}
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
