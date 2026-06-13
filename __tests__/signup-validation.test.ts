import { validateSignup, validatePassword } from '@/lib/auth/signup-validation';

// Strong password meeting the Supabase policy: 8+ chars, upper, lower, digit, symbol.
const good = { name: 'Kavisha', phone: '0771234567', email: ' You@Email.com ', password: 'Secret1!', confirm: 'Secret1!' };

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
  expect(validateSignup({ ...good, password: 'Ab1!', confirm: 'Ab1!' })).toEqual({ ok: false, message: 'Password must be at least 8 characters' });
});
test('rejects mismatched passwords', () => {
  expect(validateSignup({ ...good, confirm: 'Different1!' })).toEqual({ ok: false, message: "Passwords don't match" });
});

describe('validatePassword', () => {
  test('accepts a strong password', () => {
    expect(validatePassword('Secret1!')).toBeNull();
  });
  test('requires 8+ characters', () => {
    expect(validatePassword('Ab1!')).toBe('Password must be at least 8 characters');
  });
  test('requires a lowercase letter', () => {
    expect(validatePassword('SECRET1!')).toBe('Password needs a lowercase letter');
  });
  test('requires an uppercase letter', () => {
    expect(validatePassword('secret1!')).toBe('Password needs an uppercase letter');
  });
  test('requires a number', () => {
    expect(validatePassword('Secret!!')).toBe('Password needs a number');
  });
  test('requires a symbol', () => {
    expect(validatePassword('Secret12')).toBe('Password needs a symbol (e.g. !@#$)');
  });
});
