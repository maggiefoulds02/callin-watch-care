import "server-only";

import { cache } from "react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireOwner } from "@/lib/dal";
import type { Invoice, InvoiceJobLink, InvoiceStatus, Job } from "@/lib/types";

export async function listInvoices(status?: InvoiceStatus): Promise<Invoice[]> {
  await requireOwner();
  const supabase = await createSupabaseServerClient();
  let query = supabase.from("invoices").select("*").order("issue_date", { ascending: false });
  if (status) query = query.eq("status", status);
  const { data } = await query;
  return (data as Invoice[]) ?? [];
}

export const getInvoiceById = cache(async (invoiceId: string): Promise<Invoice | null> => {
  await requireOwner();
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("invoices").select("*").eq("id", invoiceId).maybeSingle();
  return (data as Invoice) ?? null;
});

export type InvoiceJobLinkWithJob = InvoiceJobLink & { jobs: Job | null };

export async function getLinksForInvoice(invoiceId: string): Promise<InvoiceJobLinkWithJob[]> {
  await requireOwner();
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("invoice_job_links")
    .select("*, jobs(*)")
    .eq("invoice_id", invoiceId);
  return (data as InvoiceJobLinkWithJob[]) ?? [];
}

/** Non-trade jobs that are complete but not yet invoiced — for the "create invoice" picker. */
export async function listUninvoicedJobs(): Promise<Job[]> {
  await requireOwner();
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("jobs")
    .select("*")
    .eq("invoiced", false)
    .neq("job_type", "trade")
    .order("created_at", { ascending: false });
  return (data as Job[]) ?? [];
}

/**
 * Completed trade jobs, not yet invoiced, received within [start, end] —
 * the Trade Invoice Run's source list (PRD section 06). "Completed" here
 * means Ready for collection or Collected/complete: PRD says "only
 * completed (or Ready Collection) jobs appear in the trade run."
 */
export async function listUninvoicedTradeJobs(start: string, end: string): Promise<Job[]> {
  await requireOwner();
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("jobs")
    .select("*")
    .eq("job_type", "trade")
    .eq("invoiced", false)
    .in("current_status", ["ready_collection", "collected_complete"])
    .gte("date_received", start)
    .lte("date_received", end)
    .order("date_received", { ascending: true });
  return (data as Job[]) ?? [];
}
