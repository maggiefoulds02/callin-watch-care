// Hand-written types mirroring supabase/migrations/0001_init.sql +
// 0002_business_manager.sql. TODO (once a real Supabase project exists):
// replace with generated types via `supabase gen types typescript` so this
// file can't drift from the actual schema.

export type UserRole = "owner" | "customer";

export type JobType =
  | "client"
  | "trade"
  | "sweeping_hands"
  | "internal"
  | "warranty"
  | "insurance";

export type JobStatus =
  | "incoming"
  | "booked_in"
  | "assessment"
  | "waiting_approval"
  | "waiting_parts"
  | "in_progress"
  | "quality_control"
  | "ready_collection"
  | "collected_complete"
  | "on_hold"
  | "cancelled";

// Statuses that count as "in the workshop" for the homepage tracker banner.
export const ACTIVE_JOB_STATUSES: JobStatus[] = [
  "incoming",
  "booked_in",
  "assessment",
  "waiting_approval",
  "waiting_parts",
  "in_progress",
  "quality_control",
  "ready_collection",
  "on_hold",
];

export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  incoming: "Incoming",
  booked_in: "Booked in",
  assessment: "Assessment",
  waiting_approval: "Waiting approval",
  waiting_parts: "Waiting parts",
  in_progress: "In progress",
  quality_control: "Quality control",
  ready_collection: "Ready for collection",
  collected_complete: "Collected / complete",
  on_hold: "On hold",
  cancelled: "Cancelled",
};

export type ClientType = "retail" | "trade";

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
  company_name: string | null;
  client_type: ClientType;
  vat_number: string | null;
  payment_terms_days: number;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
};

export type Job = {
  id: string;
  job_number: string;
  job_type: JobType;
  customer_id: string | null;
  watch_brand: string | null;
  watch_model: string | null;
  watch_serial_number: string | null;
  watch_movement: string | null;
  watch_case_material: string | null;
  watch_strap_bracelet: string | null;
  customer_reference: string | null;
  current_status: JobStatus;
  polishing_income: number;
  servicing_income: number;
  parts_income: number;
  outsource_cost: number;
  other_income: number;
  date_received: string;
  expected_return_date: string | null;
  intake_notes: string | null;
  invoiced: boolean;
  created_at: string;
  updated_at: string;
};

// The subset of Job fields ever exposed to the customer portal — deliberately
// excludes the five income/cost columns. Data-layer functions that serve the
// customer portal (src/data/jobs.ts) return this type, not Job, so a
// financial field making it into a customer-facing query is a compile error,
// not just a matter of remembering to leave it out of a select() string.
export type CustomerVisibleJob = Omit<
  Job,
  "polishing_income" | "servicing_income" | "parts_income" | "outsource_cost" | "other_income"
>;

export type JobStatusEvent = {
  id: string;
  job_id: string;
  status: JobStatus;
  note: string | null;
  internal_note: string | null;
  occurred_at: string;
  created_by: string | null;
};

export type PhotoStage = "before" | "during" | "after";

export type JobPhoto = {
  id: string;
  job_id: string;
  status_event_id: string | null;
  stage: PhotoStage;
  storage_path: string;
  caption: string | null;
  is_visible_to_customer: boolean;
  created_at: string;
};

export type JobChecklistItem = {
  id: string;
  job_id: string;
  step_key: string;
  label: string;
  sort_order: number;
  is_complete: boolean;
  completed_at: string | null;
};

export type ExpenseCategory =
  | "parts_purchased"
  | "outsourced_servicing"
  | "tools_equipment"
  | "sweeping_hands_withdrawal"
  | "personal_drawing_oliver"
  | "general_business"
  | "rent_workshop"
  | "consumables"
  | "marketing"
  | "software_subscriptions"
  | "insurance"
  | "training"
  | "fuel_travel"
  | "shipping"
  | "bank_fees";

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  parts_purchased: "Parts purchased",
  outsourced_servicing: "Outsourced servicing",
  tools_equipment: "Tools & equipment",
  sweeping_hands_withdrawal: "Sweeping Hands withdrawal",
  personal_drawing_oliver: "Personal drawing (Oliver)",
  general_business: "General business",
  rent_workshop: "Rent / workshop",
  consumables: "Consumables",
  marketing: "Marketing",
  software_subscriptions: "Software & subscriptions",
  insurance: "Insurance",
  training: "Training",
  fuel_travel: "Fuel & travel",
  shipping: "Shipping",
  bank_fees: "Bank fees",
};

export type Expense = {
  id: string;
  category: ExpenseCategory;
  description: string;
  expense_date: string;
  net_amount: number;
  supplier_name: string | null;
  supplier_invoice_ref: string | null;
  linked_job_id: string | null;
  is_refund: boolean;
  created_at: string;
};

export type InvoiceType = "client" | "trade" | "sweeping_hands";
export type InvoiceStatus = "pending_review" | "sent" | "paid" | "overdue" | "void";

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  pending_review: "Pending review",
  sent: "Sent",
  paid: "Paid",
  overdue: "Overdue",
  void: "Void",
};

export type Invoice = {
  id: string;
  invoice_number: string;
  invoice_type: InvoiceType;
  customer_id: string | null;
  issue_date: string;
  due_date: string | null;
  status: InvoiceStatus;
  polishing_total: number;
  servicing_total: number;
  parts_total: number;
  outsource_cost_total: number;
  other_total: number;
  total: number;
  oliver_share_amount: number | null;
  sweeping_hands_share_amount: number | null;
  business_pot_amount: number | null;
  notes: string | null;
  sent_at: string | null;
  paid_at: string | null;
};

export type InvoiceJobLink = {
  id: string;
  invoice_id: string;
  job_id: string;
  polishing_amount: number;
  servicing_amount: number;
  parts_amount: number;
  outsource_cost_amount: number;
  other_amount: number;
  line_total: number;
};

// effective_status: due-date-based "overdue" is computed at read time, not
// stored — a `sent` invoice past its due_date displays as overdue without
// needing a background job to flip the stored status.
export function effectiveInvoiceStatus(invoice: Invoice): InvoiceStatus {
  if (
    invoice.status === "sent" &&
    invoice.due_date &&
    new Date(invoice.due_date) < new Date()
  ) {
    return "overdue";
  }
  return invoice.status;
}

export type PotBalances = {
  bank_balance: number;
  sweeping_hands_pot: number;
  available_to_oliver: number;
};

export type ActivityLogEntry = {
  id: string;
  event_type: string;
  description: string;
  related_table: string | null;
  related_id: string | null;
  created_at: string;
};
