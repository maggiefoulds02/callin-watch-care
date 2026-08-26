import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireOwner } from "@/lib/dal";
import { effectiveInvoiceStatus, type ActivityLogEntry, type Invoice, type Job } from "@/lib/types";

export type RecentJob = Job & {
  customers: { full_name: string; company_name: string | null } | null;
};

export type DashboardSummary = {
  activeJobs: number;
  outstandingCount: number;
  outstandingValue: number;
  overdueCount: number;
};

export async function getDashboardSummary(): Promise<DashboardSummary> {
  await requireOwner();
  const supabase = await createSupabaseServerClient();

  const [{ count: activeJobs }, { data: openInvoices }] = await Promise.all([
    supabase
      .from("jobs")
      .select("id", { count: "exact", head: true })
      .not("current_status", "in", "(collected_complete,cancelled)"),
    supabase.from("invoices").select("*").in("status", ["pending_review", "sent", "overdue"]),
  ]);

  const invoices = (openInvoices as Invoice[]) ?? [];
  const outstandingValue = invoices.reduce((sum, i) => sum + i.total, 0);
  const overdueCount = invoices.filter((i) => effectiveInvoiceStatus(i) === "overdue").length;

  return {
    activeJobs: activeJobs ?? 0,
    outstandingCount: invoices.length,
    outstandingValue,
    overdueCount,
  };
}

export async function getRecentJobs(limit = 6): Promise<RecentJob[]> {
  await requireOwner();
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("jobs")
    .select("*, customers(full_name, company_name)")
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data as RecentJob[]) ?? [];
}

export async function getRecentActivity(limit = 20): Promise<ActivityLogEntry[]> {
  await requireOwner();
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("activity_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data as ActivityLogEntry[]) ?? [];
}
