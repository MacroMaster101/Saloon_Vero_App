import { signedImageUrl } from '@/lib/api/chat';
import { useTheme } from '@/hooks/use-theme';
import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

export function ChatImage({
  path,
  size = 220,
  onPress,
}: {
  path: string;
  size?: number;
  onPress?: (url: string) => void;
}) {
  const { c, Radius } = useTheme();
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setFailed(false);
    setUrl(null);
    signedImageUrl(path).then((u) => {
      if (!active) return;
      if (u) setUrl(u);
      else setFailed(true);
    });
    return () => {
      active = false;
    };
  }, [path, attempt]);

  const box = {
    width: size,
    height: size,
    borderRadius: Radius.md,
    backgroundColor: c.bg2,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    overflow: 'hidden' as const,
  };

  if (failed) {
    return (
      <Pressable style={box} onPress={() => setAttempt((a) => a + 1)}>
        <Text style={{ color: c.fgMuted, fontFamily: 'Poppins_500Medium', fontSize: 12 }}>
          Tap to retry
        </Text>
      </Pressable>
    );
  }
  if (!url) {
    return (
      <View style={box}>
        <ActivityIndicator color={c.accent} />
      </View>
    );
  }
  return (
    <Pressable onPress={() => onPress?.(url)}>
      <Image source={{ uri: url }} style={box} contentFit="cover" transition={150} />
    </Pressable>
  );
}
