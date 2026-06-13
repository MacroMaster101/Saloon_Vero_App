import { useState } from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/api/supabase';
import { friendlyAuthError } from '@/lib/auth/friendly-error';
import { ScreenContainer } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Card } from '@/components/ui/card';
import { ThemedTextInput } from '@/components/ui/text-input';
import { ThemedButton } from '@/components/ui/button';
import { ThemeToggleButton } from '@/components/ui/theme-toggle-button';
import { BackButton } from '@/components/ui/back-button';
import { useTheme } from '@/hooks/use-theme';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPassword() {
  const { c, Type, Spacing } = useTheme();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setError(null);
    const cleanEmail = email.trim().toLowerCase();
    if (!EMAIL_RE.test(cleanEmail)) return setError('Enter a valid email address');
    setBusy(true);
    // Sends a recovery email; with the "Reset password" template using {{ .Token }}
    // this delivers a code the user enters in-app — no link, no website redirect.
    const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail);
    setBusy(false);
    if (error) return setError(friendlyAuthError(error.message));
    // Go straight to the code screen — it shows the email and handles resend,
    // so a separate "check your email" card would just be an extra tap.
    router.push({ pathname: '/auth/reset-password', params: { email: cleanEmail } } as never);
  }

  return (
    <ScreenContainer safeTop={false}>
      <ScreenHeader eyebrow="SALOON VERO" title="Reset password" left={<BackButton />} right={<ThemeToggleButton />} />
      <View style={{ width: '100%', maxWidth: 480, alignSelf: 'center' }}>
      <Card style={{ padding: Spacing.lg, marginTop: Spacing.md }}>
        <Text style={[Type.body, { color: c.fg2, marginBottom: Spacing.md }]}>
          Enter your email and we&apos;ll send you a reset code.
        </Text>
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
        {error && <Text style={[Type.caption, { color: c.error, marginBottom: Spacing.sm, textAlign: 'center' }]}>{error}</Text>}
        <ThemedButton label="Send reset code" busy={busy} onPress={submit} />
      </Card>
      </View>
    </ScreenContainer>
  );
}
