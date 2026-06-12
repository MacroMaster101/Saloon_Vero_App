import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, RefreshControl, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useFocusEffect } from 'expo-router';
import { getAllBookings, getStylistsAdmin } from '@/lib/api/admin';
import type { AdminBooking } from '@/lib/api/admin';
import { setBookingStatus } from '@/lib/api/staff';
import type { AdminBookingStatus } from '@/lib/api/staff';
import { applyStatus, colomboDayWindow, groupByDay, serviceLabel } from '@/lib/staff/bookings-view';
import { filterByStylist } from '@/lib/admin/helpers';
import { getServices } from '@/lib/api/queries';
import { Card } from '@/components/ui/card';
import { LoadingScreen } from '@/components/ui/loading';
import { ScreenContainer } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { SectionHeader } from '@/components/ui/section-header';
import { StaffBookingCard } from '@/components/staff/booking-card';
import { ThemeToggleButton } from '@/components/ui/theme-toggle-button';
import { useTheme } from '@/hooks/use-theme';

type Service = { id: string; name: string };
type Stylist = { id: string; name: string; is_active: boolean };

const stylistNameFor = (stylists: { id: string; name: string }[], id: string | null) =>
  id ? stylists.find((s) => s.id === id)?.name : undefined;

export default function AdminSchedule() {
  const { c, Radius, Spacing, Type } = useTheme();

  const [upcoming, setUpcoming] = useState<AdminBooking[]>([]);
  const [history, setHistory] = useState<AdminBooking[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [stylists, setStylists] = useState<Stylist[]>([]);
  const [stylistFilter, setStylistFilter] = useState<string | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasAnimated = useRef(false);

  const load = useCallback(async () => {
    const todayFrom = colomboDayWindow(0).from;
    const weekTo = colomboDayWindow(7).to;
    const historyFrom = colomboDayWindow(-30).from;

    const [upcomingRows, historyRows, serviceRows, stylistRows] = await Promise.all([
      getAllBookings({ from: todayFrom, to: weekTo }),
      getAllBookings({ from: historyFrom, to: todayFrom }),
      getServices(),
      getStylistsAdmin(), // full list so bookings on deactivated stylists keep their name label
    ]);

    setUpcoming(upcomingRows);
    setHistory(historyRows);
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
    // Optimistically update both lists — history can hold past bookings still
    // marked confirmed that admin may reconcile late.
    const prevUpcoming = upcoming;
    const prevHistory = history;
    setUpcoming(applyStatus(upcoming, id, status) as AdminBooking[]);
    setHistory(applyStatus(history, id, status) as AdminBooking[]);
    const res = await setBookingStatus(id, status);
    if ('error' in res) {
      setUpcoming(prevUpcoming);
      setHistory(prevHistory);
      setError("Couldn't update — try again");
    } else {
      setError(null);
    }
  };

  if (initialLoading) return <LoadingScreen message="Loading schedule..." />;

  const activeStylists = stylists.filter((s) => s.is_active);
  const filteredUpcoming = filterByStylist(upcoming, stylistFilter);
  const filteredHistory = filterByStylist(history, stylistFilter);

  const groups = groupByDay(filteredUpcoming);
  const historyDesc = [...filteredHistory].reverse();

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
      <ScreenHeader eyebrow="SCHEDULE" title="Whole salon" right={<ThemeToggleButton />} />

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
            {(group.items as AdminBooking[]).map((booking, i) => (
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
              stylistName={stylistNameFor(stylists, booking.stylist_id)}
              allowUndo
              onSetStatus={handleSetStatus}
            />
          </Animated.View>
        ))
      )}
    </ScreenContainer>
  );
}
