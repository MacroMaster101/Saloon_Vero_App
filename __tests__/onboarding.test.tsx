import { render, fireEvent, waitFor } from '@testing-library/react-native';
import EntryScreen from '@/app/index';
import { useSession } from '@/context/session';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mocks
jest.mock('expo-router', () => ({
  router: {
    replace: jest.fn(),
  },
}));

jest.mock('@/context/session', () => ({
  useSession: jest.fn(),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
}));

describe('EntryScreen / Splash & Onboarding Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders splash loader when session is loading', async () => {
    (useSession as jest.Mock).mockReturnValue({
      user: null,
      loading: true,
      isGuest: false,
    });
    (AsyncStorage.getItem as jest.Mock).mockReturnValue(Promise.resolve(null));

    const { getByText } = render(<EntryScreen />);
    
    expect(getByText('Saloon Vero')).toBeTruthy();
    expect(getByText('Redefine Your Look')).toBeTruthy();

    // Settle AsyncStorage async promise to avoid act() warnings
    await waitFor(() => {
      expect(AsyncStorage.getItem).toHaveBeenCalled();
    });
  });

  test('renders onboarding welcome screen for first-time users once session finishes loading', async () => {
    (useSession as jest.Mock).mockReturnValue({
      user: null,
      loading: false,
      isGuest: false,
    });
    // Simulating no 'has_seen_welcome' key (first-time user)
    (AsyncStorage.getItem as jest.Mock).mockReturnValue(Promise.resolve(null));

    const { getByText } = render(<EntryScreen />);

    // Wait for the async storage check to resolve and screen state to update
    await waitFor(() => {
      expect(getByText('Redefine Your Style, Effortlessly')).toBeTruthy();
      expect(getByText('Expert Stylists')).toBeTruthy();
      expect(getByText('Get Started')).toBeTruthy();
    });
  });

  test('redirects to tabs immediately for returning users', async () => {
    (useSession as jest.Mock).mockReturnValue({
      user: { id: 'user-1' },
      loading: false,
      isGuest: false,
    });
    // Simulating user has already seen welcome screen
    (AsyncStorage.getItem as jest.Mock).mockReturnValue(Promise.resolve('true'));

    render(<EntryScreen />);

    await waitFor(() => {
      expect(router.replace).toHaveBeenCalledWith('/(tabs)');
    });
  });

  test('redirects returning guest users to guest book tab', async () => {
    (useSession as jest.Mock).mockReturnValue({
      user: null,
      loading: false,
      isGuest: true,
    });
    (AsyncStorage.getItem as jest.Mock).mockReturnValue(Promise.resolve('true'));

    render(<EntryScreen />);

    await waitFor(() => {
      expect(router.replace).toHaveBeenCalledWith('/(tabs)/book');
    });
  });

  test('clicking Get Started saves state and redirects to access choices', async () => {
    (useSession as jest.Mock).mockReturnValue({
      user: null,
      loading: false,
      isGuest: false,
    });
    (AsyncStorage.getItem as jest.Mock).mockReturnValue(Promise.resolve(null));

    const { getByText } = render(<EntryScreen />);

    // Wait for onboarding to display
    await waitFor(() => {
      expect(getByText('Get Started')).toBeTruthy();
    });

    // Press the Get Started button
    fireEvent.press(getByText('Get Started'));

    // Verify state was saved and we redirected
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('has_seen_welcome', 'true');
    await waitFor(() => {
      expect(router.replace).toHaveBeenCalledWith('/access');
    });
  });
});
