import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Linking, Pressable, RefreshControl, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { router, useFocusEffect } from 'expo-router';
import { getBookableServices, getMyBookings, getStylists } from '@/lib/api/queries';
import { getGuestBookings } from '@/lib/storage/guest-bookings';
import { money } from '@/lib/utils/format';
import { useSession } from '@/context/session';
import { GuestHeader } from '@/components/auth/guest-header';
import { Card } from '@/components/ui/card';
import { ScreenContainer } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { SectionHeader } from '@/components/ui/section-header';
import { StatusTag } from '@/components/ui/status-tag';
import { ThemedButton } from '@/components/ui/button';
import { ThemeToggleButton } from '@/components/ui/theme-toggle-button';
import { LoadingScreen } from '@/components/ui/loading';
import { useTheme } from '@/hooks/use-theme';

type UserBookingRow = {
  reference: string;
  starts_at: string;
  status: string;
  service_id: string;
  stylist_id: string | null;
};

type ScheduleBooking = {
  reference: string;
  serviceName: string;
  stylistName: string;
  whenLabel: string;
  status: string;
  priceLkr?: number;
  startsAt?: string;
};

const whenFmt = new Intl.DateTimeFormat('en-LK', {
  timeZone: 'Asia/Colombo',
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
});

function isCancelled(status: string) {
  return status === 'cancelled' || status === 'no_show';
}

function isCompleted(booking: ScheduleBooking) {
  if (booking.status === 'completed') return true;
  if (isCancelled(booking.status) || !booking.startsAt) return false;
  return new Date(booking.startsAt).getTime() < Date.now();
}

function isUpcoming(booking: ScheduleBooking) {
  return !isCancelled(booking.status) && !isCompleted(booking);
}

