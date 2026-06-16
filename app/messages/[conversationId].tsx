import {
  conversationHasBooking,
  getConversationHeader,
  getMessages,
  markRead,
  sendBookingMessage,
  sendImageMessage,
  sendMessage,
  subscribeToMessages,
  uploadChatImage,
} from '@/lib/api/chat';
import { supabase } from '@/lib/api/supabase';
import { useSession } from '@/context/session';
import { useTheme } from '@/hooks/use-theme';
import { BackButton } from '@/components/ui/back-button';
import { BookingCard } from '@/components/chat/BookingCard';
import { BookingPickerSheet } from '@/components/chat/BookingPickerSheet';
import { ChatImage } from '@/components/chat/ChatImage';
import { ImageViewerModal } from '@/components/chat/ImageViewerModal';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Image as ExpoImage } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Message } from '@/types/database';

export default function ThreadScreen() {
  const { c, Spacing, Radius, Type, scheme } = useTheme();
  const insets = useSafeAreaInsets();
  const { user, profile } = useSession();
  const { conversationId, attachBookingId } = useLocalSearchParams<{
    conversationId: string;
    attachBookingId?: string;
  }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [header, setHeader] = useState<{ name: string; avatar: string | null }>({
    name: 'Chat',
    avatar: null,
  });
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [pendingImages, setPendingImages] = useState<string[]>([]);
  const [pendingBookingId, setPendingBookingId] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const listRef = useRef<FlatList<Message>>(null);
  const isStylist = profile?.role === 'staff';
  const asStylistId = isStylist ? profile?.stylistId ?? null : null;

  useEffect(() => {
    if (!conversationId) return;
    let active = true;
    getConversationHeader(conversationId, asStylistId).then((h) => {
      if (active) setHeader(h);
    });
    getMessages(conversationId).then((m) => {
      if (active) setMessages(m);
    });
    // Needed by the staff booking picker (whose bookings to list).
    supabase
      .from('conversations')
      .select('customer_id')
      .eq('id', conversationId)
      .maybeSingle()
      .then(({ data }) => {
        if (active && data) setCustomerId(data.customer_id);
      });
    markRead(conversationId, isStylist);
    const unsub = subscribeToMessages(conversationId, (m) => {
      setMessages((prev) => (prev.some((p) => p.id === m.id) ? prev : [...prev, m]));
      markRead(conversationId, isStylist);
    });
    return () => {
      active = false;
      unsub();
    };
  }, [conversationId, isStylist, asStylistId]);

  // Customer auto-attach: when opened from a booking, post that booking's card once.
  useEffect(() => {
    if (!user || !conversationId || !attachBookingId) return;
    let active = true;
    (async () => {
      const exists = await conversationHasBooking(conversationId, attachBookingId);
      if (!active || exists) return;
      await sendBookingMessage({
        conversationId,
        senderId: user.id,
        bookingId: attachBookingId,
      });
    })();
    return () => {
      active = false;
    };
  }, [user, conversationId, attachBookingId]);

  const onSend = async () => {
    if (!user || !conversationId || !draft.trim() || sending) return;
    setSending(true);
    const body = draft;
    setDraft('');
    const res = await sendMessage({ conversationId, senderId: user.id, body });
    if ('error' in res) setDraft(body); // restore on failure
    setSending(false);
  };

  const pickImage = async () => {
    try {
      // Single pick with the system crop/edit screen. expo-image-picker only
      // offers interactive cropping during selection (allowsEditing), and only
      // for a single asset — so picking is one-at-a-time. Tap the button again
      // to add more photos before sending.
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.7,
        allowsEditing: true,
      });
      if (res.canceled) return;
      setUploadError(null);
      setPendingImages((prev) => [...prev, res.assets[0].uri]);
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Could not open the photo library.');
    }
  };

  const removeImage = (index: number) =>
    setPendingImages((prev) => prev.filter((_, i) => i !== index));

  /** Unified send: posts any attached photos (last one carries the typed caption),
   *  or a plain text message when there are no attachments. */
  const handleSend = async () => {
    if (!user || !conversationId || sending) return;
    const text = draft.trim();

    // Booking attachment (with optional note = typed text).
    if (pendingBookingId) {
      setSending(true);
      setUploadError(null);
      const res = await sendBookingMessage({
        conversationId,
        senderId: user.id,
        bookingId: pendingBookingId,
        note: text,
      });
      if ('error' in res) {
        setUploadError("Couldn't attach booking — try again");
        setSending(false);
        return;
      }
      setPendingBookingId(null);
      setDraft('');
      setSending(false);
      return;
    }

    if (pendingImages.length === 0) {
      await onSend(); // existing text-only path
      return;
    }
    setSending(true);
    setUploadError(null);
    const images = pendingImages;
    for (let i = 0; i < images.length; i++) {
      const up = await uploadChatImage(conversationId, user.id, images[i]);
      if ('error' in up) {
        setUploadError("Couldn't send photo — try again");
        setSending(false);
        return;
      }
      // Only the last image carries the caption typed in the message bar.
      const caption = i === images.length - 1 ? text : undefined;
      const res = await sendImageMessage({
        conversationId,
        senderId: user.id,
        imagePath: up.path,
        caption,
      });
      if ('error' in res) {
        setUploadError("Couldn't send photo — try again");
        setSending(false);
        return;
      }
    }
    setPendingImages([]);
    setDraft('');
    setSending(false);
  };

  const headerUri = header.avatar ?? undefined;

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      {/* Custom header bar (native header is hidden) */}
      <View
        style={{
          paddingTop: insets.top + Spacing.sm,
          paddingBottom: Spacing.sm,
          paddingHorizontal: Spacing.md,
          flexDirection: 'row',
          alignItems: 'center',
          gap: Spacing.sm,
          backgroundColor: c.surfaceRaised,
          borderBottomWidth: 1,
          borderBottomColor: c.hairline,
        }}
      >
        <BackButton />
        <ExpoImage
          source={{ uri: headerUri }}
          style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: c.bg2 }}
          contentFit="cover"
        />
        <Text numberOfLines={1} style={[Type.h2, { color: c.fg, fontSize: 17, flex: 1 }]}>
          {header.name}
        </Text>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={insets.top + 52}
      >
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={{ padding: Spacing.md, gap: 6 }}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={
            <Text
              style={{
                color: c.fgMuted,
                textAlign: 'center',
                marginTop: 48,
                fontFamily: 'Poppins_500Medium',
              }}
            >
              Say hello 👋
            </Text>
          }
          renderItem={({ item }) => {
            const mine = item.sender_id === user?.id;
            const isImage = item.kind === 'image' && !!item.image_url;
            const isBooking = item.kind === 'booking' && !!item.booking_id;
            const isMedia = isImage || isBooking;
            const textColor = mine ? (scheme === 'dark' ? '#1C1A17' : '#FFF') : c.fg;
            return (
              <View
                style={{
                  alignSelf: mine ? 'flex-end' : 'flex-start',
                  backgroundColor: mine ? c.accent : c.surfaceRaised,
                  borderWidth: mine ? 0 : 1,
                  borderColor: c.hairline,
                  borderRadius: Radius.lg,
                  borderBottomRightRadius: mine ? 4 : Radius.lg,
                  borderBottomLeftRadius: mine ? Radius.lg : 4,
                  paddingHorizontal: isMedia ? 4 : 12,
                  paddingVertical: isMedia ? 4 : 8,
                  maxWidth: '80%',
                }}
              >
                {isBooking ? (
                  <>
                    <BookingCard bookingId={item.booking_id!} />
                    {!!item.body && (
                      <Text
                        style={{
                          color: textColor,
                          fontFamily: 'Poppins_400Regular',
                          fontSize: 14,
                          lineHeight: 19,
                          marginTop: 6,
                          marginHorizontal: 8,
                          marginBottom: 4,
                        }}
                      >
                        {item.body}
                      </Text>
                    )}
                  </>
                ) : isImage ? (
                  <>
                    <ChatImage path={item.image_url!} onPress={(u) => setViewerUrl(u)} />
                    {!!item.body && (
                      <Text
                        style={{
                          color: textColor,
                          fontFamily: 'Poppins_400Regular',
                          fontSize: 14,
                          lineHeight: 19,
                          marginTop: 6,
                          marginHorizontal: 8,
                          marginBottom: 4,
                        }}
                      >
                        {item.body}
                      </Text>
                    )}
                  </>
                ) : (
                  <Text
                    style={{
                      color: textColor,
                      fontFamily: 'Poppins_400Regular',
                      fontSize: 14,
                      lineHeight: 19,
                    }}
                  >
                    {item.body}
                  </Text>
                )}
              </View>
            );
          }}
        />

        {pendingImages.length > 0 && (
          <View
            style={{
              paddingHorizontal: Spacing.md,
              paddingTop: Spacing.sm,
              paddingBottom: Spacing.xs,
              borderTopWidth: 1,
              borderTopColor: c.hairline,
              backgroundColor: c.surfaceRaised,
              gap: 6,
            }}
          >
            <FlatList
              data={pendingImages}
              horizontal
              keyExtractor={(uri, i) => `${uri}-${i}`}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: Spacing.md, paddingTop: 8, paddingRight: 8 }}
              renderItem={({ item: uri, index }) => (
                <View style={{ width: 72, height: 72 }}>
                  <ExpoImage
                    source={{ uri }}
                    style={{ width: 72, height: 72, borderRadius: Radius.md }}
                    contentFit="cover"
                  />
                  {/* remove */}
                  <Pressable
                    onPress={() => removeImage(index)}
                    hitSlop={8}
                    style={{
                      position: 'absolute',
                      top: -7,
                      right: -7,
                      width: 24,
                      height: 24,
                      borderRadius: 12,
                      backgroundColor: c.fg,
                      borderWidth: 2,
                      borderColor: c.surfaceRaised,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <IconSymbol name="xmark" size={11} color={c.bg} />
                  </Pressable>
                </View>
              )}
            />
            {!!uploadError && (
              <Text style={{ color: c.error, fontSize: 12, fontFamily: 'Poppins_500Medium' }}>
                {uploadError}
              </Text>
            )}
          </View>
        )}

        {pendingBookingId && (
          <View
            style={{
              paddingHorizontal: Spacing.md,
              paddingTop: Spacing.sm,
              borderTopWidth: 1,
              borderTopColor: c.hairline,
              backgroundColor: c.surfaceRaised,
              flexDirection: 'row',
              alignItems: 'center',
              gap: Spacing.sm,
            }}
          >
            <View style={{ flex: 1 }}>
              <BookingCard bookingId={pendingBookingId} />
            </View>
            <Pressable onPress={() => setPendingBookingId(null)} hitSlop={8}>
              <IconSymbol name="xmark" size={16} color={c.fgMuted} />
            </Pressable>
          </View>
        )}

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-end',
            paddingHorizontal: Spacing.sm,
            paddingTop: Spacing.sm,
            paddingBottom: Math.max(insets.bottom, Spacing.sm),
            borderTopWidth: 1,
            borderTopColor: c.hairline,
            backgroundColor: c.surfaceRaised,
            gap: Spacing.sm,
          }}
        >
          <Pressable
            onPress={pickImage}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <IconSymbol name="photo.fill" size={22} color={c.accentText} />
          </Pressable>
          {isStylist && (
            <Pressable
              onPress={() => setPickerOpen(true)}
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <IconSymbol name="calendar" size={22} color={c.accentText} />
            </Pressable>
          )}
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Message…"
            placeholderTextColor={c.fgMuted}
            multiline
            style={{
              flex: 1,
              color: c.fg,
              backgroundColor: c.bg2,
              borderRadius: Radius.lg,
              paddingHorizontal: 14,
              paddingTop: 10,
              paddingBottom: 10,
              maxHeight: 120,
              fontFamily: 'Poppins_400Regular',
              fontSize: 14,
            }}
          />
          {(() => {
            const canSend =
              (!!draft.trim() || pendingImages.length > 0 || !!pendingBookingId) && !sending;
            return (
              <Pressable
                onPress={handleSend}
                disabled={!canSend}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: canSend ? c.accent : c.hairline,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <IconSymbol
                  name="paperplane.fill"
                  size={18}
                  color={canSend ? (scheme === 'dark' ? '#1C1A17' : '#FFF') : c.fgMuted}
                />
              </Pressable>
            );
          })()}
        </View>
      </KeyboardAvoidingView>

      <ImageViewerModal url={viewerUrl} onClose={() => setViewerUrl(null)} />

      <BookingPickerSheet
        visible={pickerOpen}
        stylistId={asStylistId}
        customerId={customerId}
        onSelect={(id) => {
          setPendingBookingId(id);
          setPickerOpen(false);
        }}
        onClose={() => setPickerOpen(false)}
      />
    </View>
  );
}
