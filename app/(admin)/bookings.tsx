import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { getAllBookings, getServicesAdmin, getStylistsAdmin, deleteBooking } from '@/lib/api/admin';
import type { AdminBooking } from '@/lib/api/admin';
import { setBookingStatus } from '@/lib/api/staff';
import type { AdminBookingStatus } from '@/lib/api/staff';
import { applyStatus, colomboDayWindow, serviceLabel } from '@/lib/staff/bookings-view';
import { filterByStylist, stylistNameFor } from '@/lib/admin/helpers';
import { money } from '@/lib/utils/format';
import { AdminChip, AdminIconAction, AdminSectionLabel, AdminStatCard } from '@/components/admin/admin-ui';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { FadeUp } from '@/components/ui/fade-up';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { LoadingScreen } from '@/components/ui/loading';
import { ScreenContainer } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { SectionHeader } from '@/components/ui/section-header';
import { StatusTag } from '@/components/ui/status-tag';
import { ThemedTextInput } from '@/components/ui/text-input';
import { ThemeToggleButton } from '@/components/ui/theme-toggle-button';
import { useTheme } from '@/hooks/use-theme';
import type { Service, Stylist } from '@/types/database';

const dateFmt = new Intl.DateTimeFormat('en-LK', {
  timeZone: 'Asia/Colombo',
  month: 'short',
  day: 'numeric',
});

const timeFmt = new Intl.DateTimeFormat('en-LK', {
  timeZone: 'Asia/Colombo',
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
});

type StatusFilter = 'all' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';

const STATUS_FILTERS: { id: StatusFilter; name: string }[] = [
  { id: 'all', name: 'All Status' },
  { id: 'confirmed', name: 'Confirmed' },
  { id: 'completed', name: 'Completed' },
  { id: 'cancelled', name: 'Cancelled' },
  { id: 'no_show', name: 'No-show' },
];

function statusAccent(status: string, c: ReturnType<typeof useTheme>['c']) {
  if (status === 'confirmed') return c.accent;
  if (status === 'completed') return '#27AE60';
  if (status === 'cancelled' || status === 'no_show') return c.error;
  return c.hairline;
}

