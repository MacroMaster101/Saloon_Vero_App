import { useEffect, useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { getServices, getStylists } from '@/lib/api/queries';
import { getAvailability, createBooking, type SlotEntry } from '@/lib/api/edge';
import { Card } from '@/components/ui/card';
import { LoadingScreen } from '@/components/ui/loading';
import { ScreenContainer } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { ThemedTextInput } from '@/components/ui/text-input';
import { ThemedButton } from '@/components/ui/button';
import { AdminChip, AdminSectionLabel } from '@/components/admin/admin-ui';
import { SlotPicker } from '@/components/booking/slot-picker';
import { useTheme } from '@/hooks/use-theme';
import { money } from '@/lib/utils/format';
import type { Service, Stylist } from '@/types/database';

const dayFmt = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Colombo',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

function nextNDates(n: number): string[] {
  const out: string[] = [];
  const now = Date.now();
  for (let i = 0; i < n; i++) {
    out.push(dayFmt.format(new Date(now + i * 86400000)));
  }
  return out;
}

export default function WalkInDesk() {
  const { c, Spacing } = useTheme();

  // Load datasets
  const [services, setServices] = useState<Service[]>([]);
  const [stylists, setStylists] = useState<Stylist[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');

  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [selectedStylistId, setSelectedStylistId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(nextNDates(1)[0]!);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  // Slots availability
  const [slots, setSlots] = useState<SlotEntry[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([getServices(), getStylists()]).then(([serviceRows, stylistRows]) => {
      setServices(serviceRows as Service[]);
      setStylists(stylistRows as Stylist[]);
      // Autofill first service to make UX faster
      if (serviceRows.length > 0) setSelectedServiceId(serviceRows[0]!.id);
      setLoading(false);
    });
  }, []);

  // Fetch slots whenever service, stylist or date changes
  useEffect(() => {
    if (selectedServiceId && selectedDate) {
      setLoadingSlots(true);
      setError(null);
      setSelectedTime(null);
      getAvailability({
        serviceId: selectedServiceId,
        stylistId: selectedStylistId,
        date: selectedDate,
      })
        .then((res) => {
          setSlots(res.slots);
          setLoadingSlots(false);
        })
        .catch(() => {
          setSlots([]);
          setError('Could not fetch open slots.');
          setLoadingSlots(false);
        });
    }
  }, [selectedServiceId, selectedStylistId, selectedDate]);

  const handleSubmit = async () => {
    if (!name.trim()) return setError('Customer name is required.');
    if (!phone.trim()) return setError('Customer phone number is required.');
    if (!selectedServiceId) return setError('Please choose a service.');
    if (!selectedTime) return setError('Please choose an appointment slot.');

    setSubmitting(true);
    setError(null);

    const res = await createBooking({
      serviceId: selectedServiceId,
      stylistId: selectedStylistId,
      date: selectedDate,
      time: selectedTime,
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
      notes: notes.trim(),
    });

    setSubmitting(false);

    if (!res.ok) {
      setError(res.message);
      return;
    }

    // Success: show alert and return to Dashboard
    Alert.alert(
      'Walk-In Booked!',
      `Reference: ${res.reference}\nStylist: ${res.stylistName}\nTime: ${res.whenLabel}`,
      [
        {
          text: 'Go to Dashboard',
          onPress: () => {
            // Reset state
            setName('');
            setPhone('');
            setEmail('');
            setNotes('');
            setSelectedTime(null);
            router.replace('/(admin)/today');
          },
        },
      ]
    );
  };

  if (loading) {
    return <LoadingScreen message="Opening Booking Desk..." />;
  }

  return (
    <ScreenContainer safeTop={false} keyboardAware>
      <ScreenHeader eyebrow="FRONT DESK" title="Walk-In Registry" subtitle="Register a customer on the spot" />

      <View style={{ gap: Spacing.md }}>
        <Card style={{ gap: Spacing.sm }}>
          <AdminSectionLabel>Customer Details</AdminSectionLabel>
          <ThemedTextInput required label="Customer Name" placeholder="e.g. Amal Perera" value={name} onChangeText={setName} style={{ marginBottom: Spacing.xs }} />
          <ThemedTextInput required label="Mobile Number" placeholder="e.g. 0712345678" keyboardType="phone-pad" value={phone} onChangeText={setPhone} style={{ marginBottom: Spacing.xs }} />
          <ThemedTextInput label="Email (optional)" placeholder="e.g. amal@example.com" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} style={{ marginBottom: Spacing.xs }} />
        </Card>

        <Card style={{ gap: Spacing.sm }}>
          <AdminSectionLabel>Choose Service</AdminSectionLabel>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -Spacing.md }}>
            <View style={{ flexDirection: 'row', gap: Spacing.xs, paddingHorizontal: Spacing.md }}>
              {services.map((service) => {
                return (
                  <AdminChip
                    key={service.id}
                    label={`${service.name} (${money(service.price_lkr)})`}
                    selected={selectedServiceId === service.id}
                    onPress={() => setSelectedServiceId(service.id)}
                  />
                );
              })}
            </View>
          </ScrollView>
        </Card>

        <Card style={{ gap: Spacing.sm }}>
          <AdminSectionLabel>Assign Stylist Chair</AdminSectionLabel>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs }}>
            <AdminChip
              label="Any Available Chair"
              selected={selectedStylistId === null}
              onPress={() => setSelectedStylistId(null)}
            />
            {stylists.map((s) => {
              return (
                <AdminChip
                  key={s.id}
                  label={`${s.name} (${s.role})`}
                  selected={selectedStylistId === s.id}
                  onPress={() => setSelectedStylistId(s.id)}
                />
              );
            })}
          </View>
        </Card>

        <Card style={{ gap: Spacing.sm }}>
          <AdminSectionLabel>Appointment Date</AdminSectionLabel>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -Spacing.md }}>
            <View style={{ flexDirection: 'row', gap: Spacing.xs, paddingHorizontal: Spacing.md }}>
              {nextNDates(14).map((d) => {
                const [yr, mo, dy] = d.split('-').map(Number);
                const dateObj = new Date(yr, mo - 1, dy);
                const weekdayStr = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
                const monthDayStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                return (
                  <AdminChip
                    key={d}
                    label={`${weekdayStr}, ${monthDayStr}`}
                    selected={selectedDate === d}
                    onPress={() => setSelectedDate(d)}
                  />
                );
              })}
            </View>
          </ScrollView>
        </Card>

        <Card style={{ gap: Spacing.sm }}>
          <AdminSectionLabel>Available Slots</AdminSectionLabel>
          {loadingSlots ? (
            <Text style={{ fontSize: 12, color: c.fgMuted, fontStyle: 'italic', paddingVertical: Spacing.sm }}>
              Scanning calendar database for open chairs...
            </Text>
          ) : slots.length === 0 ? (
            <Text style={{ fontSize: 12, color: c.error, fontStyle: 'italic', paddingVertical: Spacing.sm }}>
              No active hours or chairs available for this date.
            </Text>
          ) : (
            <SlotPicker
              slots={slots}
              selected={selectedTime}
              onSelect={(t) => setSelectedTime(t)}
            />
          )}

          <View style={{ borderTopWidth: 1, borderTopColor: c.hairline, paddingTop: Spacing.sm, marginTop: Spacing.xs }}>
            <ThemedTextInput label="Booking Notes / Remarks (optional)" placeholder="e.g. requests extra styling, VIP treatment" multiline value={notes} onChangeText={setNotes} style={{ height: 60, textAlignVertical: 'top' }} />
          </View>
        </Card>

        {!!error && (
          <Text style={{ fontSize: 12, color: c.error, textAlign: 'center', fontFamily: 'Poppins_600SemiBold' }}>{error}</Text>
        )}

        <ThemedButton label="Create Walk-In Booking" icon="plus.circle.fill" busy={submitting} onPress={handleSubmit} />
      </View>
    </ScreenContainer>
  );
}
