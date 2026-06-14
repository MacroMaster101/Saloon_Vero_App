import { useCallback, useEffect, useRef, useState } from 'react';
import { RefreshControl, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { getAllBookings, getServicesAdmin, getStylistsAdmin } from '@/lib/api/admin';
import type { AdminBooking } from '@/lib/api/admin';
import { setBookingStatus } from '@/lib/api/staff';
import type { AdminBookingStatus } from '@/lib/api/staff';
import { applyStatus, colomboDayWindow, nextUp, serviceLabel } from '@/lib/staff/bookings-view';
import { filterByStylist, stylistNameFor } from '@/lib/admin/helpers';
import { money } from '@/lib/utils/format';
import { AdminChip, AdminIconAction, AdminIconBadge, AdminSectionLabel, AdminStatCard } from '@/components/admin/admin-ui';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { FadeUp } from '@/components/ui/fade-up';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { LoadingScreen } from '@/components/ui/loading';
import { PressableScale } from '@/components/ui/pressable-scale';
import { ScreenContainer } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { SectionHeader } from '@/components/ui/section-header';
import { StatusTag } from '@/components/ui/status-tag';
import { ThemeToggleButton } from '@/components/ui/theme-toggle-button';
import { useTheme } from '@/hooks/use-theme';
import type { Service, Stylist } from '@/types/database';

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

const hourFmt = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Colombo',
  hour: '2-digit',
  hour12: false,
});

function ProgressLine({ value, tone = 'accent' }: { value: number; tone?: 'accent' | 'danger' }) {
  const { c, Radius } = useTheme();
  const width = Math.max(0, Math.min(100, value));
  return (
    <View style={{ height: 5, backgroundColor: c.bg2, borderRadius: Radius.pill, overflow: 'hidden' }}>
      <View style={{ width: `${width}%`, height: '100%', backgroundColor: tone === 'danger' ? c.error : c.accent }} />
    </View>
  );
}

function QuickAction({
  icon,
  title,
  caption,
  onPress,
  tone,
}: {
  icon: Parameters<typeof AdminIconBadge>[0]['icon'];
  title: string;
  caption: string;
  onPress: () => void;
  tone: 'accent' | 'neutral' | 'danger' | 'muted';
}) {
  const { c, Spacing, Type } = useTheme();
  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole="button"
      style={{ flex: 1 }}
    >
      <Card style={{ minHeight: 96, gap: Spacing.sm }}>
        <AdminIconBadge icon={icon} tone={tone} size={34} />
        <View style={{ gap: 2 }}>
          <Text style={[Type.label, { color: tone === 'danger' ? c.error : c.fg, fontFamily: 'Poppins_600SemiBold' }]} numberOfLines={1}>
            {title}
          </Text>
          <Text style={[Type.caption, { color: c.fgMuted }]} numberOfLines={2}>
            {caption}
          </Text>
        </View>
      </Card>
    </PressableScale>
  );
}

