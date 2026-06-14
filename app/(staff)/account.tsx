import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { getStylists } from '@/lib/api/queries';
import { updateOwnProfile } from '@/lib/api/profile';
import { useSession } from '@/context/session';
import { Card } from '@/components/ui/card';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { PressableScale } from '@/components/ui/pressable-scale';
import { ScreenContainer } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { ThemedButton } from '@/components/ui/button';
import { ThemedTextInput } from '@/components/ui/text-input';
import { StaffIconBadge, StaffSectionLabel } from '@/components/staff/staff-ui';
import { useTheme } from '@/hooks/use-theme';
import { useThemePreference } from '@/context/theme';

type Stylist = { id: string; name: string };

export default function StaffAccount() {
  const { c, Type, Spacing, Radius, scheme } = useTheme();
  const { pref, setPref } = useThemePreference();
  const { user, profile, signOut } = useSession();
  const [stylistName, setStylistName] = useState<string>('-');
  const metadataName = (user?.user_metadata?.full_name as string | undefined) ?? '';
  const metadataPhone = (user?.user_metadata?.phone as string | undefined) ?? '';

  const [editingProfile, setEditingProfile] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<string | null>(null);

  useEffect(() => {
    setName(metadataName || user?.email || '');
    setPhone(metadataPhone);
    setProfileMsg(null);
  }, [metadataName, metadataPhone, user?.email]);

  const fullName = name.trim() || user?.email || 'Staff member';
  const firstName = fullName.split(' ')[0] || 'Staff';
  const initials = fullName.charAt(0).toUpperCase();

  useEffect(() => {
    if (!profile?.stylistId) return;
    getStylists().then((stylists) => {
      const match = (stylists as Stylist[]).find((s) => s.id === profile.stylistId);
      setStylistName(match?.name ?? '-');
    });
  }, [profile?.stylistId]);

  async function logout() {
    await signOut();
    router.replace('/access' as never);
  }

  async function handleSaveProfile() {
    if (!user) return;
    setSavingProfile(true);
    const res = await updateOwnProfile({
      userId: user.id,
      fullName: name,
      email: user.email ?? null,
      phone,
    });
    setSavingProfile(false);
    if ('error' in res) {
      setProfileMsg(res.error);
      return;
    }
    setProfileMsg('Profile saved');
    setEditingProfile(false);
  }

  return (
    <ScreenContainer safeTop={false}>
      <ScreenHeader eyebrow="Staff" title={firstName} subtitle="Account and preferences." />

      <StaffSectionLabel>Profile</StaffSectionLabel>
      <Card style={{ marginBottom: Spacing.lg, padding: 0, overflow: 'hidden', borderLeftWidth: 4, borderLeftColor: c.accent }}>
        <View style={{ padding: Spacing.md, gap: Spacing.md }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
            <View style={{ width: 48, height: 48, borderRadius: Radius.pill, backgroundColor: c.accentTint, borderWidth: 1, borderColor: c.accent, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={[Type.h2, { color: c.accentText, fontFamily: 'Poppins_700Bold' }]}>{initials}</Text>
            </View>
            <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
              <Text style={[Type.label, { color: c.fg, fontSize: 16, fontFamily: 'Poppins_600SemiBold' }]} numberOfLines={1}>
                {fullName}
              </Text>
              <Text style={[Type.caption, { color: c.fgMuted }]} numberOfLines={1}>
                {user?.email ?? '-'}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: Spacing.xs }}>
                <StaffIconBadge icon="person.fill" tone="accent" size={28} />
                <Text style={[Type.caption, { color: c.fg2, flex: 1 }]} numberOfLines={1}>
                  Chair assignment: {stylistName}
                </Text>
              </View>
            </View>
            <PressableScale
              accessibilityRole="button"
              onPress={() => {
                setEditingProfile((value) => !value);
                setProfileMsg(null);
              }}
              style={{ padding: Spacing.xs }}
            >
              <IconSymbol name={editingProfile ? 'xmark' : 'slider.horizontal.3'} size={21} color={c.accentText} />
            </PressableScale>
          </View>

          {editingProfile && (
            <View style={{ borderTopWidth: 1, borderTopColor: c.hairline, paddingTop: Spacing.md, gap: Spacing.xs }}>
              <ThemedTextInput label="Display Name" value={name} onChangeText={setName} style={{ marginBottom: Spacing.xs }} />
              <ThemedTextInput label="Mobile Number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" style={{ marginBottom: Spacing.xs }} />
              <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
                <ThemedButton
                  label="Save Profile"
                  icon="checkmark"
                  busy={savingProfile}
                  onPress={handleSaveProfile}
                  style={{ flex: 1, minHeight: 46 }}
                />
                <ThemedButton
                  label="Cancel"
                  variant="secondary"
                  onPress={() => {
                    setName(metadataName || user?.email || '');
                    setPhone(metadataPhone);
                    setEditingProfile(false);
                    setProfileMsg(null);
                  }}
                  style={{ flex: 1, minHeight: 46 }}
                />
              </View>
            </View>
          )}

          {!!profileMsg && (
            <Text style={[Type.caption, { color: profileMsg === 'Profile saved' ? c.accentText : c.error, fontFamily: 'Poppins_600SemiBold' }]}>
              {profileMsg}
            </Text>
          )}
        </View>
      </Card>

      <StaffSectionLabel>Preferences</StaffSectionLabel>
      <Card style={{ marginBottom: Spacing.lg, gap: Spacing.sm }}>
        <Text style={[Type.label, { color: c.fg, fontFamily: 'Poppins_600SemiBold' }]}>Appearance</Text>
        <SegmentedControl
          options={[
            { value: 'light', label: 'Light', icon: 'sun.max.fill' },
            { value: 'system', label: 'System', icon: 'gearshape.fill' },
            { value: 'dark', label: 'Dark', icon: 'moon.fill' },
          ] as const}
          value={pref}
          onChange={setPref}
        />
        <Text style={[Type.caption, { color: c.fgMuted }]}>
          {pref === 'system'
            ? `Following your device - currently ${scheme}.`
            : `Always ${pref}.`}
        </Text>
      </Card>

      <ThemedButton
        variant="destructive"
        label="Sign out"
        icon="xmark"
        onPress={logout}
        style={{ marginBottom: Spacing.md }}
      />
    </ScreenContainer>
  );
}
