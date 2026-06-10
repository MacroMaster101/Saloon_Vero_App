import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#2E2519', background: '#F7F1E4', tint: '#B8742A',
    icon: '#7A6A4E', tabIconDefault: '#7A6A4E', tabIconSelected: '#B8742A',
    bg: '#F7F1E4', bg2: '#F1E8D6', surface: '#FFFFFF',
    accent: '#D99A3D', accentDark: '#B8742A', accentTint: '#FBEFD8', accentText: '#9A5E1C',
    fg: '#2E2519', fg2: '#6B5D49', fgMuted: '#7A6A4E', line: '#EBE2CF', error: '#C0392B',
  },
  dark: {
    text: '#F5ECDD', background: '#1C1611', tint: '#E8B05A',
    icon: '#9A876C', tabIconDefault: '#9A876C', tabIconSelected: '#E8B05A',
    bg: '#1C1611', bg2: '#241C15', surface: '#2A2018',
    accent: '#E8B05A', accentDark: '#C98F3D', accentTint: 'rgba(232,176,90,0.14)', accentText: '#E8B05A',
    fg: '#F5ECDD', fg2: '#C7B7A0', fgMuted: '#9A876C', line: '#3A2E22', error: '#F0857E',
  },
} as const;

export const Spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 } as const;
export const Radius = { sm: 8, md: 12, lg: 16, pill: 999 } as const;
export const Shadow = {
  sm: { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  md: { shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 5 },
} as const;
export const Type = {
  h1: { fontFamily: 'Poppins_800ExtraBold', fontSize: 28 },
  h2: { fontFamily: 'Poppins_700Bold', fontSize: 20 },
  body: { fontFamily: 'Poppins_400Regular', fontSize: 15 },
  label: { fontFamily: 'Poppins_600SemiBold', fontSize: 13 },
  caption: { fontFamily: 'Poppins_400Regular', fontSize: 12 },
  button: { fontFamily: 'Poppins_700Bold', fontSize: 16 },
  eyebrow: { fontFamily: 'Poppins_600SemiBold', fontSize: 12 },
} as const;

export const Fonts = Platform.select({
  ios: { sans: 'system-ui', serif: 'ui-serif', rounded: 'ui-rounded', mono: 'ui-monospace' },
  default: { sans: 'normal', serif: 'serif', rounded: 'normal', mono: 'monospace' },
  web: { sans: 'system-ui, sans-serif', serif: 'Georgia, serif', rounded: 'system-ui', mono: 'monospace' },
});
