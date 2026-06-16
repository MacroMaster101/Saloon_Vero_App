import { getStylistCustomerBookings } from '@/lib/api/chat';
import { StatusTag } from '@/components/ui/status-tag';
import { useTheme } from '@/hooks/use-theme';
import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';

const whenFmt = new Intl.DateTimeFormat('en-LK', {
  timeZone: 'Asia/Colombo',
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
});

type Row = { id: string; reference: string; serviceName: string; startsAt: string; status: string };

export function BookingPickerSheet({
  visible,
  stylistId,
  customerId,
  onSelect,
  onClose,
}: {
  visible: boolean;
  stylistId: string | null;
  customerId: string | null;
  onSelect: (bookingId: string) => void;
  onClose: () => void;
}) {
  const { c, Spacing, Type } = useTheme();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!visible || !stylistId || !customerId) return;
    setLoading(true);
    getStylistCustomerBookings(stylistId, customerId).then((r) => {
      setRows(r);
      setLoading(false);
    });
  }, [visible, stylistId, customerId]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable
        onPress={onClose}
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' }}
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{
            backgroundColor: c.bg,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            paddingHorizontal: Spacing.md,
            paddingTop: Spacing.md,
            paddingBottom: Spacing.xl,
            maxHeight: '70%',
          }}
        >
          <Text style={[Type.h2, { color: c.fg, marginBottom: Spacing.sm }]}>Attach a booking</Text>
          {loading ? (
            <Text
              style={{ color: c.fgMuted, fontFamily: 'Poppins_500Medium', paddingVertical: Spacing.lg }}
            >
              Loading…
            </Text>
          ) : rows.length === 0 ? (
            <Text
              style={{ color: c.fgMuted, fontFamily: 'Poppins_500Medium', paddingVertical: Spacing.lg }}
            >
              No bookings to reference.
            </Text>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false}>
              {rows.map((b) => (
                <Pressable
                  key={b.id}
                  onPress={() => onSelect(b.id)}
                  style={{
                    paddingVertical: Spacing.sm,
                    borderBottomWidth: 1,
                    borderBottomColor: c.hairline,
                    gap: 4,
                  }}
                >
                  <Text style={{ color: c.fg, fontFamily: 'Poppins_600SemiBold', fontSize: 14 }}>
                    {b.serviceName}
                  </Text>
                  <View
                    style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
                  >
                    <Text style={{ color: c.fg2, fontFamily: 'Poppins_500Medium', fontSize: 12 }}>
                      {whenFmt.format(new Date(b.startsAt))}
                    </Text>
                    <StatusTag status={b.status} />
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