export default function AdminToday() {
  const { c, Radius, Spacing, Type, scheme } = useTheme();

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
    const [bookingRows, serviceRows, stylistRows] = await Promise.all([
      getAllBookings({ from, to }),
      getServicesAdmin(),
      getStylistsAdmin(),
    ]);
    setBookings(bookingRows);
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
    const prev = bookings;
    setBookings(applyStatus(bookings, id, status) as AdminBooking[]);
    const res = await setBookingStatus(id, status);
    if ('error' in res) {
      setBookings(prev);
      setError("Couldn't update status. Please try again.");
    } else {
      setError(null);
      load();
    }
  };

  if (initialLoading) return <LoadingScreen message="Loading console..." />;

  const now = new Date().toISOString();
  const dayTitle = dayTitleFmt.format(new Date());
  const visible = filterByStylist(bookings, stylistFilter);
  const nextBooking = nextUp(visible, now);
  const activeStylists = stylists.filter((s) => s.is_active);

  const estimatedRevenue = bookings.reduce((sum, booking) => {
    if (booking.status !== 'confirmed' && booking.status !== 'completed') return sum;
    const service = services.find((srv) => srv.id === booking.service_id);
    return sum + (service?.price_lkr ?? 0);
  }, 0);

  const completedCount = bookings.filter((b) => b.status === 'completed').length;
  const totalCount = bookings.length;
  const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const pendingCount = bookings.filter((b) => b.status === 'confirmed' && b.starts_at > now).length;

  const timeBlocks = [
    { label: 'Morning', hours: [9, 10, 11], count: 0 },
    { label: 'Midday', hours: [12, 13, 14], count: 0 },
    { label: 'Afternoon', hours: [15, 16, 17], count: 0 },
    { label: 'Evening', hours: [18, 19, 20], count: 0 },
  ];

  bookings.forEach((booking) => {
    if (booking.status === 'cancelled') return;
    const hour = Number(hourFmt.format(new Date(booking.starts_at)));
    timeBlocks.forEach((block) => {
      if (block.hours.includes(hour)) block.count += 1;
    });
  });

  const maxBlockCount = Math.max(...timeBlocks.map((t) => t.count), 1);
  const teamWorkload = activeStylists.map((stylist) => {
    const count = bookings.filter((booking) => booking.stylist_id === stylist.id && booking.status !== 'cancelled').length;
    return {
      name: stylist.name,
      count,
      percentage: Math.min(100, (count / 6) * 100),
    };
  });

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
        eyebrow="Backoffice"
        title="Overview"
        subtitle={`${dayTitle}. Completion rate is ${completionRate}% today.`}
        right={<ThemeToggleButton />}
      />

      <View style={{ gap: Spacing.sm, marginBottom: Spacing.lg }}>
        <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
          <AdminStatCard label="Estimated revenue" value={money(estimatedRevenue)} tone="accent" progress={(estimatedRevenue / 15000) * 100} />
          <AdminStatCard label="Today's schedule" value={String(totalCount)} detail="bookings" tone="neutral" progress={completionRate} />
        </View>
        <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
          <AdminStatCard label="Pending queue" value={String(pendingCount)} detail="future confirmed" tone="accent" progress={totalCount ? (pendingCount / totalCount) * 100 : 0} />
          <AdminStatCard label="Staff floor" value={String(activeStylists.length)} detail="active chairs" tone="neutral" progress={stylists.length ? (activeStylists.length / stylists.length) * 100 : 0} />
        </View>
      </View>

      <View style={{ gap: Spacing.md, marginBottom: Spacing.lg }}>
        <Card style={{ gap: Spacing.sm }}>
          <AdminSectionLabel>Salon Density</AdminSectionLabel>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 104, paddingTop: Spacing.xs }}>
            {timeBlocks.map((block) => {
              const height = Math.max(4, (block.count / maxBlockCount) * 74);
              return (
                <View key={block.label} style={{ flex: 1, alignItems: 'center', gap: 5 }}>
                  <Text style={[Type.caption, { color: c.fg, fontFamily: 'Poppins_600SemiBold' }]}>{block.count}</Text>
                  <View style={{ width: 24, height: 74, justifyContent: 'flex-end', backgroundColor: c.bg2, borderRadius: Radius.sm, overflow: 'hidden' }}>
                    {block.count > 0 ? (
                      <LinearGradient
                        colors={[c.accent, c.accentDark]}
                        style={{ width: '100%', height }}
                      />
                    ) : null}
                  </View>
                  <Text style={[Type.caption, { color: c.fgMuted, fontSize: 10 }]} numberOfLines={1}>
                    {block.label}
                  </Text>
                </View>
              );
            })}
          </View>
        </Card>

        <Card style={{ gap: Spacing.sm }}>
          <AdminSectionLabel>Stylist Capacity</AdminSectionLabel>
          {teamWorkload.length === 0 ? (
            <Text style={[Type.caption, { color: c.fgMuted }]}>No active stylists configured.</Text>
          ) : teamWorkload.map((item) => (
            <View key={item.name} style={{ gap: 5 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.sm }}>
                <Text style={[Type.caption, { color: c.fg, fontFamily: 'Poppins_600SemiBold', flex: 1 }]} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={[Type.caption, { color: c.fgMuted }]}>{item.count} bookings</Text>
              </View>
              <ProgressLine value={item.percentage} tone={item.percentage > 70 ? 'danger' : 'accent'} />
            </View>
          ))}
        </Card>
      </View>

      <AdminSectionLabel>Operations Control</AdminSectionLabel>
      <View style={{ gap: Spacing.sm, marginBottom: Spacing.lg }}>
        <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
          <QuickAction icon="plus.circle.fill" title="Walk-in" caption="Register an immediate booking" tone="accent" onPress={() => router.push('/(admin)/walk-in' as never)} />
          <QuickAction icon="person.fill" title="Team" caption="Manage stylists and chairs" tone="neutral" onPress={() => router.push('/(admin)/more/stylists' as never)} />
        </View>
        <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
          <QuickAction icon="calendar" title="Blocks" caption="Hold time or chairs" tone="danger" onPress={() => router.push('/(admin)/more/blocked-slots' as never)} />
          <QuickAction icon="tag.fill" title="Services" caption="Edit pricing and duration" tone="muted" onPress={() => router.push('/(admin)/more/services' as never)} />
        </View>
      </View>

      <SectionHeader eyebrow="Next Up" title="On Deck Appointment" />
      {nextBooking ? (
        <Card accent style={{ marginBottom: Spacing.lg, borderLeftWidth: 4, borderLeftColor: c.accent, padding: 0, overflow: 'hidden' }}>
          <LinearGradient
            colors={scheme === 'dark' ? ['rgba(217, 166, 72, 0.08)', 'rgba(30, 28, 25, 0.8)'] : ['rgba(168, 122, 46, 0.04)', '#FFFFFF']}
            style={{ padding: Spacing.md, gap: Spacing.sm }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: Spacing.md }}>
              <View style={{ flex: 1, gap: 4 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <IconSymbol name="clock.fill" size={13} color={c.accent} />
                  <Text style={[Type.caption, { color: c.accentText, fontFamily: 'Poppins_600SemiBold' }]}>
                    {timeFmt.format(new Date(nextBooking.starts_at))} - {timeFmt.format(new Date(nextBooking.ends_at))}
                  </Text>
                </View>
                <Text style={[Type.h2, { color: c.fg, fontFamily: 'Poppins_700Bold' }]} numberOfLines={1}>
                  {nextBooking.customer_name}
                </Text>
                <Text style={[Type.caption, { color: c.fg2 }]} numberOfLines={1}>
                  {serviceLabel(services, nextBooking.service_id)}
                </Text>
                <Text style={[Type.caption, { color: c.fgMuted }]} numberOfLines={1}>
                  {stylistNameFor(stylists, (nextBooking as AdminBooking).stylist_id) ?? 'Any Staff'}
                </Text>
              </View>
              <PressableScale
                onPress={() => router.push('/(admin)/bookings' as never)}
                accessibilityRole="button"
                style={{ backgroundColor: c.accentDark, borderRadius: Radius.sm, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs + 2 }}
              >
                <Text style={[Type.caption, { color: c.bg, fontFamily: 'Poppins_600SemiBold' }]}>View</Text>
              </PressableScale>
            </View>
          </LinearGradient>
        </Card>
      ) : (
        <Card style={{ marginBottom: Spacing.lg }}>
          <Text style={[Type.caption, { color: c.fgMuted }]}>No remaining appointments today.</Text>
        </Card>
      )}

      <SectionHeader eyebrow="Today's Timeline" title="Schedule Ledger" />

      {!!error && (
        <Text style={[Type.caption, { color: c.error, marginBottom: Spacing.sm, fontFamily: 'Poppins_600SemiBold' }]}>{error}</Text>
      )}

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, marginBottom: Spacing.sm }}>
        {([{ id: null, name: 'All Chairs' }, ...activeStylists] as { id: string | null; name: string }[]).map((item) => (
          <AdminChip
            key={item.id ?? '__all__'}
            label={item.name}
            selected={stylistFilter === item.id}
            onPress={() => setStylistFilter(item.id)}
          />
        ))}
      </View>

      {visible.length === 0 ? (
        <EmptyState title="No appointments scheduled for this chair today." />
      ) : (
        <View style={{ gap: Spacing.sm, marginBottom: 80 }}>
          {visible.map((booking, index) => {
            const timeStr = timeFmt.format(new Date(booking.starts_at));
            const stylistName = stylistNameFor(stylists, booking.stylist_id) ?? 'Any Staff';
            const serviceName = serviceLabel(services, booking.service_id);
            const isConfirmed = booking.status === 'confirmed';

            return (
              <FadeUp key={booking.id} index={index} animate={!hasAnimated.current}>
                <Card style={{ gap: Spacing.sm }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: Spacing.sm }}>
                    <View style={{ flex: 1, gap: 3 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <IconSymbol name="clock.fill" size={13} color={c.accent} />
                        <Text style={[Type.caption, { color: c.accentText, fontFamily: 'Poppins_600SemiBold' }]}>{timeStr}</Text>
                      </View>
                      <Text style={[Type.label, { color: c.fg, fontSize: 15, fontFamily: 'Poppins_700Bold' }]} numberOfLines={1}>
                        {booking.customer_name}
                      </Text>
                    </View>
                    <StatusTag status={booking.status} />
                  </View>

                  <View style={{ gap: 4 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <IconSymbol name="tag.fill" size={13} color={c.fgMuted} />
                      <Text style={[Type.caption, { color: c.fg2, flex: 1 }]} numberOfLines={1}>{serviceName}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <IconSymbol name="person.fill" size={13} color={c.fgMuted} />
                      <Text style={[Type.caption, { color: c.fg2, flex: 1 }]} numberOfLines={1}>{stylistName}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <IconSymbol name="phone.fill" size={13} color={c.fgMuted} />
                      <Text style={[Type.caption, { color: c.fgMuted, flex: 1 }]} numberOfLines={1}>{booking.customer_phone}</Text>
                    </View>
                  </View>

                  {!!booking.notes && (
                    <Text style={[Type.caption, { color: c.fgMuted, fontStyle: 'italic' }]} numberOfLines={2}>
                      Notes: {booking.notes}
                    </Text>
                  )}

                  {isConfirmed && (
                    <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: Spacing.xs, borderTopWidth: 1, borderTopColor: c.hairline, paddingTop: Spacing.sm }}>
                      <AdminIconAction icon="checkmark" label="Complete booking" tone="success" onPress={() => handleSetStatus(booking.id, 'completed')} />
                      <AdminIconAction icon="xmark" label="Cancel booking" tone="danger" onPress={() => handleSetStatus(booking.id, 'cancelled')} />
                    </View>
                  )}
                </Card>
              </FadeUp>
            );
          })}
        </View>
      )}
    </ScreenContainer>
  );
}
