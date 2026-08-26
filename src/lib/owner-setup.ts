import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/server";

/**
 * Whether an owner account has ever been created. Backs the one-time
 * "/setup" bootstrap: before this is true, anyone who lands on /setup can
 * create the (single) owner account; once it's true, /setup locks itself
 * and bounces to /login instead. Uses the admin client deliberately — this
 * runs on the public login page too, before anyone is signed in, and
 * profiles has no anonymous-read RLS policy.
 */
export async function ownerAccountExists(): Promise<boolean> {
  const admin = createSupabaseAdminClient();
  const { count } = await admin
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("role", "owner");
  return (count ?? 0) > 0;
}
