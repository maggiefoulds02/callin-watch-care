"use server";

import * as z from "zod";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireOwner } from "@/lib/dal";

const SettingsSchema = z.object({
  trade_partner_name: z.string().trim().min(1),
  sweeping_hands_polishing_pct: z.coerce.number().min(0).max(100),
  sweeping_hands_servicing_pct: z.coerce.number().min(0).max(100),
  opening_bank_balance: z.coerce.number(),
  opening_sweeping_hands_balance: z.coerce.number(),
  opening_balance_date: z.string().min(1),
});

export type SettingsFormState =
  | { errors?: Record<string, string[]>; success?: boolean }
  | undefined;

export async function updateBusinessSettings(
  _prevState: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  await requireOwner();

  const validated = SettingsSchema.safeParse({
    trade_partner_name: formData.get("trade_partner_name"),
    sweeping_hands_polishing_pct: formData.get("sweeping_hands_polishing_pct"),
    sweeping_hands_servicing_pct: formData.get("sweeping_hands_servicing_pct"),
    opening_bank_balance: formData.get("opening_bank_balance"),
    opening_sweeping_hands_balance: formData.get("opening_sweeping_hands_balance"),
    opening_balance_date: formData.get("opening_balance_date"),
  });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("business_settings")
    .update(validated.data)
    .eq("id", 1);

  if (error) {
    return { errors: { form: ["Something went wrong. Please try again."] } };
  }

  revalidatePath("/admin/settings");
  revalidatePath("/admin/pots");
  revalidatePath("/admin");
  return { success: true };
}
