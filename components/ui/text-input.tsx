import { useState } from 'react';
import { View, Text, TextInput, TextInputProps, Platform, Pressable } from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import { IconSymbol } from '@/components/ui/icon-symbol';

export function ThemedTextInput({
  label,
  error,
  style,
  secureToggle,
  ...props
}: TextInputProps & { label?: string; error?: string; secureToggle?: boolean }) {
  const { c, Radius, Type, Spacing, scheme } = useTheme();
  const [focused, setFocused] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const isIOS = Platform.OS === 'ios';

  const bg = isIOS
    ? (scheme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.65)')
    : c.bg2;

  const border = error
    ? c.error
    : focused
      ? c.accent
      : c.line;

  const inputElement = (
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
          ...(secureToggle ? { paddingRight: 44 } : {}),
        },
        style,
      ]}
      {...props}
      {...(secureToggle ? { secureTextEntry: !revealed } : {})}
    />
  );

  return (
    <View style={{ marginBottom: Spacing.md }}>
      {!!label && <Text style={[Type.label, { color: c.fgMuted, marginBottom: 6, fontSize: 12 }]}>{label}</Text>}
      {secureToggle ? (
        <View style={{ position: 'relative' }}>
          {inputElement}
          <Pressable
            onPress={() => setRevealed((v) => !v)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={revealed ? 'Hide password' : 'Show password'}
            style={{
              position: 'absolute',
              right: Spacing.md - 4,
              top: 0,
              bottom: 0,
              justifyContent: 'center',
            }}
          >
            <IconSymbol name={revealed ? 'eye.slash' : 'eye'} size={20} color={c.fgMuted} />
          </Pressable>
        </View>
      ) : (
        inputElement
      )}
      {!!error && <Text style={[Type.caption, { color: c.error, marginTop: 4 }]}>{error}</Text>}
    </View>
  );
}
