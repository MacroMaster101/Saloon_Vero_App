import { useCallback, useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import {
  createBlockedSlot,
  deleteBlockedSlot,
  getBlockedSlots,
  getStylistsAdmin,
} from '@/lib/api/admin';
import type { AdminBlockedSlot } from '@/lib/api/admin';
import { blockLabel } from '@/lib/admin/helpers';
import { Card } from '@/components/ui/card';
import { AdminChip, AdminIconAction, AdminSectionLabel } from '@/components/admin/admin-ui';
import { EmptyState } from '@/components/ui/empty-state';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ScreenContainer } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { BackButton } from '@/components/ui/back-button';
import { SkeletonCard } from '@/components/ui/skeleton';
import { ThemedButton } from '@/components/ui/button';
import { ThemedTextInput } from '@/components/ui/text-input';
import { useTheme } from '@/hooks/use-theme';
import type { Stylist } from '@/types/database';

const colomboDateFmt = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Colombo',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const slotDateFmt = new Intl.DateTimeFormat('en-LK', {
  timeZone: 'Asia/Colombo',
  weekday: 'short',
  day: 'numeric',
  month: 'short',
});

const slotTimeFmt = new Intl.DateTimeFormat('en-LK', {
  timeZone: 'Asia/Colombo',
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
});

const HOURS = Array.from({ length: 12 }, (_, i) => {
  const h = i + 9;
  return `${String(h).padStart(2, '0')}:00`;
});

type DurationOption = { label: string; h: number };
const DURATIONS: DurationOption[] = [
  { label: '1 hour', h: 1 },
  { label: '2 hours', h: 2 },
  { label: '4 hours', h: 4 },
  { label: 'All day (24h)', h: 24 },
];

