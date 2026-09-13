"use server";

import * as z from "zod";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireOwner } from "@/lib/dal";
import { logActivity } from "@/data/activity";

const EXPENSE_CATEGORIES = [
  "parts_purchased", "outsourced_servicing", "tools_equipment",
  "sweeping_hands_withdrawal", "personal_drawing_oliver", "general_business",
  "rent_workshop", "consumables", "marketing", "software_subscriptions",
  "insurance", "training", "fuel_travel", "shipping", "bank_fees",
] as const;

const ExpenseSchema = z.object({
  category: z.enum(EXPENSE_CATEGORIES),
  description: z.string().trim().min(1, { error: "Description is required." }),
  expense_date: z.string().min(1),
  net_amount: z.coerce.number().min(0),
  supplier_name: z.string().trim().optional(),
  supplier_invoice_ref: z.string().trim().optional(),
  linked_job_id: z.string().uuid().optional().or(z.literal("")),
  is_refund: z.coerce.boolean().optional(),
});

export type ExpenseFormState =
  | { errors?: Record<string, string[]>; success?: boolean }
  | undefined;

export async function createExpense(
  _prevState: ExpenseFormState,
  formData: FormData,
): Promise<ExpenseFormState> {
  await requireOwner();

  const validated = ExpenseSchema.safeParse({
    category: formData.get("category"),
    description: formData.get("description"),
    expense_date: formData.get("expense_date"),
    net_amount: formData.get("net_amount"),
    supplier_name: formData.get("supplier_name") || undefined,
    supplier_invoice_ref: formData.get("supplier_invoice_ref") || undefined,
    linked_job_id: formData.get("linked_job_id") || "",
    is_refund: formData.get("is_refund") === "on",
  });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const { linked_job_id, ...rest } = validated.data;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("expenses")
    .insert({ ...rest, linked_job_id: linked_job_id || null })
    .select("id, description")
    .single();

  if (error || !data) {
    return { errors: { form: ["Something went wrong. Please try again."] } };
  }

  await logActivity(
    validated.data.is_refund ? "expense_refunded" : "expense_added",
    `${validated.data.is_refund ? "Refund" : "Expense"}: ${data.description} (£${validated.data.net_amount.toFixed(2)})`,
    { table: "expenses", id: data.id },
  );

  revalidatePath("/admin/finance");
  revalidatePath("/admin/pots");
  revalidatePath("/admin");
  return { success: true };
}
