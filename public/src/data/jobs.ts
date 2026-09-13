import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/dal";
import {
  ACTIVE_JOB_STATUSES,
  type CustomerVisibleJob,
  type JobPhoto,
  type JobStatusEvent,
} from "@/lib/types";

const CUSTOMER_JOB_COLUMNS =
  "id, job_number, job_type, customer_id, watch_brand, watch_model, watch_serial_number, watch_movement, watch_case_material, watch_strap_bracelet, customer_reference, current_status, intake_notes, expected_return_date, invoiced, created_at, updated_at";

/**
 * Powers the homepage tracker banner: if the current visitor is logged in
 * as a customer and has a watch actively in service, return it. Returns
 * null for logged-out visitors, owners, and customers with no active job
 * — the homepage renders its normal hero in all of those cases.
 */
export async function getActiveJobForCurrentCustomer(): Promise<CustomerVisibleJob | null> {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "customer") return null;

  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from("jobs")
    .select(`${CUSTOMER_JOB_COLUMNS}, customers!inner(user_id)`)
    .eq("customers.user_id", profile.id)
    .in("current_status", ACTIVE_JOB_STATUSES)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) return null;

  // Strip the joined `customers` relation before returning — callers only
  // need the Job shape (Data Transfer Object pattern per Next.js's
  // data-security guide: return only what the caller needs).
  const { customers: _customers, ...job } = data as CustomerVisibleJob & {
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
export async function getJobsForCurrentCustomer(): Promise<CustomerVisibleJob[]> {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "customer") return [];

  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from("jobs")
    .select(`${CUSTOMER_JOB_COLUMNS}, customers!inner(user_id)`)
    .eq("customers.user_id", profile.id)
    .order("updated_at", { ascending: false });

  if (!data) return [];

  return data.map((row) => {
    const { customers: _customers, ...job } = row as CustomerVisibleJob & {
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
export async function getOwnJobById(jobId: string): Promise<CustomerVisibleJob | null> {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "customer") return null;

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("jobs")
    .select(CUSTOMER_JOB_COLUMNS)
    .eq("id", jobId)
    .maybeSingle();

  return (data as CustomerVisibleJob) ?? null;
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
    .select("id, job_id, status_event_id, stage, storage_path, caption, is_visible_to_customer, created_at")
    .eq("job_id", jobId)
    .order("created_at", { ascending: false });

  return data ?? [];
}
