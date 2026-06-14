import { useEffect, useMemo, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { getBookableServices, getGallery } from '@/lib/api/queries';
import { money } from '@/lib/utils/format';
import { Card } from '@/components/ui/card';
import { ScreenContainer } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { SectionHeader } from '@/components/ui/section-header';
import { ServiceCard } from '@/components/services/service-card';
import { SkeletonCard } from '@/components/ui/skeleton';
import { FadeUp } from '@/components/ui/fade-up';
import { PressableScale } from '@/components/ui/pressable-scale';
import { useTheme } from '@/hooks/use-theme';
import type { GalleryItem, Service } from '@/types/database';

const updates = [
  { title: 'Weekday Glow Deal', body: 'Save 15% on colour touch-ups before 3 PM.', cta: 'Book colour' },
  { title: 'Seasonal Hair Spa', body: 'Repair, smooth, and shine package for dry-weather hair.', cta: 'Book treatment' },
  { title: 'Bridal Preview Slots', body: 'Trial styling appointments are open for the next two weekends.', cta: 'Reserve time' },
];

export default function NewThings() {
  const { c, Radius, Spacing, Type } = useTheme();
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

  const featuredServices = useMemo(() => services.slice(0, 3), [services]);
  const offerTarget = featuredServices[2] ?? featuredServices[0];

  return (
    <ScreenContainer safeTop={false}>
      <ScreenHeader eyebrow="FRESH" title="New Things" />

      <SectionHeader number={1} eyebrow="Today" title="Featured offers" />
      {loading ? (
        <SkeletonCard count={3} />
      ) : updates.map((item, index) => (
        <FadeUp key={item.title} index={index} animate={!hasAnimated.current}>
          <PressableScale
            onPress={() => offerTarget && router.push(`/booking/${offerTarget.id}`)}
            style={{
              borderRadius: Radius.lg,
              backgroundColor: index === 0 ? c.accentTint : c.surfaceRaised,
              borderWidth: 1,
              borderColor: index === 0 ? c.accent : c.hairline,
              padding: Spacing.md,
              marginBottom: Spacing.sm,
            }}>
            <Text style={[Type.label, { color: c.fg, fontSize: 16, fontFamily: 'Poppins_600SemiBold' }]}>{item.title}</Text>
            <Text style={[Type.caption, { color: c.fg2, marginTop: 4, fontSize: 12 }]}>{item.body}</Text>
            <Text style={[Type.label, { color: c.accentText, marginTop: Spacing.sm, fontFamily: 'Poppins_600SemiBold' }]}>{item.cta} ›</Text>
          </PressableScale>
        </FadeUp>
      ))}

      <SectionHeader number={2} eyebrow="Services" title="New and popular" />
      {loading ? (
        <SkeletonCard count={3} />
      ) : featuredServices.map((service, index) => (
        <FadeUp key={service.id} index={index} animate={!hasAnimated.current}>
          <ServiceCard service={service} onPress={() => router.push(`/booking/${service.id}`)} />
        </FadeUp>
      ))}

      <SectionHeader number={3} eyebrow="Lookbook" title="Recent inspiration" />
      <View style={{ gap: Spacing.xs }}>
        {loading ? (
          <SkeletonCard count={4} />
        ) : gallery.slice(0, 4).map((item, index) => (
          <FadeUp key={item.id} index={index} animate={!hasAnimated.current}>
            <Card style={{ marginBottom: Spacing.sm }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flex: 1 }}>
                  <Text style={[Type.label, { color: c.fg, fontSize: 16, fontFamily: 'Poppins_600SemiBold' }]}>{item.title}</Text>
                  <Text style={[Type.caption, { color: c.fgMuted, marginTop: 2 }]}>{item.category}</Text>
                </View>
                <View style={{ borderRadius: Radius.pill, backgroundColor: c.accentTint, paddingHorizontal: Spacing.sm, paddingVertical: 2 }}>
                  <Text style={[Type.caption, { color: c.accentText, fontFamily: 'Poppins_600SemiBold', fontSize: 11 }]}>{item.tag}</Text>
                </View>
              </View>
            </Card>
          </FadeUp>
        ))}
      </View>

      {!loading && !!offerTarget && (
        <Card accent style={{ marginTop: Spacing.md }}>
          <Text style={[Type.eyebrow, { color: c.accentText, letterSpacing: 1.5, textTransform: 'uppercase', fontFamily: 'Poppins_600SemiBold' }]}>Quick pick</Text>
          <Text style={[Type.h2, { color: c.fg, marginTop: 4 }]}>{offerTarget.name}</Text>
          <Text style={[Type.body, { color: c.fg2, marginTop: 2 }]}>{money(offerTarget.price_lkr)} - {offerTarget.duration_min} min</Text>
          <Text onPress={() => router.push(`/booking/${offerTarget.id}`)} style={[Type.label, { color: c.accentText, marginTop: Spacing.md, fontFamily: 'Poppins_600SemiBold' }]}>Book this service ›</Text>
        </Card>
      )}
    </ScreenContainer>
  );
}
