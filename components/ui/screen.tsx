import { ReactNode } from 'react';
import { ScrollView, View, StyleSheet, ViewStyle, RefreshControl, Platform, KeyboardAvoidingView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/use-theme';
import { Layout, tabBarBottomGap } from '@/constants/theme';

export function ScreenContainer({
  children,
  scroll = true,
  style,
  refreshControl,
  safeTop = true,
  keyboardAware = false,
}: {
  children: ReactNode;
  scroll?: boolean;
  style?: ViewStyle;
  refreshControl?: React.ReactElement<React.ComponentProps<typeof RefreshControl>>;
  safeTop?: boolean;
  keyboardAware?: boolean;
}) {
  const { c, Spacing } = useTheme();
  const insets = useSafeAreaInsets();

  const column = { width: '100%' as const, maxWidth: Layout.maxContentWidth, alignSelf: 'center' as const };
  const dockGap = tabBarBottomGap(insets.bottom);

  const inner = scroll ? (
    <ScrollView
      style={{ flex: 1, backgroundColor: c.bg }}
      contentContainerStyle={[
        styles.scrollContent,
        { paddingHorizontal: Spacing.md, paddingBottom: dockGap, paddingTop: safeTop ? Spacing.md : 0 },
        column,
        style,
      ]}
      refreshControl={refreshControl}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.flex, column, { backgroundColor: c.bg, paddingHorizontal: Spacing.md, paddingBottom: Spacing.md, paddingTop: safeTop ? Spacing.md : 0 }, style]}>
      {children}
    </View>
  );

  return (
    <View style={[styles.wrapper, { backgroundColor: c.bg }]}>
      <SafeAreaView style={[styles.safe, { backgroundColor: c.bg }]} edges={safeTop ? ['top'] : []}>
        {keyboardAware ? (
          <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            {inner}
          </KeyboardAvoidingView>
        ) : inner}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, overflow: 'hidden' },
  safe: { flex: 1 },
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1 },
});