function generateNextDays(n: number): { key: string; label: string }[] {
  const days: { key: string; label: string }[] = [];
  const labelFmt = new Intl.DateTimeFormat('en-LK', {
    timeZone: 'Asia/Colombo',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
  for (let i = 0; i < n; i++) {
    const d = new Date(Date.now() + i * 86400000);
    const key = colomboDateFmt.format(d);
    const label = labelFmt.format(d);
    days.push({ key, label });
  }
  return days;
}

export default function BlockedSlots() {
  const { c, Spacing, Type } = useTheme();

  const days = generateNextDays(14);

  const [slots, setSlots] = useState<AdminBlockedSlot[]>([]);
  const [stylists, setStylists] = useState<Stylist[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form state
  const [stylistId, setStylistId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(days[0]?.key ?? '');
  const [selectedHour, setSelectedHour] = useState('09:00');
  const [selectedDuration, setSelectedDuration] = useState(1);
  const [reason, setReason] = useState('');

  const load = useCallback(async () => {
    const [slotRows, stylistRows] = await Promise.all([
      getBlockedSlots({ from: new Date().toISOString() }),
      getStylistsAdmin(),
    ]);
    setSlots(slotRows);
    setStylists(stylistRows);
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleDelete = (slot: AdminBlockedSlot) => {
    const label = blockLabel(slot, stylists);
    Alert.alert(
      'Remove time block?',
      `Remove block for "${label}"?`,
      [
        { text: 'Keep', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            await deleteBlockedSlot(slot.id);
            load();
          },
        },
      ],
    );
  };

  const handleSave = async () => {
    if (!selectedDate) { setFormError('Please select a date.'); return; }
    const durationOpt = DURATIONS.find((d) => d.h === selectedDuration);
    if (!durationOpt) { setFormError('Please select a duration.'); return; }

    let startsAt: string;
    let endsAt: string;

    if (durationOpt.h === 24) {
      startsAt = new Date(`${selectedDate}T00:00:00+05:30`).toISOString();
      endsAt = new Date(new Date(startsAt).getTime() + 24 * 3600000).toISOString();
    } else {
      startsAt = new Date(`${selectedDate}T${selectedHour}:00+05:30`).toISOString();
      endsAt = new Date(new Date(startsAt).getTime() + durationOpt.h * 3600000).toISOString();
    }

    setSaving(true);
    const res = await createBlockedSlot({ stylistId, startsAt, endsAt, reason });
    setSaving(false);
    if ('error' in res) { setFormError(res.error); return; }
    setShowForm(false);
    setReason('');
    setFormError(null);
    load();
  };

  const activeStylists = stylists.filter((s) => s.is_active);

  return (
    <ScreenContainer safeTop={false} keyboardAware>
      <ScreenHeader eyebrow="CALENDAR" title="Blocked Slots" left={<BackButton />} />

      <ThemedButton
        label={showForm ? 'Close Block Form' : 'Block Time / Chair'}
        icon={showForm ? 'xmark' : 'plus.circle.fill'}
        variant={showForm ? 'secondary' : 'primary'}
        onPress={() => { setShowForm((v) => !v); setFormError(null); }}
        style={{ marginBottom: Spacing.md }}
      />

      {showForm && (
        <Card style={{ marginBottom: Spacing.lg, gap: Spacing.sm }}>
          <AdminSectionLabel>Configure Time Block</AdminSectionLabel>

          <Text style={[Type.label, { color: c.fgMuted, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0, fontFamily: 'Poppins_600SemiBold' }]}>Stylist / Chair</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs }}>
            <AdminChip
              label="Whole salon"
              selected={stylistId === null}
              onPress={() => setStylistId(null)}
            />
            {activeStylists.map((s) => (
              <AdminChip
                key={s.id}
                label={s.name}
                selected={stylistId === s.id}
                onPress={() => setStylistId(s.id)}
              />
            ))}
          </View>

          <Text style={[Type.label, { color: c.fgMuted, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0, marginTop: Spacing.xs, fontFamily: 'Poppins_600SemiBold' }]}>Date</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -Spacing.md }}>
            <View style={{ flexDirection: 'row', gap: Spacing.xs, paddingHorizontal: Spacing.md }}>
              {days.map((day) => (
                <AdminChip
                  key={day.key}
                  label={day.label}
                  selected={selectedDate === day.key}
                  onPress={() => setSelectedDate(day.key)}
                />
              ))}
            </View>
          </ScrollView>

          <Text style={[Type.label, { color: c.fgMuted, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0, marginTop: Spacing.xs, fontFamily: 'Poppins_600SemiBold' }]}>Duration</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs }}>
            {DURATIONS.map((d) => (
              <AdminChip
                key={d.label}
                label={d.label}
                selected={selectedDuration === d.h}
                onPress={() => setSelectedDuration(d.h)}
              />
            ))}
          </View>

          {selectedDuration !== 24 && (
            <>
              <Text style={[Type.label, { color: c.fgMuted, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0, marginTop: Spacing.xs, fontFamily: 'Poppins_600SemiBold' }]}>Start time</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -Spacing.md }}>
                <View style={{ flexDirection: 'row', gap: Spacing.xs, paddingHorizontal: Spacing.md }}>
                  {HOURS.map((h) => (
                    <AdminChip
                      key={h}
                      label={h}
                      selected={selectedHour === h}
                      onPress={() => setSelectedHour(h)}
                    />
                  ))}
                </View>
              </ScrollView>
            </>
          )}

          <ThemedTextInput
            label="Reason / Notes (optional)"
            value={reason}
            onChangeText={setReason}
            placeholder="e.g. Lunch break, training, out of salon"
          />

          {!!formError && (
            <Text style={[Type.caption, { color: c.error, fontFamily: 'Poppins_600SemiBold' }]}>{formError}</Text>
          )}

          <ThemedButton label="Create Time Block" onPress={handleSave} busy={saving} />
        </Card>
      )}

      <AdminSectionLabel>Active Blocks</AdminSectionLabel>
      <View style={{ gap: Spacing.sm }}>
          {loading ? (
            <SkeletonCard count={3} />
          ) : slots.length === 0 ? (
            <EmptyState title="No upcoming blocked chairs." />
          ) : (
            slots.map((slot) => {
              const label = blockLabel(slot, stylists);
              const start = new Date(slot.starts_at);
              const end = new Date(slot.ends_at);
              return (
                <Card key={slot.id} style={{ borderLeftWidth: 4, borderLeftColor: c.error, padding: 0, overflow: 'hidden' }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.md }}>
                    <View style={{ flex: 1 }}>
                      <Text style={[Type.label, { color: c.fg, fontSize: 15, fontFamily: 'Poppins_600SemiBold' }]}>{label}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 }}>
                        <IconSymbol name="calendar" size={13} color={c.fgMuted} />
                        <Text style={[Type.caption, { color: c.fgMuted, fontFamily: 'Poppins_500Medium', flex: 1 }]} numberOfLines={1}>
                          {slotDateFmt.format(start)}
                        <Text style={{ color: c.fgMuted }}>{` - ${slotTimeFmt.format(start)} - ${slotTimeFmt.format(end)}`}</Text>
                        </Text>
                      </View>
                      {!!slot.reason && (
                        <Text style={[Type.caption, { color: c.fg2, fontStyle: 'italic', marginTop: 4, fontFamily: 'Poppins_400Regular' }]}>
                          {slot.reason}
                        </Text>
                      )}
                    </View>
                    <AdminIconAction icon="trash.fill" label="Remove block" tone="danger" onPress={() => handleDelete(slot)} />
                  </View>
                </Card>
              );
            })
          )}
        </View>
    </ScreenContainer>
  );
}
