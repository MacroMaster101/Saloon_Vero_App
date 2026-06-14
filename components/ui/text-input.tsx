import { useState } from 'react';
import { View, Text, TextInput, TextInputProps, Platform, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import { IconSymbol, type IconSymbolName } from '@/components/ui/icon-symbol';

const CONTAINER_KEYS = [
  'margin', 'marginHorizontal', 'marginVertical', 'marginTop', 'marginBottom', 'marginLeft', 'marginRight', 'marginStart', 'marginEnd',
  'flex', 'flexGrow', 'flexShrink', 'flexBasis', 'alignSelf',
  'position', 'top', 'bottom', 'left', 'right', 'zIndex'
];

function splitStyles(style: any) {
  const containerStyle: any = {};
  const inputStyle: any = {};

  if (!style) return { containerStyle, inputStyle };

  const flattened = StyleSheet.flatten(style);
  for (const key in flattened) {
    if (CONTAINER_KEYS.includes(key)) {
      containerStyle[key] = flattened[key];
    } else {
      inputStyle[key] = flattened[key];
    }
  }

  return { containerStyle, inputStyle };
}

export function ThemedTextInput({
  label,
  error,
  style,
  secureToggle,
  required,
  icon,
  ...props
}: TextInputProps & { label?: string; error?: string; secureToggle?: boolean; required?: boolean; icon?: IconSymbolName }) {
  const { c, Radius, Type, Spacing, scheme } = useTheme();
  const [focused, setFocused] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const isIOS = Platform.OS === 'ios';

  const bg = isIOS
    ? (scheme === 'dark' ? 'rgba(26, 24, 22, 0.80)' : 'rgba(255, 255, 255, 0.65)')
    : c.bg2;

  const border = error
    ? c.error
    : focused
      ? c.accent
      : c.line;

  const hasLeftIcon = !!icon;
  const { containerStyle, inputStyle } = splitStyles(style);

  return (
    <View style={[{ marginBottom: Spacing.md }, containerStyle]}>
      {!!label && (
        <Text style={[Type.label, { color: c.fgMuted, marginBottom: 6, fontSize: 12 }]}>
          {label}
          {required && <Text style={{ color: c.error }}> *</Text>}
        </Text>
      )}
      <View style={{ position: 'relative', justifyContent: 'center' }}>
        {hasLeftIcon && (
          <View style={{ position: 'absolute', left: Spacing.md, zIndex: 10 }}>
            <IconSymbol name={icon} size={18} color={focused ? c.accent : c.fgMuted} />
          </View>
        )}
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
              paddingLeft: hasLeftIcon ? Spacing.md + 28 : Spacing.md,
              fontFamily: 'Poppins_400Regular',
              fontSize: 15,
              ...(secureToggle ? { paddingRight: 44 } : {}),
            },
            inputStyle,
          ]}
          {...props}
          {...(secureToggle ? { secureTextEntry: !revealed } : {})}
        />
        {secureToggle && (
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
        )}
      </View>
      {!!error && <Text style={[Type.caption, { color: c.error, marginTop: 4 }]}>{error}</Text>}
    </View>
  );
}
