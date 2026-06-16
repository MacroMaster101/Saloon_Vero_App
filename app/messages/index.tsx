import { getMyConversations, subscribeToInbox, type InboxItem } from '@/lib/api/chat';
import { useSession } from '@/context/session';
import { useTheme } from '@/hooks/use-theme';
import { BackButton } from '@/components/ui/back-button';
import { EmptyState } from '@/components/ui/empty-state';
import { ScreenContainer } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Image as ExpoImage } from 'expo-image';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, RefreshControl, Text, View } from 'react-native';

export default function InboxScreen() {
  const { c, Spacing, Radius, Type, scheme } = useTheme();
  const { user, profile } = useSession();
  const [items, setItems] = useState<InboxItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const asStylistId = profile?.role === 'staff' ? profile.stylistId : null;

  const load = useCallback(async () => {
    if (!user) return;
    setItems(await getMyConversations(user.id, asStylistId));
  }, [user, asStylistId]);

  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => subscribeToInbox(load), [load]);

  return (
    <ScreenContainer
      scroll={false}
      safeTop={false}
      style={{ paddingHorizontal: 0 }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={async () => {
            setRefreshing(true);
            await load();
            setRefreshing(false);
          }}
          tintColor={c.accent}
        />
      }
    >
      <View style={{ paddingHorizontal: Spacing.md }}>
        <ScreenHeader eyebrow="MESSAGES" title="Chats" left={<BackButton />} />
      </View>

      {items.length === 0 ? (
        <EmptyState
          icon="💬"
          title="No conversations yet"
          caption="Message a stylist from their profile or one of your bookings and it'll show up here."
        />
      ) : (
        <View style={{ paddingHorizontal: Spacing.md, gap: Spacing.sm }}>
          {items.map((item) => {
            const unread = item.unread > 0;
            return (
              <Pressable
                key={item.conversation.id}
                onPress={() => router.push(`/messages/${item.conversation.id}` as never)}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: Spacing.sm,
                  padding: Spacing.sm + 2,
                  borderRadius: Radius.lg,
                  backgroundColor: pressed ? c.accentTint : c.surfaceRaised,
                  borderWidth: 1,
                  borderColor: c.hairline,
                })}
              >
                <ExpoImage
                  source={{ uri: item.otherAvatar ?? undefined }}
                  style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: c.bg2 }}
                  contentFit="cover"
                />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text
                    numberOfLines={1}
                    style={[
                      Type.body,
                      { color: c.fg, fontFamily: unread ? 'Poppins_700Bold' : 'Poppins_600SemiBold' },
                    ]}
                  >
                    {item.otherName}
                  </Text>
                  <Text
                    numberOfLines={1}
                    style={{
                      color: unread ? c.fg2 : c.fgMuted,
                      fontFamily: unread ? 'Poppins_500Medium' : 'Poppins_400Regular',
                      fontSize: 13,
                      marginTop: 1,
                    }}
                  >
                    {item.conversation.last_message_preview ?? 'Start the conversation'}
                  </Text>
                </View>
                {unread && (
                  <View
                    style={{
                      backgroundColor: c.accent,
                      borderRadius: Radius.pill,
                      minWidth: 22,
                      height: 22,
                      paddingHorizontal: 7,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text
                      style={{
                        color: scheme === 'dark' ? '#1C1A17' : '#FFF',
                        fontSize: 11,
                        fontFamily: 'Poppins_700Bold',
                      }}
                    >
                      {item.unread}
                    </Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
      )}
    </ScreenContainer>
  );
}
