import { supabase } from '@/lib/api/supabase';
import { friendlyAuthError } from '@/lib/auth/friendly-error';
import type { User } from '@supabase/supabase-js';

export type ChangePasswordArgs = {
  /** Current user's email — used to re-authenticate when verifying. */
  email: string;
  /** Required only when verifyCurrent is true. */
  currentPassword?: string;
  newPassword: string;
  /** True for email/password users (verify first); false to just set a password. */
  verifyCurrent: boolean;
};

/**
 * Changes the signed-in user's password. When verifyCurrent is true, the
 * current password is confirmed by re-authenticating (Supabase has no dedicated
 * "verify password" call) before the update. Returns null on success, or a
 * friendly error string on failure.
 */
export async function changePassword(args: ChangePasswordArgs): Promise<string | null> {
  const { email, currentPassword, newPassword, verifyCurrent } = args;
  if (!newPassword) return 'Enter a new password';

  if (verifyCurrent) {
    if (!currentPassword) return 'Enter your current password';
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: currentPassword,
    });
    if (error) {
      // A failed re-auth here means the current password was wrong.
      if (error.message.toLowerCase().includes('invalid login credentials')) {
        return 'Current password is incorrect.';
      }
      return friendlyAuthError(error.message);
    }
  }

  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) return friendlyAuthError(error.message);
  return null;
}

/**
 * True when the account has an email/password credential — i.e. it makes sense
 * to ask for a current password and offer a "Change password" form. A
 * Google-only account returns false (offer "Set a password" instead). Checks
 * every provider/identity since a user may have linked both.
 */
export function userHasPassword(user: Pick<User, 'app_metadata' | 'identities'> | null): boolean {
  if (!user) return false;
  const providers = new Set<string>();
  const primary = user.app_metadata?.provider;
  if (typeof primary === 'string') providers.add(primary);
  const list = (user.app_metadata as { providers?: unknown })?.providers;
  if (Array.isArray(list)) list.forEach((p) => typeof p === 'string' && providers.add(p));
  user.identities?.forEach((i) => i.provider && providers.add(i.provider));
  return providers.has('email');
}
