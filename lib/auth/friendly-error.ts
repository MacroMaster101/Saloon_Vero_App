// Maps raw Supabase auth errors to friendlier copy; unknown messages pass through.
export function friendlyAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('email not confirmed')) return 'Please confirm your email first — check your inbox.';
  if (m.includes('invalid login credentials')) return 'Wrong email or password.';
  return message;
}
