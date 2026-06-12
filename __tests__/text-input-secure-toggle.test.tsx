import { fireEvent, render } from '@testing-library/react-native';
import { ThemedTextInput } from '@/components/ui/text-input';

test('secureToggle hides text by default and reveals on eye press', () => {
  const { getByLabelText, getByPlaceholderText } = render(
    <ThemedTextInput placeholder="pw" secureToggle value="secret" onChangeText={() => {}} />,
  );
  expect(getByPlaceholderText('pw').props.secureTextEntry).toBe(true);
  fireEvent.press(getByLabelText('Show password'));
  expect(getByPlaceholderText('pw').props.secureTextEntry).toBe(false);
  fireEvent.press(getByLabelText('Hide password'));
  expect(getByPlaceholderText('pw').props.secureTextEntry).toBe(true);
});
