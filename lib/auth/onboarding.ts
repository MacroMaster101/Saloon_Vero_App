import AsyncStorage from '@react-native-async-storage/async-storage';

export const ONBOARDING_SEEN_KEY = 'saloon_vero_has_seen_welcome';
export const LEGACY_ONBOARDING_SEEN_KEY = 'has_seen_welcome';

export async function hasSeenWelcome(): Promise<boolean> {
  const current = await AsyncStorage.getItem(ONBOARDING_SEEN_KEY);
  if (current === 'true') return true;

  const legacy = await AsyncStorage.getItem(LEGACY_ONBOARDING_SEEN_KEY);
  return legacy === 'true';
}

export async function markWelcomeSeen(): Promise<void> {
  await Promise.all([
    AsyncStorage.setItem(ONBOARDING_SEEN_KEY, 'true'),
    AsyncStorage.setItem(LEGACY_ONBOARDING_SEEN_KEY, 'true'),
  ]);
}
