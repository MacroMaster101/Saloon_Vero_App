/** Storage path for a chat image: `${conversationId}/${senderId}-${ts}.jpg`.
 *  The leading conversation-id segment is what the bucket RLS policy checks. */
export function chatImagePath(conversationId: string, senderId: string): string {
  return `${conversationId}/${senderId}-${Date.now()}.jpg`;
}
