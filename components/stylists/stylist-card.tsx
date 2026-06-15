import { Text, View, Pressable } from 'react-native';
import { Image } from 'expo-image';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { dicebearUrl } from '@/lib/utils/avatar';
import { useTheme } from '@/hooks/use-theme';
import { PressableScale } from '@/components/ui/pressable-scale';
import type { Stylist } from '@/types/database';

const STYLIST_AVATARS: Record<string, string> = {
  'ruwan':    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
  'sanduni':  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80',
  'tharindu': 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80',
  'nadeesha': 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80',
};

export function getStylistAvatar(
  slug: string | null | undefined,
  name: string,
  avatarUrl?: string | null,
): string {
  const cleanUrl = (avatarUrl ?? '').trim();
  if (cleanUrl && (cleanUrl.startsWith('http') || cleanUrl.startsWith('data:image'))) {
    return cleanUrl;
  }
  const cleanSlug = (slug ?? '').trim().toLowerCase();
  return STYLIST_AVATARS[cleanSlug] ?? dicebearUrl(name);
}

export function StylistCard({
  stylist,
  selected,
  onPress,
  onInfoPress,
}: {
  stylist: Stylist;
  selected?: boolean;
  onPress?: () => void;
  onInfoPress?: () => void;
}) {
  const { c, Radius, Spacing, Type, scheme } = useTheme();
  const src = getStylistAvatar(stylist.slug, stylist.name, stylist.avatar_url);

  // ── Colour tokens matching date/time card selected style ──────────────────
  const cardBg     = selected ? c.accent : c.surfaceRaised;
  const cardBorder = selected ? c.accent : c.hairline;
  const nameColor  = selected ? (scheme === 'dark' ? '#1C1A17' : '#FFFFFF') : c.fg;
  const roleColor  = selected
    ? (scheme === 'dark' ? 'rgba(28,26,23,0.65)' : 'rgba(255,255,255,0.75)')
    : c.fgMuted;

  return (
    <PressableScale
      onPress={onPress}
      style={{
        flexDirection: 'row',
        gap: Spacing.md,
        alignItems: 'center',
        padding: Spacing.md,
        borderRadius: Radius.lg,
        backgroundColor: cardBg,
        borderWidth: selected ? 2 : 1,
        borderColor: cardBorder,
        marginBottom: Spacing.sm,
        shadowColor: selected ? c.accent : '#1C1A17',
        shadowOpacity: selected ? 0.20 : 0.03,
        shadowRadius: selected ? 12 : 4,
        shadowOffset: { width: 0, height: selected ? 5 : 1 },
        elevation: selected ? 5 : 1,
      }}
    >
      {/* Avatar with gold ring when selected */}
      <View
        style={{
          borderRadius: 32,
          padding: selected ? 2 : 0,
          backgroundColor: selected ? 'rgba(255,255,255,0.35)' : 'transparent',
        }}
      >
        <Image
          source={{ uri: src }}
          style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: c.bg2 }}
          contentFit="cover"
          transition={200}
        />
      </View>

      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[Type.label, { color: nameColor, fontSize: 16, fontFamily: 'Poppins_600SemiBold' }]}>
          {stylist.name}
        </Text>
        <Text style={[Type.caption, { color: roleColor, fontSize: 12 }]}>
          {stylist.role}
        </Text>
        
        {/* Rating Display */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 1 }}>
          <Text style={{ fontSize: 12, color: selected ? (scheme === 'dark' ? '#1C1A17' : '#FFFFFF') : '#D9A648', fontFamily: 'Poppins_700Bold' }}>
            {stylist.rating && stylist.rating_count && stylist.rating_count > 0 ? `★ ${Number(stylist.rating).toFixed(1)}` : '★ New'}
          </Text>
          {!!(stylist.rating_count && stylist.rating_count > 0) && (
            <Text style={{ fontSize: 11, color: selected ? (scheme === 'dark' ? 'rgba(28,26,23,0.65)' : 'rgba(255,255,255,0.75)') : c.fgMuted, fontFamily: 'Poppins_400Regular' }}>
              ({stylist.rating_count} reviews)
            </Text>
          )}
        </View>

        {/* Stylist Tags */}
        {!!stylist.tags && stylist.tags.length > 0 && (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
            {stylist.tags.slice(0, 2).map((t) => (
              <View
                key={t}
                style={{
                  backgroundColor: selected ? 'rgba(255,255,255,0.22)' : c.bg2,
                  borderRadius: Radius.sm - 4,
                  paddingHorizontal: 6,
                  paddingVertical: 1,
                }}
              >
                <Text style={{ fontSize: 10, color: selected ? nameColor : c.fg2, fontFamily: 'Poppins_500Medium' }}>
                  {t}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Right side: check-circle when selected, info button otherwise */}
      {selected ? (
        <MaterialIcons
          name="check-circle"
          size={24}
          color={scheme === 'dark' ? 'rgba(28,26,23,0.75)' : 'rgba(255,255,255,0.85)'}
        />
      ) : (
        !!onInfoPress && (
          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              onInfoPress();
            }}
            accessibilityRole="button"
            accessibilityLabel={`More info about ${stylist.name}`}
            style={{
              padding: Spacing.sm,
              borderRadius: Radius.pill,
              backgroundColor: c.bg2,
            }}
          >
            <MaterialIcons name="info-outline" size={20} color={c.fgMuted} />
          </Pressable>
        )
      )}
    </PressableScale>
  );
}
