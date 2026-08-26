import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireOwner } from "@/lib/dal";
import type { Expense, Invoice, PotBalances } from "@/lib/types";

export async function listExpenses(month?: string): Promise<Expense[]> {
  await requireOwner();
  const supabase = await createSupabaseServerClient();
  let query = supabase.from("expenses").select("*").order("expense_date", { ascending: false });

  if (month) {
    const start = `${month}-01`;
    const [y, m] = month.split("-").map(Number);
    const end = new Date(y, m, 1).toISOString().slice(0, 10); // first day of next month
    query = query.gte("expense_date", start).lt("expense_date", end);
  }

  const { data } = await query;
  return (data as Expense[]) ?? [];
}

export async function listInvoicesForMonth(month: string): Promise<Invoice[]> {
  await requireOwner();
  const supabase = await createSupabaseServerClient();
  const [y, m] = month.split("-").map(Number);
  const start = `${month}-01`;
  const end = new Date(y, m, 1).toISOString().slice(0, 10);

  const { data } = await supabase
    .from("invoices")
    .select("*")
    .gte("issue_date", start)
    .lt("issue_date", end)
    .order("issue_date", { ascending: false });

  return (data as Invoice[]) ?? [];
}

export async function getPotBalances(): Promise<PotBalances | null> {
  await requireOwner();
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("pot_balances").select("*").maybeSingle();
  return (data as PotBalances) ?? null;
}

export type PaidInvoiceWithClient = Invoice & {
  customers: { full_name: string; company_name: string | null } | null;
};

/** All paid invoices, oldest first, with the client name joined in — the Pots page's history table. */
export async function getPotHistory(): Promise<PaidInvoiceWithClient[]> {
  await requireOwner();
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("invoices")
    .select("*, customers(full_name, company_name)")
    .eq("status", "paid")
    .order("paid_at", { ascending: true });
  return (data as PaidInvoiceWithClient[]) ?? [];
}
