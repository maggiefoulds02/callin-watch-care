import "server-only";

import { cache } from "react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireOwner } from "@/lib/dal";
import type {
  Job,
  JobStatus,
  JobType,
  JobStatusEvent,
  JobPhoto,
  JobChecklistItem,
} from "@/lib/types";

/** Owner-side job list for the /admin/jobs board — every job, every field, RLS-full-access. */
export async function listJobs(filter?: {
  status?: JobStatus;
  jobType?: JobType;
  clientId?: string;
}): Promise<Job[]> {
  await requireOwner();
  const supabase = await createSupabaseServerClient();

  let query = supabase.from("jobs").select("*").order("created_at", { ascending: false });
  if (filter?.status) query = query.eq("current_status", filter.status);
  if (filter?.jobType) query = query.eq("job_type", filter.jobType);
  if (filter?.clientId) query = query.eq("customer_id", filter.clientId);

  const { data } = await query;
  return (data as Job[]) ?? [];
}

export const getJobByIdAdmin = cache(async (jobId: string): Promise<Job | null> => {
  await requireOwner();
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("jobs").select("*").eq("id", jobId).maybeSingle();
  return (data as Job) ?? null;
});

/** Full timeline including internal_note — owner reads the base table directly, not the customer-safe view. */
export async function getFullTimelineForJob(jobId: string): Promise<JobStatusEvent[]> {
  await requireOwner();
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("job_status_events")
    .select("*")
    .eq("job_id", jobId)
    .order("occurred_at", { ascending: false });
  return (data as JobStatusEvent[]) ?? [];
}

export async function getPhotosForJobAdmin(jobId: string): Promise<JobPhoto[]> {
  await requireOwner();
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("job_photos")
    .select("*")
    .eq("job_id", jobId)
    .order("created_at", { ascending: false });
  return (data as JobPhoto[]) ?? [];
}

export async function getChecklistForJob(jobId: string): Promise<JobChecklistItem[]> {
  await requireOwner();
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("job_checklist_items")
    .select("*")
    .eq("job_id", jobId)
    .order("sort_order", { ascending: true });
  return (data as JobChecklistItem[]) ?? [];
}

/** Signed URLs for a job's photos, same pattern as the customer portal's job detail page. */
export async function getSignedPhotoUrlsAdmin(
  paths: string[],
): Promise<Record<string, string>> {
  if (paths.length === 0) return {};
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.storage.from("job-photos").createSignedUrls(paths, 60 * 60);
  const urls: Record<string, string> = {};
  data?.forEach((entry) => {
    if (entry.signedUrl && !entry.error) urls[entry.path ?? ""] = entry.signedUrl;
  });
  return urls;
}
