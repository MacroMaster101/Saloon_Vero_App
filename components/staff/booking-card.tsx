import { Alert, Linking, Text, View } from 'react-native';
import { Card } from '@/components/ui/card';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { PressableScale } from '@/components/ui/pressable-scale';
import { StatusTag } from '@/components/ui/status-tag';
import { StaffIconBadge, StaffTextAction } from '@/components/staff/staff-ui';
import { useTheme } from '@/hooks/use-theme';
import type { StaffBooking, AdminBookingStatus } from '@/lib/api/staff';

const timeFmt = new Intl.DateTimeFormat('en-LK', {
  timeZone: 'Asia/Colombo',
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
});

function formatTimeRange(startsAt: string, endsAt: string): string {
  return `${timeFmt.format(new Date(startsAt))} - ${timeFmt.format(new Date(endsAt))}`;
}

function statusAccent(status: string, c: ReturnType<typeof useTheme>['c']) {
  if (status === 'confirmed') return c.accent;
  if (status === 'completed') return '#27AE60';
  if (status === 'cancelled' || status === 'no_show') return c.error;
  return c.hairline;
}

export function StaffBookingCard({
  booking,
  serviceName,
  stylistName,
  allowUndo,
  onSetStatus,
  onDelete,
}: {
  booking: StaffBooking;
  serviceName: string;
  stylistName?: string;
  allowUndo?: boolean;
  onSetStatus: (id: string, status: AdminBookingStatus) => void;
  onDelete?: (id: string) => void;
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
    <Card style={{ marginBottom: Spacing.md, gap: Spacing.sm, borderLeftWidth: 4, borderLeftColor: statusAccent(booking.status, c) }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: Spacing.sm }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flex: 1, minWidth: 0 }}>
          <StaffIconBadge icon="clock.fill" tone={booking.status === 'confirmed' ? 'accent' : 'muted'} size={34} />
          <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
            <Text style={[Type.caption, { color: c.accentText, fontFamily: 'Poppins_600SemiBold' }]} numberOfLines={1}>
              {formatTimeRange(booking.starts_at, booking.ends_at)}
            </Text>
            <Text style={[Type.label, { color: c.fg, fontSize: 17, fontFamily: 'Poppins_700Bold' }]} numberOfLines={1}>
              {booking.customer_name}
            </Text>
          </View>
        </View>
        <StatusTag status={booking.status} />
      </View>

      <View style={{ gap: 6 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <IconSymbol name="tag.fill" size={14} color={c.fgMuted} />
          <Text style={[Type.caption, { color: c.fg2, flex: 1 }]} numberOfLines={1}>{serviceName}</Text>
        </View>

        {!!stylistName && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <IconSymbol name="person.fill" size={14} color={c.fgMuted} />
            <Text style={[Type.caption, { color: c.accentText, flex: 1, fontFamily: 'Poppins_600SemiBold' }]} numberOfLines={1}>
              {stylistName}
            </Text>
          </View>
        )}
      </View>

      <PressableScale
        accessibilityRole="button"
        onPress={() => Linking.openURL(`tel:${booking.customer_phone}`)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          alignSelf: 'flex-start',
          borderRadius: Radius.sm,
          backgroundColor: c.bg2,
          borderWidth: 1,
          borderColor: c.hairline,
          paddingHorizontal: Spacing.sm,
          paddingVertical: Spacing.xs,
        }}
      >
        <IconSymbol name="phone.fill" size={14} color={c.accentText} />
        <Text style={[Type.caption, { color: c.accentText, fontFamily: 'Poppins_600SemiBold' }]}>{booking.customer_phone}</Text>
      </PressableScale>

      {!!booking.notes && (
        <Text style={[Type.caption, { color: c.fgMuted, fontStyle: 'italic', borderTopWidth: 1, borderTopColor: c.hairline, paddingTop: Spacing.sm }]} numberOfLines={3}>
          {booking.notes}
        </Text>
      )}

      {allowUndo && booking.status !== 'confirmed' && (
        <StaffTextAction
          label="Undo to confirmed"
          icon="arrow.right"
          tone="accent"
          onPress={() => onSetStatus(booking.id, 'confirmed')}
          flex={0}
        />
      )}

      {booking.status === 'confirmed' && (
        <View style={{ flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.xs, borderTopWidth: 1, borderTopColor: c.hairline, paddingTop: Spacing.sm }}>
          <StaffTextAction
            label="Complete"
            icon="checkmark"
            tone="success"
            onPress={() => onSetStatus(booking.id, 'completed')}
          />
          <StaffTextAction
            label="No-show"
            icon="person.fill"
            tone="muted"
            onPress={() => onSetStatus(booking.id, 'no_show')}
          />
          <StaffTextAction
            label="Cancel"
            icon="xmark"
            tone="danger"
            onPress={handleCancel}
          />
        </View>
      )}

      {!!onDelete && (
        <View style={{ borderTopWidth: 1, borderTopColor: c.hairline, paddingTop: Spacing.sm, marginTop: Spacing.xs, flexDirection: 'row', justifyContent: 'flex-end' }}>
          <StaffTextAction
            label="Delete Record"
            icon="trash.fill"
            tone="danger"
            flex={0}
            onPress={() => {
              Alert.alert(
                'Delete booking permanently?',
                `Reference: ${booking.reference}\nCustomer: ${booking.customer_name}\nThis action cannot be undone.`,
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Delete', style: 'destructive', onPress: () => onDelete(booking.id) },
                ],
              );
            }}
          />
        </View>
      )}
    </Card>
  );
}
