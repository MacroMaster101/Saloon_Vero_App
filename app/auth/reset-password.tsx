import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/api/supabase';
import { friendlyAuthError } from '@/lib/auth/friendly-error';
import { validatePassword } from '@/lib/auth/signup-validation';
import { ScreenContainer } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Card } from '@/components/ui/card';
import { ThemedTextInput } from '@/components/ui/text-input';
import { OtpInput } from '@/components/ui/otp-input';
import { ThemedButton } from '@/components/ui/button';
import { useTheme } from '@/hooks/use-theme';
import { useCountdown } from '@/hooks/use-countdown';
import { useSession } from '@/context/session';

// Matches the SMTP "Minimum interval per user" so resend can't trip the rate limit.
const RESEND_COOLDOWN_SECONDS = 60;

// Two-step reset: 'code' verifies the emailed OTP (which creates a recovery
// session), then 'password' sets the new password against that session.
type Step = 'loading' | 'code' | 'password' | 'done' | 'invalid';

export default function ResetPassword() {
  const { c, Type, Spacing } = useTheme();
  const { beginRecovery } = useSession();
  const params = useLocalSearchParams<{ email?: string }>();
  const email = typeof params.email === 'string' ? params.email : '';

  const [step, setStep] = useState<Step>('loading');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [resending, setResending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const cooldown = useCountdown();

  useEffect(() => {
    // A recovery link (if ever used) arrives with a session already established —
    // skip the code step. Otherwise start at the code step, which needs the email.
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) return setStep('password');
      if (email) {
        // forgot-password just sent a code — start the resend cooldown immediately.
        cooldown.start(RESEND_COOLDOWN_SECONDS);
        setStep('code');
      } else {
        setStep('invalid');
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email]);

  async function verifyCode() {
    setError(null);
    setNotice(null);
    const code = otp.trim();
    if (code.length < 6) return setError('Enter the code from your email.');
    setBusy(true);
    // Flag recovery BEFORE verifying: verifyOtp creates a session and fires the
    // auth listener immediately, so the flag must already be set to stop the app
    // routing this recovery session in as a normal login.
    beginRecovery();
    const { error } = await supabase.auth.verifyOtp({ email, token: code, type: 'recovery' });
    setBusy(false);
    if (error) return setError(friendlyAuthError(error.message));
    setStep('password'); // code consumed, recovery session now active
  }

  async function updatePassword() {
    setError(null);
    const pwError = validatePassword(password);
    if (pwError) return setError(pwError);
    if (password !== confirm) return setError("Passwords don't match");
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setBusy(false);
      return setError(friendlyAuthError(error.message));
    }
    // Drop the recovery session so the user logs in fresh with the new password.
    await supabase.auth.signOut();
    setBusy(false);
    setStep('done');
  }

  async function resend() {
    if (!email || cooldown.active) return;
    setError(null);
    setNotice(null);
    setResending(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    setResending(false);
    if (error) return setError(friendlyAuthError(error.message));
    cooldown.start(RESEND_COOLDOWN_SECONDS);
    setNotice('A new code is on its way.');
  }

  if (step === 'loading') {
    return (
      <ScreenContainer safeTop={false} keyboardAware>
        <ScreenHeader eyebrow="SALOON VERO" title="Reset password" />
      </ScreenContainer>
    );
  }

  if (step === 'invalid') {
    return (
      <ScreenContainer safeTop={false} keyboardAware>
        <ScreenHeader eyebrow="SALOON VERO" title="Reset password" />
        <View style={{ width: '100%', maxWidth: 480, alignSelf: 'center' }}>
        <Card style={{ padding: Spacing.lg, gap: Spacing.sm, marginTop: Spacing.md }}>
          <Text style={{ fontSize: 40, textAlign: 'center' }}>⏳</Text>
          <Text style={[Type.h2, { color: c.fg, textAlign: 'center' }]}>Start over</Text>
          <Text style={[Type.body, { color: c.fg2, textAlign: 'center' }]}>
            Request a password reset to get a fresh code.
          </Text>
          <ThemedButton label="Back to log in" onPress={() => router.replace('/(auth)/login')} />
        </Card>
        </View>
      </ScreenContainer>
    );
  }

  if (step === 'done') {
    return (
      <ScreenContainer safeTop={false} keyboardAware>
        <ScreenHeader eyebrow="SALOON VERO" title="Reset password" />
        <View style={{ width: '100%', maxWidth: 480, alignSelf: 'center' }}>
        <Card style={{ padding: Spacing.lg, gap: Spacing.sm, marginTop: Spacing.md }}>
          <Text style={{ fontSize: 40, textAlign: 'center' }}>✅</Text>
          <Text style={[Type.h2, { color: c.fg, textAlign: 'center' }]}>Password updated</Text>
          <Text style={[Type.body, { color: c.fg2, textAlign: 'center' }]}>
            Log in with your new password.
          </Text>
          <ThemedButton label="Go to log in" onPress={() => router.replace('/(auth)/login')} />
        </Card>
        </View>
      </ScreenContainer>
    );
  }

  // Step 1 — enter the emailed code.
  if (step === 'code') {
    return (
      <ScreenContainer safeTop={false} keyboardAware>
        <ScreenHeader eyebrow="SALOON VERO" title="Enter reset code" />
        <View style={{ width: '100%', maxWidth: 480, alignSelf: 'center' }}>
        <Card style={{ padding: Spacing.lg, marginTop: Spacing.md }}>
          <Text style={[Type.body, { color: c.fg2, marginBottom: Spacing.md }]}>
            We emailed a code to{'\n'}
            <Text style={{ fontFamily: 'Poppins_600SemiBold', color: c.accentText }}>{email}</Text>
          </Text>
          <View style={{ marginBottom: Spacing.md }}>
            <OtpInput
              value={otp}
              autoFocus
              onChangeText={(t) => { setOtp(t); setError(null); setNotice(null); }}
              onComplete={verifyCode}
            />
          </View>
          {error && <Text style={[Type.caption, { color: c.error, marginBottom: Spacing.sm, textAlign: 'center' }]}>{error}</Text>}
          {notice && <Text style={[Type.caption, { color: c.accentText, marginBottom: Spacing.sm, textAlign: 'center' }]}>{notice}</Text>}
          <ThemedButton label="Verify code" busy={busy} onPress={verifyCode} />
          <Text
            onPress={resending || cooldown.active ? undefined : resend}
            style={[Type.caption, { color: cooldown.active ? c.fgMuted : c.accentText, textAlign: 'center', marginTop: Spacing.sm, fontFamily: 'Poppins_600SemiBold' }]}
          >
            {resending ? 'Sending…' : cooldown.active ? `Resend in ${cooldown.seconds}s` : "Didn't get a code? Resend"}
          </Text>
        </Card>
        </View>
      </ScreenContainer>
    );
  }

  // Step 2 — set the new password (recovery session is active).
  return (
    <ScreenContainer safeTop={false}>
      <ScreenHeader eyebrow="SALOON VERO" title="Set a new password" />
      <View style={{ width: '100%', maxWidth: 480, alignSelf: 'center' }}>
      <Card style={{ padding: Spacing.lg, marginTop: Spacing.md }}>
        <Text style={[Type.body, { color: c.fg2, marginBottom: Spacing.md }]}>
          Choose a new password for your account.
        </Text>
        <ThemedTextInput
          label="New password"
          placeholder="••••••••"
          secureToggle
          value={password}
          onChangeText={(t) => { setPassword(t); setError(null); }}
        />
        <ThemedTextInput
          label="Confirm password"
          placeholder="••••••••"
          secureToggle
          value={confirm}
          onChangeText={(t) => { setConfirm(t); setError(null); }}
          style={{ marginBottom: Spacing.md }}
        />
        {error && <Text style={[Type.caption, { color: c.error, marginBottom: Spacing.sm, textAlign: 'center' }]}>{error}</Text>}
        <ThemedButton label="Update password" busy={busy} onPress={updatePassword} />
      </Card>
      </View>
    </ScreenContainer>
  );
}
