"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireOwner } from "@/lib/dal";
import { logActivity } from "@/data/activity";

export type TradeRunState = { error?: string; generated?: number } | undefined;

/**
 * Generates one invoice per trade client for their uninvoiced jobs in the
 * given date range. Safe to call repeatedly / as "Approve All": each job
 * carries a unique constraint on invoice_job_links.job_id, so a job that's
 * already been picked up by an earlier run (or another client's group)
 * simply won't be selected again here since listUninvoicedTradeJobs only
 * ever returns invoiced = false jobs.
 */
export async function generateTradeInvoice(
  _prevState: TradeRunState,
  formData: FormData,
): Promise<TradeRunState> {
  await requireOwner();

  const customerId = formData.get("customer_id");
  const jobIds = formData.getAll("job_ids");
  if (typeof customerId !== "string" || jobIds.length === 0) {
    return { error: "No jobs selected." };
  }

  const supabase = await createSupabaseServerClient();

  const { data: jobs } = await supabase
    .from("jobs")
    .select(
      "id, customer_id, invoiced, polishing_income, servicing_income, parts_income, outsource_cost, other_income",
    )
    .in("id", jobIds as string[]);

  if (!jobs || jobs.length === 0) {
    return { error: "Those jobs couldn't be found." };
  }
  const stillUninvoiced = jobs.filter((j) => !j.invoiced && j.customer_id === customerId);
  if (stillUninvoiced.length === 0) {
    return { error: "Those jobs have already been invoiced." };
  }

  const { data: invoice, error: invoiceError } = await supabase
    .from("invoices")
    .insert({ invoice_type: "trade", customer_id: customerId, status: "pending_review" })
    .select("id, invoice_number")
    .single();

  if (invoiceError || !invoice) {
    return { error: "Something went wrong. Please try again." };
  }

  const links = stillUninvoiced.map((job) => ({
    invoice_id: invoice.id,
    job_id: job.id,
    polishing_amount: job.polishing_income,
    servicing_amount: job.servicing_income,
    parts_amount: job.parts_income,
    outsource_cost_amount: job.outsource_cost,
    other_amount: job.other_income,
  }));

  const { error: linkError } = await supabase.from("invoice_job_links").insert(links);
  if (linkError) {
    return { error: "Invoice created but jobs couldn't be linked. Check Invoices." };
  }

  await logActivity(
    "invoice_generated",
    `Trade invoice ${invoice.invoice_number} generated (${stillUninvoiced.length} jobs)`,
    { table: "invoices", id: invoice.id },
  );

  revalidatePath("/admin/trade-invoicing");
  revalidatePath("/admin/invoices");
  return { generated: stillUninvoiced.length };
}

/**
 * "Approve All" — one invoice per trade client with uninvoiced jobs in
 * range. Used directly as a bound <form action>, which requires a void
 * return, so this deliberately doesn't return a value — check the
 * activity log or the trade run's now-emptied list to see what happened.
 */
export async function generateAllTradeInvoices(start: string, end: string): Promise<void> {
  await requireOwner();
  const supabase = await createSupabaseServerClient();

  const { data: jobs } = await supabase
    .from("jobs")
    .select(
      "id, customer_id, invoiced, polishing_income, servicing_income, parts_income, outsource_cost, other_income",
    )
    .eq("job_type", "trade")
    .eq("invoiced", false)
    .in("current_status", ["ready_collection", "collected_complete"])
    .gte("date_received", start)
    .lte("date_received", end);

  if (!jobs || jobs.length === 0) {
    revalidatePath("/admin/trade-invoicing");
    return;
  }

  const byClient = new Map<string, typeof jobs>();
  for (const job of jobs) {
    if (!job.customer_id) continue;
    const group = byClient.get(job.customer_id) ?? [];
    group.push(job);
    byClient.set(job.customer_id, group);
  }

  for (const [customerId, clientJobs] of byClient) {
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .insert({ invoice_type: "trade", customer_id: customerId, status: "pending_review" })
      .select("id, invoice_number")
      .single();
    if (invoiceError || !invoice) continue;

    const links = clientJobs.map((job) => ({
      invoice_id: invoice.id,
      job_id: job.id,
      polishing_amount: job.polishing_income,
      servicing_amount: job.servicing_income,
      parts_amount: job.parts_income,
      outsource_cost_amount: job.outsource_cost,
      other_amount: job.other_income,
    }));
    const { error: linkError } = await supabase.from("invoice_job_links").insert(links);
    if (linkError) continue;

    await logActivity(
      "invoice_generated",
      `Trade invoice ${invoice.invoice_number} generated (${clientJobs.length} jobs)`,
      { table: "invoices", id: invoice.id },
    );
  }

  revalidatePath("/admin/trade-invoicing");
  revalidatePath("/admin/invoices");
}
