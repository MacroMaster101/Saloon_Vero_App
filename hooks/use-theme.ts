import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, Spacing, Radius, Shadow, Type } from '@/constants/theme';

export function useTheme() {
  const scheme = useColorScheme() ?? 'light';
  return { scheme, c: Colors[scheme], Spacing, Radius, Shadow, Type } as const;
}
export type AppTheme = ReturnType<typeof useTheme>;
