import { useCallback, useState } from 'react';
import { Alert, Pressable, Switch, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import {
  addGalleryItem,
  deleteGalleryItem,
  getGalleryAdmin,
  setGalleryActive,
} from '@/lib/api/admin';
import { uploadImage } from '@/lib/api/storage';
import { Card } from '@/components/ui/card';
import { AdminIconAction, AdminSectionLabel } from '@/components/admin/admin-ui';
import { ScreenContainer } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { BackButton } from '@/components/ui/back-button';
import { SkeletonCard } from '@/components/ui/skeleton';
import { ThemedButton } from '@/components/ui/button';
import { ThemedTextInput } from '@/components/ui/text-input';
import { useTheme } from '@/hooks/use-theme';
import type { GalleryItem } from '@/types/database';

export default function Gallery() {
  const { c, Spacing, Type, Radius } = useTheme();

  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add photo state
  const [pendingUri, setPendingUri] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newTag, setNewTag] = useState('');
  const [saving, setSaving] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const rows = await getGalleryAdmin();
    setItems(rows);
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleToggleActive = async (item: GalleryItem) => {
    const newActive = !item.is_active;
    // Optimistic update
    setItems((prev) =>
      prev.map((it) => (it.id === item.id ? { ...it, is_active: newActive } : it)),
    );
    const res = await setGalleryActive(item.id, newActive);
    if ('error' in res) {
      // Revert
      setItems((prev) =>
        prev.map((it) => (it.id === item.id ? { ...it, is_active: item.is_active } : it)),
      );
      setError(res.error);
    }
  };

  const handleDelete = (item: GalleryItem) => {
    Alert.alert(
      'Delete lookbook photo?',
      `Delete photo "${item.title}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteGalleryItem(item.id);
            load();
          },
        },
      ],
    );
  };

  const pickPhoto = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (res.canceled) return;
    setPendingUri(res.assets[0].uri);
    setNewTitle('');
    setNewTag('');
    setAddError(null);
  };

  const handleAddSave = async () => {
    if (!pendingUri) return;
    setSaving(true);
    const up = await uploadImage('gallery', `admin/${Date.now()}.jpg`, pendingUri);
    if ('error' in up) {
      setAddError(up.error);
      setSaving(false);
      return;
    }
    const res = await addGalleryItem({
      title: newTitle || 'Untitled Look',
      tag: newTag || 'Gallery',
      category: newTag || 'Gallery',
      image_url: up.url,
    });
    setSaving(false);
    if ('error' in res) { setAddError(res.error); return; }
    setPendingUri(null);
    setNewTitle('');
    setNewTag('');
    setAddError(null);
    load();
  };

  const cancelPending = () => {
    setPendingUri(null);
    setNewTitle('');
    setNewTag('');
    setAddError(null);
  };

  return (
    <ScreenContainer safeTop={false} keyboardAware>
      <ScreenHeader eyebrow="LOOKBOOK" title="Gallery" left={<BackButton />} />

      {!pendingUri && (
        <ThemedButton
          label="Add Lookbook Photo"
          icon="plus.circle.fill"
          onPress={pickPhoto}
          style={{ marginBottom: Spacing.md }}
        />
      )}

      {!!pendingUri && (
        <Card style={{ marginBottom: Spacing.lg, gap: Spacing.sm }}>
          <AdminSectionLabel>Upload Lookbook Photo</AdminSectionLabel>
          <Image
            source={{ uri: pendingUri }}
            style={{ width: '100%', aspectRatio: 4 / 3, borderRadius: Radius.sm, backgroundColor: c.bg2 }}
            contentFit="cover"
          />
          <View style={{ marginTop: Spacing.xs }}>
            <ThemedTextInput label="Title" value={newTitle} onChangeText={setNewTitle} placeholder="e.g. Ladies Balayage, Textured Pompadour" />
            <ThemedTextInput label="Tag / Category" value={newTag} onChangeText={setNewTag} placeholder="e.g. Color, Cuts, Styling" />
          </View>
          {!!addError && (
            <Text style={[Type.caption, { color: c.error, marginBottom: Spacing.sm, fontFamily: 'Poppins_600SemiBold' }]}>{addError}</Text>
          )}
          <ThemedButton label="Upload Look" icon="plus.circle.fill" onPress={handleAddSave} busy={saving} />
          <Pressable onPress={cancelPending} style={{ marginTop: Spacing.sm, alignItems: 'center' }}>
            <Text style={[Type.caption, { color: c.accentText, fontFamily: 'Poppins_600SemiBold' }]}>Cancel</Text>
          </Pressable>
        </Card>
      )}

      {!!error && (
        <Text style={[Type.caption, { color: c.error, marginBottom: Spacing.sm }]}>{error}</Text>
      )}

      <AdminSectionLabel>Lookbook Images</AdminSectionLabel>
      {loading ? (
        <SkeletonCard count={4} />
      ) : null}
      
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm }}>
          {!loading && items.length === 0 ? (
            <View style={{ flex: 1, paddingVertical: Spacing.lg }}>
              <Text style={[Type.body, { color: c.fgMuted, textAlign: 'center' }]}>No images in gallery yet.</Text>
            </View>
          ) : !loading && items.map((item) => (
            <Card key={item.id} style={{ width: '48%', minWidth: 148, flexGrow: 1, padding: Spacing.sm }}>
              <Image
                source={{ uri: item.image_url }}
                style={{ aspectRatio: 1, borderRadius: Radius.sm, backgroundColor: c.bg2 }}
                contentFit="cover"
              />
              <Text style={[Type.label, { color: c.fg, fontSize: 13, marginTop: Spacing.xs, fontFamily: 'Poppins_600SemiBold' }]} numberOfLines={1}>
                {item.title}
              </Text>
              {!!item.tag && (
                <Text style={[Type.caption, { color: c.fgMuted, fontSize: 11 }]}>{item.tag}</Text>
              )}
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: Spacing.xs,
                  borderTopWidth: 1,
                  borderTopColor: c.hairline,
                  paddingTop: Spacing.xs,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Switch
                    value={item.is_active}
                    onValueChange={() => handleToggleActive(item)}
                    trackColor={{ true: c.accent, false: c.line }}
                    style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
                  />
                  <Text style={[Type.caption, { fontSize: 10, color: item.is_active ? c.accentText : c.fgMuted }]}>
                    {item.is_active ? 'Active' : 'Hidden'}
                  </Text>
                </View>
                <AdminIconAction icon="trash.fill" label="Delete photo" tone="danger" onPress={() => handleDelete(item)} />
              </View>
            </Card>
          ))}
        </View>
    </ScreenContainer>
  );
}
