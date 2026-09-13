"use server";

import * as z from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireOwner } from "@/lib/dal";
import { logActivity } from "@/data/activity";

export type InvoiceActionState = { error?: string } | undefined;

const CreateInvoiceSchema = z.object({
  customer_id: z.string().uuid(),
  job_ids: z.array(z.string().uuid()).min(1, { error: "Select at least one job." }),
});

/** Creates one invoice covering the selected (uninvoiced, non-trade) jobs for a single client. */
export async function createInvoiceFromJobs(
  _prevState: InvoiceActionState,
  formData: FormData,
): Promise<InvoiceActionState> {
  await requireOwner();

  const validated = CreateInvoiceSchema.safeParse({
    customer_id: formData.get("customer_id"),
    job_ids: formData.getAll("job_ids"),
  });

  if (!validated.success) {
    return { error: "Select a client and at least one job." };
  }

  const supabase = await createSupabaseServerClient();

  const { data: jobs } = await supabase
    .from("jobs")
    .select("id, customer_id, invoiced, job_type, polishing_income, servicing_income, parts_income, outsource_cost, other_income")
    .in("id", validated.data.job_ids);

  if (!jobs || jobs.length === 0) {
    return { error: "Those jobs couldn't be found." };
  }
  if (jobs.some((j) => j.invoiced)) {
    return { error: "One of those jobs is already on an invoice." };
  }
  if (jobs.some((j) => j.customer_id !== validated.data.customer_id)) {
    return { error: "All selected jobs must belong to the same client." };
  }

  const { data: invoice, error: invoiceError } = await supabase
    .from("invoices")
    .insert({ invoice_type: "client", customer_id: validated.data.customer_id, status: "pending_review" })
    .select("id, invoice_number")
    .single();

  if (invoiceError || !invoice) {
    return { error: "Something went wrong. Please try again." };
  }

  const links = jobs.map((job) => ({
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
    return { error: "Invoice created but jobs couldn't be linked. Please check the invoice." };
  }

  await logActivity("invoice_generated", `Invoice ${invoice.invoice_number} created`, {
    table: "invoices",
    id: invoice.id,
  });

  revalidatePath("/admin/invoices");
  redirect(`/admin/invoices/${invoice.id}`);
}

export async function markInvoiceSent(invoiceId: string) {
  await requireOwner();
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("invoices")
    .update({ status: "sent", sent_at: new Date().toISOString() })
    .eq("id", invoiceId)
    .select("invoice_number")
    .single();

  if (data) {
    await logActivity("invoice_sent", `Invoice ${data.invoice_number} marked sent`, {
      table: "invoices",
      id: invoiceId,
    });
  }

  revalidatePath(`/admin/invoices/${invoiceId}`);
  revalidatePath("/admin/invoices");
}

export async function markInvoicePaid(invoiceId: string) {
  await requireOwner();
  const supabase = await createSupabaseServerClient();
  // status -> 'paid' fires recalc_invoice_shares_on_paid (0002_business_manager.sql),
  // which computes and stores oliver_share_amount/sweeping_hands_share_amount/paid_at.
  const { data } = await supabase
    .from("invoices")
    .update({ status: "paid" })
    .eq("id", invoiceId)
    .select("invoice_number, total")
    .single();

  if (data) {
    await logActivity(
      "invoice_paid",
      `Invoice ${data.invoice_number} paid (£${data.total.toFixed(2)})`,
      { table: "invoices", id: invoiceId },
    );
  }

  revalidatePath(`/admin/invoices/${invoiceId}`);
  revalidatePath("/admin/invoices");
  revalidatePath("/admin/pots");
  revalidatePath("/admin");
}
