import { useEffect, useReducer, useState } from 'react';
import { Text, View, Modal, Pressable, ScrollView, StyleSheet, Platform } from 'react-native';
import { Image } from 'expo-image';
import { BlurView } from 'expo-blur';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { getStylistBio } from '@/lib/utils/stylist-bio';
import { getStylistAvatar } from '@/components/stylists/stylist-card';
import { useLocalSearchParams, router } from 'expo-router';
import { BackButton } from '@/components/ui/back-button';
import { bookingReducer, initialBooking } from '@/lib/booking/booking-machine';
import { getStylists } from '@/lib/api/queries';
import { getAvailability, createBooking, type SlotEntry } from '@/lib/api/edge';
import { SlotPicker } from '@/components/booking/slot-picker';
import { StylistCard } from '@/components/stylists/stylist-card';
import { bookingDetailsSchema } from '@/lib/validation/booking';
import { saveGuestBooking } from '@/lib/storage/guest-bookings';
import { useSession } from '@/context/session';
import { ScreenContainer } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { ThemedTextInput } from '@/components/ui/text-input';
import { ThemedButton } from '@/components/ui/button';
import { ThemeToggleButton } from '@/components/ui/theme-toggle-button';
import { StepIndicator } from '@/components/ui/step-indicator';
import { Card } from '@/components/ui/card';
import { PressableScale } from '@/components/ui/pressable-scale';
import { useTheme } from '@/hooks/use-theme';
import { LoadingScreen } from '@/components/ui/loading';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import type { Stylist } from '@/types/database';

const STEPS = ['stylist', 'date', 'time', 'details'] as const;
const dayFmt = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Colombo', year: 'numeric', month: '2-digit', day: '2-digit' });
function nextNDates(n: number): string[] {
  const out: string[] = []; const now = Date.now();
  for (let i = 0; i < n; i++) out.push(dayFmt.format(new Date(now + i * 86400000)));
  return out;
}

const STEP_TITLES: Record<string, string> = {
  stylist: 'Choose stylist',
  date: 'Pick a date',
  time: 'Pick your time',
  details: 'Your details',
};

