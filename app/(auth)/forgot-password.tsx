import { useState } from 'react';
import { Text } from 'react-native';
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
  const [sentTo, setSentTo] = useState<string | null>(null);

  async function submit() {
    setError(null);
    const cleanEmail = email.trim().toLowerCase();
    if (!EMAIL_RE.test(cleanEmail)) return setError('Enter a valid email address');
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail);
    setBusy(false);
    if (error) return setError(friendlyAuthError(error.message));
    setSentTo(cleanEmail);
  }

  return (
    <ScreenContainer>
      <ScreenHeader eyebrow="SALOON VERO" title="Reset password" left={<BackButton />} right={<ThemeToggleButton />} />
      {sentTo ? (
        <Card style={{ padding: Spacing.lg, gap: Spacing.sm, marginTop: Spacing.md }}>
          <Text style={{ fontSize: 40, textAlign: 'center' }}>📬</Text>
          <Text style={[Type.h2, { color: c.fg, textAlign: 'center' }]}>Check your email</Text>
          <Text style={[Type.body, { color: c.fg2, textAlign: 'center' }]}>
            We sent a reset link to{'\n'}
            <Text style={{ fontFamily: 'Poppins_600SemiBold', color: c.accentText }}>{sentTo}</Text>
          </Text>
          <ThemedButton variant="secondary" label="Back to log in" onPress={() => router.back()} />
        </Card>
      ) : (
        <Card style={{ padding: Spacing.lg, marginTop: Spacing.md }}>
          <Text style={[Type.body, { color: c.fg2, marginBottom: Spacing.md }]}>
            Enter your email and we&apos;ll send you a reset link.
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
          <ThemedButton label="Send reset link" busy={busy} onPress={submit} />
        </Card>
      )}
    </ScreenContainer>
  );
}
