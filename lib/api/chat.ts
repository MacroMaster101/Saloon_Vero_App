import { supabase } from '@/lib/api/supabase';
import { messagePreview } from '@/lib/chat/preview';
import { chatImagePath } from '@/lib/chat/image-path';
import { dicebearPngUrl, getStylistAvatar } from '@/lib/utils/avatar';
import type { Conversation, Message } from '@/types/database';

export type InboxItem = {
  conversation: Conversation;
  otherName: string;
  otherAvatar: string | null;
  unread: number;
};

/** Find the unique conversation for this pair, or create it. */
export async function getOrCreateConversation(
  customerId: string,
  stylistId: string,
): Promise<{ id: string } | { error: string }> {
  const existing = await supabase
    .from('conversations')
    .select('id')
    .eq('customer_id', customerId)
    .eq('stylist_id', stylistId)
    .maybeSingle();
  if (existing.data) return { id: existing.data.id };

  const created = await supabase
    .from('conversations')
    .insert({ customer_id: customerId, stylist_id: stylistId })
    .select('id')
    .single();
  if (created.error) return { error: created.error.message };
  return { id: created.data.id };
}

/** Convenience: resolve (or create) a conversation id for a pair, or null on failure. */
export async function resolveConversationId(
  userId: string,
  stylistId: string,
): Promise<string | null> {
  const res = await getOrCreateConversation(userId, stylistId);
  return 'id' in res ? res.id : null;
}

/**
 * Resolve a customer's display name for the stylist side. The app denormalises
 * the name onto each booking as `customer_name` (same source the staff/admin
 * booking screens use), which is readable by staff — unlike `profiles.full_name`,
 * which RLS may hide. Falls back to the profile name, then "Customer".
 */
async function customerNameFor(customerId: string, stylistId: string): Promise<string> {
  const { data: b } = await supabase
    .from('bookings')
    .select('customer_name')
    .eq('user_id', customerId)
    .eq('stylist_id', stylistId)
    .not('customer_name', 'is', null)
    .order('starts_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (b?.customer_name?.trim()) return b.customer_name.trim();

  const { data: p } = await supabase
    .from('profiles').select('full_name').eq('id', customerId).maybeSingle();
  return p?.full_name?.trim() || 'Customer';
}

/** Inbox list for the current user (works for both customer and stylist). */
export async function getMyConversations(
  userId: string,
  asStylistId: string | null,
): Promise<InboxItem[]> {
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .order('last_message_at', { ascending: false, nullsFirst: false });
  if (error || !data) return [];

  const viewingAsStylist = !!asStylistId;

  if (viewingAsStylist) {
    // Resolve customer names in parallel rather than one-await-per-row (N+1).
    return Promise.all(
      data.map(async (c) => {
        const name = await customerNameFor(c.customer_id, c.stylist_id);
        return {
          conversation: c,
          otherName: name,
          otherAvatar: dicebearPngUrl(name),
          unread: c.stylist_unread,
        };
      }),
    );
  }

  // Customer side: fetch every stylist in ONE query, then map locally — turns
  // N round-trips into 1.
  const stylistIds = [...new Set(data.map((c) => c.stylist_id))];
  const { data: stylists } = await supabase
    .from('stylists')
    .select('id,name,slug,avatar_url')
    .in('id', stylistIds);
  const byId = new Map((stylists ?? []).map((s) => [s.id, s]));

  return data.map((c) => {
    const s = byId.get(c.stylist_id);
    const name = s?.name ?? 'Stylist';
    return {
      conversation: c,
      otherName: name,
      otherAvatar: getStylistAvatar(s?.slug, name, s?.avatar_url),
      unread: c.customer_unread,
    };
  });
}

/**
 * Total unread count for the badge — reads only the unread columns, skipping the
 * name/avatar lookups getMyConversations does. Cheap enough to run on the
 * always-mounted ChatFab on every conversation change.
 */
export async function getUnreadCount(asStylistId: string | null): Promise<number> {
  const col = asStylistId ? 'stylist_unread' : 'customer_unread';
  const { data } = await supabase.from('conversations').select(col);
  if (!data) return 0;
  return (data as Array<Record<string, number>>).reduce((sum, r) => sum + (r[col] ?? 0), 0);
}

/** The other party's display name + avatar for a single conversation header. */
export async function getConversationHeader(
  conversationId: string,
  asStylistId: string | null,
): Promise<{ name: string; avatar: string | null }> {
  const { data: c } = await supabase
    .from('conversations')
    .select('customer_id,stylist_id')
    .eq('id', conversationId)
    .maybeSingle();
  if (!c) return { name: 'Chat', avatar: null };

  if (asStylistId) {
    const name = await customerNameFor(c.customer_id, c.stylist_id);
    return { name, avatar: dicebearPngUrl(name) };
  }
  const { data: s } = await supabase
    .from('stylists').select('name,slug,avatar_url').eq('id', c.stylist_id).maybeSingle();
  const name = s?.name ?? 'Stylist';
  return { name, avatar: getStylistAvatar(s?.slug, name, s?.avatar_url) };
}

export async function getMessages(conversationId: string): Promise<Message[]> {
  const { data } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });
  return data ?? [];
}

export async function sendMessage(opts: {
  conversationId: string;
  senderId: string;
  body: string;
}): Promise<{ ok: true } | { error: string }> {
  const body = opts.body.trim();
  if (!body) return { error: 'Message is empty.' };
  const { error } = await supabase.from('messages').insert({
    conversation_id: opts.conversationId,
    sender_id: opts.senderId,
    kind: 'text',
    body,
  });
  if (error) return { error: error.message };
  return { ok: true };
}

const CHAT_BUCKET = 'chat';

