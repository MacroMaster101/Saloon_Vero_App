import { Colors, Spacing, Radius, Shadow, Type } from '@/constants/theme';
test('Ivory Modern palette present for both schemes', () => {
  expect(Colors.light.bg).toBe('#FAFAF8');
  expect(Colors.light.accent).toBe('#C29036');
  expect(Colors.light.ctaBg).toBe('#1C1A17');
  expect(Colors.light.ctaFg).toBe('#FAFAF8');
  expect(Colors.dark.bg).toBe('#121110');
  expect(Colors.dark.accent).toBe('#D9A648');
  expect(Colors.dark.ctaBg).toBe('#D9A648');
  expect(Colors.dark.ctaFg).toBe('#121110');
});
test('scales exist', () => {
  expect(Spacing.md).toBe(16);
  expect(Radius.pill).toBe(999);
  expect(Type.h1.fontFamily).toBe('Poppins_800ExtraBold');
});
test('refined tokens exist', () => {
  expect(Radius.xl).toBe(20);
  expect(Type.display.fontSize).toBe(34);
  expect(Type.display.fontFamily).toBe('Poppins_800ExtraBold');
  expect(Colors.light.surfaceRaised).toBe('#FFFFFF');
  expect(Colors.dark.surfaceRaised).toBe('#1E1C19');
  expect(Colors.light.hairline).toBe('rgba(28, 26, 23, 0.08)');
  expect(Colors.dark.hairline).toBe('rgba(255, 255, 255, 0.06)');
  expect(Shadow.cta.elevation).toBe(6);
});