export default function BookingFlow() {
  const { c, Type, Spacing, Radius, scheme } = useTheme();
  const { user, isGuest, profile, loading: sessionLoading } = useSession();
  const { serviceId } = useLocalSearchParams<{ serviceId: string }>();
  const [state, dispatch] = useReducer(bookingReducer, serviceId!, initialBooking);
  const [stylists, setStylists] = useState<Stylist[]>([]);
  const [infoStylist, setInfoStylist] = useState<Stylist | null>(null);
  const [slots, setSlots] = useState<SlotEntry[]>([]); const [loadingSlots, setLoadingSlots] = useState(false);
  const [name, setName] = useState(''); const [phone, setPhone] = useState(''); const [email, setEmail] = useState(''); const [notes, setNotes] = useState('');
  const [prefilled, setPrefilled] = useState(false);
  const [error, setError] = useState<string | null>(null); const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!sessionLoading && !user && !isGuest) router.replace('/access' as never);
  }, [sessionLoading, user, isGuest]);
  useEffect(() => { getStylists().then(setStylists); }, []);
  useEffect(() => {
    // Admins book on behalf of walk-in customers — never prefill their own identity.
    if (!user || prefilled || profile?.role === 'admin') return;
    setName((user.user_metadata?.full_name as string | undefined) ?? '');
    setPhone((user.user_metadata?.phone as string | undefined) ?? '');
    setEmail(user.email ?? '');
    setPrefilled(true);
  }, [user, prefilled, profile?.role]);
  useEffect(() => {
    if (state.step === 'time' && state.date) {
      setLoadingSlots(true); setError(null);
      const start = Date.now();
      getAvailability({ serviceId: serviceId!, stylistId: state.stylistId, date: state.date })
        .then((r) => {
          const diff = Date.now() - start;
          const minDelay = 700;
          if (diff < minDelay) {
            setTimeout(() => {
              setSlots(r.slots);
              setLoadingSlots(false);
            }, minDelay - diff);
          } else {
            setSlots(r.slots);
            setLoadingSlots(false);
          }
        })
        .catch(() => {
          setSlots([]);
          setError('Could not load times — go back and retry.');
          setLoadingSlots(false);
        });
    }
  }, [state.step, state.date, state.stylistId, serviceId]);

  async function submit() {
    const details = bookingDetailsSchema.safeParse({ name, phone, email, notes });
    if (!details.success) return setError(details.error.issues[0]?.message ?? 'Please check your details.');
    setSubmitting(true); setError(null);
    const res = await createBooking({ serviceId: serviceId!, stylistId: state.stylistId, date: state.date!, time: state.time!, ...details.data });
    setSubmitting(false);
    if (!res.ok) return setError(res.message);
    if (isGuest) {
      await saveGuestBooking({
        id: res.id ?? undefined,        // UUID — needed for reschedule
        reference: res.reference,
        serviceId: serviceId!,
        serviceName: res.serviceName,
        stylistName: res.stylistName,
        whenLabel: res.whenLabel,
        date: state.date!,
        time: state.time!,
        status: 'confirmed',
        priceLkr: res.priceLkr,
        phone: details.data.phone,      // stored for cancel phone-verification
        createdAt: new Date().toISOString(),
      });
    }
    router.replace({
      pathname: '/booking/success',
      params: {
        reference: res.reference,
        when: res.whenLabel,
        stylist: res.stylistName,
        service: res.serviceName,
        price: String(res.priceLkr),
        guest: isGuest ? '1' : '0',
      },
    });
  }

  if (sessionLoading || (!user && !isGuest)) {
    return <LoadingScreen message="Verifying access..." />;
  }

  if (submitting) {
    return <LoadingScreen message="Securing your booking..." />;
  }

  return (
    <ScreenContainer safeTop={false} keyboardAware>
      <ScreenHeader
        eyebrow="BOOK YOUR VISIT"
        title={STEP_TITLES[state.step] ?? 'Booking'}
        left={<BackButton onPress={state.step === 'stylist' ? undefined : () => dispatch({ type: 'back' })} />}
        right={<ThemeToggleButton />}
      />
      <StepIndicator total={4} current={STEPS.indexOf(state.step)} />

      <Animated.View key={state.step} entering={FadeIn.duration(220)} exiting={FadeOut.duration(120)} style={{ width: '100%', maxWidth: 440, alignSelf: 'center' }}>
        {state.step === 'stylist' && (<>
          <PressableScale
            onPress={() => dispatch({ type: 'setStylist', stylistId: null })}
            style={{
              padding: Spacing.md,
              borderRadius: Radius.lg,
              borderWidth: 2,
              borderColor: state.stylistId === null ? c.accent : c.hairline,
              backgroundColor: state.stylistId === null ? c.accent : c.surfaceRaised,
              marginBottom: Spacing.md,
              flexDirection: 'row',
              alignItems: 'center',
              gap: Spacing.md,
              shadowColor: state.stylistId === null ? c.accent : '#1C1A17',
              shadowOpacity: state.stylistId === null ? 0.20 : 0.03,
              shadowRadius: state.stylistId === null ? 12 : 4,
              shadowOffset: { width: 0, height: state.stylistId === null ? 5 : 1 },
              elevation: state.stylistId === null ? 5 : 1,
            }}
          >
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: Radius.pill,
                backgroundColor: state.stylistId === null ? 'rgba(255,255,255,0.20)' : c.accent,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <MaterialIcons name="auto-awesome" size={22} color="#FFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[Type.label, {
                color: state.stylistId === null ? '#FFF' : c.fg,
                fontSize: 16,
                fontFamily: 'Poppins_600SemiBold',
              }]}>
                ✨ Any available stylist
              </Text>
              <Text style={[Type.caption, {
                color: state.stylistId === null ? 'rgba(255,255,255,0.75)' : c.fgMuted,
                marginTop: 1,
                fontSize: 11,
              }]}>
                Select the first stylist available for your chosen date and time
              </Text>
            </View>
            {state.stylistId === null && (
              <MaterialIcons name="check-circle" size={22} color="rgba(255,255,255,0.85)" />
            )}
          </PressableScale>
          {stylists.map((s) => (
            <StylistCard
              key={s.id}
              stylist={s}
              selected={state.stylistId === s.id}
              onPress={() => dispatch({ type: 'setStylist', stylistId: s.id })}
              onInfoPress={() => setInfoStylist(s)}
            />
          ))}
        </>)}

        {state.step === 'date' && (
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: Spacing.sm,
              justifyContent: 'flex-start',
              paddingHorizontal: Spacing.xs,
            }}
          >
            {nextNDates(15).map((d, index) => {
              const [yr, mo, dy] = d.split('-').map(Number);
              const dateObj = new Date(yr, mo - 1, dy);
              const weekdayStr = dateObj.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
              const monthStr = dateObj.toLocaleDateString('en-US', { month: 'short' });
              const isSelected = state.date === d;

              const isSunday = dateObj.getDay() === 0;
              const isPoya = d === '2026-06-29'; // Poson Full Moon Poya Day

              // ── Card colour system ──────────────────────────────────────────
              // Unselected defaults
              let cardBorderColor: string = c.hairline;
              let cardBgColor: string = c.surfaceRaised;
              let primaryTextColor: string = c.fg;
              let secondaryTextColor: string = c.fgMuted;
              let cardBorderWidth = 1.5;
              let cardElevation = 1;
              let cardShadowOpacity = 0.03;

              // Regular selected state — solid accent gold in BOTH light & dark
              if (isSelected && !isPoya) {
                cardBorderColor = c.accent;
                cardBgColor = c.accent;
                primaryTextColor = scheme === 'dark' ? '#1C1A17' : '#FFFFFF';
                secondaryTextColor = scheme === 'dark' ? 'rgba(28, 26, 23, 0.65)' : 'rgba(255, 255, 255, 0.75)';
                cardBorderWidth = 2;
                cardElevation = 5;
                cardShadowOpacity = 0.18;
              }

              // ── Poya / Holiday overrides ────────────────────────────────────
              if (isPoya) {
                if (isSelected) {
                  // Selected Poya → deep amber so it's clearly different from regular gold selection
                  cardBorderColor = '#8A6420'; // dark gold border
                  cardBgColor = scheme === 'dark' ? '#C2933C' : '#A87A2E'; // rich amber
                  primaryTextColor = '#FFFFFF';
                  secondaryTextColor = 'rgba(255, 255, 255, 0.75)';
                  cardBorderWidth = 2.5;
                  cardElevation = 6;
                  cardShadowOpacity = 0.22;
                } else {
                  // Unselected Poya → warm premium gold card
                  cardBorderColor = c.accent; // full solid gold border
                  // Warm cream in light mode feels special vs plain white
                  cardBgColor = scheme === 'dark' ? 'rgba(217, 166, 72, 0.08)' : '#FEF6E4';
                  primaryTextColor = c.accentText;
                  secondaryTextColor = c.accentDark;
                  cardBorderWidth = 2;
                  cardElevation = 3;
                  cardShadowOpacity = 0.10;
                }
              }

              // ── Badge system (TODAY / TOMORROW only — Poya uses a banner) ──
              let badgeText = '';
              let badgeBg: string = 'rgba(194, 144, 54, 0.15)';
              let badgeTextColor: string = c.accentText;

              if (!isPoya && index === 0) {
                badgeText = 'TODAY';
                if (isSelected) {
                  badgeBg = 'rgba(255, 255, 255, 0.22)';
                  badgeTextColor = scheme === 'dark' ? '#1C1A17' : '#FFF';
                } else {
                  badgeBg = 'rgba(46, 204, 113, 0.18)';
                  badgeTextColor = '#1E8449';
                }
              } else if (!isPoya && index === 1) {
                badgeText = 'TOMORROW';
                if (isSelected) {
                  badgeBg = 'rgba(255, 255, 255, 0.22)';
                  badgeTextColor = scheme === 'dark' ? '#1C1A17' : '#FFF';
                } else {
                  badgeBg = 'rgba(194, 144, 54, 0.15)';
                  badgeTextColor = c.accentText;
                }
              }

              // Poya banner colours (full-width strip at top of card)
              const poyaBannerBg = isSelected
                ? 'rgba(0, 0, 0, 0.16)'
                : c.accent;
              const poyaBannerText = isSelected
                ? '#FFF'
                : (scheme === 'dark' ? '#1C1A17' : '#FFF');

              // Set the detail label at the bottom of the card
              let detailLabel = monthStr;
              if (isPoya) {
                detailLabel = 'Poson Poya';
              } else if (isSunday) {
                detailLabel = 'Sunday';
              }

              return (
                <PressableScale
                  key={d}
                  onPress={() => dispatch({ type: 'setDate', date: d })}
                  style={{
                    width: '31.3%',
                    aspectRatio: 1,
                    borderRadius: Radius.lg,
                    borderWidth: cardBorderWidth,
                    borderColor: cardBorderColor,
                    backgroundColor: cardBgColor,
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: Spacing.xs,
                    marginBottom: Spacing.xs,
                    shadowColor: isPoya ? c.accent : '#1C1A17',
                    shadowOpacity: cardShadowOpacity,
                    shadowRadius: isSelected ? 12 : 4,
                    shadowOffset: { width: 0, height: isSelected ? 6 : 2 },
                    elevation: cardElevation,
                  }}
                >
                  {/* ── Poya holiday: full-width ribbon banner ── */}
                  {isPoya && (
                    <View
                      style={{
                        position: 'absolute',
                        top: 0, left: 0, right: 0,
                        height: 26,
                        backgroundColor: poyaBannerBg,
                        borderTopLeftRadius: Radius.lg - 1,
                        borderTopRightRadius: Radius.lg - 1,
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 8,
                          color: poyaBannerText,
                          fontFamily: 'Poppins_700Bold',
                          letterSpacing: 1.2,
                        }}
                      >
                        🌕  POYA DAY
                      </Text>
                    </View>
                  )}

                  {/* ── TODAY / TOMORROW floating badge (non-Poya days) ── */}
                  {badgeText ? (
                    <View
                      style={{
                        position: 'absolute',
                        top: 6,
                        backgroundColor: badgeBg,
                        paddingHorizontal: 5,
                        paddingVertical: 1.5,
                        borderRadius: Radius.pill,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 7,
                          color: badgeTextColor,
                          fontFamily: 'Poppins_700Bold',
                          letterSpacing: 0.2,
                        }}
                      >
                        {badgeText}
                      </Text>
                    </View>
                  ) : null}

                  <Text
                    style={[
                      Type.caption,
                      {
                        color: secondaryTextColor,
                        fontFamily: 'Poppins_600SemiBold',
                        fontSize: 10,
                        letterSpacing: 0.5,
                        marginTop: isPoya ? 22 : (badgeText ? 14 : 0),
                      },
                    ]}
                  >
                    {weekdayStr}
                  </Text>

                  <Text
                    style={[
                      Type.h2,
                      {
                        color: primaryTextColor,
                        fontSize: isPoya ? 26 : 24,
                        fontFamily: 'Poppins_800ExtraBold',
                        marginVertical: 1,
                        lineHeight: isPoya ? 30 : 28,
                      },
                    ]}
                  >
                    {dy}
                  </Text>

                  <Text
                    style={[
                      Type.caption,
                      {
                        color: secondaryTextColor,
                        fontFamily: 'Poppins_600SemiBold',
                        fontSize: isPoya ? 8 : 11,
                        textAlign: 'center',
                        letterSpacing: isPoya ? 0.3 : 0,
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {detailLabel}
                  </Text>
                </PressableScale>
              );
            })}
          </View>
        )}

        {state.step === 'time' && (
          loadingSlots ? <LoadingScreen message="Finding open slots..." fullScreen={false} /> : <SlotPicker slots={slots} selected={state.time} onSelect={(t) => dispatch({ type: 'setTime', time: t })} />
        )}

        {state.step === 'details' && (() => {
          // Derive display values for the summary banner
          const selectedStylist = state.stylistId
            ? stylists.find((s) => s.id === state.stylistId)
            : null;
          const stylistLabel = selectedStylist?.name ?? 'Any available stylist';

          const [yr, mo, dy] = (state.date ?? '').split('-').map(Number);
          const dateObj = state.date ? new Date(yr, mo - 1, dy) : null;
          const dateLabel = dateObj
            ? dateObj.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' })
            : '—';
          const timeLabel = state.time ?? '—';

          return (
            <View style={{ gap: Spacing.md }}>
              {/* ── Booking Summary Banner ── */}
              <View
                style={{
                  borderRadius: Radius.lg,
                  borderWidth: 2,
                  borderColor: c.accent,
                  backgroundColor: scheme === 'dark' ? 'rgba(217,166,72,0.06)' : '#FEF6E4',
                  overflow: 'hidden',
                }}
              >
                {/* Gold header strip */}
                <View
                  style={{
                    backgroundColor: c.accent,
                    paddingHorizontal: Spacing.md,
                    paddingVertical: Spacing.xs + 2,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: Spacing.xs,
                  }}
                >
                  <MaterialIcons name="receipt-long" size={14} color={scheme === 'dark' ? '#1C1A17' : '#FFF'} />
                  <Text
                    style={{
                      fontFamily: 'Poppins_700Bold',
                      fontSize: 10,
                      letterSpacing: 1.2,
                      color: scheme === 'dark' ? '#1C1A17' : '#FFF',
                      textTransform: 'uppercase',
                    }}
                  >
                    Booking Summary
                  </Text>
                </View>

                {/* Summary rows */}
                <View style={{ padding: Spacing.md, gap: Spacing.sm }}>
                  {([
                    { icon: 'event' as const,    label: 'Date',    value: dateLabel },
                    { icon: 'schedule' as const,  label: 'Time',    value: timeLabel },
                    { icon: 'person' as const,    label: 'Stylist', value: stylistLabel },
                  ]).map((row) => (
                    <View key={row.label} style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
                      <View
                        style={{
                          width: 30,
                          height: 30,
                          borderRadius: Radius.sm,
                          backgroundColor: scheme === 'dark' ? 'rgba(217,166,72,0.12)' : 'rgba(194,144,54,0.12)',
                          justifyContent: 'center',
                          alignItems: 'center',
                        }}
                      >
                        <MaterialIcons name={row.icon} size={15} color={c.accentText} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 10, color: c.fgMuted, textTransform: 'uppercase', letterSpacing: 0.6 }}>
                          {row.label}
                        </Text>
                        <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 13, color: c.fg, marginTop: 1 }}>
                          {row.value}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>

              {/* ── Your Details form ── */}
              <Card style={{ padding: Spacing.lg, gap: 0 }}>
                {/* Section label */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginBottom: Spacing.md }}>
                  <MaterialIcons name="person-outline" size={15} color={c.accentText} />
                  <Text style={{ fontFamily: 'Poppins_700Bold', fontSize: 11, color: c.accentText, textTransform: 'uppercase', letterSpacing: 1 }}>
                    Your Details
                  </Text>
                  <View style={{ flex: 1, height: 1, backgroundColor: c.hairline, marginLeft: Spacing.xs }} />
                </View>

                {/* Name */}
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, marginBottom: Spacing.sm }}>
                  <View style={{ width: 36, height: 36, borderRadius: Radius.sm, backgroundColor: c.bg2, justifyContent: 'center', alignItems: 'center', marginTop: 2 }}>
                    <MaterialIcons name="person" size={18} color={c.fgMuted} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <ThemedTextInput required label="Name" placeholder="e.g. Amal Perera" value={name} onChangeText={setName} style={{ marginBottom: 0 }} />
                  </View>
                </View>

                {/* Mobile */}
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, marginBottom: Spacing.sm }}>
                  <View style={{ width: 36, height: 36, borderRadius: Radius.sm, backgroundColor: c.bg2, justifyContent: 'center', alignItems: 'center', marginTop: 2 }}>
                    <MaterialIcons name="phone" size={18} color={c.fgMuted} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <ThemedTextInput required label="Mobile" placeholder="e.g. 0712345678" keyboardType="phone-pad" value={phone} onChangeText={setPhone} style={{ marginBottom: 0 }} />
                  </View>
                </View>

                {/* Email */}
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, marginBottom: Spacing.sm }}>
                  <View style={{ width: 36, height: 36, borderRadius: Radius.sm, backgroundColor: c.bg2, justifyContent: 'center', alignItems: 'center', marginTop: 2 }}>
                    <MaterialIcons name="email" size={18} color={c.fgMuted} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <ThemedTextInput label="Email (optional)" placeholder="e.g. you@example.com" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} style={{ marginBottom: 0 }} />
                  </View>
                </View>

                {/* Notes */}
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, marginBottom: Spacing.md }}>
                  <View style={{ width: 36, height: 36, borderRadius: Radius.sm, backgroundColor: c.bg2, justifyContent: 'center', alignItems: 'center', marginTop: 2 }}>
                    <MaterialIcons name="notes" size={18} color={c.fgMuted} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <ThemedTextInput label="Notes (optional)" placeholder="Special requests, preferences…" multiline value={notes} onChangeText={setNotes} style={{ height: 72, textAlignVertical: 'top', marginBottom: 0 }} />
                  </View>
                </View>

                <ThemedButton label="Confirm booking" busy={submitting} onPress={submit} />
              </Card>
            </View>
          );
        })()}
      </Animated.View>

      {error && <Text style={[Type.caption, { color: c.error, marginTop: Spacing.md, textAlign: 'center' }]}>{error}</Text>}

      {/* Stylist Details Modal */}
      <Modal
        visible={infoStylist !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setInfoStylist(null)}
      >
        <BlurView
          intensity={Platform.OS === 'ios' ? 30 : 90}
          tint={scheme === 'dark' ? 'dark' : 'light'}
          style={StyleSheet.absoluteFillObject}
        >
          <Pressable style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.md }} onPress={() => setInfoStylist(null)}>
            <Pressable
              onPress={(e) => e.stopPropagation()}
              style={{
                width: '100%',
                maxWidth: 380,
                backgroundColor: c.surfaceRaised,
                borderRadius: Radius.xl,
                borderWidth: 1,
                borderColor: c.hairline,
                overflow: 'hidden',
                shadowColor: '#1C1A17',
                shadowOpacity: 0.16,
                shadowRadius: 24,
                shadowOffset: { width: 0, height: 8 },
                elevation: 10,
              }}
            >
              {/* Profile Image & Close Button */}
              <View style={{ width: '100%', height: 210, backgroundColor: c.bg2, position: 'relative' }}>
                {infoStylist && (
                  <Image
                    source={{ uri: getStylistAvatar(infoStylist.slug, infoStylist.name) }}
                    style={{ width: '100%', height: '100%' }}
                    contentFit="cover"
                  />
                )}
                
                {/* Close Button overlay */}
                <Pressable
                  onPress={() => setInfoStylist(null)}
                  style={{
                    position: 'absolute',
                    top: Spacing.md,
                    right: Spacing.md,
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <MaterialIcons name="close" size={18} color="#FFF" />
                </Pressable>
              </View>

              {/* Details Content */}
              <ScrollView contentContainerStyle={{ padding: Spacing.lg }} style={{ maxHeight: 300 }}>
                {infoStylist && (
                  <View style={{ gap: Spacing.sm }}>
                    <View>
                      <Text style={[Type.h2, { color: c.fg, fontFamily: 'Poppins_700Bold' }]}>
                        {infoStylist.name}
                      </Text>
                      <Text style={[Type.label, { color: c.accentDark, marginTop: 2, fontFamily: 'Poppins_600SemiBold', fontSize: 14 }]}>
                        {infoStylist.role}
                      </Text>
                    </View>

                    {/* Speciality tags */}
                    {!!infoStylist.tags && infoStylist.tags.length > 0 && (
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginVertical: 4 }}>
                        {infoStylist.tags.map((t) => (
                          <View
                            key={t}
                            style={{
                              borderColor: c.accent,
                              borderWidth: 1,
                              borderRadius: Radius.sm - 2,
                              paddingHorizontal: 8,
                              paddingVertical: 2,
                            }}
                          >
                            <Text style={{ fontSize: 10, color: c.accentText, fontFamily: 'Poppins_600SemiBold', textTransform: 'uppercase' }}>
                              {t}
                            </Text>
                          </View>
                        ))}
                      </View>
                    )}

                    <View style={{ height: 1, backgroundColor: c.hairline, marginVertical: Spacing.xs }} />

                    <View style={{ gap: 4 }}>
                      <Text style={[Type.label, { color: c.fg, fontFamily: 'Poppins_600SemiBold' }]}>About</Text>
                      <Text style={[Type.body, { color: c.fg2, fontSize: 13, lineHeight: 18 }]}>
                        {getStylistBio(infoStylist.slug)}
                      </Text>
                    </View>
                  </View>
                )}
              </ScrollView>

              {/* Action Button */}
              <View style={{ padding: Spacing.md, borderTopWidth: 1, borderTopColor: c.hairline }}>
                <ThemedButton
                  label="Select Stylist"
                  onPress={() => {
                    if (infoStylist) {
                      dispatch({ type: 'setStylist', stylistId: infoStylist.id });
                      setInfoStylist(null);
                    }
                  }}
                />
              </View>
            </Pressable>
          </Pressable>
        </BlurView>
      </Modal>
    </ScreenContainer>
  );
}
