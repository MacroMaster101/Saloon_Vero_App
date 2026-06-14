import { ReactNode } from 'react';
import { Text, View, type TextStyle } from 'react-native';
import { Card } from '@/components/ui/card';
import { IconSymbol, type IconSymbolName } from '@/components/ui/icon-symbol';
import { PressableScale } from '@/components/ui/pressable-scale';
import { useTheme } from '@/hooks/use-theme';

type Tone = 'accent' | 'neutral' | 'success' | 'danger' | 'muted';

function toneColors(tone: Tone, c: ReturnType<typeof useTheme>['c']) {
  switch (tone) {
    case 'success':
      return { fg: '#27AE60', bg: 'rgba(46, 204, 113, 0.12)', border: 'rgba(46, 204, 113, 0.22)' };
    case 'danger':
      return { fg: c.error, bg: 'rgba(192, 57, 43, 0.10)', border: 'rgba(192, 57, 43, 0.24)' };
    case 'muted':
      return { fg: c.fgMuted, bg: c.bg2, border: c.hairline };
    case 'accent':
      return { fg: c.accentText, bg: c.accentTint, border: c.accent };
    default:
      return { fg: c.fg, bg: c.surfaceRaised, border: c.hairline };
  }
}

export function StaffSectionLabel({ children, style }: { children: ReactNode; style?: TextStyle }) {
  const { c, Type, Spacing } = useTheme();
  return (
    <Text style={[Type.eyebrow, { color: c.fgMuted, textTransform: 'uppercase', marginBottom: Spacing.sm }, style]}>
      {children}
    </Text>
  );
}

export function StaffIconBadge({ icon, tone = 'neutral', size = 38 }: { icon: IconSymbolName; tone?: Tone; size?: number }) {
  const { c, Radius } = useTheme();
  const toneSet = toneColors(tone, c);
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: Radius.sm,
        backgroundColor: toneSet.bg,
        borderWidth: 1,
        borderColor: toneSet.border,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <IconSymbol name={icon} size={Math.round(size * 0.48)} color={toneSet.fg} />
    </View>
  );
}

export function StaffMetricCard({
  label,
  value,
  detail,
  icon,
  tone = 'neutral',
}: {
  label: string;
  value: ReactNode;
  detail?: ReactNode;
  icon: IconSymbolName;
  tone?: Tone;
}) {
  const { c, Spacing, Type } = useTheme();
  const toneSet = toneColors(tone, c);
  return (
    <Card style={{ flex: 1, minHeight: 108, gap: Spacing.sm }}>
      <StaffIconBadge icon={icon} tone={tone} size={32} />
      <View style={{ gap: 2 }}>
        <Text style={[Type.caption, { color: c.fgMuted, textTransform: 'uppercase', fontFamily: 'Poppins_600SemiBold' }]} numberOfLines={1}>
          {label}
        </Text>
        <Text style={[Type.h1, { color: toneSet.fg, fontFamily: 'Poppins_800ExtraBold', fontSize: 24 }]} numberOfLines={1} adjustsFontSizeToFit>
          {value}
        </Text>
        {detail ? (
          <Text style={[Type.caption, { color: c.fgMuted }]} numberOfLines={1}>
            {detail}
          </Text>
        ) : null}
      </View>
    </Card>
  );
}

export function StaffTextAction({
  label,
  icon,
  tone = 'neutral',
  onPress,
  flex = 1,
}: {
  label: string;
  icon?: IconSymbolName;
  tone?: Tone;
  onPress: () => void;
  flex?: number;
}) {
  const { c, Radius, Spacing, Type } = useTheme();
  const toneSet = toneColors(tone, c);
  return (
    <PressableScale
      accessibilityRole="button"
      onPress={onPress}
      style={{
        flex,
        minHeight: 42,
        borderRadius: Radius.sm,
        backgroundColor: toneSet.bg,
        borderWidth: 1,
        borderColor: toneSet.border,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: Spacing.sm,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
        {icon ? <IconSymbol name={icon} size={16} color={toneSet.fg} /> : null}
        <Text style={[Type.caption, { color: toneSet.fg, fontFamily: 'Poppins_600SemiBold' }]} numberOfLines={1}>
          {label}
        </Text>
      </View>
    </PressableScale>
  );
}
