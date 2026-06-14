import { useCallback, useState } from 'react';
import { Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { getAllProfiles, getStylistsAdmin, setProfileRole } from '@/lib/api/admin';
import { canEditProfile } from '@/lib/admin/helpers';
import { useSession } from '@/context/session';
import { AdminChip, AdminSectionLabel } from '@/components/admin/admin-ui';
import { Card } from '@/components/ui/card';
import { PressableScale } from '@/components/ui/pressable-scale';
import { ScreenContainer } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { BackButton } from '@/components/ui/back-button';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { SkeletonCard } from '@/components/ui/skeleton';
import { ThemedButton } from '@/components/ui/button';
import { ThemedTextInput } from '@/components/ui/text-input';
import { useTheme } from '@/hooks/use-theme';
import type { Profile, Stylist } from '@/types/database';

type PersonRoleEditorProps = {
  person: Pick<Profile, 'id' | 'full_name' | 'email' | 'role' | 'stylist_id'>;
  selfId: string;
  stylists: Stylist[];
  onSave: (id: string, role: Profile['role'], stylistId: string | null) => void;
};

export function PersonRoleEditor({ person, selfId, stylists, onSave }: PersonRoleEditorProps) {
  const { c, Spacing, Type } = useTheme();

  const [role, setRole] = useState<Profile['role']>(person.role);
  const [stylistId, setStylistId] = useState<string | null>(person.stylist_id);

  if (!canEditProfile(person.id, selfId)) {
    return (
      <Card style={{ marginTop: Spacing.sm }}>
        <Text style={[Type.caption, { color: c.fgMuted, fontFamily: 'Poppins_500Medium' }]}>{"You can't change your own role."}</Text>
      </Card>
    );
  }

  const activeStylists = stylists.filter((s) => s.is_active);

  return (
    <Card style={{ marginTop: Spacing.sm, gap: Spacing.sm, borderLeftWidth: 3, borderLeftColor: c.accent }}>
      <Text style={[Type.label, { color: c.fg, fontFamily: 'Poppins_600SemiBold', fontSize: 14 }]}>Update Access Level</Text>
      <SegmentedControl
        options={[
          { value: 'user' as const, label: 'User / Guest' },
          { value: 'staff' as const, label: 'Salon Staff' },
          { value: 'admin' as const, label: 'Administrator' },
        ]}
        value={role}
        onChange={(v) => {
          setRole(v);
          if (v !== 'staff') setStylistId(null);
        }}
      />

      {role === 'staff' && (
        <View style={{ marginTop: Spacing.xs }}>
          <Text style={[Type.label, { color: c.fgMuted, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0, marginBottom: Spacing.xs, fontFamily: 'Poppins_600SemiBold' }]}>
            Link to Stylist Profile
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs }}>
            {([{ id: null, name: 'Unlinked (None)' }, ...activeStylists] as { id: string | null; name: string }[]).map(
              (s) => {
                const selected = stylistId === s.id;
                return (
                  <AdminChip
                    key={s.id ?? '__none__'}
                    label={s.name}
                    selected={selected}
                    onPress={() => setStylistId(s.id)}
                  />
                );
              },
            )}
          </View>
        </View>
      )}

      <ThemedButton
        label="Save"
        onPress={() => onSave(person.id, role, role === 'staff' ? stylistId : null)}
        style={{ marginTop: Spacing.xs }}
      />
    </Card>
  );
}

function RolePill({ role }: { role: Profile['role'] }) {
  const { c, Spacing, Type, Radius } = useTheme();

  let bg: string = 'transparent';
  let border: string = c.hairline;
  let text: string = c.fgMuted;

  if (role === 'admin') {
    bg = c.accentTint;
    border = c.accent;
    text = c.accentText;
  } else if (role === 'staff') {
    bg = 'rgba(128, 128, 128, 0.08)';
    border = c.fgMuted;
    text = c.fg2;
  }

  return (
    <View
      style={{
        backgroundColor: bg,
        borderWidth: 1,
        borderColor: border,
        borderRadius: Radius.pill,
        paddingHorizontal: Spacing.sm + 2,
        paddingVertical: Spacing.xs / 2,
      }}
    >
      <Text style={[Type.caption, { color: text, fontSize: 10, fontFamily: 'Poppins_600SemiBold', textTransform: 'capitalize' }]}>
        {role}
      </Text>
    </View>
  );
}

