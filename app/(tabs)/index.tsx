import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, View, Text, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { getMyBookings, getServices, getStylists } from '@/lib/api/queries';
import { ServiceCard } from '@/components/services/service-card';
import { StylistCard } from '@/components/stylists/stylist-card';
import { Card } from '@/components/ui/card';
import { ScreenContainer } from '@/components/ui/screen';
import { SectionHeader } from '@/components/ui/section-header';
import { ScreenHeader } from '@/components/ui/screen-header';
import { FadeUp } from '@/components/ui/fade-up';
import { PressableScale } from '@/components/ui/pressable-scale';
import { useTheme } from '@/hooks/use-theme';
import { useSession } from '@/context/session';
import { LoadingScreen } from '@/components/ui/loading';
import type { Service, Stylist } from '@/types/database';

type BookingPreview = { reference: string; starts_at: string; status: string };
const whenFmt = new Intl.DateTimeFormat('en-LK', { timeZone: 'Asia/Colombo', weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true });

export default function Home() {
  const { c, Radius, Type, Spacing, Shadow } = useTheme();
  const { user, loading: sessionLoading } = useSession();
  const [services, setServices] = useState<Service[]>([]);
  const [stylists, setStylists] = useState<Stylist[]>([]);
  const [bookings, setBookings] = useState<BookingPreview[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const hasAnimated = useRef(false);
  const userId = user?.id;

  const load = useCallback(async () => {
    const [serviceRows, stylistRows, bookingRows] = await Promise.all([
      getServices(),
      getStylists(),
      userId ? getMyBookings(userId) : Promise.resolve([]),
    ]);
    setServices(serviceRows);
    setStylists(stylistRows);
    setBookings(bookingRows as BookingPreview[]);
  }, [userId]);

  useEffect(() => {
    if (!sessionLoading && !user) {
      router.replace('/access' as never);
      return;
    }
    if (sessionLoading || !user) return;
    const start = Date.now();
    load().then(() => {
      const diff = Date.now() - start;
      const minDelay = 800; // Enforce minimum 800ms display for smooth aesthetics
      if (diff < minDelay) {
        setTimeout(() => setLoading(false), minDelay - diff);
      } else {
        setLoading(false);
      }
    });
  }, [sessionLoading, user, load]);

  // Flip after the first data render commits so the initial cascade plays once,
  // and pull-to-refresh re-renders don't replay it.
  useEffect(() => {
    if (!loading) hasAnimated.current = true;
  }, [loading]);

  if (sessionLoading || loading || !user) {
    return <LoadingScreen message="Loading Saloon Vero..." />;
  }

  const firstName = ((user.user_metadata?.full_name as string | undefined) ?? user.email ?? 'there').split(' ')[0];
  const upcoming = bookings.find((booking) => booking.status === 'confirmed' && new Date(booking.starts_at).getTime() >= Date.now());

  return (
    <ScreenContainer safeTop={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} tintColor={c.accent} />}>
      <ScreenHeader eyebrow="WELCOME BACK" title={`Hi, ${firstName}`} subtitle="Cuts, colour and care — booked in seconds." />

      <LinearGradient
        colors={[c.accentTint, c.bg2]}
        style={{
          borderWidth: 1,
          borderColor: c.accent,
          borderRadius: Radius.xl,
          padding: Spacing.lg,
          marginBottom: Spacing.md,
          ...Shadow.md,
        }}
      >
        <Text style={[Type.eyebrow, { color: c.accentText, letterSpacing: 1.5, textTransform: 'uppercase', fontFamily: 'Poppins_600SemiBold' }]}>Saloon Vero</Text>
        <Text style={[Type.h2, { color: c.fg, marginTop: Spacing.xs, letterSpacing: 0.2 }]}>Redefine Your Look</Text>
        <Text style={[Type.body, { color: c.fg2, marginTop: Spacing.xs, fontSize: 14 }]}>Premium styling, real-time appointments, and stylists ready for your next visit.</Text>
        <Pressable
          onPress={() => router.push('/(tabs)/book')}
          style={{
            alignSelf: 'flex-start',
            marginTop: Spacing.md,
            backgroundColor: c.fg,
            borderRadius: Radius.pill,
            paddingHorizontal: Spacing.md,
            paddingVertical: Spacing.sm,
          }}
        >
          <Text style={[Type.label, { color: c.bg, fontFamily: 'Poppins_600SemiBold', fontSize: 13 }]}>Book now</Text>
        </Pressable>
      </LinearGradient>

      <SectionHeader number={1} eyebrow="Next up" title="Upcoming booking" />
      <Card accent={!!upcoming} style={{ marginBottom: Spacing.sm }}>
        {upcoming ? (
          <View style={{ gap: Spacing.xs }}>
            <Text style={[Type.label, { color: c.fg, fontSize: 16 }]}>{upcoming.reference}</Text>
            <Text style={[Type.body, { color: c.fg2 }]}>{whenFmt.format(new Date(upcoming.starts_at))}</Text>
            <Text onPress={() => router.push('/(tabs)/schedules' as never)} style={[Type.label, { color: c.accentText, marginTop: Spacing.xs, fontFamily: 'Poppins_600SemiBold' }]}>View schedule ›</Text>
          </View>
        ) : (
          <View style={{ gap: Spacing.xs }}>
            <Text style={[Type.label, { color: c.fg, fontSize: 16 }]}>No upcoming appointment</Text>
            <Text style={[Type.caption, { color: c.fgMuted }]}>Choose a service and lock in your preferred time.</Text>
          </View>
        )}
      </Card>

      <SectionHeader number={2} eyebrow="Shortcuts" title="Quick actions" />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.sm }}>
        {([
          ['Book Now', '/(tabs)/book', '✂️'],
          ['View Schedules', '/(tabs)/schedules', '📅'],
          ['New Things', '/(tabs)/new-things', '✨'],
        ] as const).map(([label, href, icon], index) => (
          <FadeUp key={label} index={index} animate={!hasAnimated.current} style={{ width: '48%' }}>
            <PressableScale
              onPress={() => router.push(href as never)}
              style={{
                borderRadius: Radius.md,
                backgroundColor: c.surfaceRaised,
                borderWidth: 1,
                borderColor: c.hairline,
                padding: Spacing.md,
                flexDirection: 'row',
                alignItems: 'center',
                gap: Spacing.sm,
              }}>
              <Text style={{ fontSize: 18 }}>{icon}</Text>
              <Text style={[Type.label, { color: c.fg, flex: 1, fontSize: 13, fontFamily: 'Poppins_600SemiBold' }]}>{label}</Text>
            </PressableScale>
          </FadeUp>
        ))}
      </View>

      <SectionHeader number={3} eyebrow="Services" title="What we offer" />
      {services.map((s, i) => (
        <FadeUp key={s.id} index={i} animate={!hasAnimated.current}>
          <ServiceCard service={s} onPress={() => router.push(`/booking/${s.id}`)} />
        </FadeUp>
      ))}
      <SectionHeader number={4} eyebrow="Our team" title="Meet the stylists" />
      {stylists.map((s, i) => (
        <FadeUp key={s.id} index={i} animate={!hasAnimated.current}>
          <StylistCard stylist={s} />
        </FadeUp>
      ))}
    </ScreenContainer>
  );
}
