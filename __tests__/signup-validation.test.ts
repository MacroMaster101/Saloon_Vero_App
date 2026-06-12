import { validateSignup } from '@/lib/auth/signup-validation';

const good = { name: 'Kavisha', phone: '0771234567', email: ' You@Email.com ', password: 'secret1', confirm: 'secret1' };

test('accepts valid input and returns cleaned values', () => {
  const r = validateSignup(good);
  expect(r).toEqual({ ok: true, cleanEmail: 'you@email.com', cleanName: 'Kavisha', cleanPhone: '0771234567' });
});
test('rejects short name', () => {
  expect(validateSignup({ ...good, name: ' K ' })).toEqual({ ok: false, message: 'Please enter your name' });
});
test('rejects invalid Sri Lankan phone', () => {
  expect(validateSignup({ ...good, phone: '123' })).toEqual({ ok: false, message: 'Enter a valid Sri Lankan mobile number' });
});
test('rejects invalid email', () => {
  expect(validateSignup({ ...good, email: 'nope' })).toEqual({ ok: false, message: 'Enter a valid email address' });
});
test('rejects short password', () => {
  expect(validateSignup({ ...good, password: 'abc', confirm: 'abc' })).toEqual({ ok: false, message: 'Password must be at least 6 characters' });
});
test('rejects mismatched passwords', () => {
  expect(validateSignup({ ...good, confirm: 'different' })).toEqual({ ok: false, message: "Passwords don't match" });
});