export default function People() {
  const { c, Spacing, Type } = useTheme();
  const { user } = useSession();

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [stylists, setStylists] = useState<Stylist[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const selfId = user?.id ?? '';

  const load = useCallback(async () => {
    const [profileRows, stylistRows] = await Promise.all([
      getAllProfiles(),
      getStylistsAdmin(),
    ]);
    setProfiles(profileRows);
    setStylists(stylistRows);
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleSave = async (id: string, role: Profile['role'], linkedStylistId: string | null) => {
    const res = await setProfileRole(id, role, linkedStylistId);
    if ('error' in res) { setError(res.error); return; }
    setSelectedId(null);
    setError(null);
    await load();
  };

  const filteredPeople = profiles.filter((person) => {
    const name = person.full_name ?? '';
    const email = person.email ?? '';
    const query = searchQuery.toLowerCase();
    return name.toLowerCase().includes(query) || email.toLowerCase().includes(query);
  });

  return (
    <ScreenContainer safeTop={false}>
      <ScreenHeader eyebrow="MANAGE" title="People" left={<BackButton />} />

      {/* Search Input */}
      <ThemedTextInput
        placeholder="Search users by name or email"
        value={searchQuery}
        onChangeText={setSearchQuery}
        clearButtonMode="while-editing"
        style={{ marginBottom: Spacing.md }}
      />

      {!!error && (
        <Text style={[Type.caption, { color: c.error, marginBottom: Spacing.sm, fontFamily: 'Poppins_600SemiBold' }]}>{error}</Text>
      )}

      <AdminSectionLabel>Registered Profiles</AdminSectionLabel>
      <View style={{ gap: Spacing.sm }}>
          {loading ? (
            <SkeletonCard count={4} />
          ) : filteredPeople.length === 0 ? (
            <Text style={[Type.body, { color: c.fgMuted, textAlign: 'center', marginTop: Spacing.lg, fontFamily: 'Poppins_500Medium' }]}>No accounts found.</Text>
          ) : filteredPeople.map((person) => {
            const displayName = person.full_name ?? person.email ?? 'Unnamed';
            const initials = displayName.charAt(0).toUpperCase();

            let rowLeftColor: string = c.hairline;
            if (person.role === 'admin') rowLeftColor = c.accent;
            else if (person.role === 'staff') rowLeftColor = c.fgMuted;

            return (
              <View key={person.id}>
                <PressableScale
                  accessibilityRole="button"
                  onPress={() => setSelectedId((prev) => (prev === person.id ? null : person.id))}
                >
                  <Card style={{ padding: 0, overflow: 'hidden', borderLeftWidth: 4, borderLeftColor: rowLeftColor }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: Spacing.md, padding: Spacing.md }}>
                      <LinearGradient
                        colors={person.role === 'admin' ? [c.accent, c.accentDark] : ['#8A857C', '#57534C']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' }}
                      >
                        <Text style={{ fontSize: 15, fontFamily: 'Poppins_700Bold', color: '#FFFFFF' }}>{initials}</Text>
                      </LinearGradient>

                      <View style={{ flex: 1, gap: 2 }}>
                        <Text style={[Type.label, { color: c.fg, fontSize: 15, fontFamily: 'Poppins_600SemiBold' }]}>
                          {person.full_name ?? 'Unnamed Guest'}
                        </Text>
                        {!!person.email && (
                          <Text style={[Type.caption, { color: c.fgMuted, fontFamily: 'Poppins_500Medium' }]} numberOfLines={1}>{person.email}</Text>
                        )}
                      </View>
                      <RolePill role={person.role} />
                    </View>
                  </Card>
                </PressableScale>

                {selectedId === person.id && (
                  <View style={{ marginBottom: Spacing.xs }}>
                    <PersonRoleEditor
                      person={person}
                      selfId={selfId}
                      stylists={stylists}
                      onSave={handleSave}
                    />
                    <PressableScale
                      onPress={() => setSelectedId(null)}
                      style={{ marginTop: Spacing.xs, alignItems: 'center', paddingVertical: Spacing.xs }}
                    >
                      <Text style={[Type.caption, { color: c.accentText, fontFamily: 'Poppins_600SemiBold' }]}>Close editor</Text>
                    </PressableScale>
                  </View>
                )}
              </View>
            );
          })}
        </View>
    </ScreenContainer>
  );
}
