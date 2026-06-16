import { getBookingCard, type BookingCardData } from '@/lib/api/chat';
import { StatusTag } from '@/components/ui/status-tag';
import { useTheme } from '@/hooks/use-theme';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

const whenFmt = new Intl.DateTimeFormat('en-LK', {
  timeZone: 'Asia/Colombo',
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
});

export function BookingCard({ bookingId }: { bookingId: string }) {
  const { c, Radius, Spacing } = useTheme();
  const [data, setData] = useState<BookingCardData | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    getBookingCard(bookingId).then((d) => {
      if (!active) return;
      if (d) setData(d);
      else setFailed(true);
    });
    return () => {
      active = false;
    };
  }, [bookingId]);

  const box = {
    width: 240,
    borderRadius: Radius.md,
    backgroundColor: c.bg2,
    borderWidth: 1,
    borderColor: c.hairline,
    padding: Spacing.sm + 2,
    gap: 6,
  };

  if (failed) {
    return (
      <View style={box}>
        <Text style={{ color: c.fgMuted, fontFamily: 'Poppins_500Medium', fontSize: 12 }}>
          Booking unavailable
        </Text>
      </View>
    );
  }
  if (!data) {
    return (
      <View style={[box, { alignItems: 'center', justifyContent: 'center', minHeight: 80 }]}>
        <ActivityIndicator color={c.accent} />
      </View>
    );
  }

  return (
    <Pressable onPress={() => router.push('/(tabs)/schedules')} style={box}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Text style={{ fontSize: 13 }}>📅</Text>
        <Text
          numberOfLines={1}
          style={{ flex: 1, color: c.fg, fontFamily: 'Poppins_700Bold', fontSize: 14 }}
        >
          {data.serviceName}
        </Text>
      </View>
      <Text style={{ color: c.fg2, fontFamily: 'Poppins_500Medium', fontSize: 12 }}>
        {whenFmt.format(new Date(data.startsAt))}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <StatusTag status={data.status} />
        <Text style={{ color: c.fgMuted, fontFamily: 'Poppins_600SemiBold', fontSize: 11 }}>
          #{data.reference}
        </Text>
      </View>
    </Pressable>
  );
}
