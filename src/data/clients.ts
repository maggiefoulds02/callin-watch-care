import "server-only";

import { cache } from "react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireOwner } from "@/lib/dal";
import type { Customer, Job, Invoice } from "@/lib/types";

const CLIENT_COLUMNS =
  "id, user_id, full_name, company_name, client_type, vat_number, payment_terms_days, email, phone, address, notes";

/** All clients, optionally filtered by type — for the /admin/clients list and the job-creation client picker. */
export async function listClients(filter?: {
  clientType?: "retail" | "trade";
}): Promise<Customer[]> {
  await requireOwner();
  const supabase = await createSupabaseServerClient();

  let query = supabase
    .from("customers")
    .select(CLIENT_COLUMNS)
    .order("full_name", { ascending: true });

  if (filter?.clientType) {
    query = query.eq("client_type", filter.clientType);
  }

  const { data } = await query;
  return (data as Customer[]) ?? [];
}

export const getClientById = cache(async (clientId: string): Promise<Customer | null> => {
  await requireOwner();
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("customers")
    .select(CLIENT_COLUMNS)
    .eq("id", clientId)
    .maybeSingle();
  return (data as Customer) ?? null;
});

/** Every job for this client, newest first — for the client detail page. */
export async function getJobsForClient(clientId: string): Promise<Job[]> {
  await requireOwner();
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("jobs")
    .select("*")
    .eq("customer_id", clientId)
    .order("created_at", { ascending: false });
  return (data as Job[]) ?? [];
}

/** Every invoice for this client, newest first. */
export async function getInvoicesForClient(clientId: string): Promise<Invoice[]> {
  await requireOwner();
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("invoices")
    .select("*")
    .eq("customer_id", clientId)
    .order("issue_date", { ascending: false });
  return (data as Invoice[]) ?? [];
}
