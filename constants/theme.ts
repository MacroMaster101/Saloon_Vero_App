import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#2E2519', background: '#FAF6EE', tint: '#B8742A',
    icon: '#7A6A4E', tabIconDefault: '#7A6A4E', tabIconSelected: '#B8742A',
    bg: '#FAF6EE', bg2: '#F3EAD7', surface: 'rgba(255, 255, 255, 0.45)',
    accent: '#D99A3D', accentDark: '#B8742A', accentTint: 'rgba(217, 154, 61, 0.12)', accentText: '#9A5E1C',
    fg: '#2E2519', fg2: '#5E503F', fgMuted: '#8E7D66', line: 'rgba(184, 116, 42, 0.15)', error: '#C0392B',
    glassBg: 'rgba(255, 255, 255, 0.45)', glassBorder: 'rgba(255, 255, 255, 0.65)',
  },
  dark: {
    text: '#F5ECDD', background: '#120E0A', tint: '#E8B05A',
    icon: '#9A876C', tabIconDefault: '#9A876C', tabIconSelected: '#E8B05A',
    bg: '#120E0A', bg2: '#1C1611', surface: 'rgba(26, 20, 15, 0.55)',
    accent: '#E8B05A', accentDark: '#C98F3D', accentTint: 'rgba(232,176,90,0.12)', accentText: '#E8B05A',
    fg: '#F5ECDD', fg2: '#D2C3AF', fgMuted: '#9A876C', line: 'rgba(232, 176, 90, 0.12)', error: '#F0857E',
    glassBg: 'rgba(26, 20, 15, 0.55)', glassBorder: 'rgba(255, 255, 255, 0.08)',
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
