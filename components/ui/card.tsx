import { ReactNode } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '@/hooks/use-theme';

export function Card({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  const { c, Radius, Shadow, Spacing } = useTheme();
  return <View style={[{ backgroundColor: c.surface, borderRadius: Radius.lg, padding: Spacing.md, borderWidth: StyleSheet.hairlineWidth, borderColor: c.line }, Shadow.sm, style]}>{children}</View>;
}
