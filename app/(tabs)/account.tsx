import { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, Alert } from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useSession } from '@/context/session';
import { supabase } from '@/lib/api/supabase';
import { uploadImage } from '@/lib/api/storage';
import { ensureCameraPermission, ensurePhotoLibraryPermission } from '@/lib/permissions/photos';
import { getMyBookings } from '@/lib/api/queries';
import { getAvatarInfo } from '@/lib/utils/avatar';
import { ScreenContainer } from '@/components/ui/screen';
import { Card } from '@/components/ui/card';
import { ThemedTextInput } from '@/components/ui/text-input';
import { ThemedButton } from '@/components/ui/button';
import { SectionHeader } from '@/components/ui/section-header';
import { ScreenHeader } from '@/components/ui/screen-header';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useTheme } from '@/hooks/use-theme';
import { useThemePreference } from '@/context/theme';
import { LoadingScreen } from '@/components/ui/loading';

type Booking = { reference: string; starts_at: string; status: string };
type AvatarChoice = 'dicebear' | 'email' | 'custom';

export default function Account() {
  const { c, Type, Spacing, Radius, scheme } = useTheme();
  const { pref, setPref } = useThemePreference();
  const { user, loading, signOut } = useSession();
  const [name, setName] = useState(''); const [phone, setPhone] = useState('');
  // Last-saved values, so we can detect unsaved edits and offer the save button.
  const [savedName, setSavedName] = useState(''); const [savedPhone, setSavedPhone] = useState('');
  const [bookings, setBookings] = useState<Booking[]>([]); const [msg, setMsg] = useState<string | null>(null);
  // Local mirror of the avatar so the switcher feels instant; seeded from metadata.
  const [meta, setMeta] = useState<Record<string, unknown>>({});
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (!loading && !user) router.replace('/(auth)/login'); }, [loading, user]);
  useEffect(() => {
    if (!user) return;
    const n = (user.user_metadata?.full_name as string) ?? '';
    const p = (user.user_metadata?.phone as string) ?? '';
    setName(n); setSavedName(n);
    setPhone(p); setSavedPhone(p);
    setMeta((user.user_metadata as Record<string, unknown>) ?? {});
    getMyBookings(user.id).then((b) => setBookings(b as Booking[]));
  }, [user]);

  const seed = user?.email ?? name;
  const avatar = useMemo(() => getAvatarInfo(meta, seed), [meta, seed]);

  // True when the details form differs from what's saved (drives the save button).
  const detailsDirty = name.trim() !== savedName.trim() || phone.trim() !== savedPhone.trim();

  // Auto-dismiss the inline confirmation banner so it reads like a toast.
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(null), 2500);
    return () => clearTimeout(t);
  }, [msg]);

  async function saveProfile() {
    if (saving || !detailsDirty) return;
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ data: { full_name: name, phone } });
    setSaving(false);
    if (error) {
      Alert.alert('Could not save', error.message);
      return;
    }
    setSavedName(name); setSavedPhone(phone);
    Alert.alert('Saved', 'Your details have been updated.');
  }

  function resetDetails() {
    setName(savedName);
    setPhone(savedPhone);
  }

  // Patch user_metadata both remotely and in our local mirror so the avatar
  // preview + segmented control update immediately. Rolls the local mirror back
  // if the remote update fails so the UI never lies about what's saved.
  async function patchMeta(patch: Record<string, unknown>, note: string) {
    if (!user) return;
    const prev = meta;
    setMeta((m) => ({ ...m, ...patch }));
    const { error } = await supabase.auth.updateUser({ data: patch });
    if (error) { setMeta(prev); setMsg(error.message); return; }
    setMsg(note);
  }

  // Entry point: let the user pick a source, gated by the priming helpers.
  function uploadAvatar() {
    if (!user || busy) return;
    Alert.alert('Profile photo', 'Choose a new photo', [
      { text: 'Choose from Library', onPress: () => pickFromLibrary() },
      { text: 'Take Photo', onPress: () => takePhoto() },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  async function pickFromLibrary() {
    if (!(await ensurePhotoLibraryPermission())) return;
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7, allowsEditing: true });
    if (!res.canceled) await processAvatar(res.assets[0].uri);
  }

  async function takePhoto() {
    if (!(await ensureCameraPermission())) return;
    const res = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.7, allowsEditing: true });
    if (!res.canceled) await processAvatar(res.assets[0].uri);
  }

  async function processAvatar(uri: string) {
    if (!user) return;
    setBusy(true);
    setMsg(null);
    const up = await uploadImage('avatars', `${user.id}/${Date.now()}.jpg`, uri);
    if ('error' in up) {
      setBusy(false);
      Alert.alert('Upload failed', up.error);
      return;
    }
    await patchMeta({ avatar_url: up.url, custom_avatar_url: up.url, avatar_choice: 'custom' }, 'Photo updated ✓');
    setBusy(false);
  }

  // Switch which source renders. 'custom' with no uploaded photo opens the picker.
  function onChooseSource(choice: AvatarChoice) {
    if (choice === 'custom' && !avatar.customAvatar) return uploadAvatar();
    patchMeta({ avatar_choice: choice }, 'Avatar updated');
  }

  // Re-roll the cartoon avatar with a fresh random seed.
  function shuffleCartoon() {
    const seed = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
    patchMeta({ dicebear_seed: seed, avatar_choice: 'dicebear' }, 'New cartoon avatar');
  }

  // The badge action depends on the active source: shuffle for the cartoon,
  // (re)upload otherwise.
  const onBadgePress = avatar.choice === 'dicebear' ? shuffleCartoon : uploadAvatar;

  function logout() {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/access' as never);
        },
      },
    ]);
  }

  if (loading) {
    return <LoadingScreen message="Loading account..." />;
  }
  if (!user) return null;

  const hasEmailPhoto = !!avatar.emailAvatar;
  const sourceOptions = [
    { value: 'dicebear' as const, label: 'Avatar', icon: 'face.smiling' as const },
    ...(hasEmailPhoto ? [{ value: 'email' as const, label: 'Email', icon: 'envelope.fill' as const }] : []),
    { value: 'custom' as const, label: 'Upload', icon: 'square.and.arrow.up' as const },
  ];

  // Badge icon mirrors what tapping it does for the active source.
  const badgeIcon =
    avatar.choice === 'dicebear'
      ? ('arrow.triangle.2.circlepath' as const)
      : avatar.choice === 'email'
        ? ('camera.fill' as const)
        : ('square.and.arrow.up' as const);

  // "Upcoming" mirrors the Schedules tab: not cancelled/no-show and not yet
  // past its start time. (Counting by status alone wrongly counts past
  // confirmed bookings as upcoming.)
  const now = Date.now();
  const upcomingCount = bookings.filter(
    (b) => b.status !== 'cancelled' && b.status !== 'no_show' && b.status !== 'completed'
      && !!b.starts_at && new Date(b.starts_at).getTime() >= now,
  ).length;

  return (
    <ScreenContainer safeTop={false} keyboardAware>
      <ScreenHeader eyebrow="YOUR SPACE" title="Account" />

      {/* ── Identity header: avatar + name + email + quick stats ───────────── */}
      <Card style={{ alignItems: 'center', gap: Spacing.md, marginTop: Spacing.md }}>
        <Pressable
          onPress={onBadgePress}
          disabled={busy}
          accessibilityRole="button"
          accessibilityLabel={avatar.choice === 'dicebear' ? 'Shuffle cartoon avatar' : 'Change profile photo'}
        >
          <View style={{
            padding: Spacing.xs,
            borderRadius: Radius.pill,
            borderWidth: 2,
            borderColor: c.accentTint,
            backgroundColor: c.surfaceRaised,
          }}>
            <Image source={{ uri: avatar.src }} style={{ width: 96, height: 96, borderRadius: Radius.pill, backgroundColor: c.bg2 }} contentFit="cover" />
          </View>
          {/* contextual badge: shuffle for cartoon, camera/upload otherwise */}
          <View style={{
            position: 'absolute',
            right: 2,
            bottom: 2,
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: c.accent,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 2,
            borderColor: c.surface,
          }}>
            <IconSymbol name={busy ? 'arrow.triangle.2.circlepath' : badgeIcon} size={15} color={scheme === 'dark' ? '#1C1A17' : '#FFF'} />
          </View>
        </Pressable>

        <View style={{ alignItems: 'center', gap: 2 }}>
          <Text style={[Type.h2, { color: c.fg }]} numberOfLines={1}>{savedName || 'Your name'}</Text>
          {!!user.email && <Text style={[Type.caption, { color: c.fgMuted }]} numberOfLines={1}>{user.email}</Text>}
        </View>

        {/* Tiny stats strip */}
        <View style={{ flexDirection: 'row', gap: Spacing.lg }}>
          <View style={{ alignItems: 'center' }}>
            <Text style={[Type.h2, { color: c.accentText, fontSize: 20 }]}>{bookings.length}</Text>
            <Text style={[Type.caption, { color: c.fgMuted }]}>Bookings</Text>
          </View>
          <View style={{ width: 1, backgroundColor: c.hairline }} />
          <View style={{ alignItems: 'center' }}>
            <Text style={[Type.h2, { color: c.accentText, fontSize: 20 }]}>{upcomingCount}</Text>
            <Text style={[Type.caption, { color: c.fgMuted }]}>Upcoming</Text>
          </View>
        </View>
      </Card>

      {/* ── Photo: its own card with its own controls ─────────────────────── */}
      <SectionHeader number={1} eyebrow="Profile picture" title="Photo" />
      <Card style={{ gap: Spacing.sm }}>
        <SegmentedControl options={sourceOptions} value={avatar.choice} onChange={onChooseSource} />
        <Text style={[Type.caption, { color: c.fgMuted, textAlign: 'center' }]}>
          {avatar.choice === 'dicebear'
            ? 'Tap the avatar to shuffle a new cartoon.'
            : avatar.choice === 'email'
              ? 'Using your account photo.'
              : 'Tap the avatar or “Upload” to change your photo.'}
        </Text>
        {avatar.choice === 'custom' && (
          <ThemedButton
            variant="secondary"
            label={busy ? 'Uploading…' : 'Upload new photo'}
            busy={busy}
            icon="square.and.arrow.up"
            onPress={uploadAvatar}
          />
        )}
        {avatar.choice === 'dicebear' && (
          <ThemedButton
            variant="secondary"
            label="Shuffle avatar"
            icon="arrow.triangle.2.circlepath"
            onPress={shuffleCartoon}
          />
        )}
        {/* Inline photo confirmation (avatar changes save instantly). */}
        {msg && (
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: Spacing.xs,
            backgroundColor: c.accentTint,
            borderRadius: Radius.md,
            paddingVertical: Spacing.sm,
            paddingHorizontal: Spacing.md,
          }}>
            <IconSymbol name="checkmark" size={16} color={c.accentText} />
            <Text style={[Type.label, { color: c.accentText, fontFamily: 'Poppins_600SemiBold' }]}>{msg}</Text>
          </View>
        )}
      </Card>

      {/* ── Details: name / email (read-only) / mobile, save when edited ──── */}
      <SectionHeader number={2} eyebrow="Your details" title="Profile" />
      <Card flatOnMobile style={{ padding: Spacing.lg, gap: Spacing.xs }}>
        <ThemedTextInput label="Name" value={name} onChangeText={setName} icon="person.fill" autoCapitalize="words" />
        <ThemedTextInput
          label="Email"
          value={user.email ?? ''}
          editable={false}
          icon="envelope.fill"
          style={{ opacity: 0.6 }}
        />
        <ThemedTextInput label="Mobile" value={phone} onChangeText={setPhone} icon="phone.fill" keyboardType="phone-pad" />

        {/* Save row appears only when there are unsaved edits. */}
        {detailsDirty && (
          <View style={{ flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.xs }}>
            <ThemedButton variant="secondary" label="Cancel" onPress={resetDetails} style={{ flex: 1 }} />
            <ThemedButton label="Save changes" busy={saving} onPress={saveProfile} style={{ flex: 1.6 }} />
          </View>
        )}
      </Card>

      {/* ── Appearance ────────────────────────────────────────────────────── */}
      <SectionHeader number={3} eyebrow="Preferences" title="Appearance" />
      <Card>
        <SegmentedControl
          options={[
            { value: 'light', label: 'Light', emoji: '☀️' },
            { value: 'system', label: 'System', emoji: '⚙️' },
            { value: 'dark', label: 'Dark', emoji: '🌙' },
          ] as const}
          value={pref}
          onChange={setPref}
        />
        <Text style={[Type.caption, { color: c.fgMuted, marginTop: Spacing.sm }]}>
          {pref === 'system' ? `Following your device — currently ${scheme}.` : `Always ${pref}.`}
        </Text>
      </Card>

      {/* ── Account actions ───────────────────────────────────────────────── */}
      {/* Booking history lives on the Schedules tab — link there instead of
          duplicating the list here. */}
      <ThemedButton
        variant="secondary"
        label="View my bookings"
        icon="calendar"
        onPress={() => router.push('/(tabs)/schedules' as never)}
        style={{ marginTop: Spacing.xl }}
      />
      <ThemedButton
        variant="destructive"
        label="Sign out"
        icon="lock.fill"
        onPress={logout}
        style={{ marginTop: Spacing.sm }}
      />

      {/* Tail spacer: clears the floating chat button (56px tall) so it never
          overlaps Sign out when scrolled to the bottom, without leaving a big gap. */}
      <View style={{ height: 72 }} />
    </ScreenContainer>
  );
}
