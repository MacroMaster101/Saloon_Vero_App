import { useCallback, useEffect, useRef, useState } from 'react';
import { RefreshControl, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useFocusEffect } from 'expo-router';
import { getMyAssignedBookings, setBookingStatus } from '@/lib/api/staff';
import type { StaffBooking, AdminBookingStatus } from '@/lib/api/staff';
import { applyStatus, colomboDayWindow, groupByDay, serviceLabel } from '@/lib/staff/bookings-view';
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

export default function Schedule() {
  const { c, Spacing, Type } = useTheme();
  const { profile } = useSession();
  const stylistId = profile?.stylistId;

  const [upcoming, setUpcoming] = useState<StaffBooking[]>([]);
  const [history, setHistory] = useState<StaffBooking[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasAnimated = useRef(false);

  const load = useCallback(async () => {
    if (!stylistId) return;
    const todayFrom = colomboDayWindow(0).from;
    const weekTo = colomboDayWindow(7).to;
    const historyFrom = colomboDayWindow(-30).from;

    const [upcomingRows, historyRows, serviceRows] = await Promise.all([
      getMyAssignedBookings({ stylistId, from: todayFrom, to: weekTo }),
      getMyAssignedBookings({ stylistId, from: historyFrom, to: todayFrom }),
      getServices(),
    ]);

    setUpcoming(upcomingRows);
    setHistory(historyRows);
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
    // Optimistically update whichever list holds the booking (History can hold
    // past bookings still marked confirmed, which staff may reconcile late).
    const prevUpcoming = upcoming;
    const prevHistory = history;
    setUpcoming(applyStatus(upcoming, id, status));
    setHistory(applyStatus(history, id, status));
    const res = await setBookingStatus(id, status);
    if ('error' in res) {
      setUpcoming(prevUpcoming);
      setHistory(prevHistory);
      setError("Couldn't update — try again");
    } else {
      setError(null);
    }
  };

  if (initialLoading) return <LoadingScreen message="Loading your week..." />;

  const groups = groupByDay(upcoming);
  const historyDesc = [...history].reverse();

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
      <ScreenHeader eyebrow="SCHEDULE" title="My week" right={<ThemeToggleButton />} />

      {!!error && (
        <Text style={[Type.caption, { color: c.error, marginBottom: Spacing.sm }]}>{error}</Text>
      )}

      {groups.length === 0 ? (
        <Card style={{ marginBottom: Spacing.md }}>
          <Text style={[Type.caption, { color: c.fgMuted }]}>
            No upcoming appointments this week.
          </Text>
        </Card>
      ) : (
        groups.map((group, groupIndex) => (
          <View key={group.dayKey}>
            <SectionHeader number={groupIndex + 1} title={group.dayLabel} />
            {group.items.map((booking, i) => (
              <Animated.View key={booking.id} entering={entering(i)}>
                <StaffBookingCard
                  booking={booking}
                  serviceName={serviceLabel(services, booking.service_id)}
                  onSetStatus={handleSetStatus}
                />
              </Animated.View>
            ))}
          </View>
        ))
      )}

      <SectionHeader eyebrow="Past 30 days" title="History" />
      {historyDesc.length === 0 ? (
        <Text style={[Type.caption, { color: c.fgMuted, marginBottom: Spacing.sm }]}>
          No history yet.
        </Text>
      ) : (
        historyDesc.map((booking, i) => (
          <Animated.View key={booking.id} entering={entering(i)}>
            <StaffBookingCard
              booking={booking}
              serviceName={serviceLabel(services, booking.service_id)}
              onSetStatus={handleSetStatus}
            />
          </Animated.View>
        ))
      )}
    </ScreenContainer>
  );
}
