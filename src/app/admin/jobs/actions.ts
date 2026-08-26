"use server";

import * as z from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { randomUUID } from "node:crypto";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireOwner } from "@/lib/dal";
import { logActivity } from "@/data/activity";
import type { PhotoStage } from "@/lib/types";

// ============================================================================
// Create job
// ============================================================================
const JobSchema = z.object({
  job_type: z.enum(["client", "trade", "sweeping_hands", "internal", "warranty", "insurance"]),
  customer_id: z.string().uuid().optional().or(z.literal("")),
  watch_brand: z.string().trim().optional(),
  watch_model: z.string().trim().optional(),
  watch_serial_number: z.string().trim().optional(),
  watch_movement: z.string().trim().optional(),
  watch_case_material: z.string().trim().optional(),
  watch_strap_bracelet: z.string().trim().optional(),
  customer_reference: z.string().trim().optional(),
  expected_return_date: z.string().optional().or(z.literal("")),
  intake_notes: z.string().trim().optional(),
  polishing_income: z.coerce.number().min(0).default(0),
  servicing_income: z.coerce.number().min(0).default(0),
  parts_income: z.coerce.number().min(0).default(0),
  outsource_cost: z.coerce.number().min(0).default(0),
  other_income: z.coerce.number().min(0).default(0),
});

export type JobFormState =
  | { errors?: Record<string, string[]>; success?: boolean }
  | undefined;

export async function createJob(
  _prevState: JobFormState,
  formData: FormData,
): Promise<JobFormState> {
  await requireOwner();

  const validated = JobSchema.safeParse({
    job_type: formData.get("job_type"),
    customer_id: formData.get("customer_id") || "",
    watch_brand: formData.get("watch_brand") || undefined,
    watch_model: formData.get("watch_model") || undefined,
    watch_serial_number: formData.get("watch_serial_number") || undefined,
    watch_movement: formData.get("watch_movement") || undefined,
    watch_case_material: formData.get("watch_case_material") || undefined,
    watch_strap_bracelet: formData.get("watch_strap_bracelet") || undefined,
    customer_reference: formData.get("customer_reference") || undefined,
    expected_return_date: formData.get("expected_return_date") || "",
    intake_notes: formData.get("intake_notes") || undefined,
    polishing_income: formData.get("polishing_income") || 0,
    servicing_income: formData.get("servicing_income") || 0,
    parts_income: formData.get("parts_income") || 0,
    outsource_cost: formData.get("outsource_cost") || 0,
    other_income: formData.get("other_income") || 0,
  });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const { customer_id, expected_return_date, ...rest } = validated.data;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("jobs")
    .insert({
      ...rest,
      customer_id: customer_id || null,
      expected_return_date: expected_return_date || null,
    })
    .select("id, job_number")
    .single();

  if (error || !data) {
    return { errors: { form: ["Something went wrong. Please try again."] } };
  }

  await logActivity("job_created", `Job ${data.job_number} created`, {
    table: "jobs",
    id: data.id,
  });

  revalidatePath("/admin/jobs");
  redirect(`/admin/jobs/${data.id}`);
}

// ============================================================================
// Status update — logs a job_status_events row (jobs.current_status syncs
// via the on_job_status_event_insert trigger). Non-trade jobs get an
// automatic pending invoice the moment they're marked complete, per PRD
// section 03: "Automatically creates a pending invoice for that job,
// pre-filled with the job's financial data, ready for review before
// sending." Trade jobs are deliberately NOT auto-invoiced individually —
// they're picked up by the weekly Trade Invoice Run instead.
// ============================================================================
const StatusUpdateSchema = z.object({
  status: z.enum([
    "incoming", "booked_in", "assessment", "waiting_approval", "waiting_parts",
    "in_progress", "quality_control", "ready_collection", "collected_complete",
    "on_hold", "cancelled",
  ]),
  note: z.string().trim().optional(),
  internal_note: z.string().trim().optional(),
});

