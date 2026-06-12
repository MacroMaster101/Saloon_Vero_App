import { useState } from 'react';
import { View, Text } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/api/supabase';
import { signInWithGoogle } from '@/lib/auth/google';
import { friendlyAuthError } from '@/lib/auth/friendly-error';
import { ScreenContainer } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Card } from '@/components/ui/card';
import { ThemedTextInput } from '@/components/ui/text-input';
import { ThemedButton } from '@/components/ui/button';
import { ThemeToggleButton } from '@/components/ui/theme-toggle-button';
import { GoogleButton } from '@/components/ui/google-button';
import { BackButton } from '@/components/ui/back-button';
import { useTheme } from '@/hooks/use-theme';

export default function Login() {
  const { c, Type, Spacing } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [gbusy, setGbusy] = useState(false);

  async function submit() {
    setBusy(true);
    setError(null);
    // Android keyboards often append a trailing space on autocomplete — trim before auth.
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
    setBusy(false);
    if (error) return setError(friendlyAuthError(error.message));
    router.replace('/(tabs)');
  }

  async function google() {
    setGbusy(true);
    setError(null);
    const res = await signInWithGoogle();
    setGbusy(false);
    if (!res.ok) return setError(res.message);
    router.replace('/(tabs)');
  }

  return (
    <ScreenContainer>
      <ScreenHeader
        eyebrow="SALOON VERO"
        title="Welcome back"
        subtitle="Sign in to manage your appointments"
        left={<BackButton />}
        right={<ThemeToggleButton />}
      />

      <Card style={{ padding: Spacing.lg }}>

        <ThemedTextInput
          label="Email"
          placeholder="you@email.com"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          keyboardType="email-address"
          value={email}
          onChangeText={(t) => { setEmail(t); setError(null); }}
        />
        <ThemedTextInput
          label="Password"
          placeholder="••••••••"
          secureToggle
          value={password}
          onChangeText={(t) => { setPassword(t); setError(null); }}
          style={{ marginBottom: Spacing.xs }}
        />

        <Text
          onPress={() => router.push('/(auth)/forgot-password' as never)}
          style={[Type.caption, { color: c.accentText, textAlign: 'right', marginTop: -Spacing.xs, marginBottom: Spacing.sm, fontFamily: 'Poppins_600SemiBold' }]}
        >
          Forgot password?
        </Text>

        {error && <Text style={[Type.caption, { color: c.error, marginBottom: Spacing.md, textAlign: 'center' }]}>{error}</Text>}

        <ThemedButton label="Log in" busy={busy} onPress={submit} style={{ marginTop: Spacing.xs }} />

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginVertical: Spacing.lg }}>
          <View style={{ flex: 1, height: 1, backgroundColor: c.line }} />
          <Text style={[Type.caption, { color: c.fgMuted, fontFamily: 'Poppins_500Medium' }]}>or continue with</Text>
          <View style={{ flex: 1, height: 1, backgroundColor: c.line }} />
        </View>

        <GoogleButton busy={gbusy} onPress={google} />

        <Text onPress={() => router.push('/(auth)/signup')} style={[Type.body, { color: c.accentText, textAlign: 'center', marginTop: Spacing.lg, fontFamily: 'Poppins_600SemiBold', fontSize: 14 }]}>
          New here? Create an account
        </Text>
      </Card>
    </ScreenContainer>
  );
}
