import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, render, waitFor } from '@testing-library/react-native';
import { Text } from 'react-native';
import { ThemePreferenceProvider, useThemePreference, cycleThemePref } from '@/context/theme';

// The global jest.config.js moduleNameMapper already maps this to the jest mock;
// no explicit mock factory needed here.
jest.mock('@react-native-async-storage/async-storage');

function Probe() {
  const { pref, resolvedScheme, setPref } = useThemePreference();
  (Probe as any).setPref = setPref;
  return <Text testID="probe">{`${pref}:${resolvedScheme}`}</Text>;
}

test('defaults to system preference', async () => {
  const { getByTestId } = render(<ThemePreferenceProvider><Probe /></ThemePreferenceProvider>);
  await waitFor(() => expect(getByTestId('probe').children.join('')).toBe('system:light'));
});

test('explicit pref overrides device scheme and persists', async () => {
  const { getByTestId } = render(<ThemePreferenceProvider><Probe /></ThemePreferenceProvider>);
  await act(async () => { (Probe as any).setPref('dark'); });
  expect(getByTestId('probe').children.join('')).toBe('dark:dark');
  expect(AsyncStorage.setItem).toHaveBeenCalledWith('saloon_vero_theme_pref', 'dark');
});

test('hydrates saved preference from storage', async () => {
  (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('dark');
  const { getByTestId } = render(<ThemePreferenceProvider><Probe /></ThemePreferenceProvider>);
  await waitFor(() => expect(getByTestId('probe').children.join('')).toBe('dark:dark'));
});

test('cycle order is light -> dark -> system -> light', () => {
  expect(cycleThemePref('light')).toBe('dark');
  expect(cycleThemePref('dark')).toBe('system');
  expect(cycleThemePref('system')).toBe('light');
});
