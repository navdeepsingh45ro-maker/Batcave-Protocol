/**
 * BATCAVE SUPABASE CLIENT
 *
 * To activate cloud sync and Google Auth:
 * 1. Create a project at https://supabase.com
 * 2. Enable Google OAuth in Authentication → Providers
 * 3. Create .env.local with:
 *
 *    NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
 *    NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
 *
 * 4. Install the SDK: npm install @supabase/supabase-js
 *
 * Until configured the app runs fully offline.
 */

const SUPABASE_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL  ?? "";
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const SUPABASE_CONFIGURED = Boolean(SUPABASE_URL && SUPABASE_ANON);

/** Lazy Supabase client — only created if configured */
let _client: unknown = null;

export async function getSupabaseClient(): Promise<unknown | null> {
  if (!SUPABASE_CONFIGURED) return null;
  if (_client) return _client;

  try {
    // Dynamic import — will only work after `npm install @supabase/supabase-js`
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mod = await import("@supabase/supabase-js" as any);
    _client = mod.createClient(SUPABASE_URL, SUPABASE_ANON);
  } catch {
    console.warn("[Batcave] Supabase SDK not installed. Run: npm install @supabase/supabase-js");
    return null;
  }

  return _client;
}
