import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { useSession } from '@/context/session';
import { updateOwnProfile } from '@/lib/api/profile';
import { AdminIconBadge, AdminSectionLabel } from '@/components/admin/admin-ui';
import { Card } from '@/components/ui/card';
import { IconSymbol, type IconSymbolName } from '@/components/ui/icon-symbol';
import { ScreenContainer } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { ThemedButton } from '@/components/ui/button';
import { ThemedTextInput } from '@/components/ui/text-input';
import { PressableScale } from '@/components/ui/pressable-scale';
import { useTheme } from '@/hooks/use-theme';
import { useThemePreference } from '@/context/theme';

type MenuItem = {
  icon: IconSymbolName;
  title: string;
  caption: string;
  route: string;
  tone: 'accent' | 'neutral' | 'danger' | 'muted';
};

const SALON_ITEMS: MenuItem[] = [
  { icon: 'tag.fill', title: 'Services', caption: 'Prices, categories, and duration', route: '/(admin)/more/services', tone: 'accent' },
  { icon: 'star.fill', title: 'Customer Reviews', caption: 'Browse & moderate stylist feedback', route: '/(admin)/more/reviews', tone: 'accent' },
  { icon: 'photo.fill', title: 'Gallery & Lookbook', caption: 'Configure salon portfolio photos', route: '/(admin)/more/gallery', tone: 'neutral' },
];


const STAFF_ITEMS: MenuItem[] = [
  { icon: 'person.fill', title: 'Stylists & Chairs', caption: 'Team members, roles, and skills', route: '/(admin)/more/stylists', tone: 'accent' },
  { icon: 'calendar', title: 'Blocked Slots', caption: 'Hold chairs, breaks, and vacations', route: '/(admin)/more/blocked-slots', tone: 'danger' },
  { icon: 'person.2.fill', title: 'People & Permissions', caption: 'User accounts and app roles', route: '/(admin)/more/people', tone: 'neutral' },
];

export default function MoreIndex() {
  const { c, Spacing, Type, Radius, scheme } = useTheme();
  const { pref, setPref } = useThemePreference();
  const { user, signOut } = useSession();
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

  const adminName = name.trim() || user?.email || 'Administrator';
  const initials = adminName.charAt(0).toUpperCase();

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

  async function handleLogout() {
    await signOut();
    router.replace('/access' as never);
  }

  const renderGroup = (title: string, items: MenuItem[]) => (
    <View style={{ marginTop: Spacing.md }}>
      <AdminSectionLabel>{title}</AdminSectionLabel>
      <View style={{ gap: Spacing.sm }}>
        {items.map((item) => (
          <PressableScale
            key={item.route}
            accessibilityRole="button"
            onPress={() => router.push(item.route as never)}
          >
            <Card style={{ padding: 0, overflow: 'hidden' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.md }}>
                <AdminIconBadge icon={item.icon} tone={item.tone} size={42} />
                <View style={{ flex: 1 }}>
                  <Text style={[Type.label, { color: c.fg, fontSize: 15, fontFamily: 'Poppins_600SemiBold' }]}>{item.title}</Text>
                  <Text style={[Type.caption, { color: c.fgMuted, marginTop: 2 }]}>{item.caption}</Text>
                </View>
                <IconSymbol name="chevron.right" size={18} color={c.fgMuted} />
              </View>
            </Card>
          </PressableScale>
        ))}
      </View>
    </View>
  );

  return (
    <ScreenContainer safeTop={false}>
      <ScreenHeader eyebrow="MANAGE" title="Salon Operations" />

      <AdminSectionLabel>Account</AdminSectionLabel>
      <Card style={{ marginBottom: Spacing.md, padding: 0, overflow: 'hidden', borderLeftWidth: 4, borderLeftColor: c.accent }}>
        <View style={{ padding: Spacing.md, gap: Spacing.md }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
            <View style={{ width: 48, height: 48, borderRadius: Radius.pill, backgroundColor: c.accentTint, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: c.accent }}>
              <Text style={[Type.h2, { color: c.accentText, fontSize: 20, fontFamily: 'Poppins_700Bold' }]}>
                {initials}
              </Text>
            </View>
            <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
              <Text style={[Type.label, { color: c.fg, fontSize: 16, fontFamily: 'Poppins_600SemiBold' }]} numberOfLines={1}>
                {adminName}
              </Text>
              <Text style={[Type.caption, { color: c.fgMuted }]} numberOfLines={1}>
                {user?.email ?? '-'}
              </Text>
              <Text style={[Type.caption, { color: c.fgMuted }]}>Salon Owner / Administrator</Text>
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

      <View style={{ paddingBottom: 100 }}>
        {renderGroup('Salon & Services', SALON_ITEMS)}
        {renderGroup('Staff & Schedule', STAFF_ITEMS)}

        <View style={{ marginTop: Spacing.md }}>
          <AdminSectionLabel>Preferences</AdminSectionLabel>
          <Card style={{ gap: Spacing.sm }}>
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
        </View>

        <View style={{ marginTop: Spacing.xl }}>
          <ThemedButton
            variant="destructive"
            label="Sign out"
            icon="xmark"
            onPress={handleLogout}
          />
        </View>
      </View>
    </ScreenContainer>
  );
}
