import { useCallback, useEffect, useRef, useState } from 'react';
import { RefreshControl, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useFocusEffect } from 'expo-router';
import { getMyAssignedBookings, setBookingStatus } from '@/lib/api/staff';
import type { StaffBooking, AdminBookingStatus } from '@/lib/api/staff';
import { applyStatus, colomboDayWindow, nextUp, serviceLabel } from '@/lib/staff/bookings-view';
import { getServices } from '@/lib/api/queries';
import { useSession } from '@/context/session';
import { Card } from '@/components/ui/card';
import { LoadingScreen } from '@/components/ui/loading';
import { ScreenContainer } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { SectionHeader } from '@/components/ui/section-header';
import { StaffBookingCard } from '@/components/staff/booking-card';
import { ThemeToggleButton } from '@/components/ui/theme-toggle-button';
import { useTheme } from '@/hooks/use-theme';

type Service = { id: string; name: string };

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

export default function Today() {
  const { c, Spacing, Type } = useTheme();
  const { profile } = useSession();
  const stylistId = profile?.stylistId;

  const [bookings, setBookings] = useState<StaffBooking[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasAnimated = useRef(false);

  const load = useCallback(async () => {
    if (!stylistId) return;
    const { from, to } = colomboDayWindow(0);
    const [rows, serviceRows] = await Promise.all([
      getMyAssignedBookings({ stylistId, from, to }),
      getServices(),
    ]);
    setBookings(rows);
    setServices(serviceRows as Service[]);
    setError(null);
    setInitialLoading(false);
  }, [stylistId]);

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
    setBookings(applyStatus(bookings, id, status));
    const res = await setBookingStatus(id, status);
    if ('error' in res) {
      setBookings(prev);
      setError("Couldn't update — try again");
    } else {
      setError(null);
    }
  };

  if (initialLoading) return <LoadingScreen message="Loading your day..." />;

  const now = new Date().toISOString();
  const nextBooking = nextUp(bookings, now);
  const dayTitle = dayTitleFmt.format(new Date());

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
      <ScreenHeader eyebrow="TODAY" title={dayTitle} right={<ThemeToggleButton />} />

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

      {bookings.length === 0 ? (
        <Card>
          <Text style={[Type.caption, { color: c.fgMuted }]}>
            No appointments today — enjoy the quiet ☕
          </Text>
        </Card>
      ) : (
        <View>
          {bookings.map((booking, i) => (
            <Animated.View key={booking.id} entering={entering(i)}>
              <StaffBookingCard
                booking={booking}
                serviceName={serviceLabel(services, booking.service_id)}
                onSetStatus={handleSetStatus}
              />
            </Animated.View>
          ))}
        </View>
      )}
    </ScreenContainer>
  );
}
