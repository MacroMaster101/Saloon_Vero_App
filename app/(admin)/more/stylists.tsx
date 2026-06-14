import { useCallback, useState } from 'react';
import { Alert, Switch, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BackButton } from '@/components/ui/back-button';
import { AdminSectionLabel } from '@/components/admin/admin-ui';
import { getStylistsAdmin, upsertStylist, deleteStylist } from '@/lib/api/admin';
import { slugify } from '@/lib/admin/helpers';
import { Card } from '@/components/ui/card';
import { PressableScale } from '@/components/ui/pressable-scale';
import { ScreenContainer } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { SkeletonCard } from '@/components/ui/skeleton';
import { ThemedButton } from '@/components/ui/button';
import { ThemedTextInput } from '@/components/ui/text-input';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useTheme } from '@/hooks/use-theme';
import type { Stylist } from '@/types/database';

export default function Stylists() {
  const { c, Spacing, Type, Radius } = useTheme();

  const [stylists, setStylists] = useState<Stylist[]>([]);
  const [editing, setEditing] = useState<Stylist | 'new' | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search
  const [searchQuery, setSearchQuery] = useState('');

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

  const handleDelete = async () => {
    if (editing === 'new' || !editing) return;
    const stylistId = editing.id;
    const stylistName = editing.name;

    Alert.alert(
      'Delete stylist permanently?',
      `Delete team member "${stylistName}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            const res = await deleteStylist(stylistId);
            setDeleting(false);
            if ('error' in res) {
              if (res.error.toLowerCase().includes('foreign key') || res.error.toLowerCase().includes('violates reference')) {
                Alert.alert(
                  'Cannot delete stylist',
                  `"${stylistName}" has booked appointments. To safeguard booking history logs, we recommend deactivating their account instead (set "Active" to off).`,
                  [{ text: 'OK' }]
                );
              } else {
                setError(res.error);
              }
              return;
            }
            await load();
            setEditing(null);
          },
        },
      ]
    );
  };

  // Edit mode
  if (editing !== null) {
    return (
      <ScreenContainer safeTop={false} keyboardAware>
        <ScreenHeader eyebrow="STYLISTS" title={editing === 'new' ? 'New Stylist' : 'Edit Stylist'} left={<BackButton onPress={() => setEditing(null)} />} />

        <Card style={{ gap: Spacing.sm }}>
          <AdminSectionLabel>Stylist Details</AdminSectionLabel>
          <ThemedTextInput label="Name" value={name} onChangeText={setName} />
          <ThemedTextInput label="Role / Title" value={role} onChangeText={setRole} placeholder="e.g. Master Barber, Senior Stylist" />
          <ThemedTextInput
            label="Tags (comma-separated)"
            value={tagsText}
            onChangeText={setTagsText}
            placeholder="e.g. Cuts, Fades, Color"
          />

          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: Spacing.md,
              marginTop: Spacing.md,
              borderTopWidth: 1,
              borderTopColor: c.hairline,
              paddingTop: Spacing.sm,
            }}
          >
            <View style={{ flex: 1 }}>
              <Text style={[Type.label, { color: c.fg }]}>Active Status</Text>
              <Text style={[Type.caption, { color: c.fgMuted, fontSize: 10 }]}>Activate or hide this stylist from booking calendar</Text>
            </View>
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
            label="Save Stylist"
            onPress={handleSave}
            busy={saving}
            style={{ marginTop: Spacing.md }}
          />

          {editing !== 'new' && (
            <ThemedButton
              variant="destructive"
              label="Delete Stylist"
              onPress={handleDelete}
              busy={deleting}
              style={{ marginTop: Spacing.xs }}
            />
          )}
        </Card>
      </ScreenContainer>
    );
  }

  // Filter stylists
  const filteredStylists = stylists.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.role && s.role.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <ScreenContainer safeTop={false}>
      <ScreenHeader eyebrow="MANAGE" title="Stylists" left={<BackButton />} />

      <ThemedButton
        label="New Stylist"
        icon="plus.circle.fill"
        onPress={() => { resetForm(); setEditing('new'); }}
        style={{ marginBottom: Spacing.md }}
      />

      <ThemedTextInput
        placeholder="Search stylists"
        value={searchQuery}
        onChangeText={setSearchQuery}
        clearButtonMode="while-editing"
        style={{ marginBottom: Spacing.md }}
      />

      <View style={{ gap: Spacing.sm }}>
          {loading ? (
            <SkeletonCard count={3} />
          ) : filteredStylists.length === 0 ? (
            <Text style={[Type.body, { color: c.fgMuted, textAlign: 'center', marginTop: Spacing.lg, fontFamily: 'Poppins_500Medium' }]}>
              No stylists found.
            </Text>
          ) : filteredStylists.map((stylist) => {
            const initials = stylist.name.charAt(0).toUpperCase();
            return (
              <PressableScale
                key={stylist.id}
                accessibilityRole="button"
                onPress={() => { seedForm(stylist); setEditing(stylist); }}
              >
                <Card style={{ padding: 0, overflow: 'hidden', borderLeftWidth: 4, borderLeftColor: stylist.is_active ? c.accent : c.fgMuted }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.md }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md, flex: 1 }}>
                      <LinearGradient
                        colors={stylist.is_active ? [c.accent, c.accentDark] : ['#8A857C', '#57534C']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' }}
                      >
                        <Text style={{ fontSize: 16, fontFamily: 'Poppins_700Bold', color: '#FFFFFF' }}>{initials}</Text>
                      </LinearGradient>

                      <View style={{ flex: 1, gap: 2 }}>
                        <Text style={[Type.label, { color: c.fg, fontSize: 16, fontFamily: 'Poppins_600SemiBold' }]}>{stylist.name}</Text>
                        {!!stylist.role && (
                          <Text style={[Type.caption, { color: c.fgMuted, fontFamily: 'Poppins_500Medium' }]}>{stylist.role}</Text>
                        )}

                        {stylist.tags && stylist.tags.length > 0 && (
                          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, marginTop: Spacing.xs }}>
                            {stylist.tags.map((t) => (
                              <View
                                key={t}
                                style={{
                                  backgroundColor: c.bg2,
                                  borderRadius: Radius.pill,
                                  paddingHorizontal: 8,
                                  paddingVertical: 1,
                                  borderWidth: 1,
                                  borderColor: c.hairline,
                                }}
                              >
                                <Text style={[Type.caption, { fontSize: 9, color: c.fg2, fontFamily: 'Poppins_500Medium' }]}>{t}</Text>
                              </View>
                            ))}
                          </View>
                        )}

                        {!stylist.is_active && (
                          <View
                            style={{
                              alignSelf: 'flex-start',
                              borderWidth: 1,
                              borderColor: c.error,
                              backgroundColor: 'rgba(192, 57, 43, 0.05)',
                              borderRadius: Radius.pill,
                              paddingHorizontal: Spacing.sm,
                              paddingVertical: Spacing.xs / 2,
                              marginTop: Spacing.xs,
                            }}
                          >
                            <Text style={[Type.caption, { color: c.error, fontSize: 10, fontFamily: 'Poppins_600SemiBold' }]}>inactive</Text>
                          </View>
                        )}
                      </View>
                    </View>
                    <IconSymbol name="chevron.right" size={18} color={c.fgMuted} />
                  </View>
                </Card>
              </PressableScale>
            );
          })}
        </View>
    </ScreenContainer>
  );
}
