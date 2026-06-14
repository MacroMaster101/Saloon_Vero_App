import { Text, View } from 'react-native';
import { Image } from 'expo-image';
import { money } from '@/lib/utils/format';
import { useTheme } from '@/hooks/use-theme';
import { PressableScale } from '@/components/ui/pressable-scale';
import { getServiceImage } from '@/lib/utils/service-image';
import type { Service } from '@/types/database';

export function ServiceCard({
  service,
  layout = 'row',
  onPress,
}: {
  service: Service;
  layout?: 'row' | 'grid';
  onPress?: () => void;
}) {
  const { c, Radius, Shadow, Spacing, Type } = useTheme();
  const imageUrl = getServiceImage(service.slug, service.category, service.icon);

  if (layout === 'grid') {
    return (
      <PressableScale
        onPress={onPress}
        style={[
          {
            borderRadius: Radius.lg,
            backgroundColor: c.surfaceRaised,
            borderWidth: 1,
            borderColor: c.hairline,
            overflow: 'hidden',
            flex: 1,
          },
          Shadow.sm,
        ]}
      >
        {/* Service Image */}
        <View style={{ width: '100%', height: 115, position: 'relative', backgroundColor: c.bg2 }}>
          <Image
            source={{ uri: imageUrl }}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
            transition={300}
          />
          {/* Overlay Category Tag */}
          <View
            style={{
              position: 'absolute',
              top: Spacing.xs + 2,
              left: Spacing.xs + 2,
              backgroundColor: 'rgba(28, 26, 23, 0.72)',
              borderRadius: Radius.sm - 2,
              paddingHorizontal: 8,
              paddingVertical: 3,
            }}
          >
            <Text
              style={{
                color: '#FAFAF8',
                fontSize: 9,
                fontFamily: 'Poppins_600SemiBold',
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              }}
            >
              {service.category}
            </Text>
          </View>
        </View>

        {/* Info Area */}
        <View style={{ padding: Spacing.sm, flex: 1, justifyContent: 'space-between' }}>
          <View style={{ marginBottom: Spacing.sm }}>
            <Text
              numberOfLines={1}
              style={[Type.label, { color: c.fg, fontSize: 14, fontFamily: 'Poppins_600SemiBold' }]}
            >
              {service.name}
            </Text>
            {!!service.description ? (
              <Text
                numberOfLines={2}
                style={[
                  Type.caption,
                  { color: c.fgMuted, marginTop: 2, fontSize: 11, lineHeight: 14, minHeight: 28 },
                ]}
              >
                {service.description}
              </Text>
            ) : (
              <View style={{ minHeight: 28 }} />
            )}
          </View>

          {/* Pricing & Duration */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderTopWidth: 1,
              borderTopColor: c.hairline,
              paddingTop: Spacing.xs,
              marginTop: 'auto',
            }}
          >
            <Text
              style={[
                Type.label,
                { color: c.accentDark, fontSize: 13, fontFamily: 'Poppins_700Bold' },
              ]}
            >
              {money(service.price_lkr)}
            </Text>
            <Text style={[Type.caption, { color: c.fgMuted, fontSize: 10 }]}>
              {service.duration_min} min
            </Text>
          </View>
        </View>
      </PressableScale>
    );
  }

  // Standard vertical-list row layout
  return (
    <PressableScale
      onPress={onPress}
      style={[
        {
          flexDirection: 'row',
          gap: Spacing.md,
          padding: Spacing.md,
          borderRadius: Radius.lg,
          backgroundColor: c.surfaceRaised,
          borderWidth: 1,
          borderColor: c.hairline,
          marginBottom: Spacing.sm,
        },
        Shadow.sm,
      ]}
    >
      <View style={{ flex: 1 }}>
        <Text style={[Type.label, { color: c.fg, fontSize: 16, fontFamily: 'Poppins_600SemiBold' }]}>{service.name}</Text>
        {!!service.description && <Text style={[Type.caption, { color: c.fgMuted, marginTop: 4, fontSize: 12 }]}>{service.description}</Text>}
      </View>
      <View style={{ alignItems: 'flex-end', justifyContent: 'center' }}>
        <Text style={[Type.label, { color: c.accentDark, fontSize: 15, fontFamily: 'Poppins_700Bold' }]}>{money(service.price_lkr)}</Text>
        <Text style={[Type.caption, { color: c.fgMuted, marginTop: 2 }]}>{service.duration_min} min</Text>
      </View>
    </PressableScale>
  );
}

