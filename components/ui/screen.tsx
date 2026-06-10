import { ReactNode } from 'react';
import { ScrollView, View, StyleSheet, ViewStyle, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/use-theme';

export function ScreenContainer({ children, scroll = true, style, refreshControl }: { children: ReactNode; scroll?: boolean; style?: ViewStyle; refreshControl?: React.ReactElement<React.ComponentProps<typeof RefreshControl>> }) {
  const { c, Spacing } = useTheme();
  const pad = { padding: Spacing.md };
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.bg }]} edges={['top']}>
      {scroll
        ? <ScrollView contentContainerStyle={[pad, style]} refreshControl={refreshControl} keyboardShouldPersistTaps="handled">{children}</ScrollView>
        : <View style={[styles.flex, pad, style]}>{children}</View>}
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({ safe: { flex: 1 }, flex: { flex: 1 } });
