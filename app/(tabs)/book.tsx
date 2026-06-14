import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { getBookableServices } from '@/lib/api/queries';
import { ServiceCard } from '@/components/services/service-card';
import { GuestHeader } from '@/components/auth/guest-header';
import { ScreenContainer } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { SectionHeader } from '@/components/ui/section-header';
import { ThemeToggleButton } from '@/components/ui/theme-toggle-button';
import { useSession } from '@/context/session';
import { LoadingScreen } from '@/components/ui/loading';
import { SkeletonCard } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { FadeUp } from '@/components/ui/fade-up';
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
  const [viewLayout, setViewLayout] = useState<'grid' | 'row'>('grid');

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

  if (loading || (!user && !isGuest)) {
    return <LoadingScreen message="Verifying access..." />;
  }

  return (
    <ScreenContainer safeTop={false}>
      <ScreenHeader eyebrow="SERVICES" title="Book a visit" right={<ThemeToggleButton />} />
      {isGuest && <GuestHeader />}
      <SectionHeader number={1} eyebrow="Appointments" title="Book a service" />
      <ThemedTextInput label="Search services" placeholder="Cut, colour, facial..." value={query} onChangeText={setQuery} />
      
      {/* Category selector + Layout Switcher */}
      <View style={{ flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg, alignItems: 'center' }}>
        <View style={{ flexDirection: 'row', flex: 1, gap: Spacing.xs }}>
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
                      fontSize: 12,
                    },
                  ]}>
                  {item}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Divider line */}
        <View style={{ width: 1, height: 24, backgroundColor: c.hairline, marginHorizontal: Spacing.xs - 2 }} />

        {/* Layout switcher buttons */}
        <View style={{ flexDirection: 'row', gap: 2, backgroundColor: c.bg2, borderRadius: Radius.pill, padding: 2 }}>
          <Pressable
            onPress={() => setViewLayout('grid')}
            accessibilityRole="button"
            accessibilityLabel="Grid View"
            style={{
              padding: 6,
              borderRadius: Radius.pill,
              backgroundColor: viewLayout === 'grid' ? c.surfaceRaised : 'transparent',
            }}
          >
            <MaterialIcons name="grid-view" size={18} color={viewLayout === 'grid' ? c.accentDark : c.fgMuted} />
          </Pressable>
          <Pressable
            onPress={() => setViewLayout('row')}
            accessibilityRole="button"
            accessibilityLabel="List View"
            style={{
              padding: 6,
              borderRadius: Radius.pill,
              backgroundColor: viewLayout === 'row' ? c.surfaceRaised : 'transparent',
            }}
          >
            <MaterialIcons name="view-list" size={18} color={viewLayout === 'row' ? c.accentDark : c.fgMuted} />
          </Pressable>
        </View>
      </View>

      {servicesLoading ? (
        <SkeletonCard count={4} layout={viewLayout} />
      ) : visibleServices.length === 0 ? (
        <EmptyState icon="✂️" title="No services found" caption="No services match your search." />
      ) : viewLayout === 'grid' ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md, paddingBottom: Spacing.xl }}>
          {visibleServices.map((s, i) => (
            <FadeUp key={s.id} index={i} style={{ width: '47.5%', marginBottom: Spacing.xs }}>
              <ServiceCard service={s} layout="grid" onPress={() => router.push(`/booking/${s.id}`)} />
            </FadeUp>
          ))}
        </View>
      ) : (
        <View style={{ paddingBottom: Spacing.xl }}>
          {visibleServices.map((s, i) => (
            <FadeUp key={s.id} index={i}>
              <ServiceCard service={s} layout="row" onPress={() => router.push(`/booking/${s.id}`)} />
            </FadeUp>
          ))}
        </View>
      )}
    </ScreenContainer>
  );
}

