import { useEffect, useMemo, useRef, useState } from 'react';
import { Text, View, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { getBookableServices, getGallery } from '@/lib/api/queries';
import { money } from '@/lib/utils/format';
import { ScreenContainer } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { SectionHeader } from '@/components/ui/section-header';
import { ServiceCard } from '@/components/services/service-card';
import { SkeletonCard } from '@/components/ui/skeleton';
import { FadeUp } from '@/components/ui/fade-up';
import { PressableScale } from '@/components/ui/pressable-scale';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useTheme } from '@/hooks/use-theme';
import { getServiceImage } from '@/lib/utils/service-image';
import type { GalleryItem, Service } from '@/types/database';

const updates = [
  {
    title: 'Weekday Glow Deal',
    body: 'Save 15% on colour touch-ups before 3 PM.',
    cta: 'Book colour',
    image: 'https://images.unsplash.com/photo-1620331311520-246422fd82f9?w=300&auto=format&fit=crop&q=80',
  },
  {
    title: 'Seasonal Hair Spa',
    body: 'Repair, smooth, and shine package for dry-weather hair.',
    cta: 'Book treatment',
    image: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=300&auto=format&fit=crop&q=80',
  },
  {
    title: 'Bridal Preview Slots',
    body: 'Trial styling appointments are open for the next two weekends.',
    cta: 'Reserve time',
    image: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=300&auto=format&fit=crop&q=80',
  },
];

function getGalleryImageUrl(imageUrl: string | null | undefined, title: string): string {
  const url = (imageUrl ?? '').trim();
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:image')) {
    return url;
  }
  
  const key = (title ?? '').toLowerCase();
  if (key.includes('colour') || key.includes('color')) {
    return 'https://images.unsplash.com/photo-1620331311520-246422fd82f9?w=600&auto=format&fit=crop&q=80';
  }
  if (key.includes('fade') || key.includes('gents') || key.includes('cut')) {
    return 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=600&auto=format&fit=crop&q=80';
  }
  if (key.includes('bridal') || key.includes('wedding') || key.includes('look')) {
    return 'https://images.unsplash.com/photo-1519741497674-611481863552?w=600&auto=format&fit=crop&q=80';
  }
  if (key.includes('treatment') || key.includes('spa') || key.includes('wash') || key.includes('hair')) {
    return 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&auto=format&fit=crop&q=80';
  }
  if (key.includes('beard') || key.includes('groom')) {
    return 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=600&auto=format&fit=crop&q=80';
  }
  if (key.includes('facial') || key.includes('glow') || key.includes('beauty')) {
    return 'https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?w=600&auto=format&fit=crop&q=80';
  }
  
  return 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&auto=format&fit=crop&q=80';
}

