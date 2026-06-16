import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { useSession } from '@/context/session';
import { updateOwnProfile } from '@/lib/api/profile';
import { AdminSectionLabel } from '@/components/admin/admin-ui';
import { Card } from '@/components/ui/card';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { PressableScale } from '@/components/ui/pressable-scale';
import { ScreenContainer } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { ThemedButton } from '@/components/ui/button';
import { ThemedTextInput } from '@/components/ui/text-input';
import { BackButton } from '@/components/ui/back-button';
import { useTheme } from '@/hooks/use-theme';
import { changePassword, userHasPassword } from '@/lib/auth/change-password';
import { validatePassword } from '@/lib/auth/signup-validation';

export default function AdminAccount() {
  const { c, Type, Spacing, Radius } = useTheme();
  const { user, signOut } = useSession();

  const metadataName = (user?.user_metadata?.full_name as string | undefined) ?? '';
  const metadataPhone = (user?.user_metadata?.phone as string | undefined) ?? '';

  // ── Profile (name / phone) ───────────────────────────────────────────
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [savedName, setSavedName] = useState('');
  const [savedPhone, setSavedPhone] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<string | null>(null);

  useEffect(() => {
    const n = metadataName || user?.email || '';
    setName(n); setSavedName(n);
    setPhone(metadataPhone); setSavedPhone(metadataPhone);
  }, [metadataName, metadataPhone, user?.email]);

  const adminName = name.trim() || user?.email || 'Administrator';
  const initials = adminName.charAt(0).toUpperCase();
  const profileDirty = name.trim() !== savedName.trim() || phone.trim() !== savedPhone.trim();

  // Auto-dismiss the profile confirmation so it reads like a toast.
  useEffect(() => {
    if (!profileMsg) return;
    const t = setTimeout(() => setProfileMsg(null), 2500);
    return () => clearTimeout(t);
  }, [profileMsg]);

  // ── Password ─────────────────────────────────────────────────────────
  const [pwOpen, setPwOpen] = useState(false);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwBusy, setPwBusy] = useState(false);
  const [pwDone, setPwDone] = useState(false);
  const hasPassword = userHasPassword(user);

  async function saveProfile() {
    if (!user || savingProfile || !profileDirty) return;
    setSavingProfile(true);
    const res = await updateOwnProfile({
      userId: user.id,
      fullName: name,
      email: user.email ?? null,
      phone,
    });
    setSavingProfile(false);
    if ('error' in res) { setProfileMsg(res.error); return; }
    setSavedName(name); setSavedPhone(phone);
    setProfileMsg('Profile saved');
  }

  async function submitPassword() {
    if (pwBusy || !user?.email) return;
    setPwError(null);
    setPwDone(false);

    const pwErr = validatePassword(newPw);
    if (pwErr) return setPwError(pwErr);
    if (newPw !== confirmPw) return setPwError("Passwords don't match");
    if (hasPassword && !currentPw) return setPwError('Enter your current password');
    if (hasPassword && newPw === currentPw) {
      return setPwError('Choose a password different from your current one.');
    }

    setPwBusy(true);
    const err = await changePassword({
      email: user.email,
      currentPassword: currentPw,
      newPassword: newPw,
      verifyCurrent: hasPassword,
    });
    setPwBusy(false);
    if (err) return setPwError(err);

    setCurrentPw(''); setNewPw(''); setConfirmPw('');
    setPwDone(true);
    setPwOpen(false);
  }

  async function logout() {
    await signOut();
    router.replace('/access' as never);
  }

  return (
    <ScreenContainer safeTop={false}>
      <ScreenHeader eyebrow="SETTINGS" title="Account" left={<BackButton />} />

      <View style={{ paddingBottom: 100 }}>
        {/* ── Identity ─────────────────────────────────────────────────── */}
        <Card style={{ padding: 0, overflow: 'hidden', borderLeftWidth: 4, borderLeftColor: c.accent }}>
          <View style={{ padding: Spacing.md, flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
            <View style={{ width: 48, height: 48, borderRadius: Radius.pill, backgroundColor: c.accentTint, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: c.accent }}>
              <Text style={[Type.h2, { color: c.accentText, fontSize: 20, fontFamily: 'Poppins_700Bold' }]}>{initials}</Text>
            </View>
            <View style={{ flex: 1, minWidth: 0, gap: 1 }}>
              <Text style={[Type.label, { color: c.fg, fontSize: 16, fontFamily: 'Poppins_600SemiBold' }]} numberOfLines={1}>
                {adminName}
              </Text>
              <Text style={[Type.caption, { color: c.fgMuted }]} numberOfLines={1}>
                {user?.email ?? '-'}
              </Text>
              <Text style={[Type.caption, { color: c.fgMuted }]}>Salon Owner / Administrator</Text>
            </View>
          </View>
        </Card>

        {/* ── Profile details ──────────────────────────────────────────── */}
        <View style={{ marginTop: Spacing.lg }}>
          <AdminSectionLabel>Profile</AdminSectionLabel>
          <Card style={{ gap: Spacing.xs }}>
            <ThemedTextInput label="Display name" value={name} onChangeText={setName} icon="person.fill" autoCapitalize="words" />
            <ThemedTextInput label="Email" value={user?.email ?? ''} editable={false} icon="envelope.fill" style={{ opacity: 0.6 }} />
            <ThemedTextInput label="Mobile number" value={phone} onChangeText={setPhone} icon="phone.fill" keyboardType="phone-pad" />
            {profileDirty && (
              <View style={{ flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.xs }}>
                <ThemedButton
                  variant="secondary"
                  label="Cancel"
                  onPress={() => { setName(savedName); setPhone(savedPhone); }}
                  style={{ flex: 1, minHeight: 46 }}
                />
                <ThemedButton
                  label="Save changes"
                  icon="checkmark"
                  busy={savingProfile}
                  onPress={saveProfile}
                  style={{ flex: 1.4, minHeight: 46 }}
                />
              </View>
            )}
            {!!profileMsg && (
              <Text style={[Type.caption, { color: profileMsg === 'Profile saved' ? c.accentText : c.error, fontFamily: 'Poppins_600SemiBold', marginTop: Spacing.xs }]}>
                {profileMsg}
              </Text>
            )}
          </Card>
        </View>

        {/* ── Security (collapsible password) ───────────────────────────── */}
        <View style={{ marginTop: Spacing.lg }}>
          <AdminSectionLabel>Security</AdminSectionLabel>
          <Card style={{ padding: 0, overflow: 'hidden' }}>
            <PressableScale
              accessibilityRole="button"
              onPress={() => { setPwOpen((v) => !v); setPwError(null); setPwDone(false); }}
              style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.md }}
            >
              <IconSymbol name="lock.fill" size={18} color={c.fgMuted} />
              <Text style={[Type.label, { flex: 1, color: c.fg, fontSize: 15, fontFamily: 'Poppins_600SemiBold' }]}>
                {hasPassword ? 'Change password' : 'Set a password'}
              </Text>
              {pwDone && !pwOpen && (
                <Text style={[Type.caption, { color: c.accentText, fontFamily: 'Poppins_600SemiBold' }]}>Saved</Text>
              )}
              <IconSymbol name={pwOpen ? 'xmark' : 'chevron.right'} size={16} color={c.fgMuted} />
            </PressableScale>
            {pwOpen && (
              <View style={{ paddingHorizontal: Spacing.md, paddingBottom: Spacing.md, gap: Spacing.xs, borderTopWidth: 1, borderTopColor: c.hairline, paddingTop: Spacing.md }}>
                {!hasPassword && (
                  <Text style={[Type.caption, { color: c.fgMuted, marginBottom: Spacing.xs }]}>
                    You signed in with Google — set one to also log in by email.
                  </Text>
                )}
                {hasPassword && (
                  <ThemedTextInput
                    icon="lock.fill"
                    label="Current password"
                    placeholder="••••••••"
                    secureToggle
                    value={currentPw}
                    onChangeText={(t) => { setCurrentPw(t); setPwError(null); }}
                  />
                )}
                <ThemedTextInput
                  icon="lock.fill"
                  label="New password"
                  placeholder="••••••••"
                  secureToggle
                  value={newPw}
                  onChangeText={(t) => { setNewPw(t); setPwError(null); }}
                />
                <ThemedTextInput
                  icon="lock.fill"
                  label="Confirm new password"
                  placeholder="••••••••"
                  secureToggle
                  value={confirmPw}
                  onChangeText={(t) => { setConfirmPw(t); setPwError(null); }}
                />
                {pwError && <Text style={[Type.caption, { color: c.error, fontFamily: 'Poppins_600SemiBold' }]}>{pwError}</Text>}
                <ThemedButton
                  label={hasPassword ? 'Update password' : 'Set password'}
                  busy={pwBusy}
                  onPress={submitPassword}
                  style={{ marginTop: Spacing.xs, minHeight: 46 }}
                />
              </View>
            )}
          </Card>
        </View>

        {/* ── Sign out ─────────────────────────────────────────────────── */}
        <ThemedButton
          variant="destructive"
          label="Sign out"
          icon="xmark"
          onPress={logout}
          style={{ marginTop: Spacing.xl }}
        />
      </View>
    </ScreenContainer>
  );
}
