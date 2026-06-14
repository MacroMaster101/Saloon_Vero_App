import { useCallback, useState } from 'react';
import { Alert, Switch, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { BackButton } from '@/components/ui/back-button';
import { AdminChip, AdminSectionLabel } from '@/components/admin/admin-ui';
import { getServicesAdmin, upsertService, deleteService } from '@/lib/api/admin';
import { slugify } from '@/lib/admin/helpers';
import { money } from '@/lib/utils/format';
import { Card } from '@/components/ui/card';
import { PressableScale } from '@/components/ui/pressable-scale';
import { ScreenContainer } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { SkeletonCard } from '@/components/ui/skeleton';
import { ThemedButton } from '@/components/ui/button';
import { ThemedTextInput } from '@/components/ui/text-input';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useTheme } from '@/hooks/use-theme';
import type { Service } from '@/types/database';

export default function Services() {
  const { c, Spacing, Type, Radius } = useTheme();

  const [services, setServices] = useState<Service[]>([]);
  const [editing, setEditing] = useState<Service | 'new' | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search and Filter fields
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'hair' | 'beauty'>('all');

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

  const handleDelete = async () => {
    if (editing === 'new' || !editing) return;
    const serviceId = editing.id;
    const serviceName = editing.name;

    Alert.alert(
      'Delete service permanently?',
      `Delete "${serviceName}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            const res = await deleteService(serviceId);
            setDeleting(false);
            if ('error' in res) {
              if (res.error.toLowerCase().includes('foreign key') || res.error.toLowerCase().includes('violates reference')) {
                Alert.alert(
                  'Cannot delete service',
                  `"${serviceName}" has existing bookings records. To preserve booking history, we recommend deactivating the service instead (set "Active" to off).`,
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
        <ScreenHeader eyebrow="SERVICES" title={editing === 'new' ? 'New Service' : 'Edit Service'} left={<BackButton onPress={() => setEditing(null)} />} />

        <Card style={{ gap: Spacing.sm }}>
          <AdminSectionLabel>Service Details</AdminSectionLabel>
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
              gap: Spacing.md,
              marginTop: Spacing.md,
            }}
          >
            <View style={{ flex: 1 }}>
              <Text style={[Type.label, { color: c.fg }]}>Bookable</Text>
              <Text style={[Type.caption, { color: c.fgMuted, fontSize: 10 }]}>Display this service for online appointments</Text>
            </View>
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
              gap: Spacing.md,
              marginTop: Spacing.sm,
              borderTopWidth: 1,
              borderTopColor: c.hairline,
              paddingTop: Spacing.sm,
            }}
          >
            <View style={{ flex: 1 }}>
              <Text style={[Type.label, { color: c.fg }]}>Active Status</Text>
              <Text style={[Type.caption, { color: c.fgMuted, fontSize: 10 }]}>Activate or hide this service</Text>
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
            label="Save Service"
            onPress={handleSave}
            busy={saving}
            style={{ marginTop: Spacing.md }}
          />

          {editing !== 'new' && (
            <ThemedButton
              variant="destructive"
              label="Delete Service"
              onPress={handleDelete}
              busy={deleting}
              style={{ marginTop: Spacing.xs }}
            />
          )}
        </Card>
      </ScreenContainer>
    );
  }

  // Filter lists
  const filteredServices = services.filter((service) => {
    const matchesCategory = categoryFilter === 'all' || service.category === categoryFilter;
    const matchesSearch = service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <ScreenContainer safeTop={false}>
      <ScreenHeader eyebrow="MANAGE" title="Services" left={<BackButton />} />

      <ThemedButton
        label="New Service"
        icon="plus.circle.fill"
        onPress={() => { resetForm(); setEditing('new'); }}
        style={{ marginBottom: Spacing.md }}
      />

      <ThemedTextInput
        placeholder="Search services"
        value={searchQuery}
        onChangeText={setSearchQuery}
        clearButtonMode="while-editing"
        style={{ marginBottom: Spacing.xs }}
      />

      <View style={{ flexDirection: 'row', gap: Spacing.xs, marginBottom: Spacing.md }}>
        {([
          { id: 'all', name: 'All Categories' },
          { id: 'hair', name: 'Hair' },
          { id: 'beauty', name: 'Beauty' },
        ] as const).map((cat) => {
          return (
            <AdminChip
              key={cat.id}
              label={cat.name}
              selected={categoryFilter === cat.id}
              onPress={() => setCategoryFilter(cat.id)}
            />
          );
        })}
      </View>

      <View style={{ gap: Spacing.sm }}>
          {loading ? (
            <SkeletonCard count={3} />
          ) : filteredServices.length === 0 ? (
            <Text style={[Type.body, { color: c.fgMuted, textAlign: 'center', marginTop: Spacing.lg, fontFamily: 'Poppins_500Medium' }]}>
              No services found.
            </Text>
          ) : filteredServices.map((service) => {
            const isHair = service.category === 'hair';
            const borderCol = isHair ? c.accent : '#9B59B6';
            const catBg = isHair ? 'rgba(194, 144, 54, 0.08)' : 'rgba(155, 89, 182, 0.08)';
            const catBorder = isHair ? 'rgba(194, 144, 54, 0.15)' : 'rgba(155, 89, 182, 0.15)';
            const catText = isHair ? c.accentText : '#8E44AD';

            return (
              <PressableScale
                key={service.id}
                accessibilityRole="button"
                onPress={() => { seedForm(service); setEditing(service); }}
              >
                <Card style={{ padding: 0, overflow: 'hidden', borderLeftWidth: 4, borderLeftColor: borderCol }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.md }}>
                    <View style={{ flex: 1, gap: 4 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
                        <Text style={[Type.label, { color: c.fg, fontSize: 16, fontFamily: 'Poppins_600SemiBold', flex: 1 }]} numberOfLines={1}>{service.name}</Text>
                        <View
                          style={{
                            backgroundColor: catBg,
                            borderRadius: Radius.pill,
                            paddingHorizontal: 8,
                            paddingVertical: 1,
                            borderWidth: 1,
                            borderColor: catBorder,
                          }}
                        >
                          <Text style={[Type.caption, { fontSize: 9, color: catText, fontFamily: 'Poppins_600SemiBold', textTransform: 'uppercase' }]}>
                            {service.category}
                          </Text>
                        </View>
                      </View>
                      {!!service.description && (
                        <Text style={[Type.caption, { color: c.fgMuted }]} numberOfLines={1}>
                          {service.description}
                        </Text>
                      )}
                      <Text style={[Type.caption, { color: c.accentDark, fontFamily: 'Poppins_600SemiBold', marginTop: 2 }]}>
                        {money(service.price_lkr)}
                        <Text style={{ color: c.fgMuted, fontFamily: 'Poppins_400Regular' }}>{` · ${service.duration_min} min`}</Text>
                      </Text>
                      
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, marginTop: 2 }}>
                        {!service.is_active && (
                          <View
                            style={{
                              borderWidth: 1,
                              borderColor: c.error,
                              backgroundColor: 'rgba(192, 57, 43, 0.05)',
                              borderRadius: Radius.pill,
                              paddingHorizontal: Spacing.sm,
                              paddingVertical: Spacing.xs / 2,
                            }}
                          >
                            <Text style={[Type.caption, { color: c.error, fontSize: 10, fontFamily: 'Poppins_600SemiBold' }]}>inactive</Text>
                          </View>
                        )}
                        {!service.bookable && (
                          <View
                            style={{
                              borderWidth: 1,
                              borderColor: c.hairline,
                              borderRadius: Radius.pill,
                              paddingHorizontal: Spacing.sm,
                              paddingVertical: Spacing.xs / 2,
                            }}
                          >
                            <Text style={[Type.caption, { color: c.fgMuted, fontSize: 10, fontFamily: 'Poppins_500Medium' }]}>not bookable</Text>
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
