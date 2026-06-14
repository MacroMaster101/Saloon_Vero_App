import { View, Text } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { money } from '@/lib/utils/format';
import { Card } from '@/components/ui/card';
import { ScreenContainer } from '@/components/ui/screen';
import { ThemedButton } from '@/components/ui/button';
import { StatusTag } from '@/components/ui/status-tag';
import { useTheme } from '@/hooks/use-theme';
import { useSession } from '@/context/session';

export default function Success() {
  const { c, Type, Spacing, Radius, scheme } = useTheme();
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
      <View style={{ width: '100%', maxWidth: 420, alignSelf: 'center', paddingHorizontal: Spacing.md }}>
        
        {/* Success Icon & Message */}
        <View style={{ alignItems: 'center' }}>
          <View style={{
            width: 76,
            height: 76,
            borderRadius: 38,
            backgroundColor: c.accentTint,
            borderWidth: 1.5,
            borderColor: c.accent,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: Spacing.md,
          }}>
            <MaterialIcons name="check" size={36} color={c.accentText} />
          </View>
          <Text style={[Type.h1, { color: c.fg, letterSpacing: 0.3, textAlign: 'center' }]}>Booking confirmed</Text>
          <Text style={[Type.body, { color: c.fg2, textAlign: 'center', marginTop: Spacing.xs, fontSize: 14 }]}>
            Keep this reference for your visit.
          </Text>
        </View>

        {/* ── The Booking Ticket ── */}
        <Card style={{ 
          marginTop: Spacing.xl, 
          padding: Spacing.lg, 
          overflow: 'hidden',
          borderWidth: 0, // Hides border to make punches blend perfectly
          backgroundColor: scheme === 'dark' ? c.surfaceRaised : '#FFFFFF',
          shadowColor: '#1C1A17',
          shadowOpacity: scheme === 'dark' ? 0.2 : 0.06,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 8 },
          elevation: 4,
        }}>
          
          {/* Header section (Reference ID) */}
          <View style={{ alignItems: 'center', gap: Spacing.xs }}>
            <Text style={{
              fontFamily: 'Poppins_600SemiBold',
              fontSize: 10,
              color: c.fgMuted,
              letterSpacing: 1.5,
              textTransform: 'uppercase',
            }}>
              Booking Reference
            </Text>
            
            <Text style={{
              fontFamily: 'Poppins_800ExtraBold',
              fontSize: 26,
              color: c.accentText,
              letterSpacing: 1.5,
              marginVertical: 2,
            }}>
              {reference}
            </Text>
            
            <StatusTag status="confirmed" style={{ alignSelf: 'center', marginTop: Spacing.xs }} />
          </View>

          {/* ── Punch Cutouts and Dashed Separator ── */}
          <View style={{ position: 'relative', marginVertical: Spacing.lg, justifyContent: 'center' }}>
            {/* Left Punch */}
            <View style={{
              position: 'absolute',
              left: -Spacing.lg - 8,
              width: 16,
              height: 16,
              borderRadius: 8,
              backgroundColor: c.bg,
              zIndex: 10,
            }} />
            
            {/* Right Punch */}
            <View style={{
              position: 'absolute',
              right: -Spacing.lg - 8,
              width: 16,
              height: 16,
              borderRadius: 8,
              backgroundColor: c.bg,
              zIndex: 10,
            }} />
            
            {/* Dashed Separator Line */}
            <View style={{
              height: 1,
              borderStyle: 'dashed',
              borderWidth: 1,
              borderColor: c.hairline,
              marginHorizontal: 0,
            }} />
          </View>

          {/* Booking Info Block */}
          <View style={{ gap: Spacing.md }}>
            <Text style={{
              fontFamily: 'Poppins_700Bold',
              fontSize: 16,
              color: c.fg,
              textAlign: 'center',
              paddingHorizontal: Spacing.sm,
            }}>
              {service ?? 'Salon Service'}
            </Text>
            
            {/* Grouped Details Container */}
            <View style={{ 
              backgroundColor: scheme === 'dark' ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
              borderRadius: Radius.md,
              padding: Spacing.md,
              gap: Spacing.sm,
            }}>
              {/* Row 1: Stylist */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.xs }}>
                  <MaterialIcons name="person" size={16} color={c.fgMuted} />
                  <Text style={{ fontFamily: 'Poppins_500Medium', fontSize: 13, color: c.fgMuted }}>
                    Stylist
                  </Text>
                </View>
                <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 13, color: c.fg }}>
                  {stylist}
                </Text>
              </View>

              {/* Inner Divider */}
              <View style={{ height: 1, backgroundColor: c.hairline }} />

              {/* Row 2: Date & Time */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.xs }}>
                  <MaterialIcons name="schedule" size={16} color={c.fgMuted} />
                  <Text style={{ fontFamily: 'Poppins_500Medium', fontSize: 13, color: c.fgMuted }}>
                    Date & Time
                  </Text>
                </View>
                <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 13, color: c.fg }}>
                  {when}
                </Text>
              </View>

              {/* Inner Divider / Price Row */}
              {!Number.isNaN(priceLkr) && (
                <>
                  <View style={{ height: 1, backgroundColor: c.hairline }} />
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.xs }}>
                      <MaterialIcons name="payments" size={16} color={c.accentText} />
                      <Text style={{ fontFamily: 'Poppins_700Bold', fontSize: 13, color: c.accentText }}>
                        Total Price
                      </Text>
                    </View>
                    <Text style={{ fontFamily: 'Poppins_700Bold', fontSize: 15, color: c.accentText }}>
                      {money(priceLkr)}
                    </Text>
                  </View>
                </>
              )}
            </View>
          </View>
        </Card>

        {/* Action Buttons */}
        <View style={{ gap: Spacing.sm, marginTop: Spacing.xl }}>
          <ThemedButton 
            label={profile?.role === 'admin' ? 'Back to dashboard' : 'View Schedule'} 
            onPress={() => router.replace((profile?.role === 'admin' ? '/(admin)/today' : '/(tabs)/schedules') as never)} 
          />
          {profile?.role !== 'admin' && (
            <ThemedButton variant="secondary" label="Book Again" onPress={() => router.replace('/(tabs)/book')} />
          )}
          {profile?.role === 'admin' && (
            <ThemedButton variant="secondary" label="New walk-in" onPress={() => router.replace('/(admin)/walk-in' as never)} />
          )}
          {isGuest && (
            <ThemedButton variant="secondary" label="Login / Create Account" onPress={() => router.push('/access' as never)} />
          )}
        </View>
      </View>
    </ScreenContainer>
  );
}
