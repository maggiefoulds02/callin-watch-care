import "server-only";

import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

/**
 * Supabase client for use in Server Components, Server Actions, and Route
 * Handlers. Reads the session from request cookies; writes updated auth
 * cookies back when the session is refreshed.
 *
 * NOTE: Server Components can't write cookies (only read them) — that's
 * fine here because `proxy.ts` refreshes the session on every navigation
 * before any Server Component runs, so by the time a Server Component
 * calls this, the cookies are already current. Server Actions and Route
 * Handlers *can* write cookies, so a refresh triggered there still works.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Called from a Server Component (not a Server Action / Route
            // Handler) — cookies can't be written here. Safe to ignore
            // because proxy.ts already refreshed the session for this
            // request.
          }
        },
      },
    },
  );
}

/**
 * Admin client using the Supabase service role key. Bypasses Row-Level
 * Security entirely — never expose this to the client, never import it
 * outside server-only code, and use it only for operations that
 * genuinely need to cross RLS boundaries (e.g. inviting a customer to
 * create their portal account). Everything else should use the
 * request-scoped client above so RLS stays the real enforcement layer.
 */
export function createSupabaseAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
