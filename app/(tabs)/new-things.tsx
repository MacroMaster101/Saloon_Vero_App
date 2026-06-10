import { useEffect, useMemo, useState } from 'react';
import { Pressable, Text, View, Platform } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { router } from 'expo-router';
import { getBookableServices, getGallery } from '@/lib/api/queries';
import { money } from '@/lib/utils/format';
import { Card } from '@/components/ui/card';
import { ScreenContainer } from '@/components/ui/screen';
import { SectionHeader } from '@/components/ui/section-header';
import { ServiceCard } from '@/components/services/service-card';
import { LoadingScreen } from '@/components/ui/loading';
import { useTheme } from '@/hooks/use-theme';
import type { GalleryItem, Service } from '@/types/database';

const updates = [
  { title: 'Weekday Glow Deal', body: 'Save 15% on colour touch-ups before 3 PM.', cta: 'Book colour' },
  { title: 'Seasonal Hair Spa', body: 'Repair, smooth, and shine package for dry-weather hair.', cta: 'Book treatment' },
  { title: 'Bridal Preview Slots', body: 'Trial styling appointments are open for the next two weekends.', cta: 'Reserve time' },
];

export default function NewThings() {
  const { c, Radius, Spacing, Type, scheme } = useTheme();
  const [services, setServices] = useState<Service[]>([]);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getBookableServices(), getGallery()]).then(([serviceRows, galleryRows]) => {
      setServices(serviceRows);
      setGallery(galleryRows);
      setLoading(false);
    });
  }, []);

  const featuredServices = useMemo(() => services.slice(0, 3), [services]);
  const offerTarget = featuredServices[2] ?? featuredServices[0];

  if (loading) return <LoadingScreen message="Finding the latest..." />;

  const isIOS = Platform.OS === 'ios';

  return (
    <ScreenContainer>
      <View style={{ marginBottom: Spacing.sm }}>
        <Text style={[Type.eyebrow, { color: c.accentText, letterSpacing: 1.5, textTransform: 'uppercase' }]}>New Things</Text>
        <Text style={[Type.h1, { color: c.fg }]}>Offers and salon updates</Text>
        <Text style={[Type.body, { color: c.fg2, marginTop: Spacing.xs }]}>Fresh services, seasonal care, and announcements from Saloon Vero.</Text>
      </View>

      <SectionHeader eyebrow="Today" title="Featured offers" />
      {updates.map((item, index) => {
        const isFirst = index === 0;
        const bg = isFirst
          ? c.accentTint
          : isIOS
            ? (scheme === 'dark' ? 'rgba(255, 255, 255, 0.03)' : 'rgba(255, 255, 255, 0.55)')
            : (scheme === 'dark' ? '#1E1712' : '#FFFFFF');
        const border = isFirst
          ? c.accent
          : isIOS
            ? (scheme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(184, 116, 42, 0.15)')
            : (scheme === 'dark' ? '#2E251E' : '#EBE2CF');

        return (
          <Animated.View key={item.title} entering={FadeInDown.delay(index * 60).springify()}>
            <Pressable
              onPress={() => offerTarget && router.push(`/booking/${offerTarget.id}`)}
              style={{
                borderRadius: Radius.lg,
                backgroundColor: bg,
                borderWidth: 1,
                borderColor: border,
                padding: Spacing.md,
                marginBottom: Spacing.sm,
                shadowColor: '#000',
                shadowOpacity: isFirst ? 0.05 : 0.02,
                shadowRadius: 8,
                shadowOffset: { width: 0, height: 4 },
                elevation: 2,
              }}>
              <Text style={[Type.label, { color: c.fg, fontSize: 16, fontFamily: 'Poppins_600SemiBold' }]}>{item.title}</Text>
              <Text style={[Type.caption, { color: c.fg2, marginTop: 4, fontSize: 12 }]}>{item.body}</Text>
              <Text style={[Type.label, { color: c.accentText, marginTop: Spacing.sm, fontFamily: 'Poppins_600SemiBold' }]}>{item.cta} ›</Text>
            </Pressable>
          </Animated.View>
        );
      })}

      <SectionHeader eyebrow="Services" title="New and popular" />
      {featuredServices.map((service, index) => (
        <Animated.View key={service.id} entering={FadeInDown.delay(index * 60).springify()}>
          <ServiceCard service={service} onPress={() => router.push(`/booking/${service.id}`)} />
        </Animated.View>
      ))}

      <SectionHeader eyebrow="Lookbook" title="Recent inspiration" />
      <View style={{ gap: Spacing.xs }}>
        {gallery.slice(0, 4).map((item) => (
          <Card key={item.id} style={{ marginBottom: Spacing.sm }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <Text style={[Type.label, { color: c.fg, fontSize: 16, fontFamily: 'Poppins_600SemiBold' }]}>{item.title}</Text>
                <Text style={[Type.caption, { color: c.fgMuted, marginTop: 2 }]}>{item.category}</Text>
              </View>
              <View style={{ borderRadius: Radius.pill, backgroundColor: c.accentTint, paddingHorizontal: 10, paddingVertical: 2 }}>
                <Text style={[Type.caption, { color: c.accentText, fontFamily: 'Poppins_600SemiBold', fontSize: 11 }]}>{item.tag}</Text>
              </View>
            </View>
          </Card>
        ))}
      </View>

      {!!offerTarget && (
        <Card style={{ marginTop: Spacing.md, borderColor: c.accent }}>
          <Text style={[Type.eyebrow, { color: c.accentText, letterSpacing: 1.5, textTransform: 'uppercase', fontFamily: 'Poppins_600SemiBold' }]}>Quick pick</Text>
          <Text style={[Type.h2, { color: c.fg, marginTop: 4 }]}>{offerTarget.name}</Text>
          <Text style={[Type.body, { color: c.fg2, marginTop: 2 }]}>{money(offerTarget.price_lkr)} - {offerTarget.duration_min} min</Text>
          <Text onPress={() => router.push(`/booking/${offerTarget.id}`)} style={[Type.label, { color: c.accentText, marginTop: Spacing.md, fontFamily: 'Poppins_600SemiBold' }]}>Book this service ›</Text>
        </Card>
      )}
    </ScreenContainer>
  );
}
