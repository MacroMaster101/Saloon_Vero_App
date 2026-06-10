import { Colors, Spacing, Radius, Type } from '@/constants/theme';
test('brand palette present for both schemes', () => {
  expect(Colors.light.accent).toBe('#D99A3D');
  expect(Colors.light.bg).toBe('#FAF6EE');
  expect(Colors.dark.accent).toBe('#E8B05A');
  expect(Colors.dark.bg).toBe('#120E0A');
});
test('scales exist', () => {
  expect(Spacing.md).toBe(16);
  expect(Radius.pill).toBe(999);
  expect(Type.h1.fontFamily).toBe('Poppins_800ExtraBold');
});
