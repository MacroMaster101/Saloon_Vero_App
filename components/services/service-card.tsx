import { Pressable, Text, View, Platform } from 'react-native';
import { money } from '@/lib/utils/format';
import { useTheme } from '@/hooks/use-theme';
import type { Service } from '@/types/database';

export function ServiceCard({ service, onPress }: { service: Service; onPress?: () => void }) {
  const { c, Radius, Shadow, Spacing, Type, scheme } = useTheme();

  const isIOS = Platform.OS === 'ios';

  const bg = isIOS
    ? (scheme === 'dark' ? 'rgba(255, 255, 255, 0.03)' : 'rgba(255, 255, 255, 0.55)')
    : (scheme === 'dark' ? '#1E1712' : '#FFFFFF');

  const border = isIOS
    ? (scheme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(184, 116, 42, 0.15)')
    : (scheme === 'dark' ? '#2E251E' : '#EBE2CF');

  return (
    <Pressable 
      onPress={onPress} 
      style={[
        { 
          flexDirection: 'row', 
          gap: Spacing.md, 
          padding: Spacing.md, 
          borderRadius: Radius.lg, 
          backgroundColor: bg, 
          borderWidth: 1, 
          borderColor: border, 
          marginBottom: Spacing.sm 
        }, 
        Shadow.sm
      ]}
    >
      <View style={{ flex: 1 }}>
        <Text style={[Type.label, { color: c.fg, fontSize: 16, fontFamily: 'Poppins_600SemiBold' }]}>{service.name}</Text>
        {!!service.description && <Text style={[Type.caption, { color: c.fgMuted, marginTop: 4, fontSize: 12 }]}>{service.description}</Text>}
      </View>
      <View style={{ alignItems: 'flex-end', justifyContent: 'center' }}>
        <Text style={[Type.label, { color: c.accentText, fontSize: 15, fontFamily: 'Poppins_700Bold' }]}>{money(service.price_lkr)}</Text>
        <Text style={[Type.caption, { color: c.fgMuted, marginTop: 2 }]}>{service.duration_min} min</Text>
      </View>
    </Pressable>
  );
}
