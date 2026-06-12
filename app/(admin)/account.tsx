import { Text } from 'react-native';
import { router } from 'expo-router';
import { useSession } from '@/context/session';
import { Card } from '@/components/ui/card';
import { ScreenContainer } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { SectionHeader } from '@/components/ui/section-header';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { ThemedButton } from '@/components/ui/button';
import { useTheme } from '@/hooks/use-theme';
import { useThemePreference } from '@/context/theme';

export default function AdminAccount() {
  const { c, Type, Spacing, scheme } = useTheme();
  const { pref, setPref } = useThemePreference();
  const { user, signOut } = useSession();

  const firstName = (
    (user?.user_metadata?.full_name as string | undefined) ??
    user?.email ??
    'there'
  ).split(' ')[0];

  async function logout() {
    await signOut();
    router.replace('/access' as never);
  }

  return (
    <ScreenContainer>
      <ScreenHeader eyebrow="ADMIN" title={firstName} />

      {/* Identity card */}
      <Card style={{ marginBottom: Spacing.md, gap: Spacing.xs }}>
        <Text style={[Type.label, { color: c.fg, fontSize: 16, fontFamily: 'Poppins_600SemiBold' }]}>
          {(user?.user_metadata?.full_name as string | undefined) ?? user?.email ?? '—'}
        </Text>
        <Text style={[Type.caption, { color: c.fgMuted, marginTop: 2 }]}>
          {user?.email ?? '—'}
        </Text>
        <Text style={[Type.caption, { color: c.fgMuted, marginTop: 2 }]}>
          Salon administrator
        </Text>
      </Card>

      <SectionHeader number={1} eyebrow="Preferences" title="Appearance" />
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
          {pref === 'system'
            ? `Following your device — currently ${scheme}.`
            : `Always ${pref}.`}
        </Text>
      </Card>

      <ThemedButton
        variant="destructive"
        label="Sign out"
        onPress={logout}
        style={{ marginTop: Spacing.xl, marginBottom: Spacing.md }}
      />
    </ScreenContainer>
  );
}
