import { useRef, useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  value: string;
  onChangeText: (digits: string) => void;
  length?: number;
  autoFocus?: boolean;
  // Fires when the final digit is entered — handy to auto-submit.
  onComplete?: (digits: string) => void;
};

// A segmented one-time-code field: `length` boxes backed by a single hidden
// TextInput, so paste, OS autofill and the oneTimeCode keyboard all keep working.
export function OtpInput({ value, onChangeText, length = 6, autoFocus, onComplete }: Props) {
  const { c, Radius } = useTheme();
  const inputRef = useRef<TextInput>(null);
  const [focused, setFocused] = useState(false);

  const digits = value.slice(0, length).split('');

  function handleChange(text: string) {
    const next = text.replace(/[^0-9]/g, '').slice(0, length);
    onChangeText(next);
    if (next.length === length) onComplete?.(next);
  }

  return (
    <Pressable onPress={() => inputRef.current?.focus()} style={styles.row}>
      {Array.from({ length }).map((_, i) => {
        const char = digits[i] ?? '';
        // The box the next digit lands in shows the focus ring (caret position).
        const isCaret = focused && i === Math.min(value.length, length - 1) && value.length < length;
        const isActive = !!char || isCaret;
        return (
          <View
            key={i}
            style={[
              styles.box,
              {
                backgroundColor: c.bg2,
                borderColor: isActive ? c.accent : c.line,
                borderWidth: isActive ? 2 : 1,
                borderRadius: Radius.md,
              },
            ]}
          >
            <Text style={[styles.digit, { color: c.fg }]}>{char}</Text>
          </View>
        );
      })}

      {/* Real input stretched invisibly across the boxes; captures all typing. */}
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={handleChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        keyboardType="number-pad"
        autoComplete="one-time-code"
        textContentType="oneTimeCode"
        maxLength={length}
        autoFocus={autoFocus}
        caretHidden
        style={styles.hiddenInput}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  box: { flex: 1, aspectRatio: 1, maxWidth: 52, alignItems: 'center', justifyContent: 'center' },
  digit: { fontFamily: 'Poppins_600SemiBold', fontSize: 22 },
  hiddenInput: { ...StyleSheet.absoluteFillObject, opacity: 0, color: 'transparent' },
});
