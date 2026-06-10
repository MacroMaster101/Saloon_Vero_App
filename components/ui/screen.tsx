import { ReactNode } from 'react';
import { ScrollView, View, StyleSheet, ViewStyle, RefreshControl, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/use-theme';

export function ScreenContainer({ children, scroll = true, style, refreshControl }: { children: ReactNode; scroll?: boolean; style?: ViewStyle; refreshControl?: React.ReactElement<React.ComponentProps<typeof RefreshControl>> }) {
  const { c, Spacing, scheme } = useTheme();
  
  // Custom glowing blobs tailored for light & dark themes
  const blobColors = scheme === 'dark' 
    ? {
        blob1: 'rgba(232, 176, 90, 0.06)',
        blob2: 'rgba(184, 116, 42, 0.05)',
        blob3: 'rgba(217, 154, 61, 0.04)',
      }
    : {
        blob1: 'rgba(232, 176, 90, 0.14)',
        blob2: 'rgba(184, 116, 42, 0.10)',
        blob3: 'rgba(217, 154, 61, 0.08)',
      };

  const isIOS = Platform.OS === 'ios';

  return (
    <View style={[styles.wrapper, { backgroundColor: c.bg }]}>
      {/* Background ambient glowing spheres - iOS Only */}
      {isIOS && (
        <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
          <View style={[styles.blob, { width: 320, height: 320, borderRadius: 160, backgroundColor: blobColors.blob1, top: -90, right: -80 }]} />
          <View style={[styles.blob, { width: 280, height: 280, borderRadius: 140, backgroundColor: blobColors.blob2, bottom: 60, left: -70 }]} />
          <View style={[styles.blob, { width: 200, height: 200, borderRadius: 100, backgroundColor: blobColors.blob3, top: '45%', right: -60 }]} />
        </View>
      )}

      <SafeAreaView style={styles.safe} edges={['top']}>
        {scroll ? (
          <ScrollView
            contentContainerStyle={[styles.scrollContent, { padding: Spacing.md }, style]}
            refreshControl={refreshControl}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>
        ) : (
          <View style={[styles.flex, { padding: Spacing.md }, style]}>{children}</View>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    overflow: 'hidden',
  },
  safe: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 100, // accommodate the floating glassy tab bar dock
  },
  blob: {
    position: 'absolute',
    opacity: 0.95,
  },
});
