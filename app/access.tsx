import { useEffect, useState } from 'react';
import { Image, Text, View } from 'react-native';
import { router } from 'expo-router';
import { signInWithGoogle } from '@/lib/auth/google';
import { useSession } from '@/context/session';
import { routeForSession } from '@/lib/auth/routing';
import { ScreenContainer } from '@/components/ui/screen';
import { Card } from '@/components/ui/card';
import { ThemedButton } from '@/components/ui/button';
import { ThemeToggleButton } from '@/components/ui/theme-toggle-button';
import { GoogleButton } from '@/components/ui/google-button';
import { LoadingScreen } from '@/components/ui/loading';
import { useTheme } from '@/hooks/use-theme';

export default function AccessScreen() {
  const { c, Radius, Spacing, Type, Shadow } = useTheme();
  const { user, loading, continueAsGuest, profile, profileReady, isGuest } = useSession();
  const [error, setError] = useState<string | null>(null);
  const [guestBusy, setGuestBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);

  useEffect(() => {
    if (!loading && profileReady && user)
      router.replace((routeForSession(user, profile, isGuest) ?? '/(tabs)') as never);
  }, [loading, profileReady, user, profile, isGuest]);

  async function guest() {
    setGuestBusy(true);
    setError(null);
    await continueAsGuest();
    setGuestBusy(false);
    router.replace('/(tabs)/book');
  }

  async function google() {
    setGoogleBusy(true);
    setError(null);
    const res = await signInWithGoogle();
    setGoogleBusy(false);
    if (!res.ok) return setError(res.message);
    // routing will be handled by the useEffect above once profile loads
  }

  if (loading || user) return <LoadingScreen message="Preparing your access..." />;

  return (
    <ScreenContainer scroll={false} style={{ justifyContent: 'center' }}>
      {/* Floating ThemeToggleButton */}
      <View style={{ position: 'absolute', top: Spacing.sm, right: Spacing.md, zIndex: 10 }}>
        <ThemeToggleButton />
      </View>

      <View style={{ alignItems: 'center', marginBottom: Spacing.xl }}>
        <View
          style={[{
            width: 100,
            height: 100,
            borderRadius: 50,
            backgroundColor: c.surfaceRaised,
            borderWidth: 1.5,
            borderColor: c.hairline,
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }, Shadow.md]}>
          <Image source={require('@/assets/images/logo.jpg')} style={{ width: 84, height: 84, borderRadius: 42 }} resizeMode="contain" />
        </View>
        <Text style={[Type.eyebrow, { color: c.accentText, letterSpacing: 2, marginTop: Spacing.md, textTransform: 'uppercase', fontFamily: 'Poppins_600SemiBold' }]}>
          Welcome to
        </Text>
        <Text style={[Type.h1, { color: c.fg, textAlign: 'center', marginTop: 4, letterSpacing: 0.5 }]}>Saloon Vero</Text>
        <Text style={[Type.body, { color: c.fg2, textAlign: 'center', marginTop: Spacing.xs, paddingHorizontal: Spacing.md, fontSize: 14 }]}>
          Book premium styling sessions as a guest, or register to sync your records.
        </Text>
      </View>

      <Card style={{ gap: Spacing.md, borderRadius: Radius.lg, padding: Spacing.lg }}>
        <ThemedButton variant="secondary" label="Continue as Guest" busy={guestBusy} onPress={guest} />
        
        <GoogleButton busy={googleBusy} onPress={google} />

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginVertical: Spacing.xs }}>
          <View style={{ flex: 1, height: 1, backgroundColor: c.line }} />
          <Text style={[Type.caption, { color: c.fgMuted, fontFamily: 'Poppins_500Medium' }]}>or continue with email</Text>
          <View style={{ flex: 1, height: 1, backgroundColor: c.line }} />
        </View>

        <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
          <View style={{ flex: 1 }}>
            <ThemedButton variant="secondary" label="Sign In" onPress={() => router.push('/(auth)/login')} />
          </View>
          <View style={{ flex: 1 }}>
            <ThemedButton variant="secondary" label="Register" onPress={() => router.push('/(auth)/signup')} />
          </View>
        </View>
        
        {error && <Text style={[Type.caption, { color: c.error, textAlign: 'center', marginTop: Spacing.xs }]}>{error}</Text>}
      </Card>
    </ScreenContainer>
  );
}
