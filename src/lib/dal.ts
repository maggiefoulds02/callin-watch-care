import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

/**
 * Data Access Layer — the single place authorization logic lives, per the
 * Next.js data-security guide (Server Components/Actions/Route Handlers
 * should call these instead of querying Supabase directly for anything
 * gated by role). This is deliberately in addition to, not instead of,
 * Postgres Row-Level Security: RLS is the backstop if a check here is
 * ever missed; this layer is what makes access decisions feel obvious
 * when writing a new page or action.
 *
 * `cache()` memoizes the result for the lifetime of a single request/render
 * pass, so calling `getCurrentProfile()` from multiple components doesn't
 * trigger multiple database round trips.
 */

export const getCurrentProfile = cache(async (): Promise<Profile | null> => {
  const supabase = await createSupabaseServerClient();

  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims?.sub) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, full_name, email, phone")
    .eq("id", claims.claims.sub)
    .single();

  return profile ?? null;
});

/** Redirects to /login if there's no session at all. */
export async function requireSession(nextPath?: string): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile) {
    redirect(nextPath ? `/login?next=${encodeURIComponent(nextPath)}` : "/login");
  }
  return profile;
}

/** Redirects to /login (or /portal, if logged in as the wrong role). */
export async function requireOwner(): Promise<Profile> {
  const profile = await requireSession("/admin");
  if (profile.role !== "owner") {
    redirect("/portal");
  }
  return profile;
}

/** Redirects to /login (or /admin, if logged in as the wrong role). */
export async function requireCustomer(): Promise<Profile> {
  const profile = await requireSession("/portal");
  if (profile.role !== "customer") {
    redirect("/admin");
  }
  return profile;
}
