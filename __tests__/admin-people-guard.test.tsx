import { render } from '@testing-library/react-native';

// Mock out API modules that require Supabase env vars before importing the component
jest.mock('@/lib/api/admin', () => ({
  getAllProfiles: jest.fn(),
  getStylistsAdmin: jest.fn(),
  setProfileRole: jest.fn(),
}));

// Also mock session context used by the default export
jest.mock('@/context/session', () => ({
  useSession: () => ({ user: { id: 'me' } }),
}));

// eslint-disable-next-line import/first
import { PersonRoleEditor } from '@/app/(admin)/manage/people';

const person = { id: 'u2', full_name: 'Sanduni', email: 's@x.lk', role: 'user' as const, stylist_id: null };

test('editor disabled for own profile', () => {
  const { getByText, queryByText } = render(
    <PersonRoleEditor person={{ ...person, id: 'me' }} selfId="me" stylists={[]} onSave={jest.fn()} />,
  );
  expect(getByText("You can't change your own role.")).toBeTruthy();
  expect(queryByText('Save')).toBeNull();
});

test('editor enabled for others', () => {
  const { getByText } = render(
    <PersonRoleEditor person={person} selfId="me" stylists={[]} onSave={jest.fn()} />,
  );
  expect(getByText('Save')).toBeTruthy();
});
