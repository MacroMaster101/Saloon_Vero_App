import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { useSession } from '@/context/session';
import { AdminSectionLabel } from '@/components/admin/admin-ui';
import { Card } from '@/components/ui/card';
import { ScreenContainer } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { SectionHeader } from '@/components/ui/section-header';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { ThemedButton } from '@/components/ui/button';
import { BackButton } from '@/components/ui/back-button';
import { useTheme } from '@/hooks/use-theme';
import { useThemePreference } from '@/context/theme';

export default function AdminAccount() {
  const { c, Type, Spacing, scheme } = useTheme();
  const { pref, setPref } = useThemePreference();
  const { user, signOut } = useSession();

  const adminName = (
    (user?.user_metadata?.full_name as string | undefined) ??
    user?.email ??
    'Administrator'
  );
  const initials = adminName.charAt(0).toUpperCase();

  async function logout() {
    await signOut();
    router.replace('/access' as never);
  }

  return (
    <ScreenContainer safeTop={false}>
      <ScreenHeader eyebrow="SETTINGS" title="Account" left={<BackButton />} />

      <Card style={{ marginBottom: Spacing.lg, padding: 0, overflow: 'hidden', borderLeftWidth: 4, borderLeftColor: c.accent }}>
        <View style={{ padding: Spacing.md, flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
          <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: c.accentTint, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: c.accent }}>
            <Text style={{ fontSize: 18, fontFamily: 'Poppins_700Bold', color: c.accentText }}>{initials}</Text>
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={[Type.label, { color: c.fg, fontSize: 16, fontFamily: 'Poppins_600SemiBold' }]}>
              {adminName}
            </Text>
            <Text style={[Type.caption, { color: c.fgMuted, fontFamily: 'Poppins_500Medium' }]}>
              {user?.email ?? '-'}
            </Text>
            <Text style={[Type.caption, { color: c.fgMuted, fontSize: 11, fontFamily: 'Poppins_400Regular' }]}>
              Salon Owner / Administrator
            </Text>
          </View>
        </View>
      </Card>

      <SectionHeader eyebrow="Preferences" title="Appearance" />
      <Card style={{ marginBottom: Spacing.lg }}>
        <AdminSectionLabel>Theme Mode</AdminSectionLabel>
        <SegmentedControl
          options={[
            { value: 'light', label: 'Light', icon: 'sun.max.fill' },
            { value: 'system', label: 'System', icon: 'gearshape.fill' },
            { value: 'dark', label: 'Dark', icon: 'moon.fill' },
          ] as const}
          value={pref}
          onChange={setPref}
        />
        <Text style={[Type.caption, { color: c.fgMuted, marginTop: Spacing.sm, fontFamily: 'Poppins_500Medium' }]}>
          {pref === 'system'
            ? `Following your device - currently ${scheme}.`
            : `Always ${pref}.`}
        </Text>
      </Card>

      <ThemedButton
        variant="destructive"
        label="Sign out"
        onPress={logout}
        style={{ marginTop: Spacing.lg, marginBottom: Spacing.md }}
      />
    </ScreenContainer>
  );
}
