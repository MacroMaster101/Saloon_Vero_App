import { Text, View } from 'react-native';
import { useTheme } from '@/hooks/use-theme';

type Palette = { accent: string; fg2: string; error: string; fgMuted: string };

export function statusColor(status: string, c: Palette): string {
  switch (status) {
    case 'confirmed': return c.accent;
    case 'completed': return c.fg2;
    case 'cancelled': case 'no_show': return c.error;
    default: return c.fgMuted;
  }
}

export function StatusTag({ status }: { status: string }) {
  const { c, Radius, Type, scheme } = useTheme();
  const color = statusColor(status, c);
  
  let bg = '';
  if (status === 'confirmed') {
    bg = scheme === 'dark' ? 'rgba(217, 166, 72, 0.12)' : 'rgba(168, 122, 46, 0.10)';
  } else if (status === 'completed') {
    bg = scheme === 'dark' ? 'rgba(201, 196, 188, 0.10)' : 'rgba(87, 83, 76, 0.08)';
  } else if (status === 'cancelled' || status === 'no_show') {
    bg = scheme === 'dark' ? 'rgba(240, 133, 126, 0.12)' : 'rgba(192, 57, 43, 0.12)';
  } else {
    bg = 'rgba(128, 128, 128, 0.08)';
  }

  return (
    <View style={{ 
      borderRadius: Radius.pill, 
      borderWidth: 1, 
      borderColor: color, 
      backgroundColor: bg, 
      paddingHorizontal: 14,
      paddingVertical: 5,
      alignSelf: 'flex-start'
    }}>
      <Text style={[Type.caption, { color, textTransform: 'capitalize', fontFamily: 'Poppins_600SemiBold', fontSize: 11 }]}>
        {status.replace('_', ' ')}
      </Text>
    </View>
  );
}