export async function updateJobStatus(
  jobId: string,
  _prevState: JobFormState,
  formData: FormData,
): Promise<JobFormState> {
  await requireOwner();

  const validated = StatusUpdateSchema.safeParse({
    status: formData.get("status"),
    note: formData.get("note") || undefined,
    internal_note: formData.get("internal_note") || undefined,
  });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.from("job_status_events").insert({
    job_id: jobId,
    status: validated.data.status,
    note: validated.data.note || null,
    internal_note: validated.data.internal_note || null,
  });

  if (error) {
    return { errors: { form: ["Something went wrong. Please try again."] } };
  }

  if (validated.data.status === "collected_complete") {
    await maybeAutoInvoiceJob(jobId);
  }

  revalidatePath(`/admin/jobs/${jobId}`);
  revalidatePath("/admin/jobs");
  revalidatePath("/admin");
  return { success: true };
}

async function maybeAutoInvoiceJob(jobId: string) {
  const supabase = await createSupabaseServerClient();

  const { data: job } = await supabase
    .from("jobs")
    .select(
      "id, job_number, job_type, customer_id, invoiced, polishing_income, servicing_income, parts_income, outsource_cost, other_income",
    )
    .eq("id", jobId)
    .maybeSingle();

  if (!job || job.invoiced) return;
  // Trade jobs are batched weekly instead — see the Trade Invoice Run.
  if (job.job_type === "trade") return;

  const { data: invoice, error: invoiceError } = await supabase
    .from("invoices")
    .insert({
      invoice_type: job.job_type === "sweeping_hands" ? "sweeping_hands" : "client",
      customer_id: job.customer_id,
      status: "pending_review",
    })
    .select("id")
    .single();

  if (invoiceError || !invoice) return;

  await supabase.from("invoice_job_links").insert({
    invoice_id: invoice.id,
    job_id: job.id,
    polishing_amount: job.polishing_income,
    servicing_amount: job.servicing_income,
    parts_amount: job.parts_income,
    outsource_cost_amount: job.outsource_cost,
    other_amount: job.other_income,
  });

  await logActivity(
    "invoice_generated",
    `Pending invoice auto-created for job ${job.job_number}`,
    { table: "invoices", id: invoice.id },
  );
}

// ============================================================================
// Checklist toggle
// ============================================================================
export async function toggleChecklistItem(
  jobId: string,
  itemId: string,
  isComplete: boolean,
) {
  await requireOwner();
  const supabase = await createSupabaseServerClient();
  await supabase
    .from("job_checklist_items")
    .update({
      is_complete: isComplete,
      completed_at: isComplete ? new Date().toISOString() : null,
    })
    .eq("id", itemId);

  revalidatePath(`/admin/jobs/${jobId}`);
}

// ============================================================================
// Photo upload
// ============================================================================
export type PhotoUploadState = { error?: string } | undefined;

export async function uploadJobPhoto(
  jobId: string,
  _prevState: PhotoUploadState,
  formData: FormData,
): Promise<PhotoUploadState> {
  await requireOwner();

  const file = formData.get("file");
  const stage = formData.get("stage") as PhotoStage | null;
  const caption = (formData.get("caption") as string) || null;
  const isVisible = formData.get("is_visible_to_customer") === "on";

  if (!(file instanceof File) || file.size === 0) {
    return { error: "Please choose a photo to upload." };
  }
  if (!stage || !["before", "during", "after"].includes(stage)) {
    return { error: "Please choose a stage." };
  }

  const supabase = await createSupabaseServerClient();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storagePath = `${jobId}/${stage}/${randomUUID()}-${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from("job-photos")
    .upload(storagePath, file, { contentType: file.type });

  if (uploadError) {
    return { error: "Upload failed. Please try again." };
  }

  const { error: insertError } = await supabase.from("job_photos").insert({
    job_id: jobId,
    stage,
    storage_path: storagePath,
    caption,
    is_visible_to_customer: isVisible,
  });

  if (insertError) {
    return { error: "Photo uploaded but couldn't be saved. Please try again." };
  }

  revalidatePath(`/admin/jobs/${jobId}`);
  return undefined;
}
