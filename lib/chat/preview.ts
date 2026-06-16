type PreviewInput = { kind: 'text' | 'image' | 'booking'; body: string | null };

/** Build the inbox preview string for a message. Mirrors the DB trigger logic,
 *  except a captioned image / noted booking previews its text instead of the label. */
export function messagePreview({ kind, body }: PreviewInput): string {
  const text = (body ?? '').trim();
  if (kind === 'image') return text ? text.slice(0, 80) : '📷 Photo';
  if (kind === 'booking') return text ? text.slice(0, 80) : '📅 Booking';
  return text.slice(0, 80);
}
