import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, Spacing, Radius, Shadow, Type } from '@/constants/theme';
import { useOptionalThemePreference } from '@/context/theme';

export function useTheme() {
  const device = useColorScheme() ?? 'light';
  const pref = useOptionalThemePreference();
  const scheme = pref?.resolvedScheme ?? device;
  return { scheme, c: Colors[scheme], Spacing, Radius, Shadow, Type } as const;
}
export type AppTheme = ReturnType<typeof useTheme>;
