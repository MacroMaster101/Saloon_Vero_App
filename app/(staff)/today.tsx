import { useCallback, useEffect, useRef, useState } from 'react';
import { RefreshControl, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { getMyAssignedBookings, setBookingStatus } from '@/lib/api/staff';
import type { StaffBooking, AdminBookingStatus } from '@/lib/api/staff';
import { applyStatus, colomboDayWindow, nextUp, serviceLabel } from '@/lib/staff/bookings-view';
import { getServices } from '@/lib/api/queries';
import { useSession } from '@/context/session';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { FadeUp } from '@/components/ui/fade-up';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { SkeletonCard } from '@/components/ui/skeleton';
import { ScreenContainer } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { SectionHeader } from '@/components/ui/section-header';
import { StaffBookingCard } from '@/components/staff/booking-card';
import { StaffMetricCard, StaffSectionLabel, StaffTextAction } from '@/components/staff/staff-ui';
import { ThemeToggleButton } from '@/components/ui/theme-toggle-button';
import { useTheme } from '@/hooks/use-theme';

type Service = { id: string; name: string };

const dayTitleFmt = new Intl.DateTimeFormat('en-LK', {
  timeZone: 'Asia/Colombo',
  weekday: 'long',
  day: 'numeric',
  month: 'short',
});

const timeFmt = new Intl.DateTimeFormat('en-LK', {
  timeZone: 'Asia/Colombo',
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
});

function completionPercent(bookings: StaffBooking[]) {
  if (bookings.length === 0) return 0;
  const completed = bookings.filter((booking) => booking.status === 'completed').length;
  return Math.round((completed / bookings.length) * 100);
}

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

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  useEffect(() => {
    if (!initialLoading) hasAnimated.current = true;
  }, [initialLoading]);

  const handleSetStatus = async (id: string, status: AdminBookingStatus) => {
    const prev = bookings;
    setBookings(applyStatus(bookings, id, status));
    const res = await setBookingStatus(id, status);
    if ('error' in res) {
      setBookings(prev);
      setError("Couldn't update status. Please try again.");
    } else {
      setError(null);
    }
  };

  if (initialLoading) {
    return (
      <ScreenContainer safeTop={false}>
        <SkeletonCard count={4} />
      </ScreenContainer>
    );
  }

  const now = new Date().toISOString();
  const nextBooking = nextUp(bookings, now);
  const dayTitle = dayTitleFmt.format(new Date());
  const confirmedCount = bookings.filter((booking) => booking.status === 'confirmed').length;
  const completedCount = bookings.filter((booking) => booking.status === 'completed').length;
  const percentDone = completionPercent(bookings);

  return (
    <ScreenContainer
      safeTop={false}
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
      <ScreenHeader
        eyebrow="Staff Desk"
        title="Today"
        subtitle={dayTitle}
        right={<ThemeToggleButton />}
      />

      {!!error && (
        <Text style={[Type.caption, { color: c.error, marginBottom: Spacing.sm, fontFamily: 'Poppins_600SemiBold' }]}>{error}</Text>
      )}

      <View style={{ gap: Spacing.sm, marginBottom: Spacing.lg }}>
        <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
          <StaffMetricCard label="Clients" value={String(bookings.length)} detail="today" icon="person.2.fill" tone="neutral" />
          <StaffMetricCard label="Waiting" value={String(confirmedCount)} detail="confirmed" icon="clock.fill" tone="accent" />
        </View>
        <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
          <StaffMetricCard label="Completed" value={String(completedCount)} detail={`${percentDone}% done`} icon="checkmark" tone="success" />
          <StaffMetricCard label="Next" value={nextBooking ? timeFmt.format(new Date(nextBooking.starts_at)) : '-'} detail={nextBooking ? 'appointment' : 'clear'} icon="calendar" tone="muted" />
        </View>
      </View>

      <SectionHeader eyebrow="Next Client" title="Ready Queue" />
      {nextBooking ? (
        <Card accent style={{ marginBottom: Spacing.lg, borderLeftWidth: 4, borderLeftColor: c.accent, gap: Spacing.sm }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: Spacing.md }}>
            <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <IconSymbol name="clock.fill" size={14} color={c.accent} />
                <Text style={[Type.caption, { color: c.accentText, fontFamily: 'Poppins_600SemiBold' }]}>
                  {timeFmt.format(new Date(nextBooking.starts_at))} - {timeFmt.format(new Date(nextBooking.ends_at))}
                </Text>
              </View>
              <Text style={[Type.h2, { color: c.fg, fontFamily: 'Poppins_700Bold' }]} numberOfLines={1}>
                {nextBooking.customer_name}
              </Text>
              <Text style={[Type.caption, { color: c.fgMuted }]} numberOfLines={1}>
                {serviceLabel(services, nextBooking.service_id)}
              </Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
            <StaffTextAction label="Complete" icon="checkmark" tone="success" onPress={() => handleSetStatus(nextBooking.id, 'completed')} />
            <StaffTextAction label="No-show" icon="person.fill" tone="muted" onPress={() => handleSetStatus(nextBooking.id, 'no_show')} />
          </View>
        </Card>
      ) : (
        <Card style={{ marginBottom: Spacing.lg }}>
          <Text style={[Type.caption, { color: c.fgMuted }]}>No remaining confirmed appointments today.</Text>
        </Card>
      )}

      <StaffSectionLabel>Appointment List</StaffSectionLabel>
      {bookings.length === 0 ? (
        <EmptyState title="No appointments today." />
      ) : (
        <View>
          {bookings.map((booking, index) => (
            <FadeUp key={booking.id} index={index} animate={!hasAnimated.current}>
              <StaffBookingCard
                booking={booking}
                serviceName={serviceLabel(services, booking.service_id)}
                onSetStatus={handleSetStatus}
              />
            </FadeUp>
          ))}
        </View>
      )}
    </ScreenContainer>
  );
}