export default function AdminBookings() {
  const { c, Spacing, Type } = useTheme();

  const [upcoming, setUpcoming] = useState<AdminBooking[]>([]);
  const [history, setHistory] = useState<AdminBooking[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [stylists, setStylists] = useState<Stylist[]>([]);
  const [stylistFilter, setStylistFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
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
      getServicesAdmin(),
      getStylistsAdmin(),
    ]);

    setUpcoming(upcomingRows);
    setHistory(historyRows);
    setServices(serviceRows);
    setStylists(stylistRows);
    setError(null);
    setInitialLoading(false);
  }, []);

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
    setUpcoming(applyStatus(upcoming, id, status) as AdminBooking[]);
    setHistory(applyStatus(history, id, status) as AdminBooking[]);
    const res = await setBookingStatus(id, status);
    if ('error' in res) {
      setUpcoming(prevUpcoming);
      setHistory(prevHistory);
      setError("Couldn't update booking status.");
    } else {
      setError(null);
      load();
    }
  };

  const confirmDeleteBooking = (booking: AdminBooking) => {
    Alert.alert(
      'Delete booking?',
      `Delete ${booking.customer_name}'s booking ${booking.reference}? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const res = await deleteBooking(booking.id);
            if ('error' in res) setError(res.error);
            else {
              setError(null);
              load();
            }
          },
        },
      ],
    );
  };

  if (initialLoading) return <LoadingScreen message="Loading schedule database..." />;

  const activeStylists = stylists.filter((s) => s.is_active);
  const allRows = [...upcoming, ...history];
  const estimatedRevenue = allRows.reduce((sum, booking) => {
    if (booking.status !== 'confirmed' && booking.status !== 'completed') return sum;
    const service = services.find((srv) => srv.id === booking.service_id);
    return sum + (service?.price_lkr ?? 0);
  }, 0);

  const total = allRows.length;
  const completed = allRows.filter((booking) => booking.status === 'completed').length;
  const cancelled = allRows.filter((booking) => booking.status === 'cancelled').length;
  const successRatio = total > 0 ? Math.round((completed / Math.max(1, total - cancelled)) * 100) : 100;

  const filterList = (list: AdminBooking[]) => {
    let result = filterByStylist(list, stylistFilter);
    const query = searchQuery.trim().toLowerCase();
    if (query) {
      result = result.filter((booking) => (
        booking.customer_name.toLowerCase().includes(query) ||
        booking.customer_phone.includes(query) ||
        booking.reference.toLowerCase().includes(query)
      ));
    }
    if (statusFilter !== 'all') {
      result = result.filter((booking) => booking.status === statusFilter);
    }
    return result;
  };

  const filteredUpcoming = filterList(upcoming);
  const filteredHistory = [...filterList(history)].reverse();

  const renderBookings = (rows: AdminBooking[], title: string) => {
    if (rows.length === 0) {
      return <EmptyState title={`No ${title.toLowerCase()} records match these filters.`} />;
    }

    return (
      <View style={{ gap: Spacing.sm, marginBottom: Spacing.md }}>
        {rows.map((booking, index) => {
          const start = new Date(booking.starts_at);
          const stylistName = stylistNameFor(stylists, booking.stylist_id) ?? 'Any Chair';
          const serviceName = serviceLabel(services, booking.service_id);
          const canComplete = booking.status === 'confirmed';

          return (
            <FadeUp key={booking.id} index={index} animate={!hasAnimated.current}>
              <Card style={{ borderLeftWidth: 4, borderLeftColor: statusAccent(booking.status, c), gap: Spacing.sm }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: Spacing.sm }}>
                  <View style={{ flex: 1, gap: 3 }}>
                    <Text style={[Type.caption, { color: c.accentText, fontFamily: 'Poppins_600SemiBold' }]}>
                      {dateFmt.format(start)} at {timeFmt.format(start)}
                    </Text>
                    <Text style={[Type.label, { color: c.fg, fontSize: 15, fontFamily: 'Poppins_700Bold' }]} numberOfLines={1}>
                      {booking.customer_name}
                    </Text>
                    <Text style={[Type.caption, { color: c.fgMuted }]} numberOfLines={1}>
                      Ref {booking.reference}
                    </Text>
                  </View>
                  <StatusTag status={booking.status} />
                </View>

                <View style={{ gap: 4 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <IconSymbol name="person.fill" size={13} color={c.fgMuted} />
                    <Text style={[Type.caption, { color: c.fg2, flex: 1 }]} numberOfLines={1}>{stylistName}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <IconSymbol name="tag.fill" size={13} color={c.fgMuted} />
                    <Text style={[Type.caption, { color: c.fg2, flex: 1 }]} numberOfLines={1}>{serviceName}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <IconSymbol name="phone.fill" size={13} color={c.fgMuted} />
                    <Text style={[Type.caption, { color: c.fgMuted, flex: 1 }]} numberOfLines={1}>{booking.customer_phone}</Text>
                  </View>
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: Spacing.xs, borderTopWidth: 1, borderTopColor: c.hairline, paddingTop: Spacing.sm }}>
                  {canComplete ? (
                    <AdminIconAction icon="checkmark" label="Complete booking" tone="success" onPress={() => handleSetStatus(booking.id, 'completed')} />
                  ) : null}
                  <AdminIconAction icon="trash.fill" label="Delete booking" tone="danger" onPress={() => confirmDeleteBooking(booking)} />
                </View>
              </Card>
            </FadeUp>
          );
        })}
      </View>
    );
  };

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
      <ScreenHeader eyebrow="Schedule" title="Bookings" subtitle="Search, filter, complete, and audit appointments." right={<ThemeToggleButton />} />

      <View style={{ flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md }}>
        <AdminStatCard label="Estimated revenue" value={money(estimatedRevenue)} tone="accent" progress={(estimatedRevenue / 50000) * 100} />
        <AdminStatCard label="Completion" value={`${successRatio}%`} detail={`${completed} completed`} tone="neutral" progress={successRatio} />
      </View>

      <Card style={{ marginBottom: Spacing.md, gap: Spacing.sm }}>
        <AdminSectionLabel>Search and Filters</AdminSectionLabel>
        <ThemedTextInput
          placeholder="Search client, phone, or reference"
          value={searchQuery}
          onChangeText={setSearchQuery}
          clearButtonMode="while-editing"
          style={{ marginBottom: 0 }}
        />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -Spacing.md }}>
          <View style={{ flexDirection: 'row', gap: Spacing.xs, paddingHorizontal: Spacing.md }}>
            {STATUS_FILTERS.map((status) => (
              <AdminChip
                key={status.id}
                label={status.name}
                selected={statusFilter === status.id}
                onPress={() => setStatusFilter(status.id)}
              />
            ))}
          </View>
        </ScrollView>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -Spacing.md }}>
          <View style={{ flexDirection: 'row', gap: Spacing.xs, paddingHorizontal: Spacing.md }}>
            {([{ id: null, name: 'All Chairs' }, ...activeStylists] as { id: string | null; name: string }[]).map((stylist) => (
              <AdminChip
                key={stylist.id ?? '__all__'}
                label={stylist.name}
                selected={stylistFilter === stylist.id}
                onPress={() => setStylistFilter(stylist.id)}
              />
            ))}
          </View>
        </ScrollView>
      </Card>

      {!!error && (
        <Text style={[Type.caption, { color: c.error, marginBottom: Spacing.sm, fontFamily: 'Poppins_600SemiBold' }]}>{error}</Text>
      )}

      <SectionHeader eyebrow="Calendar" title="Upcoming Schedule" />
      {renderBookings(filteredUpcoming, 'Upcoming')}

      <SectionHeader eyebrow="Archive" title="History Ledger" />
      {renderBookings(filteredHistory, 'History')}
    </ScreenContainer>
  );
}
