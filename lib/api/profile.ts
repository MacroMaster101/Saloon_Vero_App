import { supabase } from '@/lib/api/supabase';

type Result = { ok: true } | { error: string };

export async function updateOwnProfile(opts: {
  userId: string;
  fullName: string;
  email: string | null;
  phone: string;
}): Promise<Result> {
  const fullName = opts.fullName.trim();
  const phone = opts.phone.trim();

  if (!fullName) return { error: 'Name is required.' };

  const { error: authError } = await supabase.auth.updateUser({
    data: { full_name: fullName, phone },
  });
  if (authError) return { error: authError.message };

  const { error: profileError } = await supabase
    .from('profiles')
    .update({ full_name: fullName, email: opts.email })
    .eq('id', opts.userId);

  if (profileError) return { error: profileError.message };
  return { ok: true };
}
