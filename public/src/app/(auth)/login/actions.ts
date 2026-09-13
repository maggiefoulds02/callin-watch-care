"use server";

import * as z from "zod";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const LoginSchema = z.object({
  email: z.email({ error: "Please enter a valid email." }),
  password: z.string().min(1, { error: "Please enter your password." }),
});

export type LoginFormState = { error?: string } | undefined;

/**
 * Password login. There's no public signup route — portal accounts only
 * exist because the owner granted portal access from a client's record
 * (see src/app/admin/clients/actions.ts: setPortalPassword), so this only
 * succeeds for an email that already has a Supabase auth user with a
 * password set.
 */
export async function login(
  _prevState: LoginFormState,
  formData: FormData,
): Promise<LoginFormState> {
  const next = (formData.get("next") as string) || "/";

  const validated = LoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!validated.success) {
    return { error: validated.error.issues[0]?.message ?? "Please check your details." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword(validated.data);

  if (error) {
    return { error: "Incorrect email or password." };
  }

  redirect(next);
}
