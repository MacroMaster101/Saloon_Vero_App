export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function canEditProfile(targetId: string, selfId: string): boolean {
  return targetId !== selfId;
}

export function blockLabel(slot: { stylist_id: string | null }, stylists: { id: string; name: string }[]): string {
  if (!slot.stylist_id) return 'Whole salon';
  return stylists.find((s) => s.id === slot.stylist_id)?.name ?? 'Stylist';
}

export function filterByStylist<T extends { stylist_id: string | null }>(rows: T[], stylistId: string | null): T[] {
  return stylistId ? rows.filter((row) => row.stylist_id === stylistId) : rows;
}
