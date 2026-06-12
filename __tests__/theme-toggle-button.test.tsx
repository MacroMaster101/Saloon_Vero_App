import AsyncStorage from '@react-native-async-storage/async-storage';
import { fireEvent, render } from '@testing-library/react-native';
import { ThemePreferenceProvider } from '@/context/theme';
import { ThemeToggleButton } from '@/components/ui/theme-toggle-button';

jest.mock('@react-native-async-storage/async-storage');

test('cycles preference on press: system -> light -> dark -> system', () => {
  const { getByTestId } = render(
    <ThemePreferenceProvider><ThemeToggleButton /></ThemePreferenceProvider>,
  );
  const btn = getByTestId('theme-toggle');
  fireEvent.press(btn); // system -> light
  expect(AsyncStorage.setItem).toHaveBeenLastCalledWith('saloon_vero_theme_pref', 'light');
  fireEvent.press(btn); // light -> dark
  expect(AsyncStorage.setItem).toHaveBeenLastCalledWith('saloon_vero_theme_pref', 'dark');
  fireEvent.press(btn); // dark -> system
  expect(AsyncStorage.setItem).toHaveBeenLastCalledWith('saloon_vero_theme_pref', 'system');
});
