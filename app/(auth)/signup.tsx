import { useEffect, useState } from 'react';
import { BackHandler, View, Text } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/api/supabase';
import { validateSignup } from '@/lib/auth/signup-validation';
import { friendlyAuthError } from '@/lib/auth/friendly-error';
import { signInWithGoogle } from '@/lib/auth/google';
import { ScreenContainer } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Card } from '@/components/ui/card';
import { ThemedTextInput } from '@/components/ui/text-input';
import { ThemedButton } from '@/components/ui/button';
import { ThemeToggleButton } from '@/components/ui/theme-toggle-button';
import { GoogleButton } from '@/components/ui/google-button';
import { OtpInput } from '@/components/ui/otp-input';
import { BackButton } from '@/components/ui/back-button';
import { useTheme } from '@/hooks/use-theme';
import { useCountdown } from '@/hooks/use-countdown';

// Matches the SMTP "Minimum interval per user" so resend can't trip the rate limit.
const RESEND_COOLDOWN_SECONDS = 60;

export default function Signup() {
  const { c, Type, Spacing } = useTheme();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [gbusy, setGbusy] = useState(false);
  const [confirmSentTo, setConfirmSentTo] = useState<string | null>(null);
  // OTP verification state (shown once a code has been emailed).
  const [otp, setOtp] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const cooldown = useCountdown();

  // After signup, Android hardware back would pop to the filled form — send
  // the user to log in instead, matching the card's CTA.
  useEffect(() => {
    if (!confirmSentTo) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      router.replace('/(auth)/login');
      return true;
    });
    return () => sub.remove();
  }, [confirmSentTo]);

  async function submit() {
    setError(null);
    const v = validateSignup({ name, phone, email, password, confirm });
    if (!v.ok) return setError(v.message);
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email: v.cleanEmail,
      password,
      options: { data: { full_name: v.cleanName, phone: v.cleanPhone } },
    });
    setBusy(false);
    if (error) return setError(friendlyAuthError(error.message));
    // Supabase returns a "fake success" with no identities when the email is already registered.
    if (data.user && data.user.identities?.length === 0) {
      return setError('An account with this email already exists — log in instead.');
    }
    // Email confirmation enabled: no session yet. Supabase emailed a 6-digit code;
    // collect it and verify in-app (no link/deep-link, no website redirect).
    if (!data.session) {
      cooldown.start(RESEND_COOLDOWN_SECONDS);
      return setConfirmSentTo(v.cleanEmail);
    }
    router.replace('/(tabs)');
  }

  async function verify() {
    if (!confirmSentTo) return;
    setError(null);
    setNotice(null);
    const code = otp.trim();
    if (code.length < 6) return setError('Enter the code from your email.');
    setVerifying(true);
    const { data, error } = await supabase.auth.verifyOtp({
      email: confirmSentTo,
      token: code,
      type: 'signup',
    });
    setVerifying(false);
    if (error) return setError(friendlyAuthError(error.message));
    // A verified signup returns a session — drop straight into the app.
    if (data.session) return router.replace('/(tabs)');
    // No session (rare) — fall back to the login screen.
    router.replace('/(auth)/login');
  }

  async function resend() {
    if (!confirmSentTo || cooldown.active) return;
    setError(null);
    setNotice(null);
    setResending(true);
    const { error } = await supabase.auth.resend({ type: 'signup', email: confirmSentTo });
    setResending(false);
    if (error) return setError(friendlyAuthError(error.message));
    cooldown.start(RESEND_COOLDOWN_SECONDS);
    setNotice('A new code is on its way.');
  }

  async function google() {
    setGbusy(true);
    setError(null);
    const res = await signInWithGoogle();
    setGbusy(false);
    if (!res.ok) return setError(res.message);
    router.replace('/(tabs)');
  }

  if (confirmSentTo) {
    return (
      <ScreenContainer safeTop={false}>
        <ScreenHeader eyebrow="SALOON VERO" title="Confirm your email" right={<ThemeToggleButton />} />
        <View style={{ width: '100%', maxWidth: 480, alignSelf: 'center' }}>
        <Card style={{ padding: Spacing.lg, gap: Spacing.sm, marginTop: Spacing.md }}>
          <Text style={{ fontSize: 40, textAlign: 'center' }}>📬</Text>
          <Text style={[Type.h2, { color: c.fg, textAlign: 'center' }]}>Enter your code</Text>
          <Text style={[Type.body, { color: c.fg2, textAlign: 'center' }]}>
            We sent a verification code to{'\n'}
            <Text style={{ fontFamily: 'Poppins_600SemiBold', color: c.accentText }}>{confirmSentTo}</Text>
          </Text>
          <View style={{ marginTop: Spacing.sm, marginBottom: Spacing.sm }}>
            <OtpInput
              value={otp}
              onChangeText={(t) => { setOtp(t); setError(null); setNotice(null); }}
              onComplete={verify}
            />
          </View>
          {error && <Text style={[Type.caption, { color: c.error, textAlign: 'center' }]}>{error}</Text>}
          {notice && <Text style={[Type.caption, { color: c.accentText, textAlign: 'center' }]}>{notice}</Text>}
          <ThemedButton label="Verify & continue" busy={verifying} onPress={verify} />
          <Text
            onPress={resending || cooldown.active ? undefined : resend}
            style={[Type.caption, { color: cooldown.active ? c.fgMuted : c.accentText, textAlign: 'center', marginTop: Spacing.xs, fontFamily: 'Poppins_600SemiBold' }]}
          >
            {resending ? 'Sending…' : cooldown.active ? `Resend code in ${cooldown.seconds}s` : "Didn't get it? Resend code"}
          </Text>
          <Text
            onPress={() => router.replace('/(auth)/login')}
            style={[Type.caption, { color: c.fgMuted, textAlign: 'center', marginTop: Spacing.xs }]}
          >
            Back to log in
          </Text>
        </Card>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer safeTop={false}>
      <ScreenHeader
        eyebrow="SALOON VERO"
        title="Create account"
        left={<BackButton />}
        right={<ThemeToggleButton />}
      />

      <View style={{ width: '100%', maxWidth: 480, alignSelf: 'center' }}>
      <Card style={{ padding: Spacing.lg }}>

        <ThemedTextInput
          label="Full name"
          placeholder="Your name"
          value={name}
          onChangeText={(t) => { setName(t); setError(null); }}
        />
        <ThemedTextInput
          label="Mobile"
          placeholder="07x xxx xxxx"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={(t) => { setPhone(t); setError(null); }}
        />
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
        />
        <ThemedTextInput
          label="Confirm password"
          placeholder="••••••••"
          secureToggle
          value={confirm}
          onChangeText={(t) => { setConfirm(t); setError(null); }}
          style={{ marginBottom: Spacing.md }}
        />

        {error && <Text style={[Type.caption, { color: c.error, marginBottom: Spacing.md, textAlign: 'center' }]}>{error}</Text>}

        <ThemedButton label="Sign up" busy={busy} onPress={submit} style={{ marginTop: Spacing.xs }} />

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginVertical: Spacing.lg }}>
          <View style={{ flex: 1, height: 1, backgroundColor: c.line }} />
          <Text style={[Type.caption, { color: c.fgMuted, fontFamily: 'Poppins_500Medium' }]}>or continue with</Text>
          <View style={{ flex: 1, height: 1, backgroundColor: c.line }} />
        </View>

        <GoogleButton busy={gbusy} onPress={google} />

        <Text onPress={() => router.back()} style={[Type.body, { color: c.accentText, textAlign: 'center', marginTop: Spacing.lg, fontFamily: 'Poppins_600SemiBold', fontSize: 14 }]}>
          Already have an account? Log in
        </Text>
      </Card>
      </View>
    </ScreenContainer>
  );
}
