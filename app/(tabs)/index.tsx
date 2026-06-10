import { useCallback, useEffect, useState } from 'react';
import { Pressable, View, Text, RefreshControl } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { router } from 'expo-router';
import { getMyBookings, getServices, getStylists } from '@/lib/api/queries';
import { ServiceCard } from '@/components/services/service-card';
import { StylistCard } from '@/components/stylists/stylist-card';
import { Card } from '@/components/ui/card';
import { ScreenContainer } from '@/components/ui/screen';
import { SectionHeader } from '@/components/ui/section-header';
import { useTheme } from '@/hooks/use-theme';
import { useSession } from '@/context/session';
import { LoadingScreen } from '@/components/ui/loading';
import type { Service, Stylist } from '@/types/database';

type BookingPreview = { reference: string; starts_at: string; status: string };
const whenFmt = new Intl.DateTimeFormat('en-LK', { timeZone: 'Asia/Colombo', weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true });

export default function Home() {
  const { c, Radius, Type, Spacing, scheme } = useTheme();
  const { user, loading: sessionLoading } = useSession();
  const [services, setServices] = useState<Service[]>([]);
  const [stylists, setStylists] = useState<Stylist[]>([]);
  const [bookings, setBookings] = useState<BookingPreview[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
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

  if (sessionLoading || loading || !user) {
    return <LoadingScreen message="Loading Saloon Vero..." />;
  }

  const firstName = ((user.user_metadata?.full_name as string | undefined) ?? user.email ?? 'there').split(' ')[0];
  const upcoming = bookings.find((booking) => booking.status === 'confirmed' && new Date(booking.starts_at).getTime() >= Date.now());

  return (
    <ScreenContainer refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} tintColor={c.accent} />}>
      <View style={{ marginBottom: Spacing.sm }}>
        <Text style={[Type.eyebrow, { color: c.accentText, letterSpacing: 1.5 }]}>WELCOME BACK</Text>
        <Text style={[Type.h1, { color: c.fg }]}>Hi, {firstName}</Text>
        <Text style={[Type.body, { color: c.fg2 }]}>Cuts, colour and care booked in seconds.</Text>
      </View>

      <Card style={{ backgroundColor: c.accentTint, borderColor: c.accent, marginBottom: Spacing.md, padding: Spacing.md }}>
        <Text style={[Type.eyebrow, { color: c.accentText, letterSpacing: 1.5, textTransform: 'uppercase', fontFamily: 'Poppins_600SemiBold' }]}>Saloon Vero</Text>
        <Text style={[Type.h2, { color: c.fg, marginTop: 4, letterSpacing: 0.2 }]}>Redefine Your Look</Text>
        <Text style={[Type.body, { color: c.fg2, marginTop: 4, fontSize: 14 }]}>Premium styling, real-time appointments, and stylists ready for your next visit.</Text>
      </Card>
 
      <SectionHeader eyebrow="Next up" title="Upcoming booking" />
      <Card style={{ marginBottom: Spacing.sm, borderColor: upcoming ? c.accent : 'rgba(255,255,255,0.1)' }}>
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
 
      <SectionHeader eyebrow="Shortcuts" title="Quick actions" />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.sm }}>
        {[
          ['Book Now', '/(tabs)/book', '✂️'],
          ['View Schedules', '/(tabs)/schedules', '📅'],
          ['New Things', '/(tabs)/new-things', '✨'],
        ].map(([label, href, icon]) => (
          <Pressable
            key={label}
            onPress={() => router.push(href as never)}
            android_ripple={{ color: scheme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(184, 116, 42, 0.12)' }}
            style={{ 
              width: '48%', 
              borderRadius: Radius.md, 
              backgroundColor: scheme === 'dark' ? 'rgba(255, 255, 255, 0.04)' : 'rgba(255, 255, 255, 0.55)', 
              borderWidth: 1, 
              borderColor: scheme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(184, 116, 42, 0.15)', 
              padding: Spacing.md,
              flexDirection: 'row',
              alignItems: 'center',
              gap: Spacing.sm
            }}>
            <Text style={{ fontSize: 18 }}>{icon}</Text>
            <Text style={[Type.label, { color: c.fg, flex: 1, fontSize: 13, fontFamily: 'Poppins_600SemiBold' }]}>{label}</Text>
          </Pressable>
        ))}
      </View>

      <SectionHeader eyebrow="Services" title="What we offer" />
      {services.map((s, i) => (
        <Animated.View key={s.id} entering={FadeInDown.delay(i * 50).springify()}>
          <ServiceCard service={s} onPress={() => router.push(`/booking/${s.id}`)} />
        </Animated.View>
      ))}
      <SectionHeader eyebrow="Our team" title="Meet the stylists" />
      {stylists.map((s, i) => (
        <Animated.View key={s.id} entering={FadeInDown.delay(i * 50).springify()}>
          <StylistCard stylist={s} />
        </Animated.View>
      ))}
    </ScreenContainer>
  );
}
