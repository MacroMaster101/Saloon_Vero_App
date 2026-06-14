import { Text, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { PressableScale } from '@/components/ui/pressable-scale';
import { useTheme } from '@/hooks/use-theme';
import type { SlotEntry, SlotStatus } from '@/lib/api/edge';

// ── helpers ──────────────────────────────────────────────────────────────────
function parseHour(t: string) {
  return parseInt(t.split(':')[0], 10);
}

type Group = {
  label: string;
  icon: 'wb-sunny' | 'wb-cloudy' | 'nights-stay';
  slots: SlotEntry[];
};

function groupSlots(slots: SlotEntry[]): Group[] {
  const morning: SlotEntry[]   = [];
  const afternoon: SlotEntry[] = [];
  const evening: SlotEntry[]   = [];

  for (const entry of slots) {
    const h = parseHour(entry.time);
    if (h < 12)      morning.push(entry);
    else if (h < 17) afternoon.push(entry);
    else             evening.push(entry);
  }

  const groups: Group[] = [];
  if (morning.length)   groups.push({ label: 'Morning',   icon: 'wb-sunny',   slots: morning });
  if (afternoon.length) groups.push({ label: 'Afternoon', icon: 'wb-cloudy',  slots: afternoon });
  if (evening.length)   groups.push({ label: 'Evening',   icon: 'nights-stay', slots: evening });
  return groups;
}

// ── Status visual config ──────────────────────────────────────────────────────
type SlotVisuals = {
  cardBg: string;
  cardBorder: string;
  borderWidth: number;
  iconName: 'schedule' | 'event-busy' | 'block';
  iconColor: string;
  textColor: string;
  shadowOpacity: number;
  shadowColor: string;
  elevation: number;
  disabled: boolean;
};

function getSlotVisuals(
  status: SlotStatus,
  active: boolean,
  c: ReturnType<typeof useTheme>['c'],
  scheme: ReturnType<typeof useTheme>['scheme'],
): SlotVisuals {
  if (active) {
    return {
      cardBg: c.accent,
      cardBorder: c.accent,
      borderWidth: 2,
      iconName: 'schedule',
      iconColor: scheme === 'dark' ? '#1C1A17' : '#FFF',
      textColor: scheme === 'dark' ? '#1C1A17' : '#FFFFFF',
      shadowOpacity: 0.22,
      shadowColor: c.accent,
      elevation: 5,
      disabled: false,
    };
  }

  switch (status) {
    case 'booked':
      return {
        cardBg: scheme === 'dark' ? 'rgba(192, 57, 43, 0.06)' : 'rgba(192, 57, 43, 0.04)',
        cardBorder: scheme === 'dark' ? 'rgba(192, 57, 43, 0.30)' : 'rgba(192, 57, 43, 0.22)',
        borderWidth: 1.5,
        iconName: 'event-busy',
        iconColor: scheme === 'dark' ? '#F0857E' : '#C0392B',
        textColor: scheme === 'dark' ? '#F0857E' : '#C0392B',
        shadowOpacity: 0,
        shadowColor: '#1C1A17',
        elevation: 0,
        disabled: true,
      };
    case 'blocked':
      return {
        cardBg: c.bg2,
        cardBorder: c.hairline,
        borderWidth: 1,
        iconName: 'block',
        iconColor: c.fgMuted,
        textColor: c.fgMuted,
        shadowOpacity: 0,
        shadowColor: '#1C1A17',
        elevation: 0,
        disabled: true,
      };
    default: // available
      return {
        cardBg: c.surfaceRaised,
        cardBorder: c.hairline,
        borderWidth: 1.5,
        iconName: 'schedule',
        iconColor: c.fgMuted,
        textColor: c.fg,
        shadowOpacity: 0.03,
        shadowColor: '#1C1A17',
        elevation: 1,
        disabled: false,
      };
  }
}

// ── slot card label ───────────────────────────────────────────────────────────
function statusLabel(status: SlotStatus): string {
  switch (status) {
    case 'booked':  return 'Booked';
    case 'blocked': return 'Blocked';
    default:        return '';
  }
}

// ── component ─────────────────────────────────────────────────────────────────
export function SlotPicker({
  slots,
  selected,
  onSelect,
}: {
  slots: SlotEntry[];
  selected: string | null;
  onSelect: (t: string) => void;
}) {
  const { c, Radius, Spacing, Type, scheme } = useTheme();

  if (slots.length === 0) {
    return (
      <View style={{ alignItems: 'center', paddingVertical: Spacing.xl, gap: Spacing.sm }}>
        <MaterialIcons name="event-busy" size={40} color={c.fgMuted} />
        <Text style={[Type.label, { color: c.fgMuted, textAlign: 'center' }]}>
          No times available
        </Text>
        <Text style={[Type.caption, { color: c.fgMuted, textAlign: 'center' }]}>
          Try picking a different date
        </Text>
      </View>
    );
  }

  const groups = groupSlots(slots);

  return (
    <View style={{ gap: Spacing.lg }}>
      {groups.map((group) => (
        <View key={group.label} style={{ gap: Spacing.sm }}>
          {/* ── Section header ── */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.xs }}>
            <MaterialIcons name={group.icon} size={14} color={c.accentText} />
            <Text
              style={[
                Type.eyebrow,
                {
                  color: c.accentText,
                  fontFamily: 'Poppins_700Bold',
                  fontSize: 11,
                  letterSpacing: 1,
                  textTransform: 'uppercase',
                },
              ]}
            >
              {group.label}
            </Text>
            <View style={{ flex: 1, height: 1, backgroundColor: c.hairline, marginLeft: Spacing.xs }} />
          </View>

          {/* ── Slot grid ── */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm }}>
            {group.slots.map((entry) => {
              const active = selected === entry.time && entry.status === 'available';
              const v = getSlotVisuals(entry.status, active, c, scheme);
              const sublabel = statusLabel(entry.status);

              return (
                <PressableScale
                  key={entry.time}
                  onPress={() => !v.disabled && onSelect(entry.time)}
                  disabled={v.disabled}
                  style={{
                    width: '31.3%',
                    borderRadius: Radius.md,
                    borderWidth: v.borderWidth,
                    borderColor: v.cardBorder,
                    backgroundColor: v.cardBg,
                    paddingVertical: Spacing.sm + 2,
                    paddingHorizontal: Spacing.xs,
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 2,
                    shadowColor: v.shadowColor,
                    shadowOpacity: v.shadowOpacity,
                    shadowRadius: active ? 10 : 3,
                    shadowOffset: { width: 0, height: active ? 4 : 1 },
                    elevation: v.elevation,
                    opacity: entry.status === 'blocked' ? 0.55 : 1,
                  }}
                >
                  {/* Status icon */}
                  <MaterialIcons name={v.iconName} size={13} color={v.iconColor} />

                  {/* Time label */}
                  <Text
                    style={[
                      Type.label,
                      {
                        color: v.textColor,
                        fontFamily: 'Poppins_700Bold',
                        fontSize: 13,
                        letterSpacing: 0.2,
                        textDecorationLine: entry.status === 'booked' ? 'line-through' : 'none',
                      },
                    ]}
                  >
                    {entry.time}
                  </Text>

                  {/* Booked / Blocked sub-label */}
                  {sublabel ? (
                    <Text
                      style={[
                        Type.caption,
                        {
                          color: v.textColor,
                          fontFamily: 'Poppins_600SemiBold',
                          fontSize: 8,
                          letterSpacing: 0.5,
                          textTransform: 'uppercase',
                          opacity: 0.8,
                        },
                      ]}
                    >
                      {sublabel}
                    </Text>
                  ) : null}
                </PressableScale>
              );
            })}
          </View>
        </View>
      ))}

      {/* ── Legend ── */}
      <View
        style={{
          flexDirection: 'row',
          gap: Spacing.md,
          paddingTop: Spacing.sm,
          borderTopWidth: 1,
          borderTopColor: c.hairline,
          flexWrap: 'wrap',
        }}
      >
        {([
          { icon: 'schedule' as const,    color: c.fgMuted,                              label: 'Available' },
          { icon: 'event-busy' as const,  color: scheme === 'dark' ? '#F0857E' : '#C0392B', label: 'Booked' },
          { icon: 'block' as const,       color: c.fgMuted,                              label: 'Blocked' },
        ]).map((item) => (
          <View key={item.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <MaterialIcons name={item.icon} size={12} color={item.color} />
            <Text style={[Type.caption, { color: c.fgMuted, fontSize: 10, fontFamily: 'Poppins_600SemiBold' }]}>
              {item.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
