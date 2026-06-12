import { Text } from 'react-native';
import { render, waitFor } from '@testing-library/react-native';
import { SessionProvider, useSession } from '@/context/session';
import { supabase } from '@/lib/api/supabase';

jest.mock('@/lib/api/supabase', () => {
  const auth = {
    getSession: jest.fn().mockResolvedValue({ data: { session: { user: { id: 'u1' } } } }),
    onAuthStateChange: jest.fn().mockReturnValue({ data: { subscription: { unsubscribe: jest.fn() } } }),
    signOut: jest.fn().mockResolvedValue({}),
  };
  const profileResult = { data: { role: 'staff', stylist_id: 'sty-1' }, error: null };
  const single = jest.fn().mockResolvedValue(profileResult);
  const eq = jest.fn().mockReturnValue({ single });
  const select = jest.fn().mockReturnValue({ eq });
  const from = jest.fn().mockReturnValue({ select });
  return { supabase: { auth, from, __mock: { from, select, eq, single } } };
});

function Probe() {
  const { profile, profileReady } = useSession();
  return <Text testID="probe">{`${profileReady}:${profile ? `${profile.role}/${profile.stylistId}` : 'none'}`}</Text>;
}

test('loads staff profile after session resolves', async () => {
  const { getByTestId } = render(<SessionProvider><Probe /></SessionProvider>);
  await waitFor(() => expect(getByTestId('probe').children.join('')).toBe('true:staff/sty-1'));
  expect((supabase as any).__mock.from).toHaveBeenCalledWith('profiles');
});

test('profile fetch failure resolves to null profile but ready', async () => {
  (supabase as any).__mock.single.mockRejectedValueOnce(new Error('boom'));
  const { getByTestId } = render(<SessionProvider><Probe /></SessionProvider>);
  await waitFor(() => expect(getByTestId('probe').children.join('')).toBe('true:none'));
});
