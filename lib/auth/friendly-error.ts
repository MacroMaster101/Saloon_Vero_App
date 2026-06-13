// Maps raw Supabase auth errors to friendlier copy; unknown messages pass through.
export function friendlyAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('email not confirmed')) return 'Please confirm your email first — check your inbox.';
  if (m.includes('invalid login credentials')) return 'Wrong email or password.';
  if (m.includes('error sending') || m.includes('error sending recovery email'))
    return 'Could not send the email right now. Please try again in a few minutes.';
  if (m.includes('same password')) return 'Choose a password different from your current one.';
  if (m.includes('token has expired') || m.includes('otp_expired') || m.includes('expired'))
    return 'That code has expired. Tap resend to get a new one.';
  if (m.includes('invalid') && (m.includes('token') || m.includes('otp')))
    return 'That code is incorrect. Check the email and try again.';
  if (m.includes('password') && (m.includes('should') || m.includes('weak') || m.includes('characters')))
    return 'Password must be 8+ characters with upper, lower, number and symbol.';
  return message;
}
