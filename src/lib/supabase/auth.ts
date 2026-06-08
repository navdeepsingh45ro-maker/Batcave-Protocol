import { getSupabaseClient, SUPABASE_CONFIGURED } from "./client";

export interface BatcaveUser {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  provider: "google";
}

/** Sign in with Google OAuth (redirect flow) */
export async function signInWithGoogle(): Promise<{ error: string | null }> {
  if (!SUPABASE_CONFIGURED) return { error: "Supabase not configured. Add env vars to .env.local." };
  const client = await getSupabaseClient();
  if (!client) return { error: "Client unavailable" };

  const { error } = await (client as any).auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: typeof window !== "undefined" ? window.location.origin : "/",
    },
  });
  return { error: error?.message ?? null };
}

/** Sign out */
export async function signOut(): Promise<void> {
  if (!SUPABASE_CONFIGURED) return;
  const client = await getSupabaseClient();
  if (!client) return;
  await (client as any).auth.signOut();
}

/** Get currently logged-in user */
export async function getCurrentUser(): Promise<BatcaveUser | null> {
  if (!SUPABASE_CONFIGURED) return null;
  const client = await getSupabaseClient();
  if (!client) return null;

  const { data } = await (client as any).auth.getUser();
  const user = data?.user;
  if (!user) return null;

  return {
    id:        user.id,
    email:     user.email ?? "",
    name:      user.user_metadata?.full_name ?? user.email ?? "Knight",
    avatarUrl: user.user_metadata?.avatar_url ?? null,
    provider:  "google",
  };
}

/** Listen to auth state changes */
export function onAuthStateChange(callback: (user: BatcaveUser | null) => void): () => void {
  if (!SUPABASE_CONFIGURED || typeof window === "undefined") return () => {};

  let unsub: (() => void) | null = null;
  getSupabaseClient().then((client) => {
    if (!client) return;
    const { data } = (client as any).auth.onAuthStateChange((_event: string, session: any) => {
      if (!session?.user) { callback(null); return; }
      const u = session.user;
      callback({
        id:        u.id,
        email:     u.email ?? "",
        name:      u.user_metadata?.full_name ?? u.email ?? "Knight",
        avatarUrl: u.user_metadata?.avatar_url ?? null,
        provider:  "google",
      });
    });
    unsub = () => data.subscription.unsubscribe();
  });

  return () => { unsub?.(); };
}
