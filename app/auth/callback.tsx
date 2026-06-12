import { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { router } from 'expo-router';
import * as Linking from 'expo-linking';
import { createSessionFromAuthCallback } from '@/lib/auth/google';
import { LoadingScreen } from '@/components/ui/loading';
import { ScreenContainer } from '@/components/ui/screen';
import { Card } from '@/components/ui/card';
import { ThemedButton } from '@/components/ui/button';
import { useTheme } from '@/hooks/use-theme';

export default function AuthCallback() {
  const callbackUrl = Linking.useLinkingURL();
  const { c, Spacing, Type } = useTheme();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function completeSignIn() {
      const url = callbackUrl ?? (await Linking.getInitialURL());
      if (!url) return;

      const result = await createSessionFromAuthCallback(url);
      if (!mounted) return;

      if (result.ok) {
        router.replace('/(tabs)');
      } else {
        setError(result.message);
      }
    }

    completeSignIn();

    return () => {
      mounted = false;
    };
  }, [callbackUrl]);

  if (!error) return <LoadingScreen message="Completing sign-in..." />;

  return (
    <ScreenContainer scroll={false} style={{ justifyContent: 'center' }}>
      <Card style={{ gap: Spacing.md, padding: Spacing.lg }}>
        <Text style={[Type.h2, { color: c.fg, textAlign: 'center' }]}>Could not complete sign-in</Text>
        <Text style={[Type.body, { color: c.fg2, textAlign: 'center' }]}>{error}</Text>
        <ThemedButton variant="secondary" label="Back to access" onPress={() => router.replace('/access')} />
      </Card>
    </ScreenContainer>
  );
}
