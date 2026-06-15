import { useCallback, useState } from 'react';
import { Alert, Switch, Text, View, ScrollView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Image } from 'expo-image';
import { getStylistAvatar } from '@/components/stylists/stylist-card';
import { AdminPhotoPicker } from '@/components/admin/admin-photo-picker';
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
import { DEFAULT_RATING, DEFAULT_RATING_COUNT } from '@/lib/utils/reviews';
import type { Stylist } from '@/types/database';

export default function Stylists() {
  const { c, Spacing, Type, Radius } = useTheme();
  const insets = useSafeAreaInsets();
  const isIOS = Platform.OS === 'ios';
  const fabBottom = isIOS
    ? 24 + 64 + 12
    : 16 + insets.bottom + 64 + 12;

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
  const [avatarUrl, setAvatarUrl] = useState('');
  const [tagsText, setTagsText] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [rating, setRating] = useState('4.9');
  const [ratingCount, setRatingCount] = useState('42');

  const load = useCallback(async () => {
    const rows = await getStylistsAdmin();
    setStylists(rows);
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const resetForm = () => {
    setName(''); setRole(''); setTagsText(''); setIsActive(true); setError(null);
    setAvatarUrl('');
    setRating('4.9');
    setRatingCount('42');
  };

  const seedForm = (s: Stylist) => {
    setName(s.name); setRole(s.role); setTagsText(s.tags.join(', '));
    setIsActive(s.is_active); setError(null);
    setAvatarUrl(s.avatar_url || '');
    setRating(String(s.rating ?? DEFAULT_RATING));
    setRatingCount(String(s.rating_count ?? DEFAULT_RATING_COUNT));
  };

  const handleSave = async () => {
    if (!name.trim()) { setError('Name is required.'); return; }

    const parsedRating = parseFloat(rating);
    if (isNaN(parsedRating) || parsedRating < 0 || parsedRating > 5) {
      setError('Rating must be a number between 0 and 5.');
      return;
    }
    const parsedCount = parseInt(ratingCount, 10);
    if (isNaN(parsedCount) || parsedCount < 0) {
      setError('Rating count must be a non-negative integer.');
      return;
    }

    const tags = tagsText.split(',').map((t) => t.trim()).filter(Boolean);
    const row = {
      ...(editing !== 'new'
        ? { id: (editing as Stylist).id, slug: (editing as Stylist).slug }
        : { slug: slugify(name) }),
      name: name.trim(),
      role,
      tags,
      is_active: isActive,
      avatar_url: avatarUrl.trim() || null,
      rating: parsedRating,
      rating_count: parsedCount,
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
          
          <AdminPhotoPicker
            photoUrl={avatarUrl && (avatarUrl.startsWith('http') || avatarUrl.startsWith('data:image')) ? avatarUrl : null}
            onChangePhotoUrl={(url) => setAvatarUrl(url || '')}
            placeholderUrl={getStylistAvatar(editing !== 'new' ? (editing as Stylist).slug : slugify(name), name)}
            bucketName="avatars"
            uploadPath={`stylists/${slugify(name || 'new-stylist')}`}
          />

          <ThemedTextInput label="Name" value={name} onChangeText={setName} />
          <ThemedTextInput label="Role / Title" value={role} onChangeText={setRole} placeholder="e.g. Master Barber, Senior Stylist" />
          <ThemedTextInput
            label="Tags (comma-separated)"
            value={tagsText}
            onChangeText={setTagsText}
            placeholder="e.g. Cuts, Fades, Color"
          />

          <View style={{ flexDirection: 'row', gap: Spacing.md }}>
            <View style={{ flex: 1 }}>
              <ThemedTextInput
                label="Rating (0.0 - 5.0)"
                value={rating}
                onChangeText={setRating}
                keyboardType="numeric"
                placeholder="e.g. 4.9"
              />
            </View>
            <View style={{ flex: 1 }}>
              <ThemedTextInput
                label="Rating Count (Reviews)"
                value={ratingCount}
                onChangeText={setRatingCount}
                keyboardType="number-pad"
                placeholder="e.g. 42"
              />
            </View>
          </View>

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
    <ScreenContainer safeTop={false} scroll={false}>
      <ScreenHeader eyebrow="MANAGE" title="Stylists" left={<BackButton />} />

      <ThemedTextInput
        placeholder="Search stylists"
        value={searchQuery}
        onChangeText={setSearchQuery}
        clearButtonMode="while-editing"
        style={{ marginBottom: Spacing.md }}
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: fabBottom + 56 + Spacing.md }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ gap: Spacing.sm }}>
          {loading ? (
            <SkeletonCard count={3} />
          ) : filteredStylists.length === 0 ? (
            <Text style={[Type.body, { color: c.fgMuted, textAlign: 'center', marginTop: Spacing.lg, fontFamily: 'Poppins_500Medium' }]}>
              No stylists found.
            </Text>
          ) : filteredStylists.map((stylist) => {
            return (
              <PressableScale
                key={stylist.id}
                accessibilityRole="button"
                onPress={() => { seedForm(stylist); setEditing(stylist); }}
              >
                <Card style={{ padding: 0, overflow: 'hidden', borderLeftWidth: 4, borderLeftColor: stylist.is_active ? c.accent : c.fgMuted }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.md }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md, flex: 1 }}>
                      <Image
                        source={{ uri: getStylistAvatar(stylist.slug, stylist.name, stylist.avatar_url) }}
                        style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: c.bg2 }}
                        contentFit="cover"
                        transition={200}
                      />

                      <View style={{ flex: 1, gap: 2 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginRight: Spacing.md }}>
                          <Text style={[Type.label, { color: c.fg, fontSize: 16, fontFamily: 'Poppins_600SemiBold' }]}>{stylist.name}</Text>
                          <Text style={{ fontSize: 12, color: '#D9A648', fontFamily: 'Poppins_700Bold' }}>
                            ★ {stylist.rating ? Number(stylist.rating).toFixed(1) : DEFAULT_RATING} ({stylist.rating_count ?? DEFAULT_RATING_COUNT})
                          </Text>
                        </View>
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
      </ScrollView>

      {/* Floating Action Button */}
      <PressableScale
        accessibilityRole="button"
        accessibilityLabel="New Stylist"
        onPress={() => { resetForm(); setEditing('new'); }}
        style={{
          position: 'absolute',
          right: Spacing.md,
          bottom: fabBottom,
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: c.accent,
          justifyContent: 'center',
          alignItems: 'center',
          shadowColor: '#000',
          shadowOpacity: 0.25,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 4 },
          elevation: 6,
        }}
      >
        <IconSymbol name="plus" size={24} color="#FFF" />
      </PressableScale>
    </ScreenContainer>
  );
}
