"use server";

import * as z from "zod";
import { redirect } from "next/navigation";
import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/supabase/server";
import { ownerAccountExists } from "@/lib/owner-setup";

const SetupSchema = z
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

export type SetupFormState = { error?: string } | undefined;

/**
 * One-time owner account bootstrap. Creates the single 'owner' account
 * directly (no email step — email_confirm: true) so Oliver can set himself
 * up the first time he visits the site, the same way he'd sign up for any
 * other platform. Re-checks ownerAccountExists() itself right before
 * creating, so this can't be used a second time even if someone loads the
 * form just before Oliver finishes his own setup.
 */
export async function createOwnerAccount(
  _prevState: SetupFormState,
  formData: FormData,
): Promise<SetupFormState> {
  if (await ownerAccountExists()) {
    return { error: "Setup has already been completed. Please log in instead." };
  }

  const validated = SetupSchema.safeParse({
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

  // Re-check right before writing — closes the race between the page load
  // and this submit without needing a database-level lock for what is, in
  // practice, a once-ever action.
  if (await ownerAccountExists()) {
    return { error: "Setup has already been completed. Please log in instead." };
  }

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
          ? "That email is already registered — try logging in instead."
          : "Something went wrong. Please try again.",
    };
  }

  const { error: promoteError } = await admin
    .from("profiles")
    .update({ role: "owner", full_name })
    .eq("id", newUser.user.id);
  if (promoteError) {
    return { error: "Account created but couldn't be finished. Please try logging in." };
  }

  // Sign in immediately so Oliver lands straight in the admin — no separate
  // login step after setup.
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signInWithPassword({ email, password });

  redirect("/admin");
}
