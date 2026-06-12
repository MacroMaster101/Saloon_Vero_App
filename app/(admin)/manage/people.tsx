import { useCallback, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { getAllProfiles, getStylistsAdmin, setProfileRole } from '@/lib/api/admin';
import { canEditProfile } from '@/lib/admin/helpers';
import { useSession } from '@/context/session';
import { Card } from '@/components/ui/card';
import { LoadingScreen } from '@/components/ui/loading';
import { ScreenContainer } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { BackButton } from '@/components/ui/back-button';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { ThemedButton } from '@/components/ui/button';
import { useTheme } from '@/hooks/use-theme';
import type { Profile, Stylist } from '@/types/database';

// ─── PersonRoleEditor (named export for tests) ───────────────────────────────

type PersonRoleEditorProps = {
  person: Pick<Profile, 'id' | 'full_name' | 'email' | 'role' | 'stylist_id'>;
  selfId: string;
  stylists: Stylist[];
  onSave: (id: string, role: Profile['role'], stylistId: string | null) => void;
};

export function PersonRoleEditor({ person, selfId, stylists, onSave }: PersonRoleEditorProps) {
  const { c, Spacing, Type, Radius } = useTheme();

  const [role, setRole] = useState<Profile['role']>(person.role);
  const [stylistId, setStylistId] = useState<string | null>(person.stylist_id);

  if (!canEditProfile(person.id, selfId)) {
    return (
      <Card style={{ marginTop: Spacing.sm }}>
        <Text style={[Type.caption, { color: c.fgMuted }]}>{"You can't change your own role."}</Text>
      </Card>
    );
  }

  const activeStylists = stylists.filter((s) => s.is_active);

  return (
    <Card style={{ marginTop: Spacing.sm, gap: Spacing.sm }}>
      <SegmentedControl
        options={[
          { value: 'user' as const, label: 'User' },
          { value: 'staff' as const, label: 'Staff' },
          { value: 'admin' as const, label: 'Admin' },
        ]}
        value={role}
        onChange={(v) => {
          setRole(v);
          if (v !== 'staff') setStylistId(null);
        }}
      />

      {role === 'staff' && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs }}>
          {([{ id: null, name: 'None' }, ...activeStylists] as { id: string | null; name: string }[]).map(
            (s) => {
              const selected = stylistId === s.id;
              return (
                <Pressable
                  key={s.id ?? '__none__'}
                  onPress={() => setStylistId(s.id)}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  style={{
                    backgroundColor: selected ? c.accentDark : c.surfaceRaised,
                    borderWidth: 1,
                    borderColor: selected ? c.accentDark : c.hairline,
                    borderRadius: Radius.pill,
                    paddingHorizontal: Spacing.md,
                    paddingVertical: Spacing.xs + 2,
                  }}
                >
                  <Text style={[Type.caption, { color: selected ? c.bg : c.fg2 }]}>{s.name}</Text>
                </Pressable>
              );
            },
          )}
        </View>
      )}

      <ThemedButton
        label="Save"
        onPress={() => onSave(person.id, role, role === 'staff' ? stylistId : null)}
      />
    </Card>
  );
}

// ─── Role pill helper ─────────────────────────────────────────────────────────

function RolePill({ role }: { role: Profile['role'] }) {
  const { c, Spacing, Type, Radius } = useTheme();

  if (role === 'admin') {
    return (
      <View
        style={{
          backgroundColor: c.accentTint,
          borderRadius: Radius.pill,
          paddingHorizontal: Spacing.sm,
          paddingVertical: 2,
        }}
      >
        <Text style={[Type.caption, { color: c.accentText }]}>{role}</Text>
      </View>
    );
  }

  if (role === 'staff') {
    return (
      <View
        style={{
          borderWidth: 1,
          borderColor: c.hairline,
          borderRadius: Radius.pill,
          paddingHorizontal: Spacing.sm,
          paddingVertical: 2,
        }}
      >
        <Text style={[Type.caption, { color: c.fg2 }]}>{role}</Text>
      </View>
    );
  }

  // user
  return <Text style={[Type.caption, { color: c.fgMuted }]}>{role}</Text>;
}

// ─── Default screen ───────────────────────────────────────────────────────────

export default function People() {
  const { c, Spacing, Type } = useTheme();
  const { user } = useSession();

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [stylists, setStylists] = useState<Stylist[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  if (loading) return <LoadingScreen message="Loading people..." />;

  return (
    <ScreenContainer>
      <ScreenHeader eyebrow="MANAGE" title="People" left={<BackButton />} />

      {!!error && (
        <Text style={[Type.caption, { color: c.error, marginBottom: Spacing.sm }]}>{error}</Text>
      )}

      <View style={{ gap: Spacing.sm }}>
        {profiles.map((person) => (
          <View key={person.id}>
            <Pressable
              accessibilityRole="button"
              onPress={() => setSelectedId((prev) => (prev === person.id ? null : person.id))}
            >
              <Card>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={[Type.label, { color: c.fg, fontSize: 15 }]}>
                      {person.full_name ?? person.email ?? 'Unnamed'}
                    </Text>
                    {!!person.email && (
                      <Text style={[Type.caption, { color: c.fgMuted, marginTop: 2 }]}>{person.email}</Text>
                    )}
                  </View>
                  <RolePill role={person.role} />
                </View>
              </Card>
            </Pressable>

            {selectedId === person.id && (
              <View>
                <PersonRoleEditor
                  person={person}
                  selfId={selfId}
                  stylists={stylists}
                  onSave={handleSave}
                />
                <Pressable
                  onPress={() => setSelectedId(null)}
                  style={{ marginTop: Spacing.xs, alignItems: 'center' }}
                >
                  <Text style={[Type.caption, { color: c.accentText }]}>Close</Text>
                </Pressable>
              </View>
            )}
          </View>
        ))}
      </View>
    </ScreenContainer>
  );
}
