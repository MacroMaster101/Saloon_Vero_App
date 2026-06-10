import { render } from '@testing-library/react-native';
import { LoadingScreen } from '@/components/ui/loading';

describe('LoadingScreen Component', () => {
  test('renders with default message', () => {
    const { getByText } = render(<LoadingScreen />);
    expect(getByText('Loading...')).toBeTruthy();
  });

  test('renders custom message', () => {
    const { getByText } = render(<LoadingScreen message="Fetching stylists..." />);
    expect(getByText('Fetching stylists...')).toBeTruthy();
  });

  test('renders successfully', () => {
    const { toJSON } = render(<LoadingScreen />);
    expect(toJSON()).toBeTruthy();
  });
});