/** Upload a local image to the private chat bucket. Returns the storage path. */
export async function uploadChatImage(
  conversationId: string,
  senderId: string,
  localUri: string,
): Promise<{ path: string } | { error: string }> {
  try {
    const path = chatImagePath(conversationId, senderId);
    const blob = await (await fetch(localUri)).blob();
    const contentType = blob.type || 'image/jpeg';
    const { error } = await supabase.storage
      .from(CHAT_BUCKET)
      .upload(path, blob, { upsert: false, contentType });
    if (error) return { error: error.message };
    return { path };
  } catch (e: any) {
    return { error: e?.message ?? 'Upload failed.' };
  }
}

/** Insert an image message. `image_url` holds the storage PATH; caption goes in body. */
export async function sendImageMessage(opts: {
  conversationId: string;
  senderId: string;
  imagePath: string;
  caption?: string;
}): Promise<{ ok: true } | { error: string }> {
  const caption = opts.caption?.trim() || null;
  const { error } = await supabase.from('messages').insert({
    conversation_id: opts.conversationId,
    sender_id: opts.senderId,
    kind: 'image',
    image_url: opts.imagePath,
    body: caption,
  });
  if (error) return { error: error.message };
  return { ok: true };
}

/** A 1-hour signed URL for a private chat image path, or null on failure. */
export async function signedImageUrl(path: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(CHAT_BUCKET)
    .createSignedUrl(path, 3600);
  if (error || !data) return null;
  return data.signedUrl;
}

export type BookingCardData = {
  reference: string;
  serviceName: string;
  startsAt: string;
  status: string;
};

/** Insert a booking-reference message. `body` carries the optional note. */
export async function sendBookingMessage(opts: {
  conversationId: string;
  senderId: string;
  bookingId: string;
  note?: string;
}): Promise<{ ok: true } | { error: string }> {
  const note = opts.note?.trim() || null;
  const { error } = await supabase.from('messages').insert({
    conversation_id: opts.conversationId,
    sender_id: opts.senderId,
    kind: 'booking',
    booking_id: opts.bookingId,
    body: note,
  });
  if (error) return { error: error.message };
  return { ok: true };
}

/** Fetch one booking's display fields (joined with its service name). */
export async function getBookingCard(bookingId: string): Promise<BookingCardData | null> {
  const { data } = await supabase
    .from('bookings')
    .select('reference,starts_at,status,services(name)')
    .eq('id', bookingId)
    .maybeSingle();
  if (!data) return null;
  const svc = (data as { services: { name: string } | null }).services;
  return {
    reference: data.reference,
    serviceName: svc?.name ?? 'Salon service',
    startsAt: data.starts_at,
    status: data.status,
  };
}

/** A customer's bookings with a given stylist, newest first (for the staff picker). */
export async function getStylistCustomerBookings(
  stylistId: string,
  customerId: string,
): Promise<Array<{ id: string; reference: string; serviceName: string; startsAt: string; status: string }>> {
  const { data } = await supabase
    .from('bookings')
    .select('id,reference,starts_at,status,services(name)')
    .eq('stylist_id', stylistId)
    .eq('user_id', customerId)
    .order('starts_at', { ascending: false });
  if (!data) return [];
  return data.map((b) => {
    const svc = (b as { services: { name: string } | null }).services;
    return {
      id: b.id,
      reference: b.reference,
      serviceName: svc?.name ?? 'Salon service',
      startsAt: b.starts_at,
      status: b.status,
    };
  });
}

/** True if a booking-card message for this booking already exists in the thread. */
export async function conversationHasBooking(
  conversationId: string,
  bookingId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from('messages')
    .select('id')
    .eq('conversation_id', conversationId)
    .eq('kind', 'booking')
    .eq('booking_id', bookingId)
    .limit(1)
    .maybeSingle();
  return !!data;
}

export async function markRead(conversationId: string, isStylist: boolean): Promise<void> {
  const { error } = await supabase.rpc('mark_conversation_read', {
    p_conversation_id: conversationId,
  });
  if (error) {
    // Fallback if RPC not yet deployed (mirrors queries.ts review pattern)
    const patch = isStylist ? { stylist_unread: 0 } : { customer_unread: 0 };
    await supabase.from('conversations').update(patch).eq('id', conversationId);
  }
}

// Each subscription gets its own channel instance. Supabase caches channels by
// name, so a fixed name causes two subscribers (e.g. the inbox screen and the
// ChatFab) to share one channel — the second `.on()` then throws "cannot add
// callbacks after subscribe()". A unique suffix keeps every subscriber isolated.
let channelSeq = 0;

/** Subscribe to new messages in a thread. Returns an unsubscribe fn. */
export function subscribeToMessages(
  conversationId: string,
  onInsert: (m: Message) => void,
): () => void {
  const channel = supabase
    .channel(`messages:${conversationId}:${++channelSeq}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => onInsert(payload.new as Message),
    )
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}

/** Subscribe to conversation changes for live inbox/unread. Returns unsubscribe fn. */
export function subscribeToInbox(onChange: () => void): () => void {
  const channel = supabase
    .channel(`conversations:inbox:${++channelSeq}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'conversations' },
      () => onChange(),
    )
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Best-effort push to the other conversation participant after a message is
 * sent. Fires the `notify` edge function (which verifies the caller and targets
 * the other side). Never throws — a failed push must not affect the send.
 */
export async function notifyOtherParticipant(conversationId: string, preview: string): Promise<void> {
  try {
    await supabase.functions.invoke('notify', {
      body: { conversationId, preview },
    });
  } catch {
    // ignore — notifications are non-critical
  }
}

// re-export for callers that want the preview locally
export { messagePreview };
