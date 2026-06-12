import { useEffect, useReducer, useState } from 'react';
import { Text, Pressable } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { BackButton } from '@/components/ui/back-button';
import { bookingReducer, initialBooking } from '@/lib/booking/booking-machine';
import { getStylists } from '@/lib/api/queries';
import { getAvailability, createBooking } from '@/lib/api/edge';
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
  const { c, Type, Spacing, Radius } = useTheme();
  const { user, isGuest, profile, loading: sessionLoading } = useSession();
  const { serviceId } = useLocalSearchParams<{ serviceId: string }>();
  const [state, dispatch] = useReducer(bookingReducer, serviceId!, initialBooking);
  const [stylists, setStylists] = useState<Stylist[]>([]);
  const [slots, setSlots] = useState<string[]>([]); const [loadingSlots, setLoadingSlots] = useState(false);
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
        reference: res.reference,
        serviceId: serviceId!,
        serviceName: res.serviceName,
        stylistName: res.stylistName,
        whenLabel: res.whenLabel,
        date: state.date!,
        time: state.time!,
        status: 'confirmed',
        priceLkr: res.priceLkr,
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
    <ScreenContainer>
      <ScreenHeader
        eyebrow="BOOK YOUR VISIT"
        title={STEP_TITLES[state.step] ?? 'Booking'}
        left={<BackButton onPress={state.step === 'stylist' ? undefined : () => dispatch({ type: 'back' })} />}
        right={<ThemeToggleButton />}
      />
      <StepIndicator total={4} current={STEPS.indexOf(state.step)} />

      <Animated.View key={state.step} entering={FadeIn.duration(220)} exiting={FadeOut.duration(120)}>
        {state.step === 'stylist' && (<>
          <Pressable
            onPress={() => dispatch({ type: 'setStylist', stylistId: null })}
            style={{
              padding: Spacing.md,
              borderRadius: Radius.lg,
              borderWidth: 1,
              borderColor: c.accent,
              backgroundColor: c.accentTint,
              marginBottom: Spacing.md,
            }}
          >
            <Text style={[Type.label, { color: c.accentText, textAlign: 'center', fontSize: 15, fontFamily: 'Poppins_600SemiBold' }]}>✨ Any available stylist</Text>
          </Pressable>
          {stylists.map((s) => <StylistCard key={s.id} stylist={s} onPress={() => dispatch({ type: 'setStylist', stylistId: s.id })} />)}
        </>)}

        {state.step === 'date' && (<>
          {nextNDates(14).map((d) => {
            // Timezone-safe date formatting
            const [yr, mo, dy] = d.split('-').map(Number);
            const dateObj = new Date(yr, mo - 1, dy);
            const weekdayStr = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
            const monthDayStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            const isSelected = state.date === d;

            return (
              <Pressable
                key={d}
                onPress={() => dispatch({ type: 'setDate', date: d })}
                style={{
                  padding: Spacing.md,
                  borderRadius: Radius.pill,
                  borderWidth: 1,
                  borderColor: isSelected ? c.fg : c.line,
                  backgroundColor: isSelected ? c.fg : c.surfaceRaised,
                  marginBottom: Spacing.sm,
                }}
              >
                <Text style={[Type.body, { color: isSelected ? c.bg : c.fg, fontFamily: 'Poppins_500Medium' }]}>
                  {weekdayStr}, {monthDayStr}
                </Text>
              </Pressable>
            );
          })}
        </>)}

        {state.step === 'time' && (
          loadingSlots ? <LoadingScreen message="Finding open slots..." fullScreen={false} /> : <SlotPicker slots={slots} selected={state.time} onSelect={(t) => dispatch({ type: 'setTime', time: t })} />
        )}

        {state.step === 'details' && (
          <Card style={{ padding: Spacing.lg, gap: Spacing.xs }}>
            <ThemedTextInput label="Name" value={name} onChangeText={setName} />
            <ThemedTextInput label="Mobile" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
            <ThemedTextInput label="Email (optional)" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
            <ThemedTextInput label="Notes (optional)" multiline value={notes} onChangeText={setNotes} style={{ height: 80, textAlignVertical: 'top' }} />
            <ThemedButton label="Confirm booking" busy={submitting} onPress={submit} style={{ marginTop: Spacing.sm }} />
          </Card>
        )}
      </Animated.View>

      {error && <Text style={[Type.caption, { color: c.error, marginTop: Spacing.md, textAlign: 'center' }]}>{error}</Text>}
    </ScreenContainer>
  );
}
