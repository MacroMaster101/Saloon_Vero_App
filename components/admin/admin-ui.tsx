import { ReactNode } from 'react';
import { Text, View, type TextStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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

export function AdminSectionLabel({ children, style }: { children: ReactNode; style?: TextStyle }) {
  const { c, Type, Spacing } = useTheme();
  return (
    <Text style={[Type.eyebrow, { color: c.fgMuted, textTransform: 'uppercase', marginBottom: Spacing.sm }, style]}>
      {children}
    </Text>
  );
}

export function AdminIconBadge({ icon, tone = 'neutral', size = 40 }: { icon: IconSymbolName; tone?: Tone; size?: number }) {
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

export function AdminChip({
  label,
  selected,
  onPress,
  tone = 'accent',
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  tone?: Tone;
}) {
  const { c, Radius, Spacing, Type } = useTheme();
  const toneSet = toneColors(tone, c);
  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={{
        backgroundColor: selected ? toneSet.fg : c.surfaceRaised,
        borderWidth: 1,
        borderColor: selected ? toneSet.fg : c.hairline,
        borderRadius: Radius.pill,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.xs + 2,
      }}
    >
      <Text style={[Type.caption, { color: selected ? c.bg : c.fg2, fontFamily: 'Poppins_600SemiBold' }]} numberOfLines={1}>
        {label}
      </Text>
    </PressableScale>
  );
}

export function AdminIconAction({
  icon,
  label,
  onPress,
  tone = 'neutral',
}: {
  icon: IconSymbolName;
  label: string;
  onPress: () => void;
  tone?: Tone;
}) {
  const { c, Radius, Spacing, Type } = useTheme();
  const toneSet = toneColors(tone, c);
  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={{
        minWidth: 36,
        height: 36,
        borderRadius: Radius.sm,
        backgroundColor: toneSet.bg,
        borderWidth: 1,
        borderColor: toneSet.border,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: Spacing.sm,
      }}
    >
      <IconSymbol name={icon} size={17} color={toneSet.fg} />
      <Text style={[Type.caption, { position: 'absolute', opacity: 0 }]}>{label}</Text>
    </PressableScale>
  );
}

export function AdminStatCard({
  label,
  value,
  detail,
  tone = 'neutral',
  progress,
}: {
  label: string;
  value: ReactNode;
  detail?: ReactNode;
  tone?: Tone;
  progress?: number;
}) {
  const { c, Radius, Spacing, Type, scheme } = useTheme();
  const toneSet = toneColors(tone, c);
  const width = Math.max(0, Math.min(100, progress ?? 0));

  return (
    <Card style={{ flex: 1, padding: 0, overflow: 'hidden' }}>
      <LinearGradient
        colors={scheme === 'dark' ? ['#211F1D', '#1A1816'] : ['#FFFFFF', '#F9F9F7']}
        style={{ padding: Spacing.md, flex: 1, gap: Spacing.xs }}
      >
        <Text style={[Type.caption, { color: c.fgMuted, textTransform: 'uppercase', fontFamily: 'Poppins_600SemiBold', fontSize: 10 }]}>
          {label}
        </Text>
        <Text style={[Type.h1, { color: toneSet.fg, fontFamily: 'Poppins_800ExtraBold', fontSize: 21 }]} numberOfLines={1} adjustsFontSizeToFit>
          {value}
        </Text>
        {detail ? (
          <Text style={[Type.caption, { color: c.fgMuted, fontFamily: 'Poppins_400Regular' }]} numberOfLines={1}>
            {detail}
          </Text>
        ) : null}
        {progress != null ? (
          <View style={{ height: 5, backgroundColor: c.bg2, borderRadius: Radius.pill, overflow: 'hidden', marginTop: Spacing.xs }}>
            <View style={{ height: '100%', width: `${width}%`, backgroundColor: toneSet.fg }} />
          </View>
        ) : null}
      </LinearGradient>
    </Card>
  );
}
