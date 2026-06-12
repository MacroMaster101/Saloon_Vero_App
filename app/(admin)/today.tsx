import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, RefreshControl, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { router, useFocusEffect } from 'expo-router';
import { getAllBookings, getStylistsAdmin } from '@/lib/api/admin';
import type { AdminBooking } from '@/lib/api/admin';
import { setBookingStatus } from '@/lib/api/staff';
import type { AdminBookingStatus } from '@/lib/api/staff';
import { applyStatus, colomboDayWindow, nextUp, serviceLabel } from '@/lib/staff/bookings-view';
import { filterByStylist } from '@/lib/admin/helpers';
import { getServices } from '@/lib/api/queries';
import { Card } from '@/components/ui/card';
import { LoadingScreen } from '@/components/ui/loading';
import { ScreenContainer } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { SectionHeader } from '@/components/ui/section-header';
import { StaffBookingCard } from '@/components/staff/booking-card';
import { ThemedButton } from '@/components/ui/button';
import { ThemeToggleButton } from '@/components/ui/theme-toggle-button';
import { useTheme } from '@/hooks/use-theme';

type Service = { id: string; name: string };
type Stylist = { id: string; name: string; is_active: boolean };

const dayTitleFmt = new Intl.DateTimeFormat('en-LK', {
  timeZone: 'Asia/Colombo',
  weekday: 'short',
  day: 'numeric',
  month: 'short',
});

const timeFmt = new Intl.DateTimeFormat('en-LK', {
  timeZone: 'Asia/Colombo',
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
});

const stylistNameFor = (stylists: { id: string; name: string }[], id: string | null) =>
  id ? stylists.find((s) => s.id === id)?.name : undefined;

export default function AdminToday() {
  const { c, Radius, Spacing, Type } = useTheme();

  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [stylists, setStylists] = useState<Stylist[]>([]);
  const [stylistFilter, setStylistFilter] = useState<string | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasAnimated = useRef(false);

  const load = useCallback(async () => {
    const { from, to } = colomboDayWindow(0);
    const [rows, serviceRows, stylistRows] = await Promise.all([
      getAllBookings({ from, to }),
      getServices(),
      getStylistsAdmin(), // full list so bookings on deactivated stylists keep their name label
    ]);
    setBookings(rows);
    setServices(serviceRows as Service[]);
    setStylists(stylistRows as Stylist[]);
    setError(null);
    setInitialLoading(false);
  }, []);

  useFocusEffect(useCallback(() => {
    load();
  }, [load]));

  // Gate: flip after first data render so the cascade only plays once
  useEffect(() => {
    if (!initialLoading) hasAnimated.current = true;
  }, [initialLoading]);

  const entering = (i: number) =>
    hasAnimated.current ? undefined : FadeInDown.delay(i * 60).duration(380);

  const handleSetStatus = async (id: string, status: AdminBookingStatus) => {
    const prev = bookings;
    setBookings(applyStatus(bookings, id, status) as AdminBooking[]);
    const res = await setBookingStatus(id, status);
    if ('error' in res) {
      setBookings(prev);
      setError("Couldn't update — try again");
    } else {
      setError(null);
    }
  };

  if (initialLoading) return <LoadingScreen message="Loading today..." />;

  const now = new Date().toISOString();
  const dayTitle = dayTitleFmt.format(new Date());
  const visible = filterByStylist(bookings, stylistFilter);
  const nextBooking = nextUp(visible, now);

  const activeStylists = stylists.filter((s) => s.is_active);

  return (
    <ScreenContainer
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={async () => {
            setRefreshing(true);
            await load();
            setRefreshing(false);
          }}
          tintColor={c.accent}
        />
      }
    >
      <ScreenHeader eyebrow="ALL CHAIRS" title={dayTitle} right={<ThemeToggleButton />} />

      <ThemedButton
        label="+ Walk-in booking"
        onPress={() => router.push('/(admin)/walk-in' as never)}
        style={{ marginBottom: Spacing.sm }}
      />

      {/* Stylist filter chips */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, marginBottom: Spacing.lg }}>
        {([{ id: null, name: 'All' }, ...activeStylists] as { id: string | null; name: string }[]).map((item) => {
          const selected = stylistFilter === item.id;
          return (
            <Pressable
              key={item.id ?? '__all__'}
              onPress={() => setStylistFilter(item.id)}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              style={{
                backgroundColor: selected ? c.accentDark : c.surfaceRaised,
                borderWidth: 1,
                borderColor: selected ? c.accentDark : c.hairline,
                borderRadius: Radius.pill,
                paddingHorizontal: Spacing.md,
                paddingVertical: Spacing.xs + 2,
                overflow: 'hidden',
              }}
            >
              <Text style={[Type.caption, { color: selected ? c.bg : c.fg2 }]}>
                {item.name}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {!!error && (
        <Text style={[Type.caption, { color: c.error, marginBottom: Spacing.sm }]}>{error}</Text>
      )}

      <SectionHeader number={1} eyebrow="Next" title="Next up" />
      {nextBooking ? (
        <Card style={{ borderColor: c.accent, marginBottom: Spacing.md }}>
          <Text style={[Type.caption, { color: c.fgMuted }]}>
            {timeFmt.format(new Date(nextBooking.starts_at))} – {timeFmt.format(new Date(nextBooking.ends_at))}
          </Text>
          <Text style={[Type.label, { color: c.fg, fontSize: 16, fontFamily: 'Poppins_600SemiBold', marginTop: 4 }]}>
            {nextBooking.customer_name}
          </Text>
          <Text style={[Type.caption, { color: c.fgMuted, marginTop: 2 }]}>
            {serviceLabel(services, nextBooking.service_id)}
          </Text>
        </Card>
      ) : (
        <Card style={{ marginBottom: Spacing.md }}>
          <Text style={[Type.caption, { color: c.fgMuted }]}>Nothing more today.</Text>
        </Card>
      )}

      <SectionHeader number={2} eyebrow="All day" title="Appointments" />

      {visible.length === 0 ? (
        <Card>
          <Text style={[Type.caption, { color: c.fgMuted }]}>No appointments today.</Text>
        </Card>
      ) : (
        <View>
          {visible.map((booking, i) => (
            <Animated.View key={booking.id} entering={entering(i)}>
              <StaffBookingCard
                booking={booking}
                serviceName={serviceLabel(services, booking.service_id)}
                stylistName={stylistNameFor(stylists, booking.stylist_id)}
                allowUndo
                onSetStatus={handleSetStatus}
              />
            </Animated.View>
          ))}
        </View>
      )}
    </ScreenContainer>
  );
}
