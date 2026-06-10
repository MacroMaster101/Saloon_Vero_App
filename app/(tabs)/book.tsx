import { useEffect, useState } from 'react';
import { Text, View, Platform } from 'react-native';
import { router } from 'expo-router';
import { getBookableServices } from '@/lib/api/queries';
import { ServiceCard } from '@/components/services/service-card';
import { GuestHeader } from '@/components/auth/guest-header';
import { ScreenContainer } from '@/components/ui/screen';
import { SectionHeader } from '@/components/ui/section-header';
import { useSession } from '@/context/session';
import { LoadingScreen } from '@/components/ui/loading';
import { ThemedTextInput } from '@/components/ui/text-input';
import { useTheme } from '@/hooks/use-theme';
import type { Service } from '@/types/database';

type Category = 'all' | 'hair' | 'beauty';

export default function Book() {
  const { c, Radius, Spacing, Type, scheme } = useTheme();
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

  const isIOS = Platform.OS === 'ios';

  return (
    <ScreenContainer>
      {isGuest && <GuestHeader />}
      <SectionHeader eyebrow="Appointments" title="Book a service" />
      <ThemedTextInput label="Search services" placeholder="Cut, colour, facial..." value={query} onChangeText={setQuery} />
      <View style={{ flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg }}>
        {(['all', 'hair', 'beauty'] as Category[]).map((item) => {
          const selected = item === category;
          const pillBg = selected 
            ? c.accentDark 
            : isIOS
              ? (scheme === 'dark' ? 'rgba(255, 255, 255, 0.03)' : 'rgba(255, 255, 255, 0.55)')
              : (scheme === 'dark' ? '#1E1712' : '#FFFFFF');
          const pillBorder = selected 
            ? c.accentDark 
            : isIOS
              ? (scheme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(184, 116, 42, 0.15)')
              : (scheme === 'dark' ? '#2E251E' : '#EBE2CF');
          const textColor = selected ? '#FFFFFF' : c.fg;

          return (
            <Text
              key={item}
              onPress={() => setCategory(item)}
              style={[
                Type.label,
                {
                  flex: 1,
                  textAlign: 'center',
                  textTransform: 'capitalize',
                  color: textColor,
                  backgroundColor: pillBg,
                  borderColor: pillBorder,
                  borderWidth: 1,
                  borderRadius: Radius.pill,
                  paddingVertical: Spacing.sm - 2,
                  fontFamily: 'Poppins_600SemiBold',
                  overflow: 'hidden',
                },
              ]}>
              {item}
            </Text>
          );
        })}
      </View>
      {visibleServices.length === 0 ? (
        <Text style={[Type.body, { color: c.fgMuted }]}>No services match your search.</Text>
      ) : visibleServices.map((s) => <ServiceCard key={s.id} service={s} onPress={() => router.push(`/booking/${s.id}`)} />)}
    </ScreenContainer>
  );
}
