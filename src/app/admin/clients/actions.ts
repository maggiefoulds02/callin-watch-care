"use server";

import * as z from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/supabase/server";
import { requireOwner } from "@/lib/dal";
import { logActivity } from "@/data/activity";

const ClientSchema = z.object({
  full_name: z.string().trim().min(1, { error: "Name is required." }),
  company_name: z.string().trim().optional(),
  client_type: z.enum(["retail", "trade"]),
  email: z.union([z.email(), z.literal("")]).optional(),
  phone: z.string().trim().optional(),
  address: z.string().trim().optional(),
  vat_number: z.string().trim().optional(),
  payment_terms_days: z.coerce.number().int().min(0).default(30),
  notes: z.string().trim().optional(),
});

export type ClientFormState =
  | { errors?: Record<string, string[]>; success?: boolean }
  | undefined;

function parseClientForm(formData: FormData) {
  return ClientSchema.safeParse({
    full_name: formData.get("full_name"),
    company_name: formData.get("company_name") || undefined,
    client_type: formData.get("client_type"),
    email: formData.get("email") || "",
    phone: formData.get("phone") || undefined,
    address: formData.get("address") || undefined,
    vat_number: formData.get("vat_number") || undefined,
    payment_terms_days: formData.get("payment_terms_days") || 30,
    notes: formData.get("notes") || undefined,
  });
}

export async function createClient(
  _prevState: ClientFormState,
  formData: FormData,
): Promise<ClientFormState> {
  await requireOwner();
  const validated = parseClientForm(formData);
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("customers")
    .insert(validated.data)
    .select("id")
    .single();

  if (error || !data) {
    return { errors: { form: ["Something went wrong. Please try again."] } };
  }

  revalidatePath("/admin/clients");
  redirect(`/admin/clients/${data.id}`);
}

export async function updateClient(
  clientId: string,
  _prevState: ClientFormState,
  formData: FormData,
): Promise<ClientFormState> {
  await requireOwner();
  const validated = parseClientForm(formData);
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("customers")
    .update(validated.data)
    .eq("id", clientId);

  if (error) {
    return { errors: { form: ["Something went wrong. Please try again."] } };
  }

  revalidatePath("/admin/clients");
  revalidatePath(`/admin/clients/${clientId}`);
  return { success: true };
}

export type PortalAccessState =
  | { error?: string; password?: string }
  | undefined;

/**
 * Grants (or resets) a client's portal login — sets a password directly via
 * the Supabase service-role admin API, with email_confirm: true, so no
 * email ever needs to send. The password is returned once in the action
 * state so the owner can read it out / message it to the client directly;
 * it's never stored anywhere in plaintext.
 *
 * First call for a client with no linked auth user creates one (role
 * defaults to 'customer' via the handle_new_user trigger) and links
 * customers.user_id. A later call for an already-linked client just resets
 * that same user's password.
 */
export async function setPortalPassword(
  clientId: string,
  _prevState: PortalAccessState,
  formData: FormData,
): Promise<PortalAccessState> {
  await requireOwner();

  const password = formData.get("password");
  if (typeof password !== "string" || password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  const supabase = await createSupabaseServerClient();
  const { data: client } = await supabase
    .from("customers")
    .select("id, user_id, full_name, email")
    .eq("id", clientId)
    .maybeSingle();

  if (!client) {
    return { error: "Client not found." };
  }
  if (!client.email) {
    return { error: "Add an email address for this client first." };
  }

  const admin = createSupabaseAdminClient();

  if (client.user_id) {
    const { error } = await admin.auth.admin.updateUserById(client.user_id, { password });
    if (error) {
      return { error: "Something went wrong. Please try again." };
    }
    await logActivity(
      "portal_password_reset",
      `Portal password reset for ${client.full_name}`,
      { table: "customers", id: client.id },
    );
  } else {
    const { data: newUser, error } = await admin.auth.admin.createUser({
      email: client.email,
      password,
      email_confirm: true,
      user_metadata: { full_name: client.full_name },
    });
    if (error || !newUser?.user) {
      return {
        error:
          error?.message === "A user with this email address has already been registered"
            ? "That email is already linked to a different account."
            : "Something went wrong. Please try again.",
      };
    }

    const { error: linkError } = await supabase
      .from("customers")
      .update({ user_id: newUser.user.id })
      .eq("id", clientId);
    if (linkError) {
      return { error: "Account created but couldn't be linked. Check Settings." };
    }

    await logActivity(
      "portal_access_granted",
      `Portal access granted to ${client.full_name}`,
      { table: "customers", id: client.id },
    );
  }

  revalidatePath(`/admin/clients/${clientId}`);
  return { password };
}
