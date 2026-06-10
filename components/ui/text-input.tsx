import { useState } from 'react';
import { View, Text, TextInput, TextInputProps, Platform } from 'react-native';
import { useTheme } from '@/hooks/use-theme';

export function ThemedTextInput({ label, error, style, ...props }: TextInputProps & { label?: string; error?: string }) {
  const { c, Radius, Type, Spacing, scheme } = useTheme();
  const [focused, setFocused] = useState(false);

  const isIOS = Platform.OS === 'ios';
  
  const bg = isIOS
    ? (scheme === 'dark' ? 'rgba(255, 255, 255, 0.04)' : 'rgba(255, 255, 255, 0.45)')
    : c.bg2;

  const border = error 
    ? c.error 
    : focused 
      ? c.accent 
      : isIOS
        ? (scheme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(184, 116, 42, 0.2)')
        : c.line;

  return (
    <View style={{ marginBottom: Spacing.md }}>
      {!!label && <Text style={[Type.label, { color: c.fg2, marginBottom: 6, fontSize: 13, letterSpacing: 0.2 }]}>{label}</Text>}
      <TextInput
        placeholderTextColor={c.fgMuted}
        onFocus={(e) => {
          setFocused(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          props.onBlur?.(e);
        }}
        style={[
          {
            backgroundColor: bg,
            color: c.fg,
            borderWidth: 1,
            borderColor: border,
            borderRadius: Radius.md,
            paddingVertical: Spacing.md - 3,
            paddingHorizontal: Spacing.md,
            fontFamily: 'Poppins_400Regular',
            fontSize: 15,
          },
          style,
        ]}
        {...props}
      />
      {!!error && <Text style={[Type.caption, { color: c.error, marginTop: 4 }]}>{error}</Text>}
    </View>
  );
}
