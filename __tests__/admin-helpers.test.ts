import { slugify, canEditProfile, blockLabel, filterByStylist } from '@/lib/admin/helpers';

test('slugify produces url-safe kebab case', () => {
  expect(slugify('Gents Cut & Style')).toBe('gents-cut-style');
  expect(slugify('  Hair   Colour (roots) ')).toBe('hair-colour-roots');
});

test('canEditProfile blocks self', () => {
  expect(canEditProfile('u1', 'u1')).toBe(false);
  expect(canEditProfile('u2', 'u1')).toBe(true);
});

test('blockLabel names the stylist or the whole salon', () => {
  const stylists = [{ id: 'sty-1', name: 'Ruwan' }];
  expect(blockLabel({ stylist_id: 'sty-1' }, stylists)).toBe('Ruwan');
  expect(blockLabel({ stylist_id: null }, stylists)).toBe('Whole salon');
  expect(blockLabel({ stylist_id: 'missing' }, stylists)).toBe('Stylist');
});

test('filterByStylist returns all when filter is null', () => {
  const rows = [{ stylist_id: 'a' }, { stylist_id: 'b' }, { stylist_id: null }];
  expect(filterByStylist(rows, null)).toHaveLength(3);
  expect(filterByStylist(rows, 'a')).toEqual([{ stylist_id: 'a' }]);
});
