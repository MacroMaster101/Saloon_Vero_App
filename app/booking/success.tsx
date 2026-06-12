import { View, Text } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { money } from '@/lib/utils/format';
import { Card } from '@/components/ui/card';
import { ScreenContainer } from '@/components/ui/screen';
import { ThemedButton } from '@/components/ui/button';
import { StatusTag } from '@/components/ui/status-tag';
import { useTheme } from '@/hooks/use-theme';
import { useSession } from '@/context/session';

export default function Success() {
  const { c, Type, Spacing, Radius } = useTheme();
  const { profile } = useSession();
  const { reference, when, stylist, service, price, guest } = useLocalSearchParams<{
    reference: string;
    when: string;
    stylist: string;
    service?: string;
    price?: string;
    guest?: string;
  }>();
  const isGuest = guest === '1';
  const priceLkr = price ? Number(price) : NaN;

  return (
    <ScreenContainer scroll={false} style={{ justifyContent: 'center' }}>
      <View style={{ alignItems: 'center' }}>
        {/* Gold check glyph in accentTint pill circle */}
        <View style={{
          width: 96,
          height: 96,
          borderRadius: Radius.pill,
          backgroundColor: c.accentTint,
          borderWidth: 1,
          borderColor: c.accent,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: Spacing.md,
        }}>
          <Text style={{ fontSize: 48, color: c.accent }}>✓</Text>
        </View>
        <Text style={[Type.h1, { color: c.fg, letterSpacing: 0.3 }]}>Booking confirmed</Text>
        <Text style={[Type.body, { color: c.fg2, textAlign: 'center', marginTop: Spacing.xs }]}>Keep this reference for your visit.</Text>
      </View>

      <Card style={{ marginTop: Spacing.xl, gap: Spacing.md, padding: Spacing.lg }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.md, alignItems: 'center' }}>
          <View style={{ flex: 1 }}>
            <Text style={[Type.eyebrow, { color: c.accentText, letterSpacing: 1.5, textTransform: 'uppercase', fontFamily: 'Poppins_600SemiBold' }]}>Reference</Text>
            {/* Reference pill in accentTint */}
            <View style={{
              alignSelf: 'flex-start',
              backgroundColor: c.accentTint,
              borderRadius: Radius.pill,
              paddingHorizontal: Spacing.md,
              paddingVertical: Spacing.xs,
              marginTop: 4,
            }}>
              <Text style={[Type.h2, { color: c.accentText }]}>{reference}</Text>
            </View>
          </View>
          <StatusTag status="confirmed" />
        </View>

        {/* Ticket-like dashed divider */}
        <View style={{ height: 1, borderStyle: 'dashed', borderWidth: 1, borderColor: c.line, marginVertical: 4 }} />

        <View style={{ gap: Spacing.xs }}>
          <Text style={[Type.label, { color: c.fg, fontSize: 16, fontFamily: 'Poppins_600SemiBold' }]}>{service ?? 'Salon service'}</Text>
          <Text style={[Type.caption, { color: c.fgMuted, fontSize: 13 }]}>Stylist: {stylist}</Text>
          <Text style={[Type.caption, { color: c.fgMuted, fontSize: 13 }]}>When: {when}</Text>
          {!Number.isNaN(priceLkr) && (
            <Text style={[Type.caption, { color: c.accentText, fontSize: 13, fontFamily: 'Poppins_600SemiBold', marginTop: 2 }]}>
              Price: {money(priceLkr)}
            </Text>
          )}
        </View>
      </Card>

      <View style={{ gap: Spacing.sm, marginTop: Spacing.xl }}>
        <ThemedButton label={profile?.role === 'admin' ? 'Back to dashboard' : isGuest ? 'View Guest Schedule' : 'View Schedule'} onPress={() => router.replace((profile?.role === 'admin' ? '/(admin)/today' : '/(tabs)') as never)} />
        {/* Non-admin: Book Again returns to the services screen.
            Admin: New walk-in navigates to the admin walk-in booking flow. */}
        {profile?.role !== 'admin' && (
          <ThemedButton variant="secondary" label="Book Again" onPress={() => router.replace('/(tabs)/book')} />
        )}
        {profile?.role === 'admin' && (
          <ThemedButton variant="secondary" label="New walk-in" onPress={() => router.replace('/(admin)/walk-in' as never)} />
        )}
        {isGuest && <ThemedButton variant="secondary" label="Login / Create Account" onPress={() => router.push('/access' as never)} />}
      </View>
    </ScreenContainer>
  );
}
