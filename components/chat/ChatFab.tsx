import { getUnreadCount, subscribeToInbox } from '@/lib/api/chat';
import { useSession } from '@/context/session';
import { useTheme } from '@/hooks/use-theme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

export function ChatFab() {
  const { c, Shadow, scheme } = useTheme();
  const { user, profile } = useSession();
  const [unread, setUnread] = useState(0);
  const asStylistId = profile?.role === 'staff' ? profile.stylistId : null;

  const refresh = useCallback(async () => {
    if (!user) return;
    setUnread(await getUnreadCount(asStylistId));
  }, [user, asStylistId]);

  useEffect(() => {
    refresh();
  }, [refresh]);
  useEffect(() => subscribeToInbox(refresh), [refresh]);

  if (!user) return null;

  return (
    <Pressable
      onPress={() => router.push('/messages' as never)}
      accessibilityRole="button"
      accessibilityLabel="Open messages"
      style={({ pressed }) => ({
        position: 'absolute',
        right: 20,
        bottom: 110,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: c.accent,
        borderWidth: 1,
        borderColor: scheme === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.5)',
        alignItems: 'center',
        justifyContent: 'center',
        transform: [{ scale: pressed ? 0.94 : 1 }],
        ...Shadow.cta,
      })}
    >
      <IconSymbol name="bubble.left.fill" size={24} color={scheme === 'dark' ? '#1C1A17' : '#FFF'} />
      {unread > 0 && (
        <View
          style={{
            position: 'absolute',
            top: -3,
            right: -3,
            backgroundColor: c.error,
            borderRadius: 11,
            minWidth: 22,
            height: 22,
            paddingHorizontal: 5,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 2,
            borderColor: c.bg,
          }}
        >
          <Text style={{ color: '#FFF', fontSize: 11, fontFamily: 'Poppins_700Bold' }}>
            {unread > 99 ? '99+' : unread}
          </Text>
        </View>
      )}
    </Pressable>
  );
}
