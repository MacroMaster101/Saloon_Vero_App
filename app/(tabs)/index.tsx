import { useEffect, useState } from 'react';
import { View, Text, RefreshControl } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { router } from 'expo-router';
import { getServices, getStylists } from '@/lib/api/queries';
import { ServiceCard } from '@/components/services/service-card';
import { StylistCard } from '@/components/stylists/stylist-card';
import { ScreenContainer } from '@/components/ui/screen';
import { SectionHeader } from '@/components/ui/section-header';
import { useTheme } from '@/hooks/use-theme';
import { LoadingScreen } from '@/components/ui/loading';
import type { Service, Stylist } from '@/types/database';

export default function Home() {
  const { c, Type, Spacing } = useTheme();
  const [services, setServices] = useState<Service[]>([]);
  const [stylists, setStylists] = useState<Stylist[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  async function load() {
    setServices(await getServices());
    setStylists(await getStylists());
  }

  useEffect(() => {
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
  }, []);

  if (loading) {
    return <LoadingScreen message="Loading Saloon Vero..." />;
  }

  return (
    <ScreenContainer refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} tintColor={c.accent} />}>
      <View style={{ marginBottom: Spacing.sm }}>
        <Text style={[Type.eyebrow, { color: c.accentText, letterSpacing: 1.5 }]}>BOOK YOUR LOOK</Text>
        <Text style={[Type.h1, { color: c.fg }]}>Saloon Vero</Text>
        <Text style={[Type.body, { color: c.fg2 }]}>Cuts, colour & care — booked in seconds.</Text>
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