export default function Schedules() {
  const { c, Radius, Spacing, Type } = useTheme();
  const { user, isGuest, loading } = useSession();
  const [bookings, setBookings] = useState<ScheduleBooking[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const hasAnimated = useRef(false);

  const load = useCallback(async () => {
    if (loading) return;
    if (!user && !isGuest) {
      setInitialLoading(false);
      return;
    }

    if (user) {
      const [rows, services, stylists] = await Promise.all([getMyBookings(user.id), getBookableServices(), getStylists()]);
      const servicesById = new Map(services.map((service) => [service.id, service]));
      const stylistsById = new Map(stylists.map((stylist) => [stylist.id, stylist]));
      setBookings((rows as UserBookingRow[]).map((booking) => {
        const service = servicesById.get(booking.service_id);
        const stylist = booking.stylist_id ? stylistsById.get(booking.stylist_id) : null;
        return {
          reference: booking.reference,
          serviceName: service?.name ?? 'Salon service',
          stylistName: stylist?.name ?? 'Any available stylist',
          whenLabel: whenFmt.format(new Date(booking.starts_at)),
          status: booking.status,
          priceLkr: service?.price_lkr,
          startsAt: booking.starts_at,
        };
      }));
    } else {
      const guestRows = await getGuestBookings();
      setBookings(guestRows.map((booking) => ({
        reference: booking.reference,
        serviceName: booking.serviceName,
        stylistName: booking.stylistName,
        whenLabel: booking.whenLabel,
        status: booking.status,
        priceLkr: booking.priceLkr,
        startsAt: booking.date && booking.time ? `${booking.date}T${booking.time}:00` : undefined,
      })));
    }
    setInitialLoading(false);
  }, [loading, user, isGuest]);

  useFocusEffect(useCallback(() => {
    load();
  }, [load]));

  // Flip after the first data render commits so the initial cascade plays once,
  // and later refresh/focus re-renders don't replay it.
  useEffect(() => {
    if (!initialLoading) hasAnimated.current = true;
  }, [initialLoading]);

  const sections = useMemo(() => [
    { title: 'Upcoming', data: bookings.filter(isUpcoming) },
    { title: 'Completed', data: bookings.filter(isCompleted) },
    { title: 'Cancelled', data: bookings.filter((booking) => isCancelled(booking.status)) },
  ], [bookings]);

  const entering = (i: number) => (hasAnimated.current ? undefined : FadeInDown.delay(i * 60).duration(380));

  if (loading || initialLoading) return <LoadingScreen message="Loading schedules..." />;

  if (!user && !isGuest) {
    return (
      <ScreenContainer scroll={false} style={{ justifyContent: 'center' }}>
        <Card>
          <Text style={[Type.h2, { color: c.fg }]}>Choose access first</Text>
          <Text style={[Type.body, { color: c.fg2, marginTop: Spacing.xs, marginBottom: Spacing.md }]}>
            Continue as a guest or log in to view your schedules.
          </Text>
          <ThemedButton label="Choose Access" onPress={() => router.replace('/access' as never)} />
        </Card>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} tintColor={c.accent} />}>
      <ScreenHeader eyebrow="SCHEDULES" title="Your bookings" right={<ThemeToggleButton />} />
      {isGuest && <GuestHeader />}

      {bookings.length === 0 ? (
        <Card style={{ alignItems: 'center', gap: Spacing.md, marginTop: Spacing.lg, padding: Spacing.lg }}>
          <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: c.accentTint, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: c.accentText, fontSize: 28 }}>+</Text>
          </View>
          <Text style={[Type.h2, { color: c.fg, textAlign: 'center' }]}>No bookings yet</Text>
          <Text style={[Type.body, { color: c.fgMuted, textAlign: 'center', fontSize: 14 }]}>Book a service and your reference will appear here.</Text>
          <ThemedButton label="Book Now" onPress={() => router.push('/(tabs)/book')} style={{ alignSelf: 'stretch', marginTop: Spacing.sm }} />
          {isGuest && <ThemedButton variant="secondary" label="Login / Create Account" onPress={() => router.push('/access' as never)} style={{ alignSelf: 'stretch' }} />}
        </Card>
      ) : sections.map((section, sectionIndex) => (
        <View key={section.title}>
          <SectionHeader number={sectionIndex + 1} title={section.title} />
          {section.data.length === 0 ? (
            <Text style={[Type.caption, { color: c.fgMuted, marginBottom: Spacing.sm }]}>No {section.title.toLowerCase()} bookings.</Text>
          ) : section.data.map((booking, bookingIndex) => (
            <Animated.View key={booking.reference} entering={entering(bookingIndex)}>
              <Card style={{ marginBottom: Spacing.md, gap: Spacing.md }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.md }}>
                  <View style={{ flex: 1 }}>
                    <Text style={[Type.label, { color: c.fg, fontSize: 17, fontFamily: 'Poppins_600SemiBold' }]}>{booking.serviceName}</Text>
                    <Text style={[Type.caption, { color: c.fgMuted, marginTop: 2 }]}>Ref: {booking.reference}</Text>
                  </View>
                  <StatusTag status={booking.status} />
                </View>

                <View style={{
                  borderRadius: Radius.md,
                  backgroundColor: c.surfaceRaised,
                  borderWidth: 1,
                  borderColor: c.hairline,
                  padding: Spacing.md,
                }}>
                  <Text style={[Type.body, { color: c.fg, fontFamily: 'Poppins_600SemiBold' }]}>{booking.whenLabel}</Text>
                  <Text style={[Type.caption, { color: c.fg2, marginTop: 4 }]}>Stylist: {booking.stylistName}</Text>
                  {typeof booking.priceLkr === 'number' && <Text style={[Type.caption, { color: c.accentText, marginTop: 4, fontFamily: 'Poppins_600SemiBold' }]}>Price: {money(booking.priceLkr)}</Text>}
                </View>

                <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
                  <Pressable
                    onPress={() => Linking.openURL('tel:+94771234567')}
                    accessibilityRole="button"
                    style={{
                      flex: 1,
                      borderRadius: Radius.md,
                      borderWidth: 1,
                      borderColor: c.hairline,
                      backgroundColor: c.surfaceRaised,
                      alignItems: 'center',
                      paddingVertical: Spacing.sm + 2,
                    }}>
                    <Text style={[Type.label, { color: c.fg, fontSize: 13, fontFamily: 'Poppins_600SemiBold' }]}>Call salon</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => router.push('/(tabs)/book')}
                    accessibilityRole="button"
                    style={{
                      flex: 1,
                      borderRadius: Radius.md,
                      borderWidth: 1,
                      borderColor: c.accentDark,
                      backgroundColor: c.accentDark,
                      alignItems: 'center',
                      paddingVertical: Spacing.sm + 2,
                    }}>
                    <Text style={[Type.label, { color: c.bg, fontSize: 13, fontFamily: 'Poppins_600SemiBold' }]}>
                      {isGuest ? 'Book again' : 'Reschedule'}
                    </Text>
                  </Pressable>
                </View>
              </Card>
            </Animated.View>
          ))}
        </View>
      ))}

      {isGuest && bookings.length > 0 && (
        <Card style={{ marginTop: Spacing.md, gap: Spacing.sm }}>
          <Text style={[Type.label, { color: c.fg, fontSize: 15, fontFamily: 'Poppins_600SemiBold' }]}>Create an account to save bookings</Text>
          <Text style={[Type.caption, { color: c.fgMuted, marginBottom: Spacing.xs }]}>
            Guest references stay on this device. An account keeps future bookings linked to you.
          </Text>
          <ThemedButton variant="secondary" label="Login / Create Account" onPress={() => router.push('/access' as never)} />
        </Card>
      )}
    </ScreenContainer>
  );
}
