// Hand-written types mirroring supabase/migrations/0001_init.sql.
// TODO (Phase 1 wrap-up, once a real Supabase project exists): replace
// with generated types via `supabase gen types typescript` so this file
// can't drift from the actual schema.

export type UserRole = "owner" | "customer";

export type JobStatus =
  | "received"
  | "diagnosis"
  | "quote"
  | "in_repair"
  | "quality_check"
  | "ready_for_collection"
  | "collected"
  | "on_hold"
  | "cancelled";

export const ACTIVE_JOB_STATUSES: JobStatus[] = [
  "received",
  "diagnosis",
  "quote",
  "in_repair",
  "quality_check",
  "ready_for_collection",
  "on_hold",
];

export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  received: "Received",
  diagnosis: "Diagnosis",
  quote: "Quote sent",
  in_repair: "In repair",
  quality_check: "Quality check",
  ready_for_collection: "Ready for collection",
  collected: "Collected",
  on_hold: "On hold",
  cancelled: "Cancelled",
};

export type Profile = {
  id: string;
  role: UserRole;
  full_name: string | null;
  email: string | null;
  phone: string | null;
};

export type Customer = {
  id: string;
  user_id: string | null;
  full_name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
};

export type Job = {
  id: string;
  job_number: string;
  customer_id: string;
  watch_brand: string | null;
  watch_model: string | null;
  watch_serial_number: string | null;
  watch_description: string | null;
  service_type: string | null;
  current_status: JobStatus;
  intake_notes: string | null;
  estimated_completion_date: string | null;
  created_at: string;
  updated_at: string;
};

export type JobStatusEvent = {
  id: string;
  job_id: string;
  status: JobStatus;
  note: string | null;
  internal_note: string | null;
  occurred_at: string;
  created_by: string | null;
};

export type JobPhoto = {
  id: string;
  job_id: string;
  status_event_id: string | null;
  storage_path: string;
  caption: string | null;
  is_visible_to_customer: boolean;
  created_at: string;
};

export type FinanceEntry = {
  id: string;
  job_id: string | null;
  description: string | null;
  gross_amount: number;
  host_split_percentage: number;
  host_amount: number;
  cwc_amount: number;
  transaction_date: string;
  payment_method: string | null;
};

export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue" | "void";

export type Invoice = {
  id: string;
  invoice_number: string;
  job_id: string | null;
  customer_id: string;
  issue_date: string;
  due_date: string | null;
  status: InvoiceStatus;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  notes: string | null;
  terms: string | null;
  paid_at: string | null;
  payment_method: string | null;
};

export type InvoiceLineItem = {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  sort_order: number;
};
