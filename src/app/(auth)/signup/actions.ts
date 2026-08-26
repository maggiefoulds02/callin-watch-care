"use server";

import * as z from "zod";
import { redirect } from "next/navigation";
import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/supabase/server";

const SignupSchema = z
  .object({
    full_name: z.string().trim().min(1, { error: "Please enter your name." }),
    email: z.email({ error: "Please enter a valid email." }),
    password: z.string().min(8, { error: "Password must be at least 8 characters." }),
    confirm_password: z.string(),
  })
  .refine((data) => data.password === data.confirm_password, {
    error: "Passwords don't match.",
    path: ["confirm_password"],
  });

export type SignupFormState = { error?: string } | undefined;

/**
 * Public customer sign-up — same shape as the owner's /setup, but always
 * open (not a one-time bootstrap) and always lands the new account at
 * role='customer' (that's the profiles table default; nothing here ever
 * grants 'owner'). No email step: the auth user is created directly via
 * the admin API with email_confirm: true.
 *
 * If Oliver already created a customer record for this email (e.g. he
 * took the watch in over the phone before the customer ever visited the
 * site), this links the new account to that existing record instead of
 * creating a duplicate — so their job history isn't split across two
 * customer rows. Otherwise it creates a fresh one.
 */
export async function signupCustomer(
  _prevState: SignupFormState,
  formData: FormData,
): Promise<SignupFormState> {
  const validated = SignupSchema.safeParse({
    full_name: formData.get("full_name"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirm_password: formData.get("confirm_password"),
  });
  if (!validated.success) {
    return { error: validated.error.issues[0]?.message ?? "Please check your details." };
  }
  const { full_name, email, password } = validated.data;

  const admin = createSupabaseAdminClient();

  const { data: newUser, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name },
  });
  if (createError || !newUser?.user) {
    return {
      error:
        createError?.message === "A user with this email address has already been registered"
          ? "An account with that email already exists — try logging in instead."
          : "Something went wrong. Please try again.",
    };
  }

  // Link to an existing not-yet-claimed customer record for this email
  // (e.g. Oliver already booked this person in), or create a fresh one.
  const { data: existing } = await admin
    .from("customers")
    .select("id")
    .eq("email", email)
    .is("user_id", null)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (existing) {
    await admin.from("customers").update({ user_id: newUser.user.id }).eq("id", existing.id);
  } else {
    await admin.from("customers").insert({
      user_id: newUser.user.id,
      full_name,
      email,
      client_type: "retail",
    });
  }

  // Sign in immediately so they land straight in the portal — no separate
  // login step after signing up.
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signInWithPassword({ email, password });

  redirect("/portal");
}
