import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Appends one row to activity_log — powers the dashboard's running log
 * (PRD section 09). Best-effort: a logging failure should never block the
 * actual mutation it's describing, so callers don't need to check the
 * result or wrap this in their own try/catch.
 */
export async function logActivity(
  eventType: string,
  description: string,
  related?: { table: string; id: string },
) {
  try {
    const supabase = await createSupabaseServerClient();
    await supabase.from("activity_log").insert({
      event_type: eventType,
      description,
      related_table: related?.table ?? null,
      related_id: related?.id ?? null,
    });
  } catch {
    // Deliberately swallowed — see comment above.
  }
}
