import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Linking, Modal, Platform, RefreshControl, ScrollView, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { getBookableServices, getMyBookings, getStylists, submitStylistRating } from '@/lib/api/queries';
import { resolveConversationId } from '@/lib/api/chat';
import { localToUtcISO, hhmmToMin } from '@/lib/booking/time';
import { getGuestBookings, updateGuestBookingStatus, updateGuestBookingTime } from '@/lib/storage/guest-bookings';
import { getAvailability, rescheduleBooking, cancelBooking } from '@/lib/api/edge';
import type { SlotEntry } from '@/lib/api/edge';
import { money } from '@/lib/utils/format';
import { SALON_PHONE } from '@/constants/salon';
import { useSession } from '@/context/session';
import { GuestHeader } from '@/components/auth/guest-header';
import { Card } from '@/components/ui/card';
import { ScreenContainer } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { SectionHeader } from '@/components/ui/section-header';
import { StatusTag } from '@/components/ui/status-tag';
import { ThemedButton } from '@/components/ui/button';
import { ThemeToggleButton } from '@/components/ui/theme-toggle-button';
import { LoadingScreen } from '@/components/ui/loading';
import { EmptyState } from '@/components/ui/empty-state';
import { FadeUp } from '@/components/ui/fade-up';
import { PressableScale } from '@/components/ui/pressable-scale';
import { SlotPicker } from '@/components/booking/slot-picker';
import { useTheme } from '@/hooks/use-theme';

// ── Date helpers ──────────────────────────────────────────────────────────────
const dayFmt = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Colombo' });
function nextNDates(n: number): string[] {
  const out: string[] = [];
  const now = Date.now();
  for (let i = 0; i < n; i++) out.push(dayFmt.format(new Date(now + i * 86400000)));
  return out;
}

type UserBookingRow = {
  id: string;
  reference: string;
  starts_at: string;
  status: string;
  service_id: string;
  stylist_id: string | null;
};

type ScheduleBooking = {
  id?: string;
  serviceId?: string;
  stylistId?: string | null;
  reference: string;
  serviceName: string;
  stylistName: string;
  whenLabel: string;
  status: string;
  priceLkr?: number;
  startsAt?: string;
  // Guest-only — needed for phone verification on cancel
  guestPhone?: string;
};

const whenFmt = new Intl.DateTimeFormat('en-LK', {
  timeZone: 'Asia/Colombo',
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
});

function isCancelled(status: string) {
  return status === 'cancelled' || status === 'no_show';
}
function isCompleted(booking: ScheduleBooking) {
  if (booking.status === 'completed') return true;
  if (isCancelled(booking.status) || !booking.startsAt) return false;
  return new Date(booking.startsAt).getTime() < Date.now();
}
function isUpcoming(booking: ScheduleBooking) {
  return !isCancelled(booking.status) && !isCompleted(booking);
}

