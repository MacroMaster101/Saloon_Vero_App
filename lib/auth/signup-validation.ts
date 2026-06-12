import { slLankaPhone } from '@/lib/validation/booking';

export type SignupInput = { name: string; phone: string; email: string; password: string; confirm: string };
export type SignupValidation =
  | { ok: true; cleanEmail: string; cleanName: string; cleanPhone: string }
  | { ok: false; message: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateSignup(input: SignupInput): SignupValidation {
  const cleanName = input.name.trim();
  if (cleanName.length < 2) return { ok: false, message: 'Please enter your name' };
  const phoneCheck = slLankaPhone.safeParse(input.phone.trim());
  if (!phoneCheck.success) return { ok: false, message: 'Enter a valid Sri Lankan mobile number' };
  const cleanEmail = input.email.trim().toLowerCase();
  if (!EMAIL_RE.test(cleanEmail)) return { ok: false, message: 'Enter a valid email address' };
  if (input.password.length < 6) return { ok: false, message: 'Password must be at least 6 characters' };
  if (input.password !== input.confirm) return { ok: false, message: "Passwords don't match" };
  return { ok: true, cleanEmail, cleanName, cleanPhone: phoneCheck.data };
}
