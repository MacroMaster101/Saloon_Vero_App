import { useState } from 'react';
import { View, Text } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/api/supabase';
import { signInWithGoogle } from '@/lib/auth/google';
import { ScreenContainer } from '@/components/ui/screen';
import { Card } from '@/components/ui/card';
import { ThemedTextInput } from '@/components/ui/text-input';
import { ThemedButton } from '@/components/ui/button';
import { GoogleButton } from '@/components/ui/google-button';
import { useTheme } from '@/hooks/use-theme';

export default function Login() {
  const { c, Type, Spacing } = useTheme();
  const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null); const [busy, setBusy] = useState(false); const [gbusy, setGbusy] = useState(false);
  async function submit() {
    setBusy(true); setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) return setError(error.message);
    router.replace('/(tabs)/account');
  }
  async function google() {
    setGbusy(true); setError(null);
    const res = await signInWithGoogle();
    setGbusy(false);
    if (!res.ok) return setError(res.message);
    router.replace('/(tabs)/account');
  }
  return (
    <ScreenContainer scroll={false} style={{ justifyContent: 'center' }}>
      <Card>
        <Text style={[Type.eyebrow, { color: c.accentText, letterSpacing: 1.5 }]}>SALOON VERO</Text>
        <Text style={[Type.h1, { color: c.fg, marginBottom: Spacing.md }]}>Welcome back</Text>
        <ThemedTextInput label="Email" placeholder="you@email.com" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
        <ThemedTextInput label="Password" placeholder="••••••••" secureTextEntry value={password} onChangeText={setPassword} />
        {error && <Text style={[Type.caption, { color: c.error, marginBottom: Spacing.sm }]}>{error}</Text>}
        <ThemedButton label="Log in" busy={busy} onPress={submit} />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginVertical: Spacing.md }}>
          <View style={{ flex: 1, height: 1, backgroundColor: c.line }} /><Text style={[Type.caption, { color: c.fgMuted }]}>or</Text><View style={{ flex: 1, height: 1, backgroundColor: c.line }} />
        </View>
        <GoogleButton busy={gbusy} onPress={google} />
        <Text onPress={() => router.push('/(auth)/signup')} style={[Type.body, { color: c.accentText, textAlign: 'center', marginTop: Spacing.md }]}>New here? Create an account</Text>
      </Card>
    </ScreenContainer>
  );
}
