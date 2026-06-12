import { fireEvent, render } from '@testing-library/react-native';
import { router } from 'expo-router';
import { BackButton } from '@/components/ui/back-button';

jest.mock('expo-router', () => ({ router: { back: jest.fn() } }));

beforeEach(() => jest.clearAllMocks());

test('defaults to router.back()', () => {
  const { getByLabelText } = render(<BackButton />);
  fireEvent.press(getByLabelText('Go back'));
  expect(router.back).toHaveBeenCalledTimes(1);
});

test('custom onPress overrides router.back', () => {
  const onPress = jest.fn();
  const { getByLabelText } = render(<BackButton onPress={onPress} />);
  fireEvent.press(getByLabelText('Go back'));
  expect(onPress).toHaveBeenCalledTimes(1);
  expect(router.back).not.toHaveBeenCalled();
});
