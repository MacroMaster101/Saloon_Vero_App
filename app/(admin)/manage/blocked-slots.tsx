import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
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
import { LoadingScreen } from '@/components/ui/loading';
import { ScreenContainer } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { BackButton } from '@/components/ui/back-button';
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
  { label: '1h', h: 1 },
  { label: '2h', h: 2 },
  { label: '4h', h: 4 },
  { label: 'All day', h: 24 },
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

function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const { c, Radius, Spacing, Type } = useTheme();
  return (
    <Pressable
      onPress={onPress}
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
      <Text style={[Type.caption, { color: selected ? c.bg : c.fg2 }]}>{label}</Text>
    </Pressable>
  );
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
      'Remove block?',
      label,
      [
        { text: 'Keep' },
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
    if (!selectedDate) { setFormError('Select a date.'); return; }
    const durationOpt = DURATIONS.find((d) => d.h === selectedDuration);
    if (!durationOpt) { setFormError('Select a duration.'); return; }

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

  if (loading) return <LoadingScreen message="Loading blocked slots..." />;

  return (
    <ScreenContainer>
      <ScreenHeader eyebrow="MANAGE" title="Blocked slots" left={<BackButton />} />

      <ThemedButton
        label={showForm ? '✕ Cancel' : '+ Block time'}
        variant={showForm ? 'secondary' : 'primary'}
        onPress={() => { setShowForm((v) => !v); setFormError(null); }}
        style={{ marginBottom: Spacing.md }}
      />

      {showForm && (
        <Card style={{ marginBottom: Spacing.md, gap: Spacing.sm }}>
          {/* Stylist chips */}
          <Text style={[Type.label, { color: c.fgMuted, fontSize: 12 }]}>Stylist / Chair</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs }}>
            <Chip
              label="Whole salon"
              selected={stylistId === null}
              onPress={() => setStylistId(null)}
            />
            {activeStylists.map((s) => (
              <Chip
                key={s.id}
                label={s.name}
                selected={stylistId === s.id}
                onPress={() => setStylistId(s.id)}
              />
            ))}
          </View>

          {/* Date chips */}
          <Text style={[Type.label, { color: c.fgMuted, fontSize: 12, marginTop: Spacing.xs }]}>Date</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: 'row', gap: Spacing.xs }}>
              {days.map((day) => (
                <Chip
                  key={day.key}
                  label={day.label}
                  selected={selectedDate === day.key}
                  onPress={() => setSelectedDate(day.key)}
                />
              ))}
            </View>
          </ScrollView>

          {/* Duration chips */}
          <Text style={[Type.label, { color: c.fgMuted, fontSize: 12, marginTop: Spacing.xs }]}>Duration</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs }}>
            {DURATIONS.map((d) => (
              <Chip
                key={d.label}
                label={d.label}
                selected={selectedDuration === d.h}
                onPress={() => setSelectedDuration(d.h)}
              />
            ))}
          </View>

          {/* Start hour chips — hidden for All day */}
          {selectedDuration !== 24 && (
            <>
              <Text style={[Type.label, { color: c.fgMuted, fontSize: 12, marginTop: Spacing.xs }]}>Start time</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={{ flexDirection: 'row', gap: Spacing.xs }}>
                  {HOURS.map((h) => (
                    <Chip
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
            label="Reason (optional)"
            value={reason}
            onChangeText={setReason}
          />

          {!!formError && (
            <Text style={[Type.caption, { color: c.error }]}>{formError}</Text>
          )}

          <ThemedButton label="Save block" onPress={handleSave} busy={saving} />
        </Card>
      )}

      {/* Slot list */}
      <View style={{ gap: Spacing.sm }}>
        {slots.length === 0 ? (
          <Card>
            <Text style={[Type.caption, { color: c.fgMuted }]}>No upcoming blocks.</Text>
          </Card>
        ) : (
          slots.map((slot) => {
            const label = blockLabel(slot, stylists);
            const start = new Date(slot.starts_at);
            const end = new Date(slot.ends_at);
            return (
              <Card key={slot.id}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={[Type.label, { color: c.fg, fontSize: 15 }]}>{label}</Text>
                    <Text style={[Type.caption, { color: c.fgMuted, marginTop: 2 }]}>
                      {slotDateFmt.format(start)}{' '}
                      {slotTimeFmt.format(start)} – {slotTimeFmt.format(end)}
                    </Text>
                    {!!slot.reason && (
                      <Text style={[Type.caption, { color: c.fgMuted, marginTop: 2 }]}>{slot.reason}</Text>
                    )}
                  </View>
                  <Pressable
                    onPress={() => handleDelete(slot)}
                    accessibilityRole="button"
                    style={{ paddingLeft: Spacing.sm }}
                  >
                    <Text style={[Type.caption, { color: c.error }]}>Remove</Text>
                  </Pressable>
                </View>
              </Card>
            );
          })
        )}
      </View>
    </ScreenContainer>
  );
}
