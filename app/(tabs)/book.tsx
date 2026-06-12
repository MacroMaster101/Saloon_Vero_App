import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { router } from 'expo-router';
import { getBookableServices } from '@/lib/api/queries';
import { ServiceCard } from '@/components/services/service-card';
import { GuestHeader } from '@/components/auth/guest-header';
import { ScreenContainer } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { SectionHeader } from '@/components/ui/section-header';
import { ThemeToggleButton } from '@/components/ui/theme-toggle-button';
import { useSession } from '@/context/session';
import { LoadingScreen } from '@/components/ui/loading';
import { ThemedTextInput } from '@/components/ui/text-input';
import { useTheme } from '@/hooks/use-theme';
import type { Service } from '@/types/database';

type Category = 'all' | 'hair' | 'beauty';

export default function Book() {
  const { c, Radius, Spacing, Type } = useTheme();
  const { user, isGuest, loading } = useSession();
  const [services, setServices] = useState<Service[]>([]);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<Category>('all');
  const [servicesLoading, setServicesLoading] = useState(true);

  useEffect(() => {
    getBookableServices().then((rows) => {
      setServices(rows);
      setServicesLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!loading && !user && !isGuest) router.replace('/access' as never);
  }, [loading, user, isGuest]);

  const visibleServices = services.filter((service) => {
    const matchesCategory = category === 'all' || service.category === category;
    const text = `${service.name} ${service.description}`.toLowerCase();
    return matchesCategory && text.includes(query.trim().toLowerCase());
  });

  if (loading || servicesLoading || (!user && !isGuest)) {
    return <LoadingScreen message="Verifying access..." />;
  }

  return (
    <ScreenContainer>
      <ScreenHeader eyebrow="SERVICES" title="Book a visit" right={<ThemeToggleButton />} />
      {isGuest && <GuestHeader />}
      <SectionHeader number={1} eyebrow="Appointments" title="Book a service" />
      <ThemedTextInput label="Search services" placeholder="Cut, colour, facial..." value={query} onChangeText={setQuery} />
      <View style={{ flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg }}>
        {(['all', 'hair', 'beauty'] as Category[]).map((item) => {
          const selected = item === category;
          return (
            <Pressable
              key={item}
              onPress={() => setCategory(item)}
              accessibilityRole="button"
              accessibilityState={{ selected: item === category }}
              style={{
                flex: 1,
                alignItems: 'center',
                backgroundColor: selected ? c.accentDark : c.surfaceRaised,
                borderColor: selected ? c.accentDark : c.hairline,
                borderWidth: 1,
                borderRadius: Radius.pill,
                paddingVertical: Spacing.sm - 2,
                overflow: 'hidden',
              }}>
              <Text
                style={[
                  Type.label,
                  {
                    textAlign: 'center',
                    textTransform: 'capitalize',
                    color: selected ? c.bg : c.fg,
                    fontFamily: 'Poppins_600SemiBold',
                  },
                ]}>
                {item}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {visibleServices.length === 0 ? (
        <Text style={[Type.body, { color: c.fgMuted }]}>No services match your search.</Text>
      ) : visibleServices.map((s, i) => (
        <Animated.View key={s.id} entering={FadeInDown.delay(i * 60).duration(380)}>
          <ServiceCard service={s} onPress={() => router.push(`/booking/${s.id}`)} />
        </Animated.View>
      ))}
    </ScreenContainer>
  );
}
