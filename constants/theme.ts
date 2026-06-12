import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#1C1A17', background: '#FAFAF8', tint: '#A87A2E',
    icon: '#8A857C', tabIconDefault: '#8A857C', tabIconSelected: '#A87A2E',
    bg: '#FAFAF8', bg2: '#F1F1EE', surface: 'rgba(255, 255, 255, 0.72)',
    surfaceRaised: '#FFFFFF', hairline: 'rgba(28, 26, 23, 0.08)',
    accent: '#C29036', accentDark: '#A87A2E', accentTint: 'rgba(168, 122, 46, 0.10)', accentText: '#8A6420',
    fg: '#1C1A17', fg2: '#57534C', fgMuted: '#8A857C', line: '#E6E4DF', error: '#C0392B',
    glassBg: 'rgba(255, 255, 255, 0.62)', glassBorder: 'rgba(255, 255, 255, 0.78)',
    ctaBg: '#1C1A17', ctaFg: '#FAFAF8',
  },
  dark: {
    text: '#F2F0EC', background: '#121110', tint: '#D9A648',
    icon: '#918B81', tabIconDefault: '#918B81', tabIconSelected: '#D9A648',
    bg: '#121110', bg2: '#1A1816', surface: 'rgba(26, 24, 22, 0.60)',
    surfaceRaised: '#1E1C19', hairline: 'rgba(255, 255, 255, 0.06)',
    accent: '#D9A648', accentDark: '#C2933C', accentTint: 'rgba(217, 166, 72, 0.12)', accentText: '#D9A648',
    fg: '#F2F0EC', fg2: '#C9C4BC', fgMuted: '#918B81', line: 'rgba(255, 255, 255, 0.09)', error: '#F0857E',
    glassBg: 'rgba(22, 20, 18, 0.55)', glassBorder: 'rgba(255, 255, 255, 0.08)',
    ctaBg: '#D9A648', ctaFg: '#121110',
  },
} as const;

export const Spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 } as const;
export const Radius = { sm: 8, md: 12, lg: 16, xl: 20, pill: 999 } as const;
export const Shadow = {
  sm: { shadowColor: '#1C1A17', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  md: { shadowColor: '#1C1A17', shadowOpacity: 0.10, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 5 },
  cta: { shadowColor: '#1C1A17', shadowOpacity: 0.28, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 6 },
} as const;
export const Type = {
  display: { fontFamily: 'Poppins_800ExtraBold', fontSize: 34, lineHeight: 38 },
  h1: { fontFamily: 'Poppins_800ExtraBold', fontSize: 28 },
  h2: { fontFamily: 'Poppins_700Bold', fontSize: 20 },
  body: { fontFamily: 'Poppins_400Regular', fontSize: 15 },
  label: { fontFamily: 'Poppins_600SemiBold', fontSize: 13 },
  caption: { fontFamily: 'Poppins_400Regular', fontSize: 12 },
  button: { fontFamily: 'Poppins_700Bold', fontSize: 16 },
  eyebrow: { fontFamily: 'Poppins_600SemiBold', fontSize: 12, letterSpacing: 2.5 },
} as const;

export const Fonts = Platform.select({
  ios: { sans: 'system-ui', serif: 'ui-serif', rounded: 'ui-rounded', mono: 'ui-monospace' },
  default: { sans: 'normal', serif: 'serif', rounded: 'normal', mono: 'monospace' },
  web: { sans: 'system-ui, sans-serif', serif: 'Georgia, serif', rounded: 'system-ui', mono: 'monospace' },
});
