import { slLankaPhone } from '@/lib/validation/booking';

export type SignupInput = { name: string; phone: string; email: string; password: string; confirm: string };
export type SignupValidation =
  | { ok: true; cleanEmail: string; cleanName: string; cleanPhone: string }
  | { ok: false; message: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Mirror the Supabase dashboard password policy (Auth > Sign In/Providers > Email):
// min length 8 with lowercase, uppercase, digit and symbol. Validating here lets us
// show friendly guidance before the network call, rather than a raw Supabase rejection.
export function validatePassword(password: string): string | null {
  if (password.length < 8) return 'Password must be at least 8 characters';
  if (!/[a-z]/.test(password)) return 'Password needs a lowercase letter';
  if (!/[A-Z]/.test(password)) return 'Password needs an uppercase letter';
  if (!/[0-9]/.test(password)) return 'Password needs a number';
  if (!/[^a-zA-Z0-9]/.test(password)) return 'Password needs a symbol (e.g. !@#$)';
  return null;
}

export function validateSignup(input: SignupInput): SignupValidation {
  const cleanName = input.name.trim();
  if (cleanName.length < 2) return { ok: false, message: 'Please enter your name' };
  const phoneCheck = slLankaPhone.safeParse(input.phone.trim());
  if (!phoneCheck.success) return { ok: false, message: 'Enter a valid Sri Lankan mobile number' };
  const cleanEmail = input.email.trim().toLowerCase();
  if (!EMAIL_RE.test(cleanEmail)) return { ok: false, message: 'Enter a valid email address' };
  const pwError = validatePassword(input.password);
  if (pwError) return { ok: false, message: pwError };
  if (input.password !== input.confirm) return { ok: false, message: "Passwords don't match" };
  return { ok: true, cleanEmail, cleanName, cleanPhone: phoneCheck.data };
}
