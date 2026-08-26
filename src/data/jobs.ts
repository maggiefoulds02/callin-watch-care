import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/dal";
import {
  ACTIVE_JOB_STATUSES,
  type Job,
  type JobPhoto,
  type JobStatusEvent,
} from "@/lib/types";

/**
 * Powers the homepage tracker banner: if the current visitor is logged in
 * as a customer and has a watch actively in service, return it. Returns
 * null for logged-out visitors, owners, and customers with no active job
 * — the homepage renders its normal hero in all of those cases.
 */
export async function getActiveJobForCurrentCustomer(): Promise<Job | null> {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "customer") return null;

  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from("jobs")
    .select(
      "id, job_number, customer_id, watch_brand, watch_model, watch_serial_number, watch_description, service_type, current_status, intake_notes, estimated_completion_date, created_at, updated_at, customers!inner(user_id)",
    )
    .eq("customers.user_id", profile.id)
    .in("current_status", ACTIVE_JOB_STATUSES)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) return null;

  // Strip the joined `customers` relation before returning — callers only
  // need the Job shape (Data Transfer Object pattern per Next.js's
  // data-security guide: return only what the caller needs).
  const { customers: _customers, ...job } = data as Job & {
    customers: unknown;
  };
  return job;
}

/**
 * All jobs (active and past) belonging to the currently logged-in
 * customer, for the /portal job list. RLS also enforces this scoping
 * independently — this query is the "close to the data" check the DAL
 * pattern calls for, not a substitute for RLS.
 */
export async function getJobsForCurrentCustomer(): Promise<Job[]> {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "customer") return [];

  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from("jobs")
    .select(
      "id, job_number, customer_id, watch_brand, watch_model, watch_serial_number, watch_description, service_type, current_status, intake_notes, estimated_completion_date, created_at, updated_at, customers!inner(user_id)",
    )
    .eq("customers.user_id", profile.id)
    .order("updated_at", { ascending: false });

  if (!data) return [];

  return data.map((row) => {
    const { customers: _customers, ...job } = row as Job & {
      customers: unknown;
    };
    return job;
  });
}

/**
 * A single job for the /portal/jobs/[jobId] detail page, scoped to the
 * current customer. Relies on RLS (jobs_select_own) to return null rather
 * than someone else's job if the id doesn't belong to this customer —
 * this is the IDOR check the Next.js data-security guide calls out
 * explicitly (never trust a route param alone).
 */
export async function getOwnJobById(jobId: string): Promise<Job | null> {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "customer") return null;

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("jobs")
    .select(
      "id, job_number, customer_id, watch_brand, watch_model, watch_serial_number, watch_description, service_type, current_status, intake_notes, estimated_completion_date, created_at, updated_at",
    )
    .eq("id", jobId)
    .maybeSingle();

  return (data as Job) ?? null;
}

/** Customer-visible timeline (internal_note already excluded by the view). */
export async function getTimelineForJob(
  jobId: string,
): Promise<Omit<JobStatusEvent, "internal_note">[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("customer_job_timeline")
    .select("id, job_id, status, note, occurred_at, created_by")
    .eq("job_id", jobId)
    .order("occurred_at", { ascending: false });

  return data ?? [];
}

/** Customer-visible photos only (is_visible_to_customer filtering is via RLS). */
export async function getPhotosForJob(jobId: string): Promise<JobPhoto[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("job_photos")
    .select("id, job_id, status_event_id, storage_path, caption, is_visible_to_customer, created_at")
    .eq("job_id", jobId)
    .order("created_at", { ascending: false });

  return data ?? [];
}
