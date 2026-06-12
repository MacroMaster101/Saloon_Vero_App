import { render, fireEvent } from '@testing-library/react-native';
import { ThemedButton } from '@/components/ui/button';
test('renders label and fires onPress', () => {
  const onPress = jest.fn();
  const { getByText } = render(<ThemedButton label="Book now" onPress={onPress} />);
  fireEvent.press(getByText('Book now'));
  expect(onPress).toHaveBeenCalled();
});
test('shows busy label and is not pressable when busy', () => {
  const onPress = jest.fn();
  const { getByText } = render(<ThemedButton label="Save" busy onPress={onPress} />);
  fireEvent.press(getByText('…'));
  expect(onPress).not.toHaveBeenCalled();
});
test('destructive variant renders label and fires onPress', () => {
  const onPress = jest.fn();
  const { getByText } = render(<ThemedButton label="Sign out" variant="destructive" onPress={onPress} />);
  fireEvent.press(getByText('Sign out'));
  expect(onPress).toHaveBeenCalled();
});
