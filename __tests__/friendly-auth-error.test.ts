import { friendlyAuthError } from '@/lib/auth/friendly-error';

test('maps unconfirmed email', () => {
  expect(friendlyAuthError('Email not confirmed')).toBe('Please confirm your email first — check your inbox.');
});
test('maps invalid credentials', () => {
  expect(friendlyAuthError('Invalid login credentials')).toBe('Wrong email or password.');
});
test('passes other messages through', () => {
  expect(friendlyAuthError('Too many requests')).toBe('Too many requests');
});
