import { View, Text, TextInput, TextInputProps } from 'react-native';
import { useTheme } from '@/hooks/use-theme';

export function ThemedTextInput({ label, error, style, ...props }: TextInputProps & { label?: string; error?: string }) {
  const { c, Radius, Type, Spacing } = useTheme();
  return (
    <View style={{ marginBottom: Spacing.sm }}>
      {!!label && <Text style={[Type.label, { color: c.fg2, marginBottom: 4 }]}>{label}</Text>}
      <TextInput
        placeholderTextColor={c.fgMuted}
        style={[{ backgroundColor: c.surface, color: c.fg, borderWidth: 1, borderColor: error ? c.error : c.line, borderRadius: Radius.md, padding: Spacing.md, fontFamily: 'Poppins_400Regular', fontSize: 15 }, style]}
        {...props}
      />
      {!!error && <Text style={[Type.caption, { color: c.error, marginTop: 4 }]}>{error}</Text>}
    </View>
  );
}
