type Raw = { EXPO_PUBLIC_SUPABASE_URL?: string; EXPO_PUBLIC_SUPABASE_ANON_KEY?: string };

export function readEnv(raw: Raw) {
  const supabaseUrl = raw.EXPO_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = raw.EXPO_PUBLIC_SUPABASE_ANON_KEY;
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
          cachedEnv = readEnv(process.env as Raw);
        } catch (err) {
          cacheError = err as Error;
        }
      }
      if (cacheError) throw cacheError;
      return (cachedEnv as any)[prop];
    },
  },
) as ReturnType<typeof readEnv>;
