import { useState } from 'react';
import { View, Text } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/api/supabase';
import { slLankaPhone } from '@/lib/validation/booking';
import { signInWithGoogle } from '@/lib/auth/google';
import { ScreenContainer } from '@/components/ui/screen';
import { Card } from '@/components/ui/card';
import { ThemedTextInput } from '@/components/ui/text-input';
import { ThemedButton } from '@/components/ui/button';
import { GoogleButton } from '@/components/ui/google-button';
import { useTheme } from '@/hooks/use-theme';

export default function Signup() {
  const { c, Type, Spacing } = useTheme();
  const [name, setName] = useState(''); const [phone, setPhone] = useState('');
  const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null); const [busy, setBusy] = useState(false); const [gbusy, setGbusy] = useState(false);
  async function submit() {
    setError(null);
    const phoneCheck = slLankaPhone.safeParse(phone);
    if (name.trim().length < 2) return setError('Please enter your name');
    if (!phoneCheck.success) return setError('Enter a valid Sri Lankan mobile number');
    setBusy(true);
    const { error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: name.trim(), phone: phoneCheck.data } } });
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
    <ScreenContainer style={{ justifyContent: 'center', flexGrow: 1 }}>
      <Card>
        <Text style={[Type.eyebrow, { color: c.accentText, letterSpacing: 1.5 }]}>SALOON VERO</Text>
        <Text style={[Type.h1, { color: c.fg, marginBottom: Spacing.md }]}>Create account</Text>
        <ThemedTextInput label="Full name" placeholder="Your name" value={name} onChangeText={setName} />
        <ThemedTextInput label="Mobile" placeholder="07x xxx xxxx" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
        <ThemedTextInput label="Email" placeholder="you@email.com" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
        <ThemedTextInput label="Password" placeholder="••••••••" secureTextEntry value={password} onChangeText={setPassword} />
        {error && <Text style={[Type.caption, { color: c.error, marginBottom: Spacing.sm }]}>{error}</Text>}
        <ThemedButton label="Sign up" busy={busy} onPress={submit} />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginVertical: Spacing.md }}>
          <View style={{ flex: 1, height: 1, backgroundColor: c.line }} /><Text style={[Type.caption, { color: c.fgMuted }]}>or</Text><View style={{ flex: 1, height: 1, backgroundColor: c.line }} />
        </View>
        <GoogleButton busy={gbusy} onPress={google} />
        <Text onPress={() => router.back()} style={[Type.body, { color: c.accentText, textAlign: 'center', marginTop: Spacing.md }]}>Already have an account? Log in</Text>
      </Card>
    </ScreenContainer>
  );
}
