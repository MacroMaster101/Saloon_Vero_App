import { useState } from 'react';
import { View, Text, Pressable, Platform } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/api/supabase';
import { slLankaPhone } from '@/lib/validation/booking';
import { signInWithGoogle } from '@/lib/auth/google';
import { ScreenContainer } from '@/components/ui/screen';
import { Card } from '@/components/ui/card';
import { ThemedTextInput } from '@/components/ui/text-input';
import { ThemedButton } from '@/components/ui/button';
import { GoogleButton } from '@/components/ui/google-button';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useTheme } from '@/hooks/use-theme';

export default function Signup() {
  const { c, Type, Spacing, Shadow, scheme } = useTheme();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [gbusy, setGbusy] = useState(false);

  async function submit() {
    setError(null);
    const phoneCheck = slLankaPhone.safeParse(phone);
    if (name.trim().length < 2) return setError('Please enter your name');
    if (!phoneCheck.success) return setError('Enter a valid Sri Lankan mobile number');
    setBusy(true);
    const { error } = await supabase.auth.signUp({ 
      email, 
      password, 
      options: { data: { full_name: name.trim(), phone: phoneCheck.data } } 
    });
    setBusy(false);
    if (error) return setError(error.message);
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
    <ScreenContainer style={{ justifyContent: 'center' }}>
      <Pressable 
        onPress={() => router.back()} 
        style={({ pressed }) => [
          {
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: Platform.OS === 'ios'
              ? (scheme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.6)')
              : (scheme === 'dark' ? '#1E1712' : '#FFFFFF'),
            borderWidth: 1,
            borderColor: Platform.OS === 'ios'
              ? (scheme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(184, 116, 42, 0.15)')
              : (scheme === 'dark' ? '#2E251E' : '#EBE2CF'),
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: Spacing.md,
            opacity: pressed ? 0.8 : 1,
          },
          Shadow.sm
        ]}
        android_ripple={{ color: scheme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(184, 116, 42, 0.12)' }}
      >
        <IconSymbol name="chevron.left" size={20} color={c.accentText} />
      </Pressable>
      
      <Card style={{ padding: Spacing.lg }}>
        <View style={{ marginBottom: Spacing.md }}>
          <Text style={[Type.eyebrow, { color: c.accentText, letterSpacing: 2, fontFamily: 'Poppins_600SemiBold', textTransform: 'uppercase' }]}>SALOON VERO</Text>
          <Text style={[Type.h1, { color: c.fg, marginTop: 2 }]}>Create account</Text>
          <Text style={[Type.body, { color: c.fg2, fontSize: 14, marginTop: 2 }]}>Register to save your schedules and profile</Text>
        </View>
        
        <ThemedTextInput label="Full name" placeholder="Your name" value={name} onChangeText={setName} />
        <ThemedTextInput label="Mobile" placeholder="07x xxx xxxx" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
        <ThemedTextInput label="Email" placeholder="you@email.com" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
        <ThemedTextInput label="Password" placeholder="••••••••" secureTextEntry value={password} onChangeText={setPassword} style={{ marginBottom: Spacing.md }} />
        
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
    </ScreenContainer>
  );
}
