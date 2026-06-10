import { View, Text } from 'react-native';
import { ThemedButton } from '@/components/ui/button';
import { useTheme } from '@/hooks/use-theme';

export function GoogleButton({ onPress, busy }: { onPress: () => void; busy?: boolean }) {
  const { c, Type } = useTheme();
  return (
    <View>
      <ThemedButton variant="social" busy={busy} onPress={onPress} label="Continue with Google" />
      <Text style={[Type.caption, { color: c.fgMuted, textAlign: 'center', marginTop: 4 }]}>Sign in with your Google account</Text>
    </View>
  );
}
