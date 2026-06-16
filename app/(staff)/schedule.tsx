import { useCallback, useEffect, useRef, useState } from 'react';
import { RefreshControl, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { getMyAssignedBookings, setBookingStatus } from '@/lib/api/staff';
import type { StaffBooking, AdminBookingStatus } from '@/lib/api/staff';
import { applyStatus, colomboDayWindow, groupByDay, serviceLabel } from '@/lib/staff/bookings-view';
import { getServices } from '@/lib/api/queries';
import { useSession } from '@/context/session';
import { EmptyState } from '@/components/ui/empty-state';
import { FadeUp } from '@/components/ui/fade-up';
import { SkeletonCard } from '@/components/ui/skeleton';
import { ScreenContainer } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { SectionHeader } from '@/components/ui/section-header';
import { StaffBookingCard } from '@/components/staff/booking-card';
import { StaffMetricCard, StaffSectionLabel } from '@/components/staff/staff-ui';
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

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  useEffect(() => {
    if (!initialLoading) hasAnimated.current = true;
  }, [initialLoading]);

  const handleSetStatus = async (id: string, status: AdminBookingStatus) => {
    const prevUpcoming = upcoming;
    const prevHistory = history;
    setUpcoming(applyStatus(upcoming, id, status));
    setHistory(applyStatus(history, id, status));
    const res = await setBookingStatus(id, status);
    if ('error' in res) {
      setUpcoming(prevUpcoming);
      setHistory(prevHistory);
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

  const groups = groupByDay(upcoming);
  const historyDesc = [...history].reverse();
  const confirmed = upcoming.filter((booking) => booking.status === 'confirmed').length;
  const completedHistory = history.filter((booking) => booking.status === 'completed').length;

  return (
    <ScreenContainer
      safeTop={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={async () => {
            setRefreshing(true);
            try {
              await load();
            } finally {
              setRefreshing(false);
            }
          }}
          tintColor={c.accent}
        />
      }
    >
      <ScreenHeader
        eyebrow="Roster"
        title="My Week"
        subtitle="Upcoming appointments and recent history."
        right={<ThemeToggleButton />}
      />

      {!!error && (
        <Text style={[Type.caption, { color: c.error, marginBottom: Spacing.sm, fontFamily: 'Poppins_600SemiBold' }]}>{error}</Text>
      )}

      <View style={{ gap: Spacing.sm, marginBottom: Spacing.lg }}>
        <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
          <StaffMetricCard label="Upcoming" value={String(upcoming.length)} detail="next 7 days" icon="calendar" tone="accent" />
          <StaffMetricCard label="Waiting" value={String(confirmed)} detail="confirmed" icon="clock.fill" tone="neutral" />
        </View>
        <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
          <StaffMetricCard label="History" value={String(history.length)} detail="past 30 days" icon="arrow.right" tone="muted" />
          <StaffMetricCard label="Completed" value={String(completedHistory)} detail="recent" icon="checkmark" tone="success" />
        </View>
      </View>

      <StaffSectionLabel>Upcoming Schedule</StaffSectionLabel>
      {groups.length === 0 ? (
        <EmptyState title="No upcoming appointments this week." />
      ) : (
        groups.map((group, groupIndex) => (
          <View key={group.dayKey}>
            <SectionHeader title={group.dayLabel} />
            {group.items.map((booking, index) => (
              <FadeUp key={booking.id} index={index + groupIndex} animate={!hasAnimated.current}>
                <StaffBookingCard
                  booking={booking}
                  serviceName={serviceLabel(services, booking.service_id)}
                  onSetStatus={handleSetStatus}
                />
              </FadeUp>
            ))}
          </View>
        ))
      )}

      <StaffSectionLabel style={{ marginTop: Spacing.lg }}>Recent History</StaffSectionLabel>
      {historyDesc.length === 0 ? (
        <EmptyState title="No history yet." />
      ) : (
        historyDesc.map((booking, index) => (
          <FadeUp key={booking.id} index={index} animate={!hasAnimated.current}>
            <StaffBookingCard
              booking={booking}
              serviceName={serviceLabel(services, booking.service_id)}
              allowUndo
              onSetStatus={handleSetStatus}
            />
          </FadeUp>
        ))
      )}
    </ScreenContainer>
  );
}
