import { Stack } from 'expo-router';

export default function MessagesLayout() {
  // Headers are rendered inside each screen (ScreenHeader / custom thread bar)
  // to match the app's design system, so the native stack header stays hidden.
  return <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} />;
}
