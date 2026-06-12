import { Alert, Linking, Pressable, Text, View } from 'react-native';
import { Card } from '@/components/ui/card';
import { StatusTag } from '@/components/ui/status-tag';
import { useTheme } from '@/hooks/use-theme';
import type { StaffBooking, AdminBookingStatus } from '@/lib/api/staff';

const timeFmt = new Intl.DateTimeFormat('en-LK', {
  timeZone: 'Asia/Colombo',
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
});

function formatTimeRange(startsAt: string, endsAt: string): string {
  return `${timeFmt.format(new Date(startsAt))} – ${timeFmt.format(new Date(endsAt))}`;
}

export function StaffBookingCard({
  booking,
  serviceName,
  stylistName,
  allowUndo,
  onSetStatus,
}: {
  booking: StaffBooking;
  serviceName: string;
  stylistName?: string;
  allowUndo?: boolean;
  onSetStatus: (id: string, status: AdminBookingStatus) => void;
}) {
  const { c, Radius, Spacing, Type } = useTheme();

  function handleCancel() {
    Alert.alert(
      'Cancel booking?',
      booking.reference,
      [
        { text: 'Keep' },
        {
          text: 'Cancel booking',
          style: 'destructive',
          onPress: () => onSetStatus(booking.id, 'cancelled'),
        },
      ],
    );
  }

  return (
    <Card style={{ marginBottom: Spacing.md, gap: Spacing.sm }}>
      {/* Time range */}
      <Text style={[Type.caption, { color: c.fgMuted }]}>
        {formatTimeRange(booking.starts_at, booking.ends_at)}
      </Text>

      {/* Customer name */}
      <Text style={[Type.label, { color: c.fg, fontSize: 16, fontFamily: 'Poppins_600SemiBold' }]}>
        {booking.customer_name}
      </Text>

      {/* Stylist pill */}
      {!!stylistName && (
        <Text style={[
          Type.caption,
          {
            color: c.accentText,
            backgroundColor: c.accentTint,
            borderRadius: Radius.pill,
            fontSize: 11,
            paddingHorizontal: 8,
            alignSelf: 'flex-start',
            overflow: 'hidden',
          },
        ]}>
          {stylistName}
        </Text>
      )}

      {/* Service name */}
      <Text style={[Type.caption, { color: c.fgMuted }]}>{serviceName}</Text>

      {/* Phone */}
      <Pressable
        accessibilityRole="button"
        onPress={() => Linking.openURL(`tel:${booking.customer_phone}`)}
      >
        <Text style={[Type.caption, { color: c.accentText }]}>{booking.customer_phone}</Text>
      </Pressable>

      {/* Status */}
      <StatusTag status={booking.status} />

      {/* Notes */}
      {!!booking.notes && (
        <Text style={[Type.caption, { color: c.fgMuted, fontStyle: 'italic' }]}>
          {booking.notes}
        </Text>
      )}

      {/* Undo action — only when allowUndo and booking is not already confirmed */}
      {allowUndo && booking.status !== 'confirmed' && (
        <Pressable
          accessibilityRole="button"
          onPress={() => onSetStatus(booking.id, 'confirmed')}
          style={{
            alignSelf: 'flex-start',
            borderWidth: 1,
            borderColor: c.accentDark,
            borderRadius: Radius.pill,
            paddingHorizontal: 12,
            paddingVertical: Spacing.xs,
            backgroundColor: 'transparent',
          }}
        >
          <Text style={[Type.caption, { color: c.accentDark, fontFamily: 'Poppins_600SemiBold' }]}>
            Undo to confirmed
          </Text>
        </Pressable>
      )}

      {/* Action row — only for confirmed bookings */}
      {booking.status === 'confirmed' && (
        <View style={{ flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.xs }}>
          {/* Complete */}
          <Pressable
            accessibilityRole="button"
            onPress={() => onSetStatus(booking.id, 'completed')}
            style={{
              flex: 1,
              borderRadius: Radius.pill,
              paddingVertical: Spacing.sm,
              backgroundColor: c.accentTint,
              alignItems: 'center',
            }}
          >
            <Text style={[Type.caption, { color: c.accentText, fontFamily: 'Poppins_600SemiBold' }]}>
              Complete
            </Text>
          </Pressable>

          {/* No-show */}
          <Pressable
            accessibilityRole="button"
            onPress={() => onSetStatus(booking.id, 'no_show')}
            style={{
              flex: 1,
              borderRadius: Radius.pill,
              paddingVertical: Spacing.sm,
              backgroundColor: c.surfaceRaised,
              borderWidth: 1,
              borderColor: c.line,
              alignItems: 'center',
            }}
          >
            <Text style={[Type.caption, { color: c.fgMuted, fontFamily: 'Poppins_600SemiBold' }]}>
              No-show
            </Text>
          </Pressable>

          {/* Cancel */}
          <Pressable
            accessibilityRole="button"
            onPress={handleCancel}
            style={{
              flex: 1,
              borderRadius: Radius.pill,
              paddingVertical: Spacing.sm,
              borderWidth: 1,
              borderColor: c.error,
              alignItems: 'center',
            }}
          >
            <Text style={[Type.caption, { color: c.error, fontFamily: 'Poppins_600SemiBold' }]}>
              Cancel
            </Text>
          </Pressable>
        </View>
      )}
    </Card>
  );
}
