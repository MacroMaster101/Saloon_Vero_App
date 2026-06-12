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
import { LoadingScreen } from '@/components/ui/loading';
import { ScreenContainer } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { BackButton } from '@/components/ui/back-button';
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
      'Delete photo?',
      item.title,
      [
        { text: 'Cancel' },
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
      title: newTitle,
      tag: newTag,
      category: newTag,
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

  if (loading) return <LoadingScreen message="Loading gallery..." />;

  return (
    <ScreenContainer>
      <ScreenHeader eyebrow="MANAGE" title="Gallery" left={<BackButton />} />

      {!pendingUri && (
        <ThemedButton
          label="+ Add photo"
          onPress={pickPhoto}
          style={{ marginBottom: Spacing.md }}
        />
      )}

      {!!pendingUri && (
        <Card style={{ marginBottom: Spacing.md }}>
          <Image
            source={{ uri: pendingUri }}
            style={{ width: '100%', aspectRatio: 1, borderRadius: Radius.lg, backgroundColor: c.bg2 }}
            contentFit="cover"
          />
          <View style={{ marginTop: Spacing.md }}>
            <ThemedTextInput label="Title" value={newTitle} onChangeText={setNewTitle} />
            <ThemedTextInput label="Tag" value={newTag} onChangeText={setNewTag} />
          </View>
          {!!addError && (
            <Text style={[Type.caption, { color: c.error, marginBottom: Spacing.sm }]}>{addError}</Text>
          )}
          <ThemedButton label="Save photo" onPress={handleAddSave} busy={saving} />
          <Pressable onPress={cancelPending} style={{ marginTop: Spacing.sm, alignItems: 'center' }}>
            <Text style={[Type.caption, { color: c.accentText }]}>Cancel</Text>
          </Pressable>
        </Card>
      )}

      {!!error && (
        <Text style={[Type.caption, { color: c.error, marginBottom: Spacing.sm }]}>{error}</Text>
      )}

      {/* Grid */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm }}>
        {items.map((item) => (
          <Card key={item.id} style={{ width: '48%' }}>
            <Image
              source={{ uri: item.image_url }}
              style={{ aspectRatio: 1, borderRadius: Radius.lg, backgroundColor: c.bg2 }}
              contentFit="cover"
            />
            <Text style={[Type.label, { color: c.fg, fontSize: 13, marginTop: Spacing.xs }]}>
              {item.title}
            </Text>
            {!!item.tag && (
              <Text style={[Type.caption, { color: c.fgMuted }]}>{item.tag}</Text>
            )}
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: Spacing.xs,
              }}
            >
              <Switch
                value={item.is_active}
                onValueChange={() => handleToggleActive(item)}
                trackColor={{ true: c.accent, false: c.line }}
              />
              <Pressable
                onPress={() => handleDelete(item)}
                accessibilityRole="button"
              >
                <Text style={[Type.caption, { color: c.error }]}>Delete</Text>
              </Pressable>
            </View>
          </Card>
        ))}
      </View>
    </ScreenContainer>
  );
}
