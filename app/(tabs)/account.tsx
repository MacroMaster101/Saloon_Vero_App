import { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useSession } from '@/context/session';
import { supabase } from '@/lib/api/supabase';
import { getMyBookings } from '@/lib/api/queries';
import { avatarSrc } from '@/lib/utils/avatar';
import { ScreenContainer } from '@/components/ui/screen';
import { Card } from '@/components/ui/card';
import { ThemedTextInput } from '@/components/ui/text-input';
import { ThemedButton } from '@/components/ui/button';
import { SectionHeader } from '@/components/ui/section-header';
import { StatusTag } from '@/components/ui/status-tag';
import { useTheme } from '@/hooks/use-theme';

import { LoadingScreen } from '@/components/ui/loading';

type Booking = { reference: string; starts_at: string; status: string };
const whenFmt = new Intl.DateTimeFormat('en-LK', { timeZone: 'Asia/Colombo', weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true });

export default function Account() {
  const { c, Type, Spacing, scheme } = useTheme();
  const { user, loading, signOut } = useSession();
  const [name, setName] = useState(''); const [phone, setPhone] = useState('');
  const [bookings, setBookings] = useState<Booking[]>([]); const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => { if (!loading && !user) router.replace('/(auth)/login'); }, [loading, user]);
  useEffect(() => {
    if (!user) return;
    setName((user.user_metadata?.full_name as string) ?? '');
    setPhone((user.user_metadata?.phone as string) ?? '');
    getMyBookings(user.id).then((b) => setBookings(b as Booking[]));
  }, [user]);

  async function saveProfile() {
    const { error } = await supabase.auth.updateUser({ data: { full_name: name, phone } });
    setMsg(error ? error.message : 'Saved');
  }
  async function pickAvatar() {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });
    if (res.canceled || !user) return;
    const uri = res.assets[0].uri;
    const blob = await (await fetch(uri)).blob();
    const path = `${user.id}/${Date.now()}.jpg`;
    const { error: upErr } = await supabase.storage.from('avatars').upload(path, blob, { upsert: true, contentType: 'image/jpeg' });
    if (upErr) return setMsg(upErr.message);
    const { data } = supabase.storage.from('avatars').getPublicUrl(path);
    await supabase.auth.updateUser({ data: { avatar_url: data.publicUrl, custom_avatar_url: data.publicUrl, avatar_choice: 'custom' } });
    setMsg('Photo updated');
  }
  async function logout() {
    await signOut();
    router.replace('/access' as never);
  }

  if (loading) {
    return <LoadingScreen message="Loading account..." />;
  }
  if (!user) return null;
  const src = avatarSrc(user.user_metadata as any, user.email ?? name);
  return (
    <ScreenContainer>
      <View style={{ alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.lg, marginTop: Spacing.md }}>
        <View style={{ 
          padding: 4, 
          borderRadius: 50, 
          borderWidth: 2, 
          borderColor: scheme === 'dark' ? 'rgba(232, 176, 90, 0.4)' : 'rgba(217, 154, 61, 0.4)',
          backgroundColor: 'rgba(255,255,255,0.1)'
        }}>
          <Image source={{ uri: src }} style={{ width: 88, height: 88, borderRadius: 44, backgroundColor: c.bg2 }} contentFit="cover" />
        </View>
        <Text onPress={pickAvatar} style={[Type.label, { color: c.accentText, fontFamily: 'Poppins_600SemiBold', marginTop: 4 }]}>Change photo</Text>
      </View>
      
      <Card style={{ padding: Spacing.lg, gap: Spacing.xs }}>
        <ThemedTextInput label="Name" value={name} onChangeText={setName} />
        <ThemedTextInput label="Mobile" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        <ThemedButton label="Save Details" onPress={saveProfile} style={{ marginTop: Spacing.xs }} />
        {msg && <Text style={[Type.caption, { color: c.accentText, marginTop: Spacing.sm, textAlign: 'center', fontFamily: 'Poppins_600SemiBold' }]}>{msg}</Text>}
      </Card>
 
      <SectionHeader eyebrow="History" title="My bookings" />
      {bookings.length === 0 ? (
        <Text style={[Type.body, { color: c.fgMuted, paddingHorizontal: Spacing.sm }]}>No bookings yet.</Text>
      ) : bookings.map((b) => (
        <Card key={b.reference} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm }}>
          <View>
            <Text style={[Type.label, { color: c.fg, fontSize: 15, fontFamily: 'Poppins_600SemiBold' }]}>{b.reference}</Text>
            <Text style={[Type.caption, { color: c.fgMuted, marginTop: 2 }]}>{whenFmt.format(new Date(b.starts_at))}</Text>
          </View>
          <StatusTag status={b.status} />
        </Card>
      ))}
      
      <ThemedButton variant="secondary" label="Sign out" onPress={logout} style={{ marginTop: Spacing.xl, marginBottom: Spacing.md }} />
    </ScreenContainer>
  );
}
