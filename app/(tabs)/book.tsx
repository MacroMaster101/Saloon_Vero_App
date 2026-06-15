import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { Pressable, Text, View, Dimensions, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { PressableScale } from '@/components/ui/pressable-scale';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
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
import { getServiceImage } from '@/lib/utils/service-image';
import { money } from '@/lib/utils/format';
import type { Service } from '@/types/database';

type Category = 'all' | 'hair' | 'beauty';

export default function Book() {
  const { c, Radius, Spacing, Type, Shadow, scheme } = useTheme();
  const { user, isGuest, loading } = useSession();
  const [services, setServices] = useState<Service[]>([]);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<Category>('all');
  const [servicesLoading, setServicesLoading] = useState(true);
  const [viewLayout, setViewLayout] = useState<'grid' | 'row'>('grid');

  // Carousel constants matching stylist slider style
  const screenWidth = Dimensions.get('window').width;
  const CARD_WIDTH = 260;
  const CARD_MARGIN = -25;
  const SNAP_INTERVAL = CARD_WIDTH + 2 * CARD_MARGIN; // 210 center-to-center
  const CAROUSEL_PADDING = (screenWidth - CARD_WIDTH) / 2 - CARD_MARGIN;

  const pickScrollRef = useRef<ScrollView>(null);
  const autoScrollTimerRef = useRef<any>(null);
  const VIRTUAL_REPEATS = 50;

  const [activePickIndex, setActivePickIndex] = useState(0);

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

  const featuredPicks = useMemo(() => {
    if (services.length === 0) return [];
    const picks = services.filter(s => s.is_featured);
    if (picks.length === 0) return services.slice(0, 3);
    return picks;
  }, [services]);

  const virtualPicks = useMemo(() => {
    if (featuredPicks.length === 0) return [];
    return Array(VIRTUAL_REPEATS).fill(featuredPicks).flat();
  }, [featuredPicks]);

  const startAutoScroll = useCallback(() => {
    if (autoScrollTimerRef.current) {
      clearInterval(autoScrollTimerRef.current);
    }
    if (featuredPicks.length <= 1) return;
    autoScrollTimerRef.current = setInterval(() => {
      setActivePickIndex((prev) => {
        const next = prev + 1;
        pickScrollRef.current?.scrollTo({
          x: next * SNAP_INTERVAL,
          animated: true,
        });
        return next;
      });
    }, 4000);
  }, [featuredPicks.length, SNAP_INTERVAL]);

  // Initial scroll to middle index on mount/data load
  useEffect(() => {
    if (!servicesLoading && featuredPicks.length > 0) {
      const mid = Math.floor(VIRTUAL_REPEATS / 2) * featuredPicks.length;
      setActivePickIndex(mid);
      setTimeout(() => {
        pickScrollRef.current?.scrollTo({
          x: mid * SNAP_INTERVAL,
          animated: false,
        });
      }, 100);
      startAutoScroll();
    }
  }, [servicesLoading, featuredPicks.length, SNAP_INTERVAL, startAutoScroll]);

  useEffect(() => {
    return () => {
      if (autoScrollTimerRef.current) clearInterval(autoScrollTimerRef.current);
    };
  }, []);

  const handlePickScrollEnd = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / SNAP_INTERVAL);
    if (index >= 0 && index < virtualPicks.length && index !== activePickIndex) {
      setActivePickIndex(index);
      startAutoScroll();

      // Silent boundary reset: snap back to middle index if close to ends
      const realIdx = index % featuredPicks.length;
      const mid = Math.floor(VIRTUAL_REPEATS / 2) * featuredPicks.length;
      if (index < featuredPicks.length * 3 || index > virtualPicks.length - featuredPicks.length * 3) {
        const nextMiddleIndex = mid + realIdx;
        setActivePickIndex(nextMiddleIndex);
        setTimeout(() => {
          pickScrollRef.current?.scrollTo({
            x: nextMiddleIndex * SNAP_INTERVAL,
            animated: false,
          });
        }, 10);
      }
    } else {
      startAutoScroll();
    }
  };

  if (loading || (!user && !isGuest)) {
    return <LoadingScreen message="Verifying access..." />;
  }

  return (
    <ScreenContainer safeTop={false}>
      <ScreenHeader eyebrow="SERVICES" title="Book a visit" right={isGuest ? <ThemeToggleButton /> : undefined} />
      {isGuest && <GuestHeader />}

      {/* Swipeable Featured Picks Carousel */}
      {!servicesLoading && featuredPicks.length > 0 && (
        <ScrollView
          ref={pickScrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          snapToInterval={SNAP_INTERVAL}
          snapToAlignment="center"
          onMomentumScrollEnd={handlePickScrollEnd}
          style={{ paddingVertical: 12, marginVertical: -12, marginBottom: Spacing.md }}
          contentContainerStyle={{ paddingHorizontal: CAROUSEL_PADDING, paddingBottom: Spacing.sm }}
        >
          {virtualPicks.map((pick, index) => {
            const isActive = index === activePickIndex;
            return (
              <PressableScale
                key={`${pick.id}-${index}`}
                onPress={() => router.push(`/booking/${pick.id}`)}
                accessibilityRole="button"
                accessibilityLabel={`Featured Pick: ${pick.name}`}
                style={{
                  width: CARD_WIDTH,
                  height: 156,
                  marginHorizontal: CARD_MARGIN,
                  transform: [{ scale: isActive ? 1.05 : 0.88 }],
                  zIndex: isActive ? 10 : 5,
                  shadowColor: '#1C1A17',
                  shadowOpacity: isActive ? 0.20 : 0.04,
                  shadowRadius: isActive ? 16 : 6,
                  shadowOffset: { width: 0, height: isActive ? 8 : 3 },
                  elevation: isActive ? 8 : 2,
                }}
              >
                <View
                  style={{
                    flex: 1,
                    borderRadius: Radius.lg,
                    overflow: 'hidden',
                    backgroundColor: c.surfaceRaised,
                    opacity: isActive ? 1 : 0.65,
                  }}
                >
                  <Image
                    source={{ uri: getServiceImage(pick.slug, pick.category) }}
                    style={{ width: '100%', height: '100%' }}
                    contentFit="cover"
                    transition={300}
                  />
                  <LinearGradient
                    colors={['rgba(28, 26, 23, 0.12)', 'rgba(28, 26, 23, 0.88)']}
                    style={{
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      top: 0,
                      bottom: 0,
                      padding: Spacing.md,
                      justifyContent: 'flex-end',
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <View style={{ backgroundColor: c.accent, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 1 }}>
                        <Text style={{ color: '#1C1A17', fontSize: 8, fontFamily: 'Poppins_700Bold' }}>
                          FEATURED
                        </Text>
                      </View>
                      <Text style={{ color: c.accent, fontFamily: 'Poppins_600SemiBold', fontSize: 9, letterSpacing: 0.5 }}>
                        RECOMMENDED LOOK
                      </Text>
                    </View>
                    <Text style={{ color: '#FAFAF8', fontFamily: 'Poppins_700Bold', fontSize: 16 }} numberOfLines={1}>
                      {pick.name}
                    </Text>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
                      <Text style={{ color: 'rgba(250, 250, 248, 0.85)', fontFamily: 'Poppins_500Medium', fontSize: 11 }}>
                        {money(pick.price_lkr)} • {pick.duration_min} min
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                        <Text style={{ color: c.accent, fontFamily: 'Poppins_600SemiBold', fontSize: 11 }}>
                          Book Now
                        </Text>
                        <MaterialIcons name="chevron-right" size={14} color={c.accent} />
                      </View>
                    </View>
                  </LinearGradient>
                  {/* Border overlay to ensure border is never hidden or clipped by image */}
                  <View
                    pointerEvents="none"
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      borderRadius: Radius.lg,
                      borderWidth: isActive ? 2 : 1,
                      borderColor: isActive ? c.accent : c.hairline,
                    }}
                  />
                </View>
              </PressableScale>
            );
          })}
        </ScrollView>
      )}

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
                  ...Shadow.sm,
                }}>
                <Text
                  style={[
                    Type.label,
                    {
                      textAlign: 'center',
                      textTransform: 'capitalize',
                      color: selected ? (scheme === 'dark' ? '#1C1A17' : '#FFFFFF') : c.fg,
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

