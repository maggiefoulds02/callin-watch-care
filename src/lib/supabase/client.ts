import { createBrowserClient } from "@supabase/ssr";

/**
 * Supabase client for use in Client Components. Reads/writes the session
 * via cookies (not localStorage) so it stays in sync with the server
 * client used in Server Components/Actions — this is what makes the
 * homepage tracker banner's server-side session read reflect a login
 * that just happened client-side.
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
