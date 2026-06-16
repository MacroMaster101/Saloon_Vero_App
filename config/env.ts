type Raw = { EXPO_PUBLIC_SUPABASE_URL?: string; EXPO_PUBLIC_SUPABASE_ANON_KEY?: string };

export function readEnv(_raw?: Raw) {
  // IMPORTANT: reference each var as the literal static expression
  // `process.env.EXPO_PUBLIC_*`. Metro inlines EXPO_PUBLIC_* vars by textually
  // replacing exactly that member-access pattern at bundle time. Reading them
  // off a passed-in object (e.g. `raw.EXPO_PUBLIC_SUPABASE_URL`) defeats the
  // inlining, so the release bundle ends up with `undefined` and throws.
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl) throw new Error('Missing EXPO_PUBLIC_SUPABASE_URL');
  if (!supabaseAnonKey) throw new Error('Missing EXPO_PUBLIC_SUPABASE_ANON_KEY');
  return { supabaseUrl, supabaseAnonKey };
}

// Lazy export: env is validated only when first accessed, not at module load time
let cachedEnv: ReturnType<typeof readEnv> | undefined;
let cacheError: Error | undefined;

export const env = new Proxy(
  {},
  {
    get: (target, prop) => {
      if (cachedEnv === undefined && cacheError === undefined) {
        try {
          cachedEnv = readEnv();
        } catch (err) {
          cacheError = err as Error;
        }
      }
      if (cacheError) throw cacheError;
      return (cachedEnv as any)[prop];
    },
  },
) as ReturnType<typeof readEnv>;
