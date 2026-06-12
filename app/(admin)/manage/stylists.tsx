import { useCallback, useState } from 'react';
import { Pressable, Switch, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { BackButton } from '@/components/ui/back-button';
import { getStylistsAdmin, upsertStylist } from '@/lib/api/admin';
import { slugify } from '@/lib/admin/helpers';
import { Card } from '@/components/ui/card';
import { LoadingScreen } from '@/components/ui/loading';
import { ScreenContainer } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { ThemedButton } from '@/components/ui/button';
import { ThemedTextInput } from '@/components/ui/text-input';
import { useTheme } from '@/hooks/use-theme';
import type { Stylist } from '@/types/database';

export default function Stylists() {
  const { c, Spacing, Type, Radius } = useTheme();

  const [stylists, setStylists] = useState<Stylist[]>([]);
  const [editing, setEditing] = useState<Stylist | 'new' | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [tagsText, setTagsText] = useState('');
  const [isActive, setIsActive] = useState(true);

  const load = useCallback(async () => {
    const rows = await getStylistsAdmin();
    setStylists(rows);
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const resetForm = () => {
    setName(''); setRole(''); setTagsText(''); setIsActive(true); setError(null);
  };

  const seedForm = (s: Stylist) => {
    setName(s.name); setRole(s.role); setTagsText(s.tags.join(', '));
    setIsActive(s.is_active); setError(null);
  };

  const handleSave = async () => {
    if (!name.trim()) { setError('Name is required.'); return; }

    const tags = tagsText.split(',').map((t) => t.trim()).filter(Boolean);
    const row = {
      ...(editing !== 'new'
        ? { id: (editing as Stylist).id, slug: (editing as Stylist).slug }
        : { slug: slugify(name) }),
      name: name.trim(),
      role,
      tags,
      is_active: isActive,
    };

    setSaving(true);
    const res = await upsertStylist(row);
    setSaving(false);
    if ('error' in res) { setError(res.error); return; }
    await load();
    setEditing(null);
  };

  if (loading) return <LoadingScreen message="Loading stylists..." />;

  // Edit mode
  if (editing !== null) {
    return (
      <ScreenContainer>
        <ScreenHeader eyebrow="MANAGE" title={editing === 'new' ? 'New stylist' : 'Edit stylist'} left={<BackButton onPress={() => setEditing(null)} />} />

        <Card style={{ gap: Spacing.xs }}>
          <ThemedTextInput label="Name" value={name} onChangeText={setName} />
          <ThemedTextInput label="Role" value={role} onChangeText={setRole} />
          <ThemedTextInput
            label="Tags (comma-separated)"
            value={tagsText}
            onChangeText={setTagsText}
          />

          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: Spacing.sm,
            }}
          >
            <Text style={[Type.label, { color: c.fg }]}>Active</Text>
            <Switch
              value={isActive}
              onValueChange={setIsActive}
              trackColor={{ true: c.accent, false: c.line }}
            />
          </View>

          {!!error && (
            <Text style={[Type.caption, { color: c.error, marginTop: Spacing.sm }]}>{error}</Text>
          )}

          <ThemedButton
            label="Save"
            onPress={handleSave}
            busy={saving}
            style={{ marginTop: Spacing.md }}
          />
        </Card>
      </ScreenContainer>
    );
  }

  // List mode
  return (
    <ScreenContainer>
      <ScreenHeader eyebrow="MANAGE" title="Stylists" left={<BackButton />} />

      <ThemedButton
        label="+ New stylist"
        onPress={() => { resetForm(); setEditing('new'); }}
        style={{ marginBottom: Spacing.md }}
      />

      <View style={{ gap: Spacing.sm }}>
        {stylists.map((stylist) => (
          <Pressable
            key={stylist.id}
            accessibilityRole="button"
            onPress={() => { seedForm(stylist); setEditing(stylist); }}
          >
            <Card>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View style={{ flex: 1 }}>
                  <Text style={[Type.label, { color: c.fg, fontSize: 16 }]}>{stylist.name}</Text>
                  {!!stylist.role && (
                    <Text style={[Type.caption, { color: c.fgMuted, marginTop: 2 }]}>{stylist.role}</Text>
                  )}
                  {!stylist.is_active && (
                    <View
                      style={{
                        alignSelf: 'flex-start',
                        borderWidth: 1,
                        borderColor: c.hairline,
                        borderRadius: Radius.pill,
                        paddingHorizontal: Spacing.sm,
                        paddingVertical: 2,
                        marginTop: Spacing.xs,
                      }}
                    >
                      <Text style={[Type.caption, { color: c.fgMuted }]}>inactive</Text>
                    </View>
                  )}
                </View>
                <Text style={[Type.h2, { color: c.fgMuted }]}>›</Text>
              </View>
            </Card>
          </Pressable>
        ))}
      </View>
    </ScreenContainer>
  );
}
