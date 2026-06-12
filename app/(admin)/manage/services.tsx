import { useCallback, useState } from 'react';
import { Pressable, Switch, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { BackButton } from '@/components/ui/back-button';
import { getServicesAdmin, upsertService } from '@/lib/api/admin';
import { slugify } from '@/lib/admin/helpers';
import { money } from '@/lib/utils/format';
import { Card } from '@/components/ui/card';
import { LoadingScreen } from '@/components/ui/loading';
import { ScreenContainer } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { ThemedButton } from '@/components/ui/button';
import { ThemedTextInput } from '@/components/ui/text-input';
import { useTheme } from '@/hooks/use-theme';
import type { Service } from '@/types/database';

export default function Services() {
  const { c, Spacing, Type, Radius } = useTheme();

  const [services, setServices] = useState<Service[]>([]);
  const [editing, setEditing] = useState<Service | 'new' | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [duration, setDuration] = useState('');
  const [category, setCategory] = useState<'hair' | 'beauty'>('hair');
  const [bookable, setBookable] = useState(true);
  const [isActive, setIsActive] = useState(true);

  const load = useCallback(async () => {
    const rows = await getServicesAdmin();
    setServices(rows);
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const resetForm = () => {
    setName(''); setDescription(''); setPrice(''); setDuration('');
    setCategory('hair'); setBookable(true); setIsActive(true); setError(null);
  };

  const seedForm = (s: Service) => {
    setName(s.name); setDescription(s.description); setPrice(String(s.price_lkr));
    setDuration(String(s.duration_min)); setCategory(s.category);
    setBookable(s.bookable); setIsActive(s.is_active); setError(null);
  };

  const handleSave = async () => {
    const parsedPrice = Number(price);
    const parsedDuration = Number(duration);
    if (!name.trim()) { setError('Name is required.'); return; }
    if (!isFinite(parsedPrice) || parsedPrice <= 0) { setError('Price must be a positive number.'); return; }
    if (!isFinite(parsedDuration) || parsedDuration <= 0) { setError('Duration must be a positive number.'); return; }

    const row = {
      ...(editing !== 'new'
        ? { id: (editing as Service).id, slug: (editing as Service).slug }
        : { slug: slugify(name) }),
      name: name.trim(),
      description,
      category,
      price_lkr: parsedPrice,
      duration_min: parsedDuration,
      bookable,
      is_active: isActive,
    };

    setSaving(true);
    const res = await upsertService(row as Parameters<typeof upsertService>[0]);
    setSaving(false);
    if ('error' in res) { setError(res.error); return; }
    await load();
    setEditing(null);
  };

  if (loading) return <LoadingScreen message="Loading services..." />;

  // Edit mode
  if (editing !== null) {
    return (
      <ScreenContainer>
        <ScreenHeader eyebrow="MANAGE" title={editing === 'new' ? 'New service' : 'Edit service'} left={<BackButton onPress={() => setEditing(null)} />} />

        <Card style={{ gap: Spacing.xs }}>
          <ThemedTextInput label="Name" value={name} onChangeText={setName} />
          <ThemedTextInput label="Description" value={description} onChangeText={setDescription} />
          <ThemedTextInput
            label="Price (LKR)"
            value={price}
            onChangeText={setPrice}
            keyboardType="numeric"
          />
          <ThemedTextInput
            label="Duration (minutes)"
            value={duration}
            onChangeText={setDuration}
            keyboardType="numeric"
          />

          <Text style={[Type.label, { color: c.fgMuted, fontSize: 12, marginBottom: 4 }]}>Category</Text>
          <SegmentedControl
            options={[
              { value: 'hair' as const, label: 'Hair' },
              { value: 'beauty' as const, label: 'Beauty' },
            ]}
            value={category}
            onChange={setCategory}
          />

          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: Spacing.md,
            }}
          >
            <Text style={[Type.label, { color: c.fg }]}>Bookable</Text>
            <Switch
              value={bookable}
              onValueChange={setBookable}
              trackColor={{ true: c.accent, false: c.line }}
            />
          </View>

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
      <ScreenHeader eyebrow="MANAGE" title="Services" left={<BackButton />} />

      <ThemedButton
        label="+ New service"
        onPress={() => { resetForm(); setEditing('new'); }}
        style={{ marginBottom: Spacing.md }}
      />

      <View style={{ gap: Spacing.sm }}>
        {services.map((service) => (
          <Pressable
            key={service.id}
            accessibilityRole="button"
            onPress={() => { seedForm(service); setEditing(service); }}
          >
            <Card>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View style={{ flex: 1 }}>
                  <Text style={[Type.label, { color: c.fg, fontSize: 16 }]}>{service.name}</Text>
                  <Text style={[Type.caption, { color: c.accentDark, marginTop: 2 }]}>
                    {money(service.price_lkr)}
                    <Text style={{ color: c.fgMuted }}>{` · ${service.duration_min} min`}</Text>
                  </Text>
                  <View style={{ flexDirection: 'row', gap: Spacing.xs, marginTop: Spacing.xs }}>
                    {!service.is_active && (
                      <View
                        style={{
                          borderWidth: 1,
                          borderColor: c.hairline,
                          borderRadius: Radius.pill,
                          paddingHorizontal: Spacing.sm,
                          paddingVertical: 2,
                        }}
                      >
                        <Text style={[Type.caption, { color: c.fgMuted }]}>inactive</Text>
                      </View>
                    )}
                    {!service.bookable && (
                      <View
                        style={{
                          borderWidth: 1,
                          borderColor: c.hairline,
                          borderRadius: Radius.pill,
                          paddingHorizontal: Spacing.sm,
                          paddingVertical: 2,
                        }}
                      >
                        <Text style={[Type.caption, { color: c.fgMuted }]}>not bookable</Text>
                      </View>
                    )}
                  </View>
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
