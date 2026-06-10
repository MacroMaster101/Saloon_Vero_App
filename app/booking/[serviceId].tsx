import { useEffect, useReducer, useState } from 'react';
import { Text, Pressable } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { bookingReducer, initialBooking } from '@/lib/booking/booking-machine';
import { getStylists } from '@/lib/api/queries';
import { getAvailability, createBooking } from '@/lib/api/edge';
import { SlotPicker } from '@/components/booking/slot-picker';
import { StylistCard } from '@/components/stylists/stylist-card';
import { bookingDetailsSchema } from '@/lib/validation/booking';
import { ScreenContainer } from '@/components/ui/screen';
import { SectionHeader } from '@/components/ui/section-header';
import { ThemedTextInput } from '@/components/ui/text-input';
import { ThemedButton } from '@/components/ui/button';
import { StepIndicator } from '@/components/ui/step-indicator';
import { useTheme } from '@/hooks/use-theme';
import { LoadingScreen } from '@/components/ui/loading';
import type { Stylist } from '@/types/database';

const STEPS = ['stylist', 'date', 'time', 'details'] as const;
const dayFmt = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Colombo', year: 'numeric', month: '2-digit', day: '2-digit' });
function nextNDates(n: number): string[] {
  const out: string[] = []; const now = Date.now();
  for (let i = 0; i < n; i++) out.push(dayFmt.format(new Date(now + i * 86400000)));
  return out;
}

export default function BookingFlow() {
  const { c, Type, Spacing, Radius } = useTheme();
  const { serviceId } = useLocalSearchParams<{ serviceId: string }>();
  const [state, dispatch] = useReducer(bookingReducer, serviceId!, initialBooking);
  const [stylists, setStylists] = useState<Stylist[]>([]);
  const [slots, setSlots] = useState<string[]>([]); const [loadingSlots, setLoadingSlots] = useState(false);
  const [name, setName] = useState(''); const [phone, setPhone] = useState(''); const [email, setEmail] = useState(''); const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null); const [submitting, setSubmitting] = useState(false);

  useEffect(() => { getStylists().then(setStylists); }, []);
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
    router.replace({ pathname: '/booking/success', params: { reference: res.reference, when: res.whenLabel, stylist: res.stylistName } });
  }

  if (submitting) {
    return <LoadingScreen message="Securing your booking..." />;
  }

  return (
    <ScreenContainer>
      <StepIndicator total={4} current={STEPS.indexOf(state.step)} />
      {state.step !== 'stylist' && <Pressable onPress={() => dispatch({ type: 'back' })}><Text style={[Type.body, { color: c.accentText, marginBottom: Spacing.sm }]}>‹ Back</Text></Pressable>}

      {state.step === 'stylist' && (<>
        <SectionHeader eyebrow="Step 1" title="Choose a stylist" />
        <Pressable onPress={() => dispatch({ type: 'setStylist', stylistId: null })} style={{ padding: Spacing.md, borderRadius: Radius.lg, borderWidth: 1, borderColor: c.accent, marginBottom: Spacing.sm }}>
          <Text style={[Type.label, { color: c.fg }]}>Any available stylist</Text>
        </Pressable>
        {stylists.map((s) => <StylistCard key={s.id} stylist={s} onPress={() => dispatch({ type: 'setStylist', stylistId: s.id })} />)}
      </>)}

      {state.step === 'date' && (<>
        <SectionHeader eyebrow="Step 2" title="Pick a date" />
        {nextNDates(14).map((d) => (
          <Pressable key={d} onPress={() => dispatch({ type: 'setDate', date: d })} style={{ padding: Spacing.md, borderRadius: Radius.md, borderWidth: 1, borderColor: c.line, backgroundColor: c.surface, marginBottom: Spacing.sm }}>
            <Text style={[Type.body, { color: c.fg }]}>{d}</Text>
          </Pressable>
        ))}
      </>)}

      {state.step === 'time' && (<>
        <SectionHeader eyebrow="Step 3" title="Pick a time" />
        {loadingSlots ? <LoadingScreen message="Finding open slots..." fullScreen={false} /> : <SlotPicker slots={slots} selected={state.time} onSelect={(t) => dispatch({ type: 'setTime', time: t })} />}
      </>)}

      {state.step === 'details' && (<>
        <SectionHeader eyebrow="Step 4" title="Your details" />
        <ThemedTextInput label="Name" value={name} onChangeText={setName} />
        <ThemedTextInput label="Mobile" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
        <ThemedTextInput label="Email (optional)" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
        <ThemedTextInput label="Notes (optional)" multiline value={notes} onChangeText={setNotes} style={{ height: 80, textAlignVertical: 'top' }} />
        <ThemedButton label="Confirm booking" busy={submitting} onPress={submit} />
      </>)}

      {error && <Text style={[Type.caption, { color: c.error, marginTop: Spacing.md }]}>{error}</Text>}
    </ScreenContainer>
  );
}
