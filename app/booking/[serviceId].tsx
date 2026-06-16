import { useEffect, useReducer, useState } from 'react';
import { Alert, Text, View, Modal, Pressable, ScrollView, StyleSheet, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { getStylistBio } from '@/lib/utils/stylist-bio';
import { useLocalSearchParams, router } from 'expo-router';
import { BackButton } from '@/components/ui/back-button';
import { bookingReducer, initialBooking } from '@/lib/booking/booking-machine';
import { getStylists, getStylistReviews, createStylistReview, likeReview, reportReview } from '@/lib/api/queries';
import { getAvailability, createBooking, type SlotEntry } from '@/lib/api/edge';
import { SlotPicker } from '@/components/booking/slot-picker';
import { StylistCard, getStylistAvatar } from '@/components/stylists/stylist-card';
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
import { isPoyaHoliday } from '@/constants/salon';
import { computeUpdatedRating, REVIEW_STORAGE_KEYS } from '@/lib/utils/reviews';
import { LoadingScreen } from '@/components/ui/loading';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import type { Stylist, StylistReview } from '@/types/database';

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
  const { c, Type, Spacing, Radius, Shadow, scheme } = useTheme();
  const { user, isGuest, profile, loading: sessionLoading } = useSession();
  const { serviceId } = useLocalSearchParams<{ serviceId: string }>();
  const [state, dispatch] = useReducer(bookingReducer, serviceId!, initialBooking);
  const [stylists, setStylists] = useState<Stylist[]>([]);
  const [infoStylist, setInfoStylist] = useState<Stylist | null>(null);

  // Reviews state hooks
  const [reviews, setReviews] = useState<StylistReview[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [activeTab, setActiveTab] = useState<'About' | 'Reviews'>('About');
  const [isWritingReview, setIsWritingReview] = useState(false);
  const [newReviewName, setNewReviewName] = useState('');
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewComment, setNewReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Engagement: likes & reports (persisted per device)
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [reportedIds, setReportedIds] = useState<Set<string>>(new Set());
  const [engagingId, setEngagingId] = useState<string | null>(null);

  useEffect(() => {
    AsyncStorage.multiGet([REVIEW_STORAGE_KEYS.clientLiked, REVIEW_STORAGE_KEYS.clientReported]).then((pairs) => {
      try {
        const liked = pairs[0][1] ? new Set<string>(JSON.parse(pairs[0][1])) : new Set<string>();
        const reported = pairs[1][1] ? new Set<string>(JSON.parse(pairs[1][1])) : new Set<string>();
        setLikedIds(liked);
        setReportedIds(reported);
      } catch (e) { if (__DEV__) console.warn('Failed to parse stored review state:', e); }
    });
  }, []);

  useEffect(() => {
    if (infoStylist) {
      setLoadingReviews(true);
      getStylistReviews(infoStylist.id, infoStylist.slug)
        .then((data) => {
          setReviews(data);
          setLoadingReviews(false);
        })
        .catch(() => setLoadingReviews(false));
      setActiveTab('About');
      setIsWritingReview(false);
      setNewReviewName('');
      setNewReviewRating(5);
      setNewReviewComment('');
    } else {
      setReviews([]);
    }
  }, [infoStylist]);

  const handleSubmitReview = async () => {
    if (!infoStylist) return;
    if (!newReviewName.trim()) {
      Alert.alert('Required', 'Please enter your name.');
      return;
    }
    if (!newReviewComment.trim()) {
      Alert.alert('Required', 'Please enter your review description.');
      return;
    }

    setSubmittingReview(true);
    const res = await createStylistReview(
      infoStylist.id,
      newReviewName.trim(),
      newReviewRating,
      newReviewComment.trim()
    );
    setSubmittingReview(false);

    if (res.ok && res.review) {
      Alert.alert('Review Submitted ✓', 'Thank you for your feedback!');
      setReviews((prev) => [res.review!, ...prev]);

      const { rating: newRatingVal, rating_count: updatedCount } = computeUpdatedRating(infoStylist, newReviewRating);

      const updatedStylists = stylists.map((s) => {
        if (s.id === infoStylist.id) {
          return {
            ...s,
            rating: newRatingVal,
            rating_count: updatedCount,
          };
        }
        return s;
      });
      setStylists(updatedStylists);

      setInfoStylist({
        ...infoStylist,
        rating: newRatingVal,
        rating_count: updatedCount,
      });

      setIsWritingReview(false);
      setNewReviewName('');
      setNewReviewRating(5);
      setNewReviewComment('');
    } else {
      Alert.alert('Error', res.error || 'Could not submit review. Please try again.');
    }
  };

  const handleLikeReview = async (review: StylistReview) => {
    if (engagingId) return;
    const wasLiked = likedIds.has(review.id);
    const delta: 1 | -1 = wasLiked ? -1 : 1;
    const prevLikedIds = likedIds;
    setReviews((prev) => prev.map((r) =>
      r.id === review.id ? { ...r, likes_count: Math.max(0, (r.likes_count ?? 0) + delta) } : r
    ));
    const newLikedIds = new Set(likedIds);
    if (wasLiked) newLikedIds.delete(review.id); else newLikedIds.add(review.id);
    setLikedIds(newLikedIds);
    await AsyncStorage.setItem(REVIEW_STORAGE_KEYS.clientLiked, JSON.stringify([...newLikedIds]));
    setEngagingId(review.id);
    try {
      await likeReview(review.id, delta);
    } catch {
      // Roll back optimistic UI + persisted state on failure.
      setReviews((prev) => prev.map((r) =>
        r.id === review.id ? { ...r, likes_count: Math.max(0, (r.likes_count ?? 0) - delta) } : r
      ));
      setLikedIds(prevLikedIds);
      await AsyncStorage.setItem(REVIEW_STORAGE_KEYS.clientLiked, JSON.stringify([...prevLikedIds]));
    } finally {
      setEngagingId(null);
    }
  };

  const handleReportReview = (review: StylistReview) => {
    if (reportedIds.has(review.id)) {
      Alert.alert('Already Reported', 'You have already reported this review.');
      return;
    }
    Alert.alert(
      'Report Review?',
      'Flag this review as inappropriate for admin moderation.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Report',
          style: 'destructive',
          onPress: async () => {
            const prevReportedIds = reportedIds;
            const newReportedIds = new Set(reportedIds);
            newReportedIds.add(review.id);
            setReportedIds(newReportedIds);
            await AsyncStorage.setItem(REVIEW_STORAGE_KEYS.clientReported, JSON.stringify([...newReportedIds]));
            try {
              await reportReview(review.id);
              Alert.alert('Reported ✓', 'Thank you. Our team will review this.');
            } catch {
              // Roll back so the user can retry the report.
              setReportedIds(prevReportedIds);
              await AsyncStorage.setItem(REVIEW_STORAGE_KEYS.clientReported, JSON.stringify([...prevReportedIds]));
              Alert.alert('Error', 'Could not report this review. Please try again.');
            }
          },
        },
      ]
    );
  };
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
        right={isGuest ? <ThemeToggleButton /> : undefined}
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
              const isPoya = isPoyaHoliday(d);

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
              <Card flatOnMobile style={{ padding: Spacing.lg, gap: 0 }}>
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
                maxWidth: 360,
                backgroundColor: c.surfaceRaised,
                borderRadius: 24,
                overflow: 'hidden',
                shadowColor: '#1C1A17',
                shadowOpacity: 0.22,
                shadowRadius: 28,
                shadowOffset: { width: 0, height: 10 },
                elevation: 12,
              }}
            >
              {/* Cover Photo & Close Button */}
              {!isWritingReview && (
                <View style={{
                  width: '100%',
                  height: 233,
                  backgroundColor: c.bg2,
                  position: 'relative',
                  borderRadius: 23,
                  overflow: 'hidden',
                }}>
                  {infoStylist && (
                    <Image
                      source={{ uri: getStylistAvatar(infoStylist.slug, infoStylist.name, infoStylist.avatar_url) }}
                      style={{
                        width: '100%',
                        height: '100%',
                        borderRadius: 23,
                      }}
                      contentFit="cover"
                    />
                  )}
                  
                  {/* Linear gradient on bottom of cover image */}
                  <LinearGradient
                    colors={['transparent', 'rgba(18, 17, 16, 0.5)']}
                    style={{
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      bottom: 0,
                      height: 60,
                    }}
                  />

                  {/* Close Button overlay */}
                  <Pressable
                    onPress={() => setInfoStylist(null)}
                    style={{
                      position: 'absolute',
                      top: Spacing.md,
                      right: Spacing.md,
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      backgroundColor: 'rgba(0,0,0,0.5)',
                      justifyContent: 'center',
                      alignItems: 'center',
                      ...Shadow.sm,
                    }}
                  >
                    <MaterialIcons name="close" size={20} color="#FFF" />
                  </Pressable>
                </View>
              )}

              {/* Details Content */}
              <View style={{
                padding: Spacing.lg,
                gap: Spacing.md,
                backgroundColor: c.surfaceRaised,
                marginTop: isWritingReview ? Spacing.md : -23,
                borderBottomLeftRadius: 23,
                borderBottomRightRadius: 23,
                overflow: 'hidden',
              }}>
                {infoStylist && (
                  <View style={{ gap: Spacing.sm }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <View>
                        <Text style={[Type.h2, { color: c.fg, fontFamily: 'Poppins_700Bold', fontSize: 22 }]}>
                          {infoStylist.name}
                        </Text>
                        <Text style={{ color: c.accentText, marginTop: 2, fontFamily: 'Poppins_600SemiBold', fontSize: 13 }}>
                          {infoStylist.role}
                        </Text>
                      </View>
                      
                      {isWritingReview ? (
                        /* Close Button when writing review */
                        <Pressable
                          onPress={() => setInfoStylist(null)}
                          style={{
                            padding: 6,
                          }}
                        >
                          <MaterialIcons name="close" size={24} color={c.fgMuted} />
                        </Pressable>
                      ) : (
                        /* Rating Badge */
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 3,
                            backgroundColor: scheme === 'dark' ? 'rgba(217, 166, 72, 0.12)' : '#FEF6E4',
                            borderColor: c.accent,
                            borderWidth: 0.5,
                            borderRadius: Radius.sm,
                            paddingHorizontal: 8,
                            paddingVertical: 4,
                          }}
                        >
                          <Text style={{ fontSize: 11, color: c.accentText, fontFamily: 'Poppins_700Bold' }}>
                            ★ {infoStylist.rating && infoStylist.rating_count && infoStylist.rating_count > 0 ? `${Number(infoStylist.rating).toFixed(1)} (${infoStylist.rating_count})` : 'New'}
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Tab Selector */}
                    <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: c.hairline, marginBottom: Spacing.sm }}>
                      {(['About', 'Reviews'] as const).map((tab) => {
                        const isSelected = activeTab === tab;
                        return (
                          <Pressable
                            key={tab}
                            onPress={() => setActiveTab(tab)}
                            style={{
                              flex: 1,
                              paddingVertical: Spacing.sm - 2,
                              borderBottomWidth: isSelected ? 2 : 0,
                              borderBottomColor: c.accent,
                              alignItems: 'center',
                            }}
                          >
                            <Text style={{
                              fontFamily: isSelected ? 'Poppins_700Bold' : 'Poppins_500Medium',
                              color: isSelected ? c.fg : c.fgMuted,
                              fontSize: 13,
                            }}>
                              {tab}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>

                    {activeTab === 'About' ? (
                      <>
                        {/* Specialties / Tags */}
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
                                  backgroundColor: scheme === 'dark' ? 'rgba(217, 166, 72, 0.05)' : 'rgba(194, 144, 54, 0.04)',
                                }}
                              >
                                <Text style={{ fontSize: 9, color: c.accentText, fontFamily: 'Poppins_600SemiBold', textTransform: 'uppercase' }}>
                                  {t}
                                </Text>
                              </View>
                            ))}
                          </View>
                        )}

                        <View style={{ height: 1, backgroundColor: c.hairline, marginVertical: Spacing.xs }} />

                        <View style={{ gap: 4 }}>
                          <Text style={{ color: c.fg, fontFamily: 'Poppins_600SemiBold', fontSize: 13 }}>About</Text>
                          <Text style={{ color: c.fg2, fontSize: 12, lineHeight: 18 }}>
                            {getStylistBio(infoStylist.slug)}
                          </Text>
                        </View>

                        <ThemedButton
                          label="Select Stylist"
                          style={{ marginTop: Spacing.md }}
                          onPress={() => {
                            if (infoStylist) {
                              dispatch({ type: 'setStylist', stylistId: infoStylist.id });
                              setInfoStylist(null);
                            }
                          }}
                        />
                      </>
                    ) : (
                      // Reviews Tab
                      <View style={{ gap: Spacing.sm }}>
                        {isWritingReview ? (
                          // Redesigned Review Form
                          <ScrollView style={{ maxHeight: 340 }} showsVerticalScrollIndicator={false}>
                            <View style={{
                              padding: Spacing.md,
                              borderRadius: Radius.lg,
                              backgroundColor: scheme === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
                              borderWidth: 1,
                              borderColor: c.hairline,
                              gap: Spacing.sm,
                            }}>
                              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                <Text style={{ color: c.fg, fontFamily: 'Poppins_700Bold', fontSize: 16 }}>
                                  Write a Review
                                </Text>
                                <MaterialIcons name="rate-review" size={18} color={c.accent} />
                              </View>

                              <ThemedTextInput
                                label="Your Name"
                                value={newReviewName}
                                onChangeText={setNewReviewName}
                                placeholder="e.g. Amal Perera"
                                icon="person.fill"
                                style={{ marginBottom: Spacing.xs }}
                              />

                              <View style={{
                                backgroundColor: scheme === 'dark' ? 'rgba(217, 166, 72, 0.05)' : 'rgba(194, 144, 54, 0.03)',
                                borderColor: 'rgba(217, 166, 72, 0.15)',
                                borderWidth: 1,
                                borderRadius: Radius.md,
                                padding: Spacing.sm + 2,
                                alignItems: 'center',
                                marginBottom: Spacing.sm,
                              }}>
                                <Text style={{ fontSize: 11, fontFamily: 'Poppins_600SemiBold', color: c.fgMuted, marginBottom: Spacing.xs }}>
                                  Select Rating
                                </Text>
                                <View style={{ flexDirection: 'row', gap: 12, marginVertical: 4 }}>
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <PressableScale
                                      key={star}
                                      onPress={() => setNewReviewRating(star)}
                                      style={{ padding: 2 }}
                                    >
                                      <MaterialIcons
                                        name={star <= newReviewRating ? 'star' : 'star-outline'}
                                        size={32}
                                        color={star <= newReviewRating ? '#D9A648' : c.fgMuted}
                                      />
                                    </PressableScale>
                                  ))}
                                </View>
                                <Text style={{ fontSize: 12, fontFamily: 'Poppins_700Bold', color: c.accentText, marginTop: 4 }}>
                                  {newReviewRating === 5 ? '★★★★★ Excellent!' :
                                   newReviewRating === 4 ? '★★★★☆ Very Good' :
                                   newReviewRating === 3 ? '★★★☆☆ Good' :
                                   newReviewRating === 2 ? '★★☆☆☆ Fair' :
                                   '★☆☆☆☆ Poor'}
                                </Text>
                              </View>

                              <ThemedTextInput
                                label="Your Feedback"
                                value={newReviewComment}
                                onChangeText={setNewReviewComment}
                                placeholder="Describe your experience with the stylist..."
                                multiline
                                style={{ height: 70, textAlignVertical: 'top', marginBottom: Spacing.sm }}
                                icon="bubble.left.fill"
                              />

                              <View style={{ gap: Spacing.sm, marginTop: Spacing.xs }}>
                                <ThemedButton
                                  label="Submit Review"
                                  busy={submittingReview}
                                  onPress={handleSubmitReview}
                                />
                                <PressableScale
                                  onPress={() => setIsWritingReview(false)}
                                  style={{
                                    alignItems: 'center',
                                    paddingVertical: Spacing.sm,
                                    borderRadius: Radius.pill,
                                    borderWidth: 1,
                                    borderColor: c.hairline,
                                    backgroundColor: scheme === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
                                  }}
                                >
                                  <Text style={{ color: c.accentText, fontFamily: 'Poppins_600SemiBold', fontSize: 14 }}>
                                    Cancel
                                  </Text>
                                </PressableScale>
                              </View>
                            </View>
                          </ScrollView>
                        ) : (
                          // Reviews List
                          <>
                            {loadingReviews ? (
                              <Text style={{ textAlign: 'center', marginVertical: Spacing.md, color: c.fgMuted, fontSize: 12 }}>
                                Loading reviews...
                              </Text>
                            ) : reviews.length === 0 ? (
                              <Text style={{ textAlign: 'center', marginVertical: Spacing.lg, color: c.fgMuted, fontSize: 12, fontFamily: 'Poppins_400Regular' }}>
                                No reviews yet. Be the first to leave one!
                              </Text>
                            ) : (
                             <ScrollView style={{ maxHeight: 180 }} showsVerticalScrollIndicator={false}>
                               <View style={{ gap: Spacing.sm }}>
                                 {reviews.map((rev) => (
                                   <View
                                     key={rev.id}
                                     style={{
                                       borderRadius: Radius.md,
                                       backgroundColor: scheme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                                       borderWidth: 1,
                                       borderColor: c.hairline,
                                       overflow: 'hidden',
                                     }}
                                   >
                                     <View style={{ padding: Spacing.sm, gap: Spacing.xs }}>
                                       <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                                         <Text style={{ fontFamily: 'Poppins_700Bold', fontSize: 12, color: c.fg }}>
                                           {rev.customer_name}
                                         </Text>
                                         <Text style={{ fontSize: 10, color: '#D9A648', fontFamily: 'Poppins_600SemiBold' }}>
                                           {'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}
                                         </Text>
                                       </View>
                                       <Text style={{ fontSize: 11, color: c.fg2, lineHeight: 15, fontFamily: 'Poppins_400Regular' }}>
                                         {rev.comment}
                                       </Text>

                                       {/* Like / Report row */}
                                       <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: 4, borderTopWidth: 1, borderTopColor: c.hairline, paddingTop: 6 }}>
                                         <PressableScale
                                           onPress={() => handleLikeReview(rev)}
                                           accessibilityRole="button"
                                           style={{
                                             flexDirection: 'row',
                                             alignItems: 'center',
                                             gap: 4,
                                             paddingHorizontal: 8,
                                             paddingVertical: 3,
                                             borderRadius: Radius.pill,
                                             backgroundColor: likedIds.has(rev.id)
                                               ? 'rgba(224,112,112,0.12)'
                                               : (scheme === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'),
                                             borderWidth: 1,
                                             borderColor: likedIds.has(rev.id) ? 'rgba(224,112,112,0.4)' : c.hairline,
                                           }}
                                         >
                                           <Text style={{ fontSize: 11 }}>{likedIds.has(rev.id) ? '❤️' : '🤍'}</Text>
                                           {(rev.likes_count ?? 0) > 0 && (
                                             <Text style={{ fontSize: 10, fontFamily: 'Poppins_600SemiBold', color: likedIds.has(rev.id) ? '#E07070' : c.fgMuted }}>
                                               {rev.likes_count}
                                             </Text>
                                           )}
                                           <Text style={{ fontSize: 10, fontFamily: 'Poppins_500Medium', color: likedIds.has(rev.id) ? '#E07070' : c.fgMuted }}>
                                             {likedIds.has(rev.id) ? 'Liked' : 'Helpful'}
                                           </Text>
                                         </PressableScale>
                                         <View style={{ flex: 1 }} />
                                         <PressableScale
                                           onPress={() => handleReportReview(rev)}
                                           accessibilityRole="button"
                                           style={{
                                             flexDirection: 'row',
                                             alignItems: 'center',
                                             gap: 3,
                                             paddingHorizontal: 7,
                                             paddingVertical: 3,
                                             borderRadius: Radius.pill,
                                             backgroundColor: reportedIds.has(rev.id) ? 'rgba(192,57,43,0.08)' : 'transparent',
                                             borderWidth: 1,
                                             borderColor: reportedIds.has(rev.id) ? 'rgba(192,57,43,0.3)' : c.hairline,
                                           }}
                                         >
                                           <MaterialIcons
                                             name="flag"
                                             size={11}
                                             color={reportedIds.has(rev.id) ? c.error : c.fgMuted}
                                           />
                                           <Text style={{ fontSize: 10, fontFamily: 'Poppins_500Medium', color: reportedIds.has(rev.id) ? c.error : c.fgMuted }}>
                                             {reportedIds.has(rev.id) ? 'Reported' : 'Report'}
                                           </Text>
                                         </PressableScale>
                                       </View>
                                     </View>
                                   </View>
                                 ))}
                               </View>
                             </ScrollView>
                            )}

                            <ThemedButton
                              variant="secondary"
                              label="Write a Review"
                              style={{ marginTop: Spacing.sm }}
                              onPress={() => setIsWritingReview(true)}
                            />
                          </>
                        )}
                      </View>
                    )}
                  </View>
                )}
              </View>
              {/* Border overlay to ensure border is never hidden or clipped by image */}
              <View
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  borderRadius: 24,
                  borderWidth: 1,
                  borderColor: c.accent,
                }}
              />
            </Pressable>
          </Pressable>
        </BlurView>
      </Modal>
    </ScreenContainer>
  );
}