export default function NewThings() {
  const { c, Radius, Spacing, Type, Shadow } = useTheme();
  const [services, setServices] = useState<Service[]>([]);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const hasAnimated = useRef(false);

  useEffect(() => {
    Promise.all([getBookableServices(), getGallery()]).then(([serviceRows, galleryRows]) => {
      setServices(serviceRows);
      setGallery(galleryRows);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!loading) hasAnimated.current = true;
  }, [loading]);

  const featuredServices = useMemo(() => services.slice(0, 4), [services]);
  const offerTarget = featuredServices[2] ?? featuredServices[0];

  return (
    <ScreenContainer safeTop={false}>
      <ScreenHeader eyebrow="FRESH" title="New Things" subtitle="Stay ahead of the style curve with our latest updates" />

      {/* SECTION 1: FEATURED OFFERS */}
      <SectionHeader number={1} eyebrow="TODAY" title="Featured offers" />
      {loading ? (
        <SkeletonCard count={1} />
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          snapToInterval={296} // width (280) + gap (16)
          snapToAlignment="center"
          style={{ marginHorizontal: -Spacing.md }}
          contentContainerStyle={{
            gap: Spacing.md,
            paddingHorizontal: Spacing.md,
            paddingBottom: Spacing.sm,
          }}
        >
          {updates.map((item, index) => {
            const isFirst = index === 0;
            return (
              <FadeUp key={item.title} index={index} animate={!hasAnimated.current}>
                <PressableScale
                  onPress={() => offerTarget && router.push(`/booking/${offerTarget.id}`)}
                  style={{
                    width: 280,
                    borderRadius: Radius.lg,
                    borderWidth: isFirst ? 2 : 1,
                    borderColor: isFirst ? c.accent : c.hairline,
                    overflow: 'hidden',
                    backgroundColor: c.surfaceRaised,
                    padding: Spacing.md,
                    height: 146,
                    ...Shadow.sm,
                  }}
                >
                  <View style={{ flexDirection: 'row', flex: 1, gap: Spacing.sm }}>
                    {/* Left: Info */}
                    <View style={{ flex: 1, justifyContent: 'space-between' }}>
                      <View>
                        <Text style={[Type.eyebrow, { color: isFirst ? c.accentDark : c.fgMuted, textTransform: 'uppercase', fontSize: 10, letterSpacing: 0.5 }]}>
                          {isFirst ? '★ EDITOR\'S CHOICE' : 'SPECIAL DEAL'}
                        </Text>
                        <Text style={[Type.label, { color: c.fg, fontSize: 15, fontFamily: 'Poppins_600SemiBold', marginTop: 2 }]} numberOfLines={1}>
                          {item.title}
                        </Text>
                        <Text style={[Type.caption, { color: c.fg2, marginTop: 2, fontSize: 11, lineHeight: 14 }]} numberOfLines={3}>
                          {item.body}
                        </Text>
                      </View>
                      <Text style={{ color: c.accentText, fontFamily: 'Poppins_600SemiBold', fontSize: 11, marginTop: 4 }}>
                        {item.cta} ›
                      </Text>
                    </View>

                    {/* Right: Image Thumbnail */}
                    <View style={{ position: 'relative', justifyContent: 'center' }}>
                      <Image
                        source={{ uri: item.image }}
                        style={{ width: 84, height: 84, borderRadius: Radius.md, backgroundColor: c.bg2 }}
                        contentFit="cover"
                        transition={200}
                      />
                      {isFirst && (
                        <View style={{ position: 'absolute', top: -4, right: -4, backgroundColor: c.accent, borderRadius: Radius.pill, paddingHorizontal: 6, paddingVertical: 2, ...Shadow.sm }}>
                          <Text style={{ color: '#1C1A17', fontSize: 8, fontFamily: 'Poppins_700Bold' }}>
                            15% OFF
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                </PressableScale>
              </FadeUp>
            );
          })}
        </ScrollView>
      )}

      {/* SECTION 2: NEW AND POPULAR */}
      <View style={{ marginTop: Spacing.md }}>
        <SectionHeader number={2} eyebrow="SERVICES" title="New and popular" />
        {loading ? (
          <SkeletonCard count={2} />
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            decelerationRate="fast"
            snapToInterval={216} // width (200) + gap (16)
            snapToAlignment="center"
            style={{ marginHorizontal: -Spacing.md }}
            contentContainerStyle={{
              gap: Spacing.md,
              paddingHorizontal: Spacing.md,
              paddingBottom: Spacing.sm,
            }}
          >
            {featuredServices.map((service, index) => (
              <FadeUp key={service.id} index={index} animate={!hasAnimated.current}>
                <View style={{ width: 200 }}>
                  <ServiceCard service={service} layout="grid" onPress={() => router.push(`/booking/${service.id}`)} />
                </View>
              </FadeUp>
            ))}
          </ScrollView>
        )}
      </View>

      {/* SECTION 3: RECENT INSPIRATION / LOOKBOOK */}
      <View style={{ marginTop: Spacing.md }}>
        <SectionHeader number={3} eyebrow="LOOKBOOK" title="Recent inspiration" />
        {loading ? (
          <SkeletonCard count={4} />
        ) : (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, paddingBottom: Spacing.sm }}>
            {gallery.slice(0, 6).map((item, index) => (
              <FadeUp key={item.id} index={index} animate={!hasAnimated.current} style={{ width: '47%', minWidth: 140, flexGrow: 1 }}>
                <PressableScale
                  onPress={() => offerTarget && router.push(`/booking/${offerTarget.id}`)}
                  style={{
                    borderRadius: Radius.md,
                    overflow: 'hidden',
                    position: 'relative',
                    backgroundColor: c.bg2,
                    height: 190,
                    ...Shadow.sm,
                  }}
                >
                  <Image
                    source={{ uri: getGalleryImageUrl(item.image_url, item.title) }}
                    style={{ width: '100%', height: '100%' }}
                    contentFit="cover"
                    transition={250}
                  />
                  
                  {/* Top Right Floating Badge */}
                  <View
                    style={{
                      position: 'absolute',
                      top: Spacing.xs + 2,
                      right: Spacing.xs + 2,
                      backgroundColor: 'rgba(28, 26, 23, 0.65)',
                      borderRadius: Radius.sm - 4,
                      paddingHorizontal: 8,
                      paddingVertical: 2,
                    }}
                  >
                    <Text style={{ color: '#FAFAF8', fontSize: 9, fontFamily: 'Poppins_600SemiBold', textTransform: 'uppercase' }}>
                      {item.tag}
                    </Text>
                  </View>

                  {/* Bottom title block with dark gradient overlay */}
                  <LinearGradient
                    colors={['transparent', 'rgba(18, 17, 16, 0.95)']}
                    style={{
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      bottom: 0,
                      paddingTop: 36,
                      paddingBottom: Spacing.sm,
                      paddingHorizontal: Spacing.sm,
                    }}
                  >
                    <Text style={{ color: '#FAFAF8', fontFamily: 'Poppins_600SemiBold', fontSize: 13 }} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={{ color: c.accent, fontFamily: 'Poppins_400Regular', fontSize: 10, marginTop: 1 }} numberOfLines={1}>
                      {item.category}
                    </Text>
                  </LinearGradient>
                </PressableScale>
              </FadeUp>
            ))}
          </View>
        )}
      </View>

      {/* SECTION 4: EDITORIAL QUICK PICK */}
      {!loading && !!offerTarget && (
        <FadeUp index={4} animate={!hasAnimated.current}>
          <View style={{ marginTop: Spacing.lg, marginBottom: Spacing.sm }}>
            <Text style={[Type.eyebrow, { color: c.fgMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: Spacing.sm }]}>
              ★ PERSONALIZED RECOMMENDATION
            </Text>
            <PressableScale
              onPress={() => router.push(`/booking/${offerTarget.id}`)}
              style={{
                borderRadius: Radius.lg,
                overflow: 'hidden',
                position: 'relative',
                height: 180,
                ...Shadow.md,
              }}
            >
              <Image
                source={{ uri: getServiceImage(offerTarget.slug, offerTarget.category) }}
                style={{ width: '100%', height: '100%' }}
                contentFit="cover"
                transition={300}
              />
              <LinearGradient
                colors={['rgba(28, 26, 23, 0.2)', 'rgba(28, 26, 23, 0.92)']}
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
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                  <View style={{ backgroundColor: c.accent, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 1 }}>
                    <Text style={{ color: '#1C1A17', fontSize: 9, fontFamily: 'Poppins_700Bold' }}>
                      HOT PICK
                    </Text>
                  </View>
                  <Text style={{ color: c.accent, fontFamily: 'Poppins_600SemiBold', fontSize: 11, letterSpacing: 0.5 }}>
                    TRENDING NOW
                  </Text>
                </View>
                
                <Text style={{ color: '#FAFAF8', fontFamily: 'Poppins_700Bold', fontSize: 20 }} numberOfLines={1}>
                  {offerTarget.name}
                </Text>
                
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
                  <Text style={{ color: 'rgba(250, 250, 248, 0.85)', fontFamily: 'Poppins_500Medium', fontSize: 13 }}>
                    {money(offerTarget.price_lkr)} • {offerTarget.duration_min} min
                  </Text>
                  
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                    <Text style={{ color: c.accent, fontFamily: 'Poppins_600SemiBold', fontSize: 12 }}>
                      Book Look
                    </Text>
                    <IconSymbol name="chevron.right" size={14} color={c.accent} />
                  </View>
                </View>
              </LinearGradient>
            </PressableScale>
          </View>
        </FadeUp>
      )}
    </ScreenContainer>
  );
}