// ── RescheduleModal ────────────────────────────────────────────────────────────
function RescheduleModal({
  booking,
  onClose,
  onSuccess,
}: {
  booking: ScheduleBooking;
  onClose: () => void;
  onSuccess: (whenLabel: string, date: string, time: string) => void;
}) {
  const { c, Radius, Spacing, scheme } = useTheme();
  const dates = useMemo(() => nextNDates(15), []);

  const [selectedDate, setSelectedDate] = useState<string>(dates[0]!);
  const [slots, setSlots] = useState<SlotEntry[]>([]);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedDate || !booking.serviceId) return;
    setLoadingSlots(true);
    setSelectedTime(null);
    setError(null);
    getAvailability({ serviceId: booking.serviceId, stylistId: booking.stylistId ?? null, date: selectedDate })
      .then((r) => { setSlots(r.slots); setLoadingSlots(false); })
      .catch(() => { setSlots([]); setLoadingSlots(false); setError('Could not load times — try again.'); });
  }, [selectedDate, booking.serviceId, booking.stylistId]);

  async function confirmReschedule() {
    if (!selectedTime || !booking.id) return;
    setSubmitting(true);
    setError(null);
    const res = await rescheduleBooking({ bookingId: booking.id, date: selectedDate, time: selectedTime });
    setSubmitting(false);
    if (!res.ok) { setError(res.message); return; }
    onSuccess(res.whenLabel, selectedDate, selectedTime);
  }

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <PressableScale onPress={onClose} style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.45)' }}>
          <View style={{ flex: 1 }} />
        </PressableScale>

        <View style={{
          backgroundColor: c.bg,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          maxHeight: '88%',
          paddingBottom: Platform.OS === 'ios' ? 34 : 20,
        }}>
          <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 4 }}>
            <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: c.hairline }} />
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: Spacing.md, paddingBottom: Spacing.xl }}>
            {/* Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.md }}>
              <View>
                <Text style={{ fontFamily: 'Poppins_700Bold', fontSize: 18, color: c.fg }}>Reschedule</Text>
                <Text style={{ fontFamily: 'Poppins_500Medium', fontSize: 12, color: c.fgMuted, marginTop: 2 }}>{booking.serviceName}</Text>
              </View>
              <PressableScale onPress={onClose} style={{ padding: 8 }}>
                <MaterialIcons name="close" size={22} color={c.fgMuted} />
              </PressableScale>
            </View>

            {/* Current time banner */}
            <View style={{
              flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
              backgroundColor: c.accentTint,
              borderRadius: Radius.md,
              padding: Spacing.md,
              marginBottom: Spacing.lg,
              borderWidth: 1,
              borderColor: scheme === 'dark' ? 'rgba(217,166,72,0.18)' : 'rgba(194,144,54,0.15)',
            }}>
              <MaterialIcons name="event" size={16} color={c.accentText} />
              <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 13, color: c.accentText, flex: 1 }}>
                Currently: {booking.whenLabel}
              </Text>
            </View>

            {/* Date strip */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginBottom: Spacing.sm }}>
              <MaterialIcons name="calendar-today" size={14} color={c.accentText} />
              <Text style={{ fontFamily: 'Poppins_700Bold', fontSize: 11, color: c.accentText, textTransform: 'uppercase', letterSpacing: 0.8 }}>New Date</Text>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -Spacing.md, marginBottom: Spacing.lg }}>
              <View style={{ flexDirection: 'row', gap: Spacing.xs, paddingHorizontal: Spacing.md }}>
                {dates.map((d) => {
                  const [yr, mo, dy] = d.split('-').map(Number);
                  const dateObj = new Date(yr, mo - 1, dy);
                  const weekday = dateObj.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
                  const monthStr = dateObj.toLocaleDateString('en-US', { month: 'short' });
                  const isSelected = selectedDate === d;
                  return (
                    <PressableScale key={d} onPress={() => setSelectedDate(d)} style={{
                      width: 62, paddingVertical: Spacing.sm, borderRadius: Radius.md,
                      borderWidth: 1.5,
                      borderColor: isSelected ? c.accent : c.hairline,
                      backgroundColor: isSelected ? c.accent : c.surfaceRaised,
                      alignItems: 'center', gap: 2,
                    }}>
                      <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 9, color: isSelected ? (scheme === 'dark' ? '#1C1A17' : '#FFF') : c.fgMuted }}>{weekday}</Text>
                      <Text style={{ fontFamily: 'Poppins_800ExtraBold', fontSize: 20, color: isSelected ? (scheme === 'dark' ? '#1C1A17' : '#FFF') : c.fg }}>{dy}</Text>
                      <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 9, color: isSelected ? (scheme === 'dark' ? '#1C1A17' : '#FFF') : c.fgMuted }}>{monthStr}</Text>
                    </PressableScale>
                  );
                })}
              </View>
            </ScrollView>

            {/* Slot picker */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginBottom: Spacing.sm }}>
              <MaterialIcons name="schedule" size={14} color={c.accentText} />
              <Text style={{ fontFamily: 'Poppins_700Bold', fontSize: 11, color: c.accentText, textTransform: 'uppercase', letterSpacing: 0.8 }}>New Time</Text>
            </View>

            {loadingSlots
              ? <Text style={{ fontFamily: 'Poppins_500Medium', fontSize: 13, color: c.fgMuted, textAlign: 'center', paddingVertical: Spacing.xl }}>Finding open slots…</Text>
              : <SlotPicker slots={slots} selected={selectedTime} onSelect={setSelectedTime} />
            }

            {!!error && (
              <Text style={{ fontFamily: 'Poppins_500Medium', fontSize: 13, color: c.error, textAlign: 'center', marginTop: Spacing.sm }}>{error}</Text>
            )}

            <View style={{ marginTop: Spacing.lg }}>
              <ThemedButton label="Confirm Reschedule" busy={submitting} onPress={confirmReschedule} />
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function Schedules() {
  const { c, Radius, Spacing, Type, scheme, Shadow } = useTheme();
  const { user, isGuest, loading } = useSession();
  const [bookings, setBookings] = useState<ScheduleBooking[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const hasAnimated = useRef(false);

  const [rescheduleTarget, setRescheduleTarget] = useState<ScheduleBooking | null>(null);
  const [cancellingRef, setCancellingRef] = useState<string | null>(null);
  const [ratingTarget, setRatingTarget] = useState<ScheduleBooking | null>(null);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [submittingRating, setSubmittingRating] = useState(false);
  const [hasRated, setHasRated] = useState(false);

  const handleRateStylist = async (stars: number) => {
    if (!ratingTarget || !ratingTarget.stylistId || submittingRating || hasRated) return;
    setUserRating(stars);
    setSubmittingRating(true);
    const res = await submitStylistRating(ratingTarget.stylistId, stars);
    setSubmittingRating(false);
    if (res.ok) {
      setHasRated(true);
      Alert.alert('Rating Submitted ✓', `Thank you for rating ${ratingTarget.stylistName}!`);
      setTimeout(() => {
        setRatingTarget(null);
      }, 1200);
    } else {
      Alert.alert('Error', res.error || 'Could not submit rating. Please try again.');
    }
  };

  const load = useCallback(async () => {
    if (loading) return;
    if (!user && !isGuest) { setInitialLoading(false); return; }

    if (user) {
      const [rows, services, stylists] = await Promise.all([getMyBookings(user.id), getBookableServices(), getStylists()]);
      const servicesById = new Map(services.map((s) => [s.id, s]));
      const stylistsById = new Map(stylists.map((s) => [s.id, s]));
      setBookings((rows as UserBookingRow[]).map((b) => {
        const svc = servicesById.get(b.service_id);
        const sty = b.stylist_id ? stylistsById.get(b.stylist_id) : null;
        return {
          id: b.id,
          serviceId: b.service_id,
          stylistId: b.stylist_id,
          reference: b.reference,
          serviceName: svc?.name ?? 'Salon service',
          stylistName: sty?.name ?? 'Any available stylist',
          whenLabel: whenFmt.format(new Date(b.starts_at)),
          status: b.status,
          priceLkr: svc?.price_lkr,
          startsAt: b.starts_at,
        };
      }));
    } else {
      const guestRows = await getGuestBookings();
      setBookings(guestRows.map((b) => ({
        id: b.id,
        serviceId: b.serviceId,
        stylistId: undefined,
        reference: b.reference,
        serviceName: b.serviceName,
        stylistName: b.stylistName,
        whenLabel: b.whenLabel,
        status: b.status,
        priceLkr: b.priceLkr,
        // Build a proper UTC instant from the stored Colombo wall-clock date+time;
        // a bare `${date}T${time}` string would be parsed as device-local time and
        // be off by the Colombo offset (~5.5h), corrupting upcoming/completed sorting.
        startsAt: b.date && b.time ? localToUtcISO(b.date, hhmmToMin(b.time)) : undefined,
        guestPhone: b.phone,
      })));
    }
    setInitialLoading(false);
  }, [loading, user, isGuest]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  useEffect(() => {
    if (!initialLoading) hasAnimated.current = true;
  }, [initialLoading]);

  // ── Message stylist handler ──────────────────────────────────────────────
  async function handleMessageStylist(booking: ScheduleBooking) {
    if (!user || !booking.stylistId) return;
    const id = await resolveConversationId(user.id, booking.stylistId);
    if (id) router.push(`/messages/${id}?attachBookingId=${booking.id}` as never);
    else Alert.alert('Could not open chat', 'Please try again in a moment.');
  }

  // ── Cancel handler ─────────────────────────────────────────────────────────
  function handleCancel(booking: ScheduleBooking) {
    Alert.alert(
      'Cancel booking?',
      `Cancel your ${booking.serviceName} appointment on ${booking.whenLabel}? This cannot be undone.`,
      [
        { text: 'Keep it', style: 'cancel' },
        {
          text: 'Yes, cancel',
          style: 'destructive',
          onPress: async () => {
            if (!booking.id) return;
            setCancellingRef(booking.reference);
            const res = await cancelBooking({
              bookingId: booking.id,
              phone: booking.guestPhone, // only used for guest verification
            });
            setCancellingRef(null);
            if (!res.ok) {
              Alert.alert('Could not cancel', res.message);
              return;
            }
            // Update local state optimistically
            setBookings((prev) =>
              prev.map((b) => b.reference === booking.reference ? { ...b, status: 'cancelled' } : b),
            );
            // For guests: persist status change to AsyncStorage
            if (isGuest) {
              await updateGuestBookingStatus(booking.reference, 'cancelled');
            }
            Alert.alert('Booking cancelled', 'Your booking has been cancelled successfully.');
          },
        },
      ],
    );
  }

  const sections = useMemo(() => [
    { title: 'Upcoming', data: bookings.filter(isUpcoming) },
    { title: 'Completed', data: bookings.filter(isCompleted) },
    { title: 'Cancelled', data: bookings.filter((b) => isCancelled(b.status)) },
  ], [bookings]);

  if (loading || initialLoading) return <LoadingScreen message="Loading schedules..." />;

  if (!user && !isGuest) {
    return (
      <ScreenContainer scroll={false} style={{ justifyContent: 'center' }}>
        <Card>
          <Text style={[Type.h2, { color: c.fg }]}>Choose access first</Text>
          <Text style={[Type.body, { color: c.fg2, marginTop: Spacing.xs, marginBottom: Spacing.md }]}>
            Continue as a guest or log in to view your schedules.
          </Text>
          <ThemedButton label="Choose Access" onPress={() => router.replace('/access' as never)} />
        </Card>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer
      safeTop={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} tintColor={c.accent} />}>
      <ScreenHeader eyebrow="SCHEDULES" title="Your bookings" right={isGuest ? <ThemeToggleButton /> : undefined} />
      {isGuest && <GuestHeader />}

      {bookings.length === 0 ? (
        <>
          <EmptyState icon="📅" title="No bookings yet" caption="Book a service and your reference will appear here." actionLabel="Book Now" onAction={() => router.push('/(tabs)/book')} />
          {isGuest && (
            <ThemedButton variant="secondary" label="Login / Create Account" onPress={() => router.push('/access' as never)} style={{ marginTop: Spacing.sm }} />
          )}
        </>
      ) : sections.map((section, sectionIndex) => (
        <View key={section.title}>
          <SectionHeader number={sectionIndex + 1} title={section.title} />
          {section.data.length === 0 ? (
            <EmptyState title={`No ${section.title.toLowerCase()} bookings`} />
          ) : section.data.map((booking, bookingIndex) => {
            const upcoming = isUpcoming(booking);
            const canAct = upcoming && !!booking.id;
            const cancelling = cancellingRef === booking.reference;

            return (
              <FadeUp key={booking.reference} index={bookingIndex} animate={!hasAnimated.current}>
                {(() => {
                  return (
                    <Card
                      style={{
                        marginBottom: Spacing.md,
                        padding: 0,
                        overflow: 'hidden',
                        borderWidth: 1,
                        borderColor: c.hairline,
                        backgroundColor: c.surfaceRaised,
                        ...Shadow.sm,
                      }}
                    >
                      {/* Ticket Header (Primary Pass Info) */}
                      <View style={{ padding: Spacing.md, gap: Spacing.xs }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: Spacing.sm }}>
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontFamily: 'Poppins_700Bold', fontSize: 16, color: c.fg }}>
                              {booking.serviceName}
                            </Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                              <View style={{
                                backgroundColor: c.accentTint,
                                borderRadius: Radius.pill,
                                paddingHorizontal: 8,
                                paddingVertical: 2,
                                borderWidth: 1,
                                borderColor: scheme === 'dark' ? 'rgba(217,166,72,0.15)' : 'rgba(194,144,54,0.12)',
                              }}>
                                <Text style={{ fontFamily: 'Poppins_700Bold', fontSize: 10, color: c.accentText, letterSpacing: 0.5 }}>
                                  #{booking.reference}
                                </Text>
                              </View>
                            </View>
                          </View>
                          <StatusTag status={booking.status} />
                        </View>
                      </View>

                      {/* Dashed Line Ticket-Stub Separator */}
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 16, marginVertical: -4 }}>
                        {/* Left ticket circle cut */}
                        <View style={{ width: 12, height: 24, borderRadius: 12, backgroundColor: c.bg, position: 'absolute', left: -7, borderWidth: 1, borderColor: c.hairline }} />
                        {/* Dashed line */}
                        <View style={{ flex: 1, height: 1, borderStyle: 'dashed', borderWidth: 1, borderColor: c.line, borderRadius: 1, marginHorizontal: 12 }} />
                        {/* Right ticket circle cut */}
                        <View style={{ width: 12, height: 24, borderRadius: 12, backgroundColor: c.bg, position: 'absolute', right: -7, borderWidth: 1, borderColor: c.hairline }} />
                      </View>

                      {/* Ticket Details Panel & Actions */}
                      <View style={{ padding: Spacing.md, gap: Spacing.md }}>
                        <View style={{
                          backgroundColor: scheme === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.012)',
                          borderRadius: Radius.md,
                          padding: Spacing.sm + 4,
                          gap: Spacing.xs + 2,
                          borderWidth: 1,
                          borderColor: c.hairline,
                        }}>
                          {/* Stylist Row */}
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                              <MaterialIcons name="person" size={14} color={c.fgMuted} />
                              <Text style={{ fontFamily: 'Poppins_500Medium', fontSize: 11, color: c.fgMuted }}>Stylist</Text>
                            </View>
                            <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 11, color: c.fg }}>{booking.stylistName}</Text>
                          </View>

                          <View style={{ height: 1, backgroundColor: c.hairline }} />

                          {/* Date & Time Row */}
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                              <MaterialIcons name="schedule" size={14} color={c.fgMuted} />
                              <Text style={{ fontFamily: 'Poppins_500Medium', fontSize: 11, color: c.fgMuted }}>Date & Time</Text>
                            </View>
                            <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 11, color: c.fg, textAlign: 'right' }}>{booking.whenLabel}</Text>
                          </View>

                          {typeof booking.priceLkr === 'number' && (
                            <>
                              <View style={{ height: 1, backgroundColor: c.hairline }} />
                              {/* Price Row */}
                              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                  <MaterialIcons name="payments" size={14} color={c.accentText} />
                                  <Text style={{ fontFamily: 'Poppins_700Bold', fontSize: 11, color: c.accentText }}>Price</Text>
                                </View>
                                <Text style={{ fontFamily: 'Poppins_700Bold', fontSize: 13, color: c.accentText }}>{money(booking.priceLkr)}</Text>
                              </View>
                            </>
                          )}
                        </View>

                        {/* Action buttons */}
                        {upcoming ? (
                          <View style={{ gap: Spacing.sm }}>
                            <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
                              <PressableScale
                                onPress={() => Linking.openURL(`tel:${SALON_PHONE}`)}
                                style={{
                                  flex: 1,
                                  borderRadius: Radius.pill,
                                  borderWidth: 1,
                                  borderColor: c.line,
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  height: 38,
                                }}
                              >
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                  <MaterialIcons name="phone" size={12} color={c.accentText} />
                                  <Text style={{ color: c.accentText, fontSize: 12, fontFamily: 'Poppins_600SemiBold' }}>Call salon</Text>
                                </View>
                              </PressableScale>

                              {canAct && (
                                <PressableScale
                                  onPress={() => setRescheduleTarget(booking)}
                                  style={{
                                    flex: 1,
                                    borderRadius: Radius.pill,
                                    backgroundColor: c.accent,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    height: 38,
                                  }}
                                >
                                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                    <MaterialIcons name="edit-calendar" size={12} color={scheme === 'dark' ? '#121110' : '#FAFAF8'} />
                                    <Text style={{ color: scheme === 'dark' ? '#121110' : '#FAFAF8', fontSize: 12, fontFamily: 'Poppins_600SemiBold' }}>Reschedule</Text>
                                  </View>
                                </PressableScale>
                              )}
                            </View>

                            {!isGuest && booking.stylistId && (
                              <PressableScale
                                onPress={() => handleMessageStylist(booking)}
                                style={{
                                  borderRadius: Radius.pill,
                                  borderWidth: 1,
                                  borderColor: c.line,
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  height: 38,
                                }}
                              >
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                  <MaterialIcons name="chat" size={12} color={c.accentText} />
                                  <Text style={{ color: c.accentText, fontSize: 12, fontFamily: 'Poppins_600SemiBold' }}>Message stylist</Text>
                                </View>
                              </PressableScale>
                            )}

                            {canAct && (
                              <PressableScale
                                onPress={() => handleCancel(booking)}
                                disabled={cancelling}
                                style={{
                                  borderRadius: Radius.pill,
                                  borderWidth: 1,
                                  borderColor: scheme === 'dark' ? 'rgba(240,133,126,0.3)' : 'rgba(192,57,43,0.2)',
                                  backgroundColor: scheme === 'dark' ? 'rgba(240,133,126,0.06)' : 'rgba(192,57,43,0.04)',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  height: 38,
                                }}
                              >
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                  <MaterialIcons name="cancel" size={12} color={c.error} />
                                  <Text style={{ color: c.error, fontSize: 12, fontFamily: 'Poppins_600SemiBold' }}>
                                    {cancelling ? 'Cancelling…' : 'Cancel booking'}
                                  </Text>
                                </View>
                              </PressableScale>
                            )}
                          </View>
                        ) : (
                          <View style={{ gap: Spacing.sm }}>
                            {isCompleted(booking) && booking.stylistId && (
                              <PressableScale
                                onPress={() => {
                                  setUserRating(null);
                                  setHasRated(false);
                                  setRatingTarget(booking);
                                }}
                                style={{
                                  borderRadius: Radius.pill,
                                  borderWidth: 1.5,
                                  borderColor: c.accent,
                                  backgroundColor: scheme === 'dark' ? 'rgba(217,166,72,0.06)' : '#FEF6E4',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  height: 38,
                                }}
                              >
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                  <MaterialIcons name="star-outline" size={14} color={c.accentText} />
                                  <Text style={{ color: c.accentText, fontSize: 12, fontFamily: 'Poppins_600SemiBold' }}>Rate {booking.stylistName}</Text>
                                </View>
                              </PressableScale>
                            )}
                            <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
                              <PressableScale
                                onPress={() => Linking.openURL(`tel:${SALON_PHONE}`)}
                                style={{
                                  flex: 1,
                                  borderRadius: Radius.pill,
                                  borderWidth: 1,
                                  borderColor: c.line,
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  height: 38,
                                }}
                              >
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                  <MaterialIcons name="phone" size={12} color={c.accentText} />
                                  <Text style={{ color: c.accentText, fontSize: 12, fontFamily: 'Poppins_600SemiBold' }}>Call salon</Text>
                                </View>
                              </PressableScale>
                              
                              <PressableScale
                                onPress={() => router.push('/(tabs)/book')}
                                style={{
                                  flex: 1,
                                  borderRadius: Radius.pill,
                                  backgroundColor: c.accent,
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  height: 38,
                                }}
                              >
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                  <MaterialIcons name="event" size={12} color={scheme === 'dark' ? '#121110' : '#FAFAF8'} />
                                  <Text style={{ color: scheme === 'dark' ? '#121110' : '#FAFAF8', fontSize: 12, fontFamily: 'Poppins_600SemiBold' }}>Book again</Text>
                                </View>
                              </PressableScale>
                            </View>
                          </View>
                        )}
                      </View>
                    </Card>
                  );
                })()}
              </FadeUp>
            );
          })}
        </View>
      ))}

      {isGuest && bookings.length > 0 && (
        <Card style={{ marginTop: Spacing.md, gap: Spacing.sm }}>
          <Text style={[Type.label, { color: c.fg, fontSize: 15, fontFamily: 'Poppins_600SemiBold' }]}>Create an account to save bookings</Text>
          <Text style={[Type.caption, { color: c.fgMuted, marginBottom: Spacing.xs }]}>
            Guest references stay on this device. An account keeps future bookings linked to you.
          </Text>
          <ThemedButton variant="secondary" label="Login / Create Account" onPress={() => router.push('/access' as never)} />
        </Card>
      )}

      <View style={{ height: 60 }} />

      {/* Reschedule bottom sheet */}
      {rescheduleTarget && (
        <RescheduleModal
          booking={rescheduleTarget}
          onClose={() => setRescheduleTarget(null)}
          onSuccess={async (whenLabel, date, time) => {
            setBookings((prev) =>
              prev.map((b) =>
                b.id === rescheduleTarget.id
                  ? { ...b, whenLabel, startsAt: localToUtcISO(date, hhmmToMin(time)) }
                  : b,
              ),
            );
            if (isGuest) {
              await updateGuestBookingTime(rescheduleTarget.reference, whenLabel, date, time);
            }
            setRescheduleTarget(null);
            Alert.alert('Rescheduled ✓', `Your appointment has been moved to ${whenLabel}.`);
          }}
        />
      )}

      {/* Rate Stylist Modal */}
      {ratingTarget && (
        <Modal visible animationType="fade" transparent onRequestClose={() => setRatingTarget(null)}>
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)', padding: Spacing.md }}>
            <PressableScale onPress={() => setRatingTarget(null)} style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }}>
              <View style={{ flex: 1 }} />
            </PressableScale>
            
            <View style={{
              width: '100%',
              maxWidth: 340,
              backgroundColor: c.surfaceRaised,
              borderRadius: 24,
              borderWidth: 1,
              borderColor: c.accent,
              padding: Spacing.lg,
              gap: Spacing.md,
              shadowColor: '#1C1A17',
              shadowOpacity: 0.22,
              shadowRadius: 28,
              shadowOffset: { width: 0, height: 10 },
              elevation: 12,
            }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={[Type.h2, { color: c.fg, fontFamily: 'Poppins_700Bold', fontSize: 18 }]}>Rate Stylist</Text>
                <PressableScale onPress={() => setRatingTarget(null)} style={{ padding: 4 }}>
                  <MaterialIcons name="close" size={20} color={c.fgMuted} />
                </PressableScale>
              </View>

              <Text style={[Type.body, { color: c.fg2, fontSize: 13, lineHeight: 18, textAlign: 'center', marginVertical: Spacing.xs }]}>
                How was your service with <Text style={{ fontFamily: 'Poppins_700Bold', color: c.fg }}>{ratingTarget.stylistName}</Text> for <Text style={{ fontFamily: 'Poppins_600SemiBold' }}>{ratingTarget.serviceName}</Text>?
              </Text>

              <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 12, marginVertical: Spacing.sm }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <PressableScale
                    key={star}
                    onPress={() => handleRateStylist(star)}
                    disabled={submittingRating || hasRated}
                    style={{ padding: 4 }}
                  >
                    <MaterialIcons
                      name={star <= (userRating ?? 0) ? 'star' : 'star-outline'}
                      size={36}
                      color={star <= (userRating ?? 0) ? '#D9A648' : c.fgMuted}
                    />
                  </PressableScale>
                ))}
              </View>

              {hasRated && (
                <Text style={{ color: '#2ECC71', fontSize: 12, fontFamily: 'Poppins_600SemiBold', textAlign: 'center' }}>
                  Rating submitted! Thank you! ❤️
                </Text>
              )}
            </View>
          </View>
        </Modal>
      )}
    </ScreenContainer>
  );
}
